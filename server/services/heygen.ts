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
    this.apiKey = process.env.HEYGEN_API_KEY || "";
    this.baseUrl = "https://api.heygen.com/v2";
  }

  async generateAvatarResponse(message: HeyGenChatMessage): Promise<HeyGenResponse> {
    try {
      if (!this.apiKey) {
        throw new Error("HeyGen API key not configured");
      }

      const config = AVATAR_CONFIGS[message.language] || AVATAR_CONFIGS.en;
      
      const payload = {
        avatar_id: config.avatarId,
        voice: config.voice,
        text: message.text,
        background: config.background,
        session_id: message.sessionId,
        language: config.language
      };

      const response = await fetch(`${this.baseUrl}/video/generate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HeyGen API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        videoUrl: data.video_url,
        audioUrl: data.audio_url,
        text: message.text,
        sessionId: message.sessionId
      };

    } catch (error) {
      console.error("HeyGen API error:", error);
      
      // Return text-only response as fallback
      return {
        text: message.text,
        sessionId: message.sessionId
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