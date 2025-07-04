import StreamingAvatar, { 
  AvatarQuality, 
  StreamingEvents,
  TaskType,
  TaskMode,
  VoiceEmotion 
} from "@heygen/streaming-avatar";

class HeyGenSingleton {
  private static instance: HeyGenSingleton | null = null;
  private avatar: StreamingAvatar | null = null;
  private isInitializing = false;
  private hasSpokenGreeting = false;
  private initializationPromise: Promise<{ session_id: string; mediaStream: MediaStream | null }> | null = null;
  private mediaStream: MediaStream | null = null;
  private listeners: Map<string, Function[]> = new Map();

  private constructor() {}

  static getInstance(): HeyGenSingleton {
    if (!HeyGenSingleton.instance) {
      HeyGenSingleton.instance = new HeyGenSingleton();
    }
    return HeyGenSingleton.instance;
  }

  async initialize(apiKey: string): Promise<{ session_id: string; mediaStream: MediaStream | null }> {
    // If already initialized, return existing session
    if (this.avatar && this.mediaStream) {
      console.log("Avatar already initialized, returning existing session");
      return { session_id: "existing", mediaStream: this.mediaStream };
    }

    // If initialization is in progress, return the existing promise
    if (this.initializationPromise) {
      console.log("Avatar initialization already in progress, returning existing promise");
      return this.initializationPromise;
    }

    // Create and store the initialization promise
    this.initializationPromise = this.doInitialize(apiKey);
    return this.initializationPromise;
  }

  private async doInitialize(apiKey: string): Promise<{ session_id: string; mediaStream: MediaStream | null }> {
    console.log("Starting new avatar initialization");
    this.isInitializing = true;

    try {
      // Clean up any existing instance
      if (this.avatar) {
        await this.avatar.stopAvatar();
      }

      // Create new avatar instance
      this.avatar = new StreamingAvatar({ token: apiKey });

      // Set up event listeners
      this.avatar.on(StreamingEvents.AVATAR_START_TALKING, (e) => {
        console.log("Avatar started talking");
        this.emit('start_talking', e);
      });

      this.avatar.on(StreamingEvents.AVATAR_STOP_TALKING, (e) => {
        console.log("Avatar stopped talking");
        this.emit('stop_talking', e);
      });

      this.avatar.on(StreamingEvents.STREAM_READY, (e) => {
        console.log("Stream ready:", e);
        this.mediaStream = this.avatar?.mediaStream || null;
        this.emit('stream_ready', e);
      });

      this.avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        console.log("Stream disconnected");
        this.emit('stream_disconnected', null);
      });

      // Start the avatar
      const sessionInfo = await this.avatar.createStartAvatar({
        quality: AvatarQuality.High,
        avatarName: "Ann_Doctor_Standing2_public",
        voice: {
          voiceId: "192baff0b23f445c85e5532cf4802310", // Ann's voice ID
          rate: 1.0,
          emotion: VoiceEmotion.FRIENDLY
        },
        disableIdleTimeout: true
      });

      console.log("Avatar session started:", sessionInfo);
      
      // Initial greeting - only speak once
      if (!this.hasSpokenGreeting) {
        this.hasSpokenGreeting = true;
        await this.speak("Hi, how can I assist you?");
      }

      this.isInitializing = false;
      return { session_id: sessionInfo.session_id, mediaStream: this.mediaStream };

    } catch (error) {
      console.error("Failed to initialize avatar:", error);
      this.isInitializing = false;
      this.initializationPromise = null; // Reset on error
      throw error;
    }
  }

  async speak(text: string): Promise<void> {
    if (!this.avatar) {
      console.error("Avatar not initialized");
      return;
    }

    try {
      await this.avatar.speak({
        text,
        taskType: TaskType.REPEAT,
        taskMode: TaskMode.SYNC
      });
    } catch (error) {
      console.error("Failed to make avatar speak:", error);
    }
  }

  async cleanup(): Promise<void> {
    if (this.avatar) {
      console.log("Cleaning up avatar singleton");
      await this.avatar.stopAvatar();
      this.avatar = null;
      this.mediaStream = null;
    }
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  getMediaStream(): MediaStream | null {
    return this.mediaStream;
  }
}

export const heygenSingleton = HeyGenSingleton.getInstance();