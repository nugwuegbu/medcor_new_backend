/**
 * Dynamic Video Player Manager
 * Real-time responsive video switching based on user interaction
 */

export enum DynamicVideoMode {
  WAITING = 'waiting',         // ADANA01: Continuous waiting loop until user types
  SPEAKING = 'speaking',       // ADANA02: Speaking video synced with ElevenLabs TTS
  HEYGEN_ACTIVE = 'heygen'     // ADANA03: HeyGen takes over (no video overlay)
}

export interface DynamicPlayerState {
  sessionId: string;
  mode: DynamicVideoMode;
  isTyping: boolean;
  isSpeaking: boolean;
  currentVideo: string;
  audioProvider: 'elevenlabs' | 'openai' | 'heygen' | null;
  userInteractionCount: number;
  lastActivity: number;
  speechStartTime: number | null;
  speechDuration: number | null;
}

export class DynamicVideoPlayerManager {
  private sessions: Map<string, DynamicPlayerState> = new Map();
  private typingDetectionTimeout = 500; // 500ms typing detection
  
  constructor() {
    console.log('🎬 Dynamic Video Player Manager initialized');
  }

  /**
   * Initialize new session in WAITING mode
   */
  initializeSession(sessionId: string): DynamicPlayerState {
    const state: DynamicPlayerState = {
      sessionId,
      mode: DynamicVideoMode.WAITING,
      isTyping: false,
      isSpeaking: false,
      currentVideo: '/waiting_heygen.mp4',
      audioProvider: null,
      userInteractionCount: 0,
      lastActivity: Date.now(),
      speechStartTime: null,
      speechDuration: null
    };
    
    this.sessions.set(sessionId, state);
    console.log(`🎬 Dynamic Player session initialized: ${sessionId} - WAITING mode`);
    
    return state;
  }

  /**
   * Handle user starts typing (immediate transition to SPEAKING preparation)
   */
  handleUserStartsTyping(sessionId: string): DynamicPlayerState {
    let state = this.sessions.get(sessionId);
    if (!state) {
      state = this.initializeSession(sessionId);
    }
    
    // Only transition if not already speaking or in HeyGen mode
    if (state.mode === DynamicVideoMode.WAITING && !state.isTyping) {
      state.isTyping = true;
      state.mode = DynamicVideoMode.SPEAKING;
      state.currentVideo = '/speak_heygen.mp4';
      state.lastActivity = Date.now();
      
      console.log(`⌨️  User starts typing in session: ${sessionId} - Switching to SPEAKING mode`);
    }
    
    return state;
  }

  /**
   * Handle user sends message (trigger TTS and sync with video)
   */
  handleUserMessage(sessionId: string, message: string, ttsProvider: 'elevenlabs' | 'openai' = 'elevenlabs'): DynamicPlayerState {
    let state = this.sessions.get(sessionId);
    if (!state) {
      state = this.initializeSession(sessionId);
    }
    
    state.userInteractionCount++;
    state.lastActivity = Date.now();
    state.isTyping = false;
    
    // Determine mode based on interaction count
    if (state.userInteractionCount <= 2) {
      // First two interactions: Use video overlay with TTS
      state.mode = DynamicVideoMode.SPEAKING;
      state.currentVideo = '/speak_heygen.mp4';
      state.audioProvider = ttsProvider;
      state.isSpeaking = true;
      state.speechStartTime = Date.now();
      
      console.log(`🗣️  User message #${state.userInteractionCount} in session: ${sessionId} - SPEAKING mode with ${ttsProvider}`);
      
    } else {
      // Third+ interaction: Activate HeyGen
      state.mode = DynamicVideoMode.HEYGEN_ACTIVE;
      state.currentVideo = '';
      state.audioProvider = 'heygen';
      state.isSpeaking = true;
      
      console.log(`🚀 User message #${state.userInteractionCount} in session: ${sessionId} - HeyGen ACTIVE mode`);
    }
    
    return state;
  }

  /**
   * Handle TTS speech starts (ensure video is playing)
   */
  handleSpeechStart(sessionId: string, estimatedDuration: number): DynamicPlayerState {
    const state = this.sessions.get(sessionId);
    if (!state) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    
    state.isSpeaking = true;
    state.speechStartTime = Date.now();
    state.speechDuration = estimatedDuration;
    
    if (state.mode === DynamicVideoMode.SPEAKING) {
      state.currentVideo = '/speak_heygen.mp4';
      console.log(`🎵 Speech started in session: ${sessionId} - Duration: ${estimatedDuration}ms`);
    }
    
    return state;
  }

  /**
   * Handle TTS speech ends (return to WAITING mode)
   */
  handleSpeechEnd(sessionId: string): DynamicPlayerState {
    const state = this.sessions.get(sessionId);
    if (!state) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    
    state.isSpeaking = false;
    state.speechStartTime = null;
    state.speechDuration = null;
    
    // Return to appropriate mode
    if (state.mode === DynamicVideoMode.SPEAKING) {
      // Return to waiting mode for next interaction
      state.mode = DynamicVideoMode.WAITING;
      state.currentVideo = '/waiting_heygen.mp4';
      state.audioProvider = null;
      
      console.log(`🔇 Speech ended in session: ${sessionId} - Returning to WAITING mode`);
    }
    
    return state;
  }

  /**
   * Handle user stops typing (timeout-based detection)
   */
  handleUserStopsTyping(sessionId: string): DynamicPlayerState {
    const state = this.sessions.get(sessionId);
    if (!state) {
      return this.initializeSession(sessionId);
    }
    
    state.isTyping = false;
    
    // If not speaking and not in HeyGen mode, return to waiting
    if (!state.isSpeaking && state.mode === DynamicVideoMode.SPEAKING) {
      state.mode = DynamicVideoMode.WAITING;
      state.currentVideo = '/waiting_heygen.mp4';
      state.audioProvider = null;
      
      console.log(`⏸️  User stops typing in session: ${sessionId} - Returning to WAITING mode`);
    }
    
    return state;
  }

  /**
   * Get current player state
   */
  getPlayerState(sessionId: string): DynamicPlayerState | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get real-time status for frontend polling
   */
  getRealtimeStatus(sessionId: string): {
    mode: DynamicVideoMode;
    videoUrl: string;
    audioProvider: string | null;
    isTyping: boolean;
    isSpeaking: boolean;
    shouldShowVideo: boolean;
    interactionCount: number;
  } {
    const state = this.sessions.get(sessionId);
    
    if (!state) {
      return {
        mode: DynamicVideoMode.WAITING,
        videoUrl: '/waiting_heygen.mp4',
        audioProvider: null,
        isTyping: false,
        isSpeaking: false,
        shouldShowVideo: true,
        interactionCount: 0
      };
    }
    
    return {
      mode: state.mode,
      videoUrl: state.currentVideo,
      audioProvider: state.audioProvider,
      isTyping: state.isTyping,
      isSpeaking: state.isSpeaking,
      shouldShowVideo: state.mode !== DynamicVideoMode.HEYGEN_ACTIVE,
      interactionCount: state.userInteractionCount
    };
  }

  /**
   * Cleanup session
   */
  cleanupSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    console.log(`🧹 Dynamic Player session cleaned up: ${sessionId}`);
  }

  /**
   * Get all active sessions stats
   */
  getSessionStats(): {
    totalSessions: number;
    waitingMode: number;
    speakingMode: number;
    heygenActive: number;
    activeSpeaking: number;
  } {
    const stats = {
      totalSessions: this.sessions.size,
      waitingMode: 0,
      speakingMode: 0,
      heygenActive: 0,
      activeSpeaking: 0
    };

    this.sessions.forEach(state => {
      switch (state.mode) {
        case DynamicVideoMode.WAITING:
          stats.waitingMode++;
          break;
        case DynamicVideoMode.SPEAKING:
          stats.speakingMode++;
          break;
        case DynamicVideoMode.HEYGEN_ACTIVE:
          stats.heygenActive++;
          break;
      }
      
      if (state.isSpeaking) {
        stats.activeSpeaking++;
      }
    });

    return stats;
  }
}

// Global instance
export const dynamicVideoPlayerManager = new DynamicVideoPlayerManager();