import { textToSpeechService } from './text-to-speech.js';

export interface AvatarState {
  mode: 'waiting' | 'speaking' | 'heygen_active' | 'elevenlabs_fallback';
  sessionId?: string;
  isHeygenReady: boolean;
  isHeygenHealthy: boolean;
  lastActivity: Date;
}

export interface AvatarResponse {
  mode: 'waiting' | 'speaking' | 'heygen_active' | 'elevenlabs_fallback';
  videoUrl?: string;
  audioUrl?: string;
  sessionId?: string;
  message?: string;
  shouldTransition?: boolean;
}

export class AvatarOrchestrator {
  private sessions: Map<string, AvatarState> = new Map();
  private heygenHealthCheck: Map<string, boolean> = new Map();
  
  constructor() {
    // Periyodik health check
    setInterval(() => this.checkHeygenHealth(), 10000);
  }

  async initializeSession(sessionId: string): Promise<AvatarResponse> {
    const state: AvatarState = {
      mode: 'waiting',
      isHeygenReady: false,
      isHeygenHealthy: false,
      lastActivity: new Date()
    };
    
    this.sessions.set(sessionId, state);
    
    // Background'da HeyGen hazırlığı başlat
    this.prepareHeygenInBackground(sessionId);
    
    return {
      mode: 'waiting',
      videoUrl: '/waiting_heygen.mp4',
      message: 'Avatar initializing...'
    };
  }

  async handleUserMessage(sessionId: string, message: string, aiResponse: string): Promise<AvatarResponse> {
    const state = this.sessions.get(sessionId);
    if (!state) {
      return this.initializeSession(sessionId);
    }

    state.lastActivity = new Date();
    
    // Detect language from user message
    const detectedLanguage = this.detectLanguage(message);
    console.log(`Detected language: ${detectedLanguage} for message: "${message}"`);
    
    // Kullanıcı mesaj gönderdiğinde speaking moduna geç
    state.mode = 'speaking';
    this.sessions.set(sessionId, state);

    // HeyGen hazır mı kontrol et
    if (state.isHeygenReady && state.isHeygenHealthy) {
      // HeyGen aktif et
      state.mode = 'heygen_active';
      this.sessions.set(sessionId, state);
      
      return {
        mode: 'heygen_active',
        sessionId: state.sessionId,
        shouldTransition: true,
        message: 'Switching to HeyGen avatar...'
      };
    } else {
      // Language-based TTS fallback
      state.mode = 'elevenlabs_fallback';
      this.sessions.set(sessionId, state);
      
      try {
        let audioResponse;
        let provider;
        
        if (detectedLanguage === 'tr') {
          // Turkish: Use ElevenLabs with Turkish voice
          audioResponse = await textToSpeechService.generateSpeech(aiResponse, 'tr', 'elevenlabs');
          provider = 'ElevenLabs Turkish';
        } else {
          // English/Other: Use OpenAI TTS
          audioResponse = await textToSpeechService.generateSpeech(aiResponse, 'en', 'openai');
          provider = 'OpenAI English';
        }
        
        return {
          mode: 'elevenlabs_fallback',
          videoUrl: '/speak_heygen.mp4',
          audioUrl: audioResponse.audioUrl,
          message: `Using ${provider} voice...`
        };
      } catch (error) {
        console.error('TTS fallback failed:', error);
        return {
          mode: 'speaking',
          videoUrl: '/speak_heygen.mp4',
          message: 'Voice generation failed'
        };
      }
    }
  }

  private detectLanguage(text: string): 'tr' | 'en' {
    // Turkish specific characters and patterns
    const turkishChars = /[çğıöşüÇĞIİÖŞÜ]/;
    const turkishWords = /\b(ve|ile|bir|bu|şu|o|ben|sen|biz|siz|onlar|nasıl|ne|nerede|neden|kim|hangi|kaç|merhaba|selam|teşekkür|günaydın|iyi|kötü|doktor|randevu|sağlık|hasta|tedavi)\b/i;
    
    return (turkishChars.test(text) || turkishWords.test(text)) ? 'tr' : 'en';
  }

  async getSessionState(sessionId: string): Promise<AvatarState | null> {
    return this.sessions.get(sessionId) || null;
  }

  private async prepareHeygenInBackground(sessionId: string): Promise<void> {
    try {
      console.log(`Preparing HeyGen for session ${sessionId}...`);
      
      // HeyGen session oluştur (gerçek API çağrısı)
      // Bu işlem background'da çalışır, UI'ı bloklamaz
      
      // Simulated HeyGen preparation
      setTimeout(() => {
        const state = this.sessions.get(sessionId);
        if (state) {
          state.isHeygenReady = true;
          state.isHeygenHealthy = true;
          state.sessionId = `heygen_${Date.now()}`;
          this.sessions.set(sessionId, state);
          this.heygenHealthCheck.set(sessionId, true);
          console.log(`HeyGen ready for session ${sessionId}`);
        }
      }, 2000); // 2 saniye hazırlık süresi
      
    } catch (error) {
      console.error('HeyGen preparation failed:', error);
      const state = this.sessions.get(sessionId);
      if (state) {
        state.isHeygenHealthy = false;
        this.sessions.set(sessionId, state);
      }
    }
  }

  private checkHeygenHealth(): void {
    // HeyGen session'ları periyodik kontrol et
    for (const [sessionId, state] of this.sessions.entries()) {
      if (state.isHeygenReady && state.sessionId) {
        // HeyGen health check logic
        const isHealthy = this.heygenHealthCheck.get(sessionId) || false;
        state.isHeygenHealthy = isHealthy;
        this.sessions.set(sessionId, state);
      }
    }
  }

  async cleanupSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
    this.heygenHealthCheck.delete(sessionId);
  }

  getActiveSessionsCount(): number {
    return this.sessions.size;
  }

  getHeygenSessionsCount(): number {
    return Array.from(this.sessions.values()).filter(s => s.mode === 'heygen_active').length;
  }
}

export const avatarOrchestrator = new AvatarOrchestrator();