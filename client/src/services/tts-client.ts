interface TTSOptions {
  text: string;
  provider?: 'elevenlabs' | 'openai';
  voiceId?: string;
  language?: string;
}

interface TTSResponse {
  audioUrl: string;
  provider: string;
}

export class TTSClient {
  private audioCache = new Map<string, string>();

  async generateSpeech(options: TTSOptions): Promise<TTSResponse> {
    const { text, provider = 'elevenlabs', voiceId, language = 'en' } = options;
    
    // Create cache key
    const cacheKey = `${provider}-${voiceId || 'default'}-${text}`;
    
    // Check cache first
    if (this.audioCache.has(cacheKey)) {
      return {
        audioUrl: this.audioCache.get(cacheKey)!,
        provider
      };
    }

    try {
      let response: Response;

      if (provider === 'elevenlabs') {
        response = await fetch('/api/elevenlabs/tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            voiceId: voiceId || 'pWeLcyFEBT5svt9WMYAO' // Default Turkish voice
          })
        });
      } else {
        response = await fetch('/api/text-to-speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            provider: 'openai',
            voice: voiceId,
            language
          })
        });
      }

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      // Convert audio blob to URL
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Cache the URL
      this.audioCache.set(cacheKey, audioUrl);
      
      return {
        audioUrl,
        provider
      };
    } catch (error) {
      console.error('TTS generation failed:', error);
      throw new Error(`Failed to generate speech: ${error.message}`);
    }
  }

  async playAudio(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error('Audio playback failed'));
      
      audio.play().catch(reject);
    });
  }

  async speakText(text: string, options: Partial<TTSOptions> = {}): Promise<void> {
    try {
      const ttsResponse = await this.generateSpeech({
        text,
        provider: 'elevenlabs', // Default to ElevenLabs for quality
        voiceId: 'pWeLcyFEBT5svt9WMYAO', // Turkish voice
        ...options
      });

      await this.playAudio(ttsResponse.audioUrl);
    } catch (error) {
      console.error('Failed to speak text:', error);
      
      // Fallback to browser's speech synthesis
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = options.language || 'tr-TR';
        speechSynthesis.speak(utterance);
      }
    }
  }

  async getAvailableVoices() {
    try {
      const response = await fetch('/api/voices');
      return await response.json();
    } catch (error) {
      console.error('Failed to get voices:', error);
      return { elevenlabs: [], openai: [], custom: [] };
    }
  }

  clearCache() {
    // Cleanup cached audio URLs
    for (const url of this.audioCache.values()) {
      URL.revokeObjectURL(url);
    }
    this.audioCache.clear();
  }

  // Detect if text is Turkish to use appropriate voice
  private detectTurkish(text: string): boolean {
    const turkishChars = /[çğıöşüÇĞIİÖŞÜ]/;
    const turkishWords = /\b(ve|ile|bir|bu|şu|o|ben|sen|biz|siz|onlar|nasıl|ne|nerede|neden|kim|hangi|kaç|merhaba|selam|teşekkür|günaydın|iyi|kötü)\b/i;
    
    return turkishChars.test(text) || turkishWords.test(text);
  }
}

export const ttsClient = new TTSClient();