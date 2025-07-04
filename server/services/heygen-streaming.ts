import StreamingAvatar, { 
  AvatarQuality, 
  StreamingEvents, 
  TaskMode,
  TaskType,
  VoiceEmotion 
} from "@heygen/streaming-avatar";

export class HeyGenStreamingService {
  private avatar: StreamingAvatar | null = null;
  private apiKey: string;
  private chatbotToken: string;

  constructor() {
    this.apiKey = process.env.HEYGEN_API_KEY || "Mzk0YThhNTk4OWRiNGU4OGFlZDZiYzliYzkwOTBjOGQtMTcyNjczNDQ0Mg==";
    this.chatbotToken = "bWVkY29yaG9zcGl0YWw6MTc1MTY0MDI5MjoyODZmMzRhY2UxNmZiOTc5Mzc4M2YxNjc4MDk4YzNjNGEzOGM2ZWM2NDZkMGQyYTNhZDcwNGY1ZDUxMGIwMDcy";
  }

  async createSession() {
    try {
      // Initialize the streaming avatar
      this.avatar = new StreamingAvatar({ 
        token: this.apiKey 
      });

      // Create a new session
      const sessionInfo = await this.avatar.createStartAvatar({
        quality: AvatarQuality.High,
        avatarName: "anna_public_3_20240108",
        voice: {
          voiceId: "1bd001e7e50f421d891986aad5158bc8",
          rate: 1.0,
          emotion: VoiceEmotion.FRIENDLY
        }
      });

      console.log("HeyGen Streaming session created:", sessionInfo);

      // Set up event listeners
      this.avatar.on(StreamingEvents.STREAM_READY, (event) => {
        console.log("Stream ready:", event);
      });

      this.avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        console.log("Stream disconnected");
      });

      return {
        sessionId: sessionInfo.session_id,
        sessionData: {
          sdp: sessionInfo.sdp,
          ice_servers: sessionInfo.ice_servers,
          session_id: sessionInfo.session_id,
          access_token: this.apiKey
        }
      };
    } catch (error) {
      console.error("Failed to create HeyGen streaming session:", error);
      throw error;
    }
  }

  async sendMessage(text: string) {
    if (!this.avatar) {
      throw new Error("Avatar session not initialized");
    }

    try {
      await this.avatar.speak({
        text,
        taskType: TaskType.TALK,
        taskMode: TaskMode.SYNC
      });
      
      return { success: true };
    } catch (error) {
      console.error("Failed to send message to avatar:", error);
      throw error;
    }
  }

  async closeSession() {
    if (this.avatar) {
      await this.avatar.stopAvatar();
      this.avatar = null;
    }
  }
}

export const heygenStreamingService = new HeyGenStreamingService();