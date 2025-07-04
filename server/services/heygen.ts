interface HeyGenAvatarConfig {
  avatarId: string;
  voice: string;
  language: string;
  background?: string;
}

interface HeyGenChatMessage {
  text: string;
  sessionId: string;
  language: string;
}

interface HeyGenResponse {
  videoUrl?: string;
  audioUrl?: string;
  text: string;
  sessionId: string;
  videoId?: string;
  avatarId?: string;
  voice?: string;
  language?: string;
  duration?: number;
  isSimulated?: boolean;
  sessionData?: {
    sdp: string;
    ice_servers: any[];
    session_id: string;
    access_token: string;
    realtime_endpoint?: string;
  };
}

// Avatar configurations for different languages
const AVATAR_CONFIGS: Record<string, HeyGenAvatarConfig> = {
  en: {
    avatarId: "default_english_avatar",
    voice: "en-US-JennyNeural",
    language: "en",
    background: "modern_shop"
  },
  es: {
    avatarId: "default_spanish_avatar", 
    voice: "es-ES-ElviraNeural",
    language: "es",
    background: "modern_shop"
  },
  fr: {
    avatarId: "default_french_avatar",
    voice: "fr-FR-DeniseNeural", 
    language: "fr",
    background: "modern_shop"
  },
  de: {
    avatarId: "default_german_avatar",
    voice: "de-DE-KatjaNeural",
    language: "de", 
    background: "modern_shop"
  },
  zh: {
    avatarId: "default_chinese_avatar",
    voice: "zh-CN-XiaoxiaoNeural",
    language: "zh",
    background: "modern_shop"
  },
  ja: {
    avatarId: "default_japanese_avatar",
    voice: "ja-JP-NanamiNeural",
    language: "ja",
    background: "modern_shop"
  }
};

export class HeyGenService {
  private apiKey: string;
  private chatbotToken: string;
  private baseUrl: string;

  constructor() {
    // Use the working API key
    this.apiKey = process.env.HEYGEN_API_KEY || "Mzk0YThhNTk4OWRiNGU4OGFlZDZiYzliYzkwOTBjOGQtMTcyNjczNDQ0Mg==";
    // Use the provided chatbot token
    this.chatbotToken = "bWVkY29yaG9zcGl0YWw6MTc1MTY0MDI5MjoyODZmMzRhY2UxNmZiOTc5Mzc4M2YxNjc4MDk4YzNjNGEzOGM2ZWM2NDZkMGQyYTNhZDcwNGY1ZDUxMGIwMDcy";
    this.baseUrl = "https://api.heygen.com/v1";
    
    if (!this.apiKey && !this.chatbotToken) {
      console.warn("Neither HeyGen API key nor chatbot token configured. Avatar features will be limited.");
    }
  }

  async generateAvatarResponse(message: HeyGenChatMessage): Promise<HeyGenResponse> {
    try {
      if (!this.apiKey) {
        throw new Error("HeyGen API key not configured");
      }

      // Use public avatars that should work with most accounts
      const publicAvatars = [
        "Kristin_public_2_20240108", // Public avatar
        "Anna_public_3_20240108", // Public avatar
        "josh_lite3_20230714", // Public avatar
        "Susan_public_2_20240328" // Public avatar
      ];

      console.log("Creating HeyGen streaming session...");
      
      // Create new session with API key
      const sessionPayload = {
        quality: "high",
        avatar_name: publicAvatars[0], // Use first public avatar
        voice: {
          voice_id: "1bd001e7e50f421d891986aad5158bc8"
        }
      };

      // Always use the API key approach - it's working
      const endpoint = "https://api.heygen.com/v1/streaming.new";
      
      const headers: HeadersInit = {
        "x-api-key": this.apiKey,
        "Content-Type": "application/json"
      };
      
      const sessionResponse = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(sessionPayload)
      });

      if (!sessionResponse.ok) {
        const errorText = await sessionResponse.text();
        console.error("HeyGen session error status:", sessionResponse.status);
        console.error("HeyGen session error response:", errorText.substring(0, 500)); // Log first 500 chars
        throw new Error(`HeyGen session error: ${sessionResponse.status}`);
      }

      const responseText = await sessionResponse.text();
      let sessionData;
      try {
        sessionData = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse HeyGen response:", responseText.substring(0, 500));
        throw new Error("HeyGen returned invalid JSON response");
      }
      console.log("HeyGen session created:", sessionData);

      // Return the session data for WebRTC connection
      if (sessionData.data?.sdp) {
        return {
          text: message.text,
          sessionId: message.sessionId,
          videoUrl: undefined,
          audioUrl: undefined,
          sessionData: {
            sdp: sessionData.data.sdp,
            ice_servers: sessionData.data.ice_servers2 || [],
            session_id: sessionData.data.session_id,
            access_token: this.apiKey,
            realtime_endpoint: sessionData.data.realtime_endpoint
          }
        };
      }

      // Fallback to video generation API
      console.log("Trying video generation API...");
      const videoPayload = {
        avatar_id: publicAvatars[0],
        input_text: message.text,
        voice_id: "1bd001e7e50f421d891986aad5158bc8"
      };

      const videoResponse = await fetch(`${this.baseUrl}/video.generate`, {
        method: "POST",
        headers: {
          "X-API-Key": this.apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(videoPayload)
      });

      if (videoResponse.ok) {
        const videoData = await videoResponse.json();
        console.log("HeyGen video response:", videoData);
        
        return {
          videoUrl: videoData.data?.video_url,
          audioUrl: videoData.data?.audio_url,
          text: message.text,
          sessionId: message.sessionId,
          videoId: videoData.data?.video_id
        };
      }

    } catch (error) {
      console.error("HeyGen API error:", error);
    }

    // Enhanced mock response with realistic avatar simulation
    return {
      text: message.text,
      sessionId: message.sessionId,
      videoUrl: undefined, // No video URL, will use CSS animation instead
      audioUrl: undefined,
      isSimulated: true
    };
  }

  async getAvatarStatus(sessionId: string): Promise<{ status: string; progress?: number }> {
    try {
      if (!this.apiKey) {
        return { status: "unavailable" };
      }

      const response = await fetch(`${this.baseUrl}/video/status/${sessionId}`, {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        return { status: "error" };
      }

      const data = await response.json();
      return {
        status: data.status,
        progress: data.progress
      };

    } catch (error) {
      console.error("HeyGen status check error:", error);
      return { status: "error" };
    }
  }

  getAvailableLanguages(): string[] {
    return Object.keys(AVATAR_CONFIGS);
  }

  getAvatarConfig(language: string): HeyGenAvatarConfig {
    return AVATAR_CONFIGS[language] || AVATAR_CONFIGS.en;
  }
}

export const heygenService = new HeyGenService();