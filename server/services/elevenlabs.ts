import fetch from 'node-fetch';

interface ElevenLabsVoiceResponse {
  audio: Buffer;
  contentType: string;
}

interface TextToSpeechRequest {
  text: string;
  voiceId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

export class ElevenLabsService {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  private defaultVoiceId = 'pWeLcyFEBT5svt9WMYAO'; // Turkish voice ID provided

  constructor() {
    if (!process.env.ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY environment variable is required');
    }
    this.apiKey = process.env.ELEVENLABS_API_KEY;
  }

  async textToSpeech(request: TextToSpeechRequest): Promise<ElevenLabsVoiceResponse> {
    const voiceId = request.voiceId || this.defaultVoiceId;
    
    const payload = {
      text: request.text,
      model_id: 'eleven_multilingual_v2', // Supports Turkish
      voice_settings: {
        stability: request.stability || 0.5,
        similarity_boost: request.similarityBoost || 0.8,
        style: request.style || 0.0,
        use_speaker_boost: request.useSpeakerBoost || true
      }
    };

    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      const audioBuffer = await response.buffer();
      
      return {
        audio: audioBuffer,
        contentType: 'audio/mpeg'
      };
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      throw new Error(`Failed to generate speech: ${error.message}`);
    }
  }

  async getVoices() {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('ElevenLabs get voices error:', error);
      throw new Error(`Failed to fetch voices: ${error.message}`);
    }
  }

  async getVoiceInfo(voiceId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/voices/${voiceId}`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voice info: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('ElevenLabs get voice info error:', error);
      throw new Error(`Failed to fetch voice info: ${error.message}`);
    }
  }
}

export const elevenLabsService = new ElevenLabsService();