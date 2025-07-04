// Speech Recognition Service using Web Speech API
// Falls back to audio recording if Web Speech API is not available

interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

interface SpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
  maxAlternatives?: number;
}

// Type definitions for Web Speech API
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onaudiostart: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: ISpeechRecognition, ev: any) => any) | null;
  onnomatch: ((this: ISpeechRecognition, ev: any) => any) | null;
  onresult: ((this: ISpeechRecognition, ev: any) => any) | null;
  onsoundstart: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: ISpeechRecognition, ev: Event) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

export class SpeechRecognitionService {
  private recognition: ISpeechRecognition | null = null;
  private isListening = false;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  constructor(options: SpeechRecognitionOptions = {}) {
    // Check if Web Speech API is available
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = options.continuous ?? false;
      this.recognition.interimResults = options.interimResults ?? true;
      this.recognition.lang = options.language ?? 'en-US';
      this.recognition.maxAlternatives = options.maxAlternatives ?? 1;
    }
  }

  async startListening(
    onResult: (result: SpeechRecognitionResult) => void,
    onError?: (error: Error) => void,
    onEnd?: () => void
  ): Promise<void> {
    if (this.isListening) return;
    
    this.isListening = true;

    // Try Web Speech API first
    if (this.recognition) {
      return this.startWebSpeechRecognition(onResult, onError, onEnd);
    }
    
    // Fallback to audio recording
    return this.startAudioRecording(onResult, onError, onEnd);
  }

  private startWebSpeechRecognition(
    onResult: (result: SpeechRecognitionResult) => void,
    onError?: (error: Error) => void,
    onEnd?: () => void
  ): void {
    if (!this.recognition) return;

    this.recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const result = event.results[last];
      
      onResult({
        transcript: result[0].transcript,
        confidence: result[0].confidence,
        isFinal: result.isFinal
      });
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event);
      this.isListening = false;
      if (onError) {
        onError(new Error(event.error || 'Speech recognition failed'));
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (onEnd) onEnd();
    };

    this.recognition.start();
  }

  private async startAudioRecording(
    onResult: (result: SpeechRecognitionResult) => void,
    onError?: (error: Error) => void,
    onEnd?: () => void
  ): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        
        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result?.toString().split(',')[1];
          
          if (base64Audio) {
            try {
              // Send to backend for transcription
              const response = await fetch('/api/speech-to-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  audio: base64Audio,
                  language: 'en'
                })
              });
              
              const data = await response.json();
              onResult({
                transcript: data.text || "Sorry, I couldn't understand that",
                confidence: data.confidence || 0.5,
                isFinal: true
              });
            } catch (error) {
              console.error('Transcription error:', error);
              if (onError) onError(error as Error);
            }
          }
        };
        
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        this.isListening = false;
        if (onEnd) onEnd();
      };

      this.mediaRecorder.start();
      
      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (this.isListening && this.mediaRecorder?.state === 'recording') {
          this.stopListening();
        }
      }, 10000);
    } catch (error) {
      console.error('Audio recording error:', error);
      this.isListening = false;
      if (onError) onError(error as Error);
    }
  }

  stopListening(): void {
    if (!this.isListening) return;
    
    if (this.recognition) {
      this.recognition.stop();
    }
    
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
    
    this.isListening = false;
  }

  isAvailable(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  getListeningState(): boolean {
    return this.isListening;
  }
}

// Create a singleton instance
export const speechRecognition = new SpeechRecognitionService();