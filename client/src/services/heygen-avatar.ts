import StreamingAvatar, { 
  AvatarQuality, 
  StreamingEvents,
  TaskType,
  VoiceEmotion,
  TaskMode
} from "@heygen/streaming-avatar";

class HeyGenAvatarService {
  private avatar: StreamingAvatar | null = null;
  private peerConnection: RTCPeerConnection | null = null;

  async createSession(apiKey: string) {
    try {
      // Initialize the streaming avatar with token
      this.avatar = new StreamingAvatar({ 
        token: apiKey 
      });

      // Listen to avatar events
      this.avatar.on(StreamingEvents.AVATAR_START_TALKING, (e) => {
        console.log("Avatar started talking");
      });

      this.avatar.on(StreamingEvents.AVATAR_STOP_TALKING, (e) => {
        console.log("Avatar stopped talking");
      });

      this.avatar.on(StreamingEvents.STREAM_READY, (e) => {
        console.log("Stream is ready", e);
      });

      this.avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        console.log("Stream disconnected");
      });

      // Create and start avatar session
      const sessionInfo = await this.avatar.createStartAvatar({
        quality: AvatarQuality.High,
        avatarName: "anna_public_3_20240108",
        voice: {
          voiceId: "1bd001e7e50f421d891986aad5158bc8",
          rate: 1.0,
          emotion: VoiceEmotion.FRIENDLY
        }
      });

      console.log("HeyGen session created:", sessionInfo);
      return sessionInfo;
    } catch (error) {
      console.error("Failed to create HeyGen session:", error);
      throw error;
    }
  }

  async speak(text: string) {
    if (!this.avatar) {
      throw new Error("Avatar not initialized");
    }

    try {
      await this.avatar.speak({
        text,
        taskType: TaskType.TALK,
        taskMode: TaskMode.SYNC
      });
    } catch (error) {
      console.error("Failed to make avatar speak:", error);
      throw error;
    }
  }

  async stopAvatar() {
    if (this.avatar) {
      await this.avatar.stopAvatar();
      this.avatar = null;
    }
  }

  getMediaStream() {
    return this.avatar?.mediaStream;
  }
}

export const heygenAvatarService = new HeyGenAvatarService();