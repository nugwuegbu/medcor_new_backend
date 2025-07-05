import StreamingAvatar, { 
  AvatarQuality, 
  StreamingEvents,
  TaskType,
  TaskMode,
  VoiceEmotion 
} from "@heygen/streaming-avatar";

// Global variables to ensure only one instance
let globalAvatar: StreamingAvatar | null = null;
let globalInitPromise: Promise<any> | null = null;
let hasGreeted = false;
let initializationLock = false;

// Use window object to persist across React re-renders
if (typeof window !== 'undefined') {
  (window as any).__avatarManager = (window as any).__avatarManager || {
    avatar: null,
    promise: null,
    hasGreeted: false,
    lock: false
  };
}

export class AvatarManager {
  static async getOrCreateAvatar(apiKey: string): Promise<StreamingAvatar> {
    const manager = (window as any).__avatarManager;
    
    // If we already have an avatar, return it
    if (manager.avatar) {
      console.log("Returning existing avatar instance from window");
      return manager.avatar;
    }

    // If initialization is in progress, wait for it
    if (manager.promise) {
      console.log("Waiting for existing initialization from window");
      try {
        await manager.promise;
        return manager.avatar;
      } catch (e) {
        console.error("Previous initialization failed:", e);
        manager.promise = null;
      }
    }

    // Prevent concurrent initialization
    if (manager.lock) {
      console.log("Initialization already locked, waiting...");
      // Wait a bit and try again
      await new Promise(resolve => setTimeout(resolve, 100));
      return AvatarManager.getOrCreateAvatar(apiKey);
    }

    // Lock and start new initialization
    manager.lock = true;
    manager.promise = AvatarManager.createAvatar(apiKey);
    
    try {
      await manager.promise;
      return manager.avatar;
    } finally {
      manager.promise = null;
      manager.lock = false;
    }
  }

  private static async createAvatar(apiKey: string) {
    const manager = (window as any).__avatarManager;
    
    console.log("Creating new avatar instance");
    
    const avatar = new StreamingAvatar({ token: apiKey });
    
    // Set up event listeners
    avatar.on(StreamingEvents.AVATAR_START_TALKING, () => {
      console.log("Avatar started talking");
    });

    avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
      console.log("Avatar stopped talking");
    });

    avatar.on(StreamingEvents.STREAM_READY, async () => {
      console.log("Stream ready");
      // Avatar is ready, no automatic greeting
    });

    // Start the avatar with default settings
    const sessionInfo = await avatar.createStartAvatar({
      quality: AvatarQuality.High,
      avatarName: "Ann_Doctor_Standing2_public",
      disableIdleTimeout: true,
      knowledgeBase: undefined // Explicitly set to avoid potential issues
    });

    console.log("Avatar session created:", sessionInfo.session_id);
    manager.avatar = avatar;
    manager.sessionId = sessionInfo.session_id;
    
    // Start session health check
    if (manager.healthCheckInterval) {
      clearInterval(manager.healthCheckInterval);
    }
    
    manager.healthCheckInterval = setInterval(async () => {
      try {
        // Check if avatar is still connected
        if (!manager.avatar || !manager.avatar.mediaStream || !manager.avatar.mediaStream.active) {
          console.log("Avatar session lost, attempting to reconnect...");
          manager.avatar = null;
          manager.promise = null;
          manager.lock = false;
          await AvatarManager.getOrCreateAvatar(apiKey);
        }
      } catch (error) {
        console.error("Health check error:", error);
      }
    }, 5000); // Check every 5 seconds
    
    // Set global speak function with language detection
    (window as any).heygenSpeak = async (text: string, language?: string) => {
      if (manager.avatar) {
        try {
          // Detect language from text if not provided
          const detectedLang = language || AvatarManager.detectLanguage(text);
          const voiceConfig = AvatarManager.getVoiceConfig(detectedLang);
          
          // Speak with basic parameters only
          await manager.avatar.speak({
            text,
            taskType: TaskType.REPEAT,
            taskMode: TaskMode.SYNC
          });
        } catch (e: any) {
          console.error("Failed to speak:", e);
          
          // If session is closed, try to recreate the avatar
          if (e.message?.includes('session state wrong') || e.message?.includes('closed')) {
            console.log("Session closed, attempting to recreate avatar...");
            manager.avatar = null;
            manager.promise = null;
            manager.lock = false;
            
            // Try to recreate avatar
            try {
              await AvatarManager.getOrCreateAvatar(apiKey);
              // Retry speaking after recreating
              if (manager.avatar) {
                await manager.avatar.speak({
                  text,
                  taskType: TaskType.REPEAT,
                  taskMode: TaskMode.SYNC
                });
              }
            } catch (recreateError) {
              console.error("Failed to recreate avatar:", recreateError);
            }
          }
        }
      }
    };
    
    return avatar;
  }

  static getMediaStream(): MediaStream | null {
    const manager = (window as any).__avatarManager;
    const stream = manager.avatar?.mediaStream || null;
    console.log("Getting media stream:", stream);
    return stream;
  }

  static getAvatar() {
    const manager = (window as any).__avatarManager;
    return manager?.avatar;
  }

  static detectLanguage(text: string): string {
    // Simple language detection based on common patterns
    const turkishPatterns = /[ığüşöçĞÜŞÖÇİ]/;
    const arabicPatterns = /[\u0600-\u06FF]/;
    const chinesePatterns = /[\u4E00-\u9FA5]/;
    const japanesePatterns = /[\u3040-\u309F\u30A0-\u30FF]/;
    
    if (turkishPatterns.test(text)) return 'tr';
    if (arabicPatterns.test(text)) return 'ar';
    if (chinesePatterns.test(text)) return 'zh';
    if (japanesePatterns.test(text)) return 'ja';
    
    // Check for common Turkish words
    const turkishWords = ['merhaba', 'nasıl', 'yardım', 'teşekkür', 'lütfen', 'evet', 'hayır'];
    const lowerText = text.toLowerCase();
    if (turkishWords.some(word => lowerText.includes(word))) return 'tr';
    
    return 'en'; // Default to English
  }
  
  static getVoiceConfig(language: string): any {
    const voiceConfigs: Record<string, any> = {
      en: {
        voiceId: "1bd001e7e50f421d891986aad5158bc8", // English female
        rate: 1.0,
        emotion: VoiceEmotion.FRIENDLY
      },
      tr: {
        voiceId: "Zeynep - Natural", // HeyGen Turkish female voice
        rate: 1.0,
        emotion: VoiceEmotion.FRIENDLY,
        language: "Turkish"
      },
      es: {
        voiceId: "es-ES-ElviraNeural", // Spanish female
        rate: 1.0,
        emotion: VoiceEmotion.FRIENDLY
      },
      fr: {
        voiceId: "fr-FR-DeniseNeural", // French female
        rate: 1.0,
        emotion: VoiceEmotion.FRIENDLY
      },
      zh: {
        voiceId: "zh-CN-XiaoxiaoNeural", // Chinese female
        rate: 1.0,
        emotion: VoiceEmotion.FRIENDLY
      }
    };
    
    return voiceConfigs[language] || voiceConfigs.en;
  }

  static async cleanup() {
    if (globalAvatar) {
      console.log("Cleaning up avatar");
      try {
        await globalAvatar.stopAvatar();
      } catch (e) {
        console.error("Error stopping avatar:", e);
      }
      globalAvatar = null;
      hasGreeted = false;
    }
  }
}