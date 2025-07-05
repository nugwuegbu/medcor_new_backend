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

// Optimized cache with LRU-like behavior
const MAX_CACHE_SIZE = 100;
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

class OptimizedCache {
  private cache = new Map<string, { 
    timestamp: number; 
    duration: number;
    latency: number;
    lastAccessed: number;
  }>();

  get(key: string) {
    const item = this.cache.get(key);
    if (item && Date.now() - item.timestamp < CACHE_TTL) {
      item.lastAccessed = Date.now();
      metrics.cacheHits++;
      return item;
    }
    metrics.cacheMisses++;
    return null;
  }

  set(key: string, value: { timestamp: number; duration: number; latency: number }) {
    // Remove oldest items if cache is full
    if (this.cache.size >= MAX_CACHE_SIZE) {
      let oldestKey = '';
      let oldestTime = Date.now();
      
      this.cache.forEach((v, k) => {
        if (v.lastAccessed < oldestTime) {
          oldestTime = v.lastAccessed;
          oldestKey = k;
        }
      });
      
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(key, { ...value, lastAccessed: Date.now() });
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    return !!(item && Date.now() - item.timestamp < CACHE_TTL);
  }
}

const responseCache = new OptimizedCache();

// Metrics tracking
const metrics = {
  cacheHits: 0,
  cacheMisses: 0,
  averageLatency: 0,
  totalRequests: 0
};

export class AvatarManager {
  private static lastRecoveryAttempt = 0;
  private static freezeDetectionInterval: NodeJS.Timeout | null = null;
  private static sessionPool: StreamingAvatar[] = [];
  private static isPreWarming = false;
  
  private static preWarmConnection(apiKey: string) {
    // Pre-warm multiple connections for instant switching
    if (!this.isPreWarming && this.sessionPool.length < 2) {
      this.isPreWarming = true;
      setTimeout(async () => {
        try {
          console.log("Pre-warming avatar connections...");
          const avatar = new StreamingAvatar({ token: apiKey });
          await avatar.createStartAvatar({
            quality: AvatarQuality.High,
            avatarName: "Ann_Doctor_Standing2_public",
            disableIdleTimeout: true
          });
          this.sessionPool.push(avatar);
          console.log("Pre-warmed avatar ready in pool");
        } catch (e) {
          console.log("Pre-warm failed:", (e as Error).message);
        }
        this.isPreWarming = false;
      }, 1000);
    }
  }

  static async getOrCreateAvatar(apiKey: string): Promise<StreamingAvatar> {
    const manager = (window as any).__avatarManager;
    
    // Check if we have a pre-warmed avatar in the pool
    if (this.sessionPool.length > 0) {
      const pooledAvatar = this.sessionPool.shift();
      console.log("Using pre-warmed avatar from pool - instant connection!");
      manager.avatar = pooledAvatar;
      
      // Start pre-warming another one
      this.preWarmConnection(apiKey);
      
      return pooledAvatar!;
    }
    
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
    
    const avatar = new StreamingAvatar({ 
      token: apiKey
    });
    
    // Set up event listeners
    avatar.on(StreamingEvents.AVATAR_START_TALKING, () => {
      console.log("Avatar started talking");
    });

    avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
      console.log("Avatar stopped talking");
    });

    avatar.on(StreamingEvents.STREAM_READY, async () => {
      console.log("Stream ready");
      // Log connection quality metrics
      if ((window as any).performance && (window as any).performance.now) {
        const connectionTime = (window as any).performance.now();
        console.log(`WebRTC connection established in ${Math.round(connectionTime)}ms`);
      }
      
      // Start freeze detection
      this.startFreezeDetection();
      
      // Avatar is ready, no automatic greeting
    });

    // Start the avatar with high quality settings
    const sessionInfo = await avatar.createStartAvatar({
      quality: AvatarQuality.High, // High quality for better visual experience
      avatarName: "Ann_Doctor_Standing2_public", // Back to original avatar
      disableIdleTimeout: true,
      knowledgeBase: undefined // Explicitly set to avoid potential issues
    });

    console.log("Avatar session created:", sessionInfo.session_id);
    manager.avatar = avatar;
    
    // Preload common responses for better performance
    const commonPhrases = [
      "Hello! How can I assist you today?",
      "I understand your concern.",
      "Let me help you with that.",
      "Would you like to schedule an appointment?",
      "Thank you for visiting MedCare AI."
    ];
    
    // Preload in background without blocking
    setTimeout(() => {
      commonPhrases.forEach(phrase => {
        const cacheKey = `${phrase}_auto`;
        if (!responseCache.has(cacheKey)) {
          console.log(`Preloading: "${phrase}"`);
          // Just cache the metadata, actual speak will happen when needed
          responseCache.set(cacheKey, {
            timestamp: Date.now(),
            duration: 0,
            latency: 0
          });
        }
      });
    }, 2000);
    
    // Set global speak function with language detection and caching
    (window as any).heygenSpeak = async (text: string, language?: string) => {
      if (manager.avatar) {
        try {
          // Check cache first for improved speed
          const cacheKey = `${text}_${language || 'auto'}`;
          const cached = responseCache.get(cacheKey);
          
          if (cached) {
            console.log(`Cache hit! Latency: ${cached.latency}ms`);
            metrics.cacheHits++;
            // For cached responses, we still need to trigger the avatar to speak
            // but the response will be faster as HeyGen may have internal caching
          }
          
          // Detect language from text if not provided
          const detectedLang = language || AvatarManager.detectLanguage(text);
          const voiceConfig = AvatarManager.getVoiceConfig(detectedLang);
          
          const startTime = Date.now();
          
          // Speak with optimized parameters for better performance
          await manager.avatar.speak({
            text,
            taskType: TaskType.REPEAT,
            taskMode: TaskMode.ASYNC // Changed from SYNC to ASYNC for non-blocking operation
          });
          
          // Cache the response timing with latency
          const latency = Date.now() - startTime;
          responseCache.set(cacheKey, {
            timestamp: Date.now(),
            duration: latency,
            latency: latency
          });
          
          // Update metrics
          metrics.totalRequests++;
          metrics.averageLatency = (metrics.averageLatency * (metrics.totalRequests - 1) + latency) / metrics.totalRequests;
          console.log(`Response latency: ${latency}ms, Average: ${Math.round(metrics.averageLatency)}ms`);
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
                  taskMode: TaskMode.ASYNC // Changed from SYNC to ASYNC for non-blocking operation
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
    if (this.freezeDetectionInterval) {
      clearInterval(this.freezeDetectionInterval);
      this.freezeDetectionInterval = null;
    }
    
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
  
  private static startFreezeDetection() {
    if (this.freezeDetectionInterval) {
      clearInterval(this.freezeDetectionInterval);
    }
    
    let lastFrameCount = 0;
    let freezeCount = 0;
    
    this.freezeDetectionInterval = setInterval(() => {
      const video = document.querySelector('video');
      if (!video) return;
      
      // Check if video is actually playing
      const currentTime = video.currentTime;
      
      // Use webkitDecodedFrameCount if available (Chrome)
      const frameCount = (video as any).webkitDecodedFrameCount || 
                        (video as any).mozDecodedFrames || 
                        currentTime;
      
      if (frameCount === lastFrameCount && !video.paused) {
        freezeCount++;
        console.log(`Video might be frozen (${freezeCount} checks)`);
        
        if (freezeCount >= 3) {
          console.log("Video freeze detected - attempting recovery");
          this.handleVideoFreeze();
          freezeCount = 0;
        }
      } else {
        freezeCount = 0;
      }
      
      lastFrameCount = frameCount;
    }, 1000);
  }
  
  private static handleVideoFreeze() {
    const video = document.querySelector('video');
    const manager = (window as any).__avatarManager;
    const stream = manager?.avatar?.mediaStream;
    
    if (!video || !stream) return;
    
    // Try various recovery methods
    console.log("Attempting to recover from video freeze...");
    
    // Method 1: Toggle video tracks
    const videoTracks = stream.getVideoTracks();
    videoTracks.forEach((track: MediaStreamTrack) => {
      track.enabled = false;
      setTimeout(() => {
        track.enabled = true;
      }, 50);
    });
    
    // Method 2: Force video element reload
    const currentSrc = video.srcObject;
    video.srcObject = null;
    setTimeout(() => {
      video.srcObject = currentSrc;
      video.play().catch(e => console.error("Failed to restart video:", e));
    }, 100);
  }
}