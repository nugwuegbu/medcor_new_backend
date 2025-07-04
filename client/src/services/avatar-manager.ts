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

export class AvatarManager {
  static async getOrCreateAvatar(apiKey: string) {
    // If we already have an avatar, return it
    if (globalAvatar) {
      console.log("Returning existing avatar instance");
      return globalAvatar;
    }

    // If initialization is in progress, wait for it
    if (globalInitPromise) {
      console.log("Waiting for existing initialization");
      await globalInitPromise;
      return globalAvatar;
    }

    // Start new initialization
    globalInitPromise = AvatarManager.createAvatar(apiKey);
    
    try {
      await globalInitPromise;
      return globalAvatar;
    } finally {
      globalInitPromise = null;
    }
  }

  private static async createAvatar(apiKey: string) {
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
      
      // Only greet once per session
      if (!hasGreeted) {
        hasGreeted = true;
        try {
          await avatar.speak({
            text: "Hello there! How can I help you? I am Medcor AI assistant.",
            taskType: TaskType.REPEAT,
            taskMode: TaskMode.SYNC
          });
        } catch (e) {
          console.error("Failed to speak greeting:", e);
        }
      }
    });

    // Start the avatar
    const sessionInfo = await avatar.createStartAvatar({
      quality: AvatarQuality.High,
      avatarName: "Ann_Doctor_Standing2_public",
      voice: {
        voiceId: "1bd001e7e50f421d891986aad5158bc8", // Default female voice
        rate: 1.0,
        emotion: VoiceEmotion.FRIENDLY
      },
      disableIdleTimeout: true
    });

    console.log("Avatar session created:", sessionInfo.session_id);
    globalAvatar = avatar;
    
    // Set global speak function
    (window as any).heygenSpeak = async (text: string) => {
      if (globalAvatar) {
        try {
          await globalAvatar.speak({
            text,
            taskType: TaskType.REPEAT,
            taskMode: TaskMode.SYNC
          });
        } catch (e) {
          console.error("Failed to speak:", e);
        }
      }
    };
    
    return avatar;
  }

  static getMediaStream(): MediaStream | null {
    return globalAvatar?.mediaStream || null;
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