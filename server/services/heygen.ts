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
  private baseUrl: string;

  constructor() {
    // Use the working API key
    this.apiKey = process.env.HEYGEN_API_KEY || "Mzk0YThhNTk4OWRiNGU4OGFlZDZiYzliYzkwOTBjOGQtMTcyNjczNDQ0Mg==";
    this.baseUrl = "https://api.heygen.com/v1";
    
    if (!this.apiKey) {
      console.warn("HeyGen API key not configured. Avatar features will be limited.");
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

      // Create access token first
      console.log("Creating HeyGen access token...");
      const tokenResponse = await fetch(`${this.baseUrl}/streaming.create_token`, {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey
        }
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        console.error("HeyGen token error:", errorData);
        throw new Error(`HeyGen token error: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.data?.token;
      
      if (!accessToken) {
        throw new Error("No access token received");
      }

      console.log("Creating HeyGen streaming session with token...");
      
      // Create new session with the token
      const sessionPayload = {
        quality: "high",
        avatar_name: publicAvatars[0], // Use first public avatar
        voice: {
          voice_id: "1bd001e7e50f421d891986aad5158bc8"
        }
      };

      const sessionResponse = await fetch(`${this.baseUrl}/streaming.new`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(sessionPayload)
      });

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json();
        console.error("HeyGen session error:", errorData);
        throw new Error(`HeyGen session error: ${sessionResponse.status}`);
      }

      const sessionData = await sessionResponse.json();
      console.log("HeyGen session created:", sessionData);

      // If we have a session token, use it to send the message
      if (sessionData.data?.token) {
        const speakPayload = {
          text: message.text,
          task_type: "talk",
          session_id: sessionData.data.session_id
        };

        const speakResponse = await fetch(`${this.baseUrl}/streaming.task`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${sessionData.data.token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(speakPayload)
        });

        if (speakResponse.ok) {
          const speakData = await speakResponse.json();
          console.log("HeyGen speak response:", speakData);
          
          return {
            videoUrl: `https://api.heygen.com/v1/streaming.get/${sessionData.data.session_id}`,
            audioUrl: speakData.data?.audio_url,
            text: message.text,
            sessionId: message.sessionId,
            videoId: sessionData.data.session_id
          };
        }
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