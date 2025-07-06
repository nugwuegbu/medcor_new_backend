import OpenAI from 'openai';
import { elevenLabsService } from './elevenlabs';

interface TTSRequest {
  text: string;
  voice?: string;
  provider?: 'openai' | 'elevenlabs';
  language?: string;
}

interface TTSResponse {
  audio: Buffer;
  contentType: string;
  provider: string;
}

export class TextToSpeechService {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async generateSpeech(request: TTSRequest): Promise<TTSResponse> {
    const { text, voice, provider = 'elevenlabs', language = 'en' } = request;

    // Detect language from text to choose appropriate provider
    const isTurkish = this.detectTurkish(text);
    
    // Use ElevenLabs for Turkish or when explicitly requested
    if (provider === 'elevenlabs' || isTurkish) {
      return this.generateElevenLabsSpeech(text, voice);
    } else {
      return this.generateOpenAISpeech(text, voice);
    }
  }

  private async generateElevenLabsSpeech(text: string, voiceId?: string): Promise<TTSResponse> {
    try {
      const response = await elevenLabsService.textToSpeech({
        text,
        voiceId: voiceId || 'pWeLcyFEBT5svt9WMYAO', // Default Turkish voice
        stability: 0.5,
        similarityBoost: 0.8,
        style: 0.0,
        useSpeakerBoost: true
      });

      return {
        audio: response.audio,
        contentType: response.contentType,
        provider: 'elevenlabs'
      };
    } catch (error) {
      console.error('ElevenLabs TTS failed, falling back to OpenAI:', error);
      // Fallback to OpenAI if ElevenLabs fails
      return this.generateOpenAISpeech(text);
    }
  }

  private async generateOpenAISpeech(text: string, voice?: string): Promise<TTSResponse> {
    try {
      // OpenAI TTS voices: alloy, echo, fable, onyx, nova, shimmer
      const selectedVoice = voice || 'nova'; // Nova has a pleasant female voice
      
      const mp3 = await this.openai.audio.speech.create({
        model: "tts-1-hd", // High quality model
        voice: selectedVoice as any,
        input: text,
        response_format: 'mp3',
        speed: 1.0
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());

      return {
        audio: buffer,
        contentType: 'audio/mpeg',
        provider: 'openai'
      };
    } catch (error) {
      console.error('OpenAI TTS error:', error);
      throw new Error(`Failed to generate speech with OpenAI: ${error.message}`);
    }
  }

  private detectTurkish(text: string): boolean {
    // Turkish specific characters and patterns
    const turkishChars = /[çğıöşüÇĞIİÖŞÜ]/;
    const turkishWords = /\b(ve|ile|bir|bu|şu|o|ben|sen|biz|siz|onlar|nasıl|ne|nerede|neden|kim|hangi|kaç|merhaba|selam|teşekkür|günaydın|iyi|kötü)\b/i;
    
    return turkishChars.test(text) || turkishWords.test(text);
  }

  async getAvailableVoices() {
    try {
      const elevenLabsVoices = await elevenLabsService.getVoices();
      
      const openAIVoices = [
        { id: 'alloy', name: 'Alloy', provider: 'openai' },
        { id: 'echo', name: 'Echo', provider: 'openai' },
        { id: 'fable', name: 'Fable', provider: 'openai' },
        { id: 'onyx', name: 'Onyx', provider: 'openai' },
        { id: 'nova', name: 'Nova', provider: 'openai' },
        { id: 'shimmer', name: 'Shimmer', provider: 'openai' }
      ];

      return {
        elevenlabs: elevenLabsVoices.voices || [],
        openai: openAIVoices
      };
    } catch (error) {
      console.error('Failed to get voices:', error);
      return {
        elevenlabs: [],
        openai: []
      };
    }
  }
}

export const textToSpeechService = new TextToSpeechService();