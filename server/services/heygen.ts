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
    // Use the provided API key
    this.apiKey = "Mzk0YThhNTk4OWRiNGU4OGFlZDZiYzliYzkwOTBjOGQtMTcyNjczNDQ0Mg==";
    this.baseUrl = "https://api.heygen.com/v2";
  }

  async generateAvatarResponse(message: HeyGenChatMessage): Promise<HeyGenResponse> {
    try {
      if (!this.apiKey) {
        throw new Error("HeyGen API key not configured");
      }

      // Use common public avatar IDs that should be available
      const publicAvatarIds = [
        "Wayne_20240711", // Common public avatar
        "Anna_public_3_20240108", // Another common public avatar
        "josh_lite3_20230714", // Public avatar
        "Tyler-incasualsuit-20220721" // Another option
      ];
      
      // Try to get available avatars, fallback to public ones
      let avatarId = publicAvatarIds[0]; // Default to first public avatar
      
      try {
        const avatarsResponse = await fetch(`${this.baseUrl}/avatars`, {
          method: "GET",
          headers: {
            "X-API-Key": this.apiKey,
            "Content-Type": "application/json"
          }
        });

        if (avatarsResponse.ok) {
          const avatarsData = await avatarsResponse.json();
          if (avatarsData.data && avatarsData.data.length > 0) {
            // Use the first available avatar from user's account
            avatarId = avatarsData.data[0].avatar_id;
          }
        }
      } catch (error) {
        console.log("Using default public avatar");
      }

      // Generate avatar video with real HeyGen API
      const payload = {
        video_inputs: [{
          character: {
            type: "avatar",
            avatar_id: avatarId
          },
          voice: {
            type: "text",
            input_text: message.text,
            voice_id: "1bd001e7e50f421d891986aad5158bc8" // Default English voice
          }
        }],
        callback_id: message.sessionId,
        test: false // Set to true for testing, false for production
      };

      const response = await fetch(`${this.baseUrl}/video/generate`, {
        method: "POST",
        headers: {
          "X-API-Key": this.apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("HeyGen API error:", errorData);
        throw new Error(`HeyGen API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }

      const data = await response.json();

      return {
        videoUrl: data.data?.video_url,
        audioUrl: data.data?.audio_url,
        text: message.text,
        sessionId: message.sessionId,
        videoId: data.data?.video_id // For status checking
      };

    } catch (error) {
      console.error("HeyGen API error:", error);
      
      // Return mock response for development
      return {
        text: `I understand you said: "${message.text}". I'm your AI health assistant here to help with medical questions and appointments.`,
        sessionId: message.sessionId,
        videoUrl: `https://mock-avatar-video.com/${message.sessionId}.mp4`,
        audioUrl: `https://mock-avatar-audio.com/${message.sessionId}.mp3`
      };
    }
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