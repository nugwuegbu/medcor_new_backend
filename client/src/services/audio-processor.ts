// Professional Audio Processing System with Web Audio API
// Handles microphone access, audio level monitoring, noise reduction, and recording

export interface AudioProcessorOptions {
  sampleRate?: number;
  bufferSize?: number;
  numberOfChannels?: number;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
}

export interface AudioVisualizationData {
  volume: number;
  frequency: Float32Array;
  waveform: Float32Array;
  isClipping: boolean;
}

export class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private recorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording = false;
  private isInitialized = false;
  private animationId: number | null = null;
  private onVisualizationUpdate?: (data: AudioVisualizationData) => void;
  private frequencyData: Uint8Array | null = null;
  private timeDomainData: Uint8Array | null = null;

  constructor(private options: AudioProcessorOptions = {}) {
    this.options = {
      sampleRate: 48000,
      bufferSize: 2048,
      numberOfChannels: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      ...options
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create audio context with optimal settings
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.options.sampleRate
      });

      // Request microphone with advanced constraints
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: this.options.echoCancellation,
          noiseSuppression: this.options.noiseSuppression,
          autoGainControl: this.options.autoGainControl,
          channelCount: this.options.numberOfChannels,
          sampleRate: this.options.sampleRate,
          sampleSize: 16,
          // Advanced constraints for better quality
          latency: 0.01,
          googEchoCancellation: true,
          googAutoGainControl: true,
          googNoiseSuppression: true,
          googHighpassFilter: true,
          googTypingNoiseDetection: true
        } as any
      });

      // Create audio nodes
      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.gainNode = this.audioContext.createGain();

      // Configure analyser for precise visualization
      this.analyser.fftSize = this.options.bufferSize!;
      this.analyser.smoothingTimeConstant = 0.8;
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -10;

      // Connect nodes
      this.source.connect(this.gainNode);
      this.gainNode.connect(this.analyser);

      // Initialize data arrays
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeDomainData = new Uint8Array(this.analyser.fftSize);

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize audio processor:', error);
      throw error;
    }
  }

  async startRecording(onDataAvailable?: (blob: Blob) => void): Promise<void> {
    if (!this.isInitialized) await this.initialize();
    if (this.isRecording) return;

    this.recordedChunks = [];
    
    // Create MediaRecorder with optimal settings
    const mimeType = this.getBestMimeType();
    this.recorder = new MediaRecorder(this.mediaStream!, {
      mimeType,
      audioBitsPerSecond: 128000
    });

    this.recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
        if (onDataAvailable) {
          onDataAvailable(event.data);
        }
      }
    };

    this.recorder.start(100); // Collect data every 100ms
    this.isRecording = true;
    this.startVisualization();
  }

  async stopRecording(): Promise<Blob> {
    if (!this.isRecording || !this.recorder) {
      throw new Error('Not recording');
    }

    return new Promise((resolve) => {
      this.recorder!.onstop = () => {
        const blob = new Blob(this.recordedChunks, { 
          type: this.recorder!.mimeType 
        });
        this.recordedChunks = [];
        resolve(blob);
      };

      this.recorder.stop();
      this.isRecording = false;
      this.stopVisualization();
    });
  }

  private getBestMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/wav',
      'audio/mp4'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm'; // Default fallback
  }

  setVisualizationCallback(callback: (data: AudioVisualizationData) => void): void {
    this.onVisualizationUpdate = callback;
  }

  private startVisualization(): void {
    if (!this.analyser || this.animationId) return;

    const visualize = () => {
      if (!this.isRecording) return;

      // Get frequency and waveform data
      this.analyser!.getByteFrequencyData(this.frequencyData!);
      this.analyser!.getByteTimeDomainData(this.timeDomainData!);

      // Calculate volume (RMS)
      let sum = 0;
      for (let i = 0; i < this.timeDomainData!.length; i++) {
        const normalized = (this.timeDomainData![i] - 128) / 128;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / this.timeDomainData!.length);
      const volume = Math.min(1, rms * 2); // Scale to 0-1

      // Check for clipping
      const isClipping = this.timeDomainData!.some(value => 
        value === 0 || value === 255
      );

      // Convert to Float32Array for visualization
      const frequency = new Float32Array(this.frequencyData!);
      const waveform = new Float32Array(this.timeDomainData!);

      if (this.onVisualizationUpdate) {
        this.onVisualizationUpdate({
          volume,
          frequency,
          waveform,
          isClipping
        });
      }

      this.animationId = requestAnimationFrame(visualize);
    };

    visualize();
  }

  private stopVisualization(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  async convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result?.toString().split(',')[1];
        if (base64) {
          resolve(base64);
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  setGain(value: number): void {
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(
        Math.max(0, Math.min(2, value)), 
        this.audioContext!.currentTime
      );
    }
  }

  destroy(): void {
    this.stopVisualization();
    
    if (this.recorder && this.isRecording) {
      this.recorder.stop();
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }

    if (this.audioContext) {
      this.audioContext.close();
    }

    this.audioContext = null;
    this.mediaStream = null;
    this.source = null;
    this.analyser = null;
    this.gainNode = null;
    this.recorder = null;
    this.isInitialized = false;
    this.isRecording = false;
  }

  isActive(): boolean {
    return this.isRecording;
  }

  // Advanced feature: Get audio level in decibels
  getAudioLevel(): number {
    if (!this.analyser || !this.timeDomainData) return -Infinity;

    this.analyser.getByteTimeDomainData(this.timeDomainData);
    
    let sum = 0;
    for (let i = 0; i < this.timeDomainData.length; i++) {
      const normalized = (this.timeDomainData[i] - 128) / 128;
      sum += normalized * normalized;
    }
    
    const rms = Math.sqrt(sum / this.timeDomainData.length);
    const db = 20 * Math.log10(rms);
    
    return db;
  }
}

// Export singleton instance for easy use
export const audioProcessor = new AudioProcessor();