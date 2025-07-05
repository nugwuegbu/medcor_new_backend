import StreamingAvatar, { AvatarQuality, StreamingEvents } from "@heygen/streaming-avatar";

export class AvatarManager {
  static async getOrCreateAvatar(apiKey: string): Promise<StreamingAvatar> {
    const manager = (window as any).__avatarManager;
    
    if (manager && manager.avatar && manager.sessionActive) {
      console.log("Returning existing avatar instance from window");
      return manager.avatar;
    }

    console.log("Creating new avatar instance");
    const avatar = new StreamingAvatar({ token: apiKey });

    // Store in window for persistence
    (window as any).__avatarManager = {
      avatar,
      sessionActive: false,
      sessionId: null
    };

    // Set up event listeners
    avatar.on(StreamingEvents.AVATAR_START_TALKING, () => {
      console.log("Avatar started talking");
    });

    avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
      console.log("Avatar stopped talking");
    });

    avatar.on(StreamingEvents.STREAM_READY, async () => {
      console.log("Stream ready");
    });

    // Start the avatar
    const sessionInfo = await avatar.createStartAvatar({
      quality: AvatarQuality.High,
      avatarName: "Ann_Doctor_Standing2_public",
      disableIdleTimeout: true
    });

    (window as any).__avatarManager.sessionActive = true;
    (window as any).__avatarManager.sessionId = sessionInfo.session_id;
    console.log("Avatar session created:", sessionInfo.session_id);

    return avatar;
  }

  static async speakText(
    avatar: StreamingAvatar, 
    text: string, 
    language: string = 'en',
    voice?: string
  ): Promise<void> {
    try {
      await avatar.speak({
        text
      });
    } catch (error) {
      console.error("Failed to speak:", error);
      throw error;
    }
  }

  static getMediaStream(): MediaStream | null {
    const manager = (window as any).__avatarManager;
    return manager?.avatar?.mediaStream || null;
  }

  static async closeAvatar(): Promise<void> {
    const manager = (window as any).__avatarManager;
    if (manager?.avatar) {
      try {
        await manager.avatar.stopAvatar();
        console.log("Avatar stopped");
      } catch (error) {
        console.error("Error stopping avatar:", error);
      }
      
      delete (window as any).__avatarManager;
    }
  }
}