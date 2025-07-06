/**
 * Intelligent Video Player Manager
 * Handles 3 video modes with automatic switching based on user interaction
 */

export enum VideoPlayerMode {
  IDLE = 'idle',           // ADANA01: waiting_heygen.mp4 (10 min loop when inactive)
  SPEAKING = 'speaking',   // ADANA02: speak_heygen.mp4 (synced with ElevenLabs voice)
  HEYGEN_READY = 'ready'   // ADANA03: Placeholder videos deactivated, HeyGen takes over
}

export interface PlayerState {
  mode: VideoPlayerMode;
  isPlaying: boolean;
  currentVideo: string | null;
  audioProvider: string | null;
  sessionId: string;
  userInteractionCount: number;
  lastInteractionTime: number;
  idleTimer: NodeJS.Timeout | null;
  speakingTimer: NodeJS.Timeout | null;
}

export class VideoPlayerManager {
  private sessions: Map<string, PlayerState> = new Map();
  private readonly IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes
  private readonly SPEAKING_CHECK_INTERVAL = 100; // 100ms
  
  constructor() {
    console.log('🎬 Video Player Manager initialized');
  }

  /**
   * Initialize a new player session
   */
  initializeSession(sessionId: string): PlayerState {
    const state: PlayerState = {
      mode: VideoPlayerMode.IDLE,
      isPlaying: true,
      currentVideo: '/waiting_heygen.mp4',
      audioProvider: null,
      sessionId,
      userInteractionCount: 0,
      lastInteractionTime: Date.now(),
      idleTimer: null,
      speakingTimer: null
    };

    this.sessions.set(sessionId, state);
    this.startIdleMode(sessionId);
    
    console.log(`🎬 Player session initialized: ${sessionId} - IDLE mode active`);
    return state;
  }

  /**
   * Handle user interaction (voice or text input)
   */
  handleUserInteraction(sessionId: string, message: string): {
    mode: VideoPlayerMode;
    videoUrl: string;
    audioProvider: string | null;
    shouldActivateHeyGen: boolean;
  } {
    const state = this.getOrCreateSession(sessionId);
    
    state.userInteractionCount++;
    state.lastInteractionTime = Date.now();
    
    console.log(`🎯 User interaction #${state.userInteractionCount} in session: ${sessionId}`);
    
    // Clear idle timer
    if (state.idleTimer) {
      clearTimeout(state.idleTimer);
      state.idleTimer = null;
    }

    // Decide mode based on interaction count
    if (state.userInteractionCount >= 2) {
      // ADANA03: Deactivate placeholder videos, let HeyGen take over
      return this.activateHeyGenReadyMode(sessionId);
    } else {
      // ADANA02: Speaking mode for first interaction
      return this.activateSpeakingMode(sessionId, message);
    }
  }

  /**
   * Handle speech completion (when ElevenLabs finishes)
   */
  handleSpeechComplete(sessionId: string): {
    mode: VideoPlayerMode;
    videoUrl: string;
    audioProvider: string | null;
  } {
    const state = this.getOrCreateSession(sessionId);
    
    console.log(`🔇 Speech completed for session: ${sessionId} - Returning to IDLE`);
    
    // Clear speaking timer
    if (state.speakingTimer) {
      clearTimeout(state.speakingTimer);
      state.speakingTimer = null;
    }

    // Return to idle mode
    return this.activateIdleMode(sessionId);
  }

  /**
   * Get current player state for a session
   */
  getPlayerState(sessionId: string): PlayerState | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * ADANA01: Idle/Waiting mode - 10 minute loop when inactive
   */
  private activateIdleMode(sessionId: string): {
    mode: VideoPlayerMode;
    videoUrl: string;
    audioProvider: string | null;
  } {
    const state = this.getOrCreateSession(sessionId);
    
    state.mode = VideoPlayerMode.IDLE;
    state.currentVideo = '/waiting_heygen.mp4';
    state.audioProvider = null;
    state.isPlaying = true;

    // Start 10-minute idle timer
    this.startIdleMode(sessionId);
    
    console.log(`😴 ADANA01 IDLE mode activated for session: ${sessionId}`);
    
    return {
      mode: VideoPlayerMode.IDLE,
      videoUrl: '/waiting_heygen.mp4',
      audioProvider: null
    };
  }

  /**
   * ADANA02: Speaking mode - sync with ElevenLabs voice duration
   */
  private activateSpeakingMode(sessionId: string, message: string): {
    mode: VideoPlayerMode;
    videoUrl: string;
    audioProvider: string | null;
    shouldActivateHeyGen: boolean;
  } {
    const state = this.getOrCreateSession(sessionId);
    
    state.mode = VideoPlayerMode.SPEAKING;
    state.currentVideo = '/speak_heygen.mp4';
    state.audioProvider = 'elevenlabs';
    state.isPlaying = true;

    // Estimate speaking duration (150-200 WPM)
    const wordCount = message.split(' ').length;
    const estimatedDuration = Math.max(2000, (wordCount / 3) * 1000); // ~180 WPM
    
    // Auto-return to idle after speaking
    state.speakingTimer = setTimeout(() => {
      this.handleSpeechComplete(sessionId);
    }, estimatedDuration);
    
    console.log(`🗣️ ADANA02 SPEAKING mode activated for session: ${sessionId} - Duration: ${estimatedDuration}ms`);
    
    return {
      mode: VideoPlayerMode.SPEAKING,
      videoUrl: '/speak_heygen.mp4',
      audioProvider: 'elevenlabs',
      shouldActivateHeyGen: false
    };
  }

  /**
   * ADANA03: HeyGen Ready mode - deactivate placeholder videos, let HeyGen take over
   */
  private activateHeyGenReadyMode(sessionId: string): {
    mode: VideoPlayerMode;
    videoUrl: string;
    audioProvider: string | null;
    shouldActivateHeyGen: boolean;
  } {
    const state = this.getOrCreateSession(sessionId);
    
    state.mode = VideoPlayerMode.HEYGEN_READY;
    state.currentVideo = 'none';
    state.audioProvider = null;
    state.isPlaying = false;

    // Clear all timers - HeyGen will handle everything now
    if (state.idleTimer) {
      clearTimeout(state.idleTimer);
      state.idleTimer = null;
    }
    
    if (state.speakingTimer) {
      clearTimeout(state.speakingTimer);
      state.speakingTimer = null;
    }
    
    console.log(`🤖 ADANA03 HEYGEN READY mode activated for session: ${sessionId} - Placeholder videos deactivated`);
    
    return {
      mode: VideoPlayerMode.HEYGEN_READY,
      videoUrl: 'none',
      audioProvider: null,
      shouldActivateHeyGen: true
    };
  }

  /**
   * Start 10-minute idle timer
   */
  private startIdleMode(sessionId: string): void {
    const state = this.sessions.get(sessionId);
    if (!state) return;

    // Clear existing timer
    if (state.idleTimer) {
      clearTimeout(state.idleTimer);
    }

    // Set 10-minute idle timer
    state.idleTimer = setTimeout(() => {
      console.log(`⏰ Idle timeout reached for session: ${sessionId} - Keeping IDLE mode`);
      // Stay in idle mode - this just logs the timeout
    }, this.IDLE_TIMEOUT);
  }

  /**
   * Get or create session state
   */
  private getOrCreateSession(sessionId: string): PlayerState {
    if (!this.sessions.has(sessionId)) {
      return this.initializeSession(sessionId);
    }
    return this.sessions.get(sessionId)!;
  }

  /**
   * Cleanup session when done
   */
  cleanupSession(sessionId: string): void {
    const state = this.sessions.get(sessionId);
    if (state) {
      // Clear all timers
      if (state.idleTimer) clearTimeout(state.idleTimer);
      if (state.speakingTimer) clearTimeout(state.speakingTimer);
      
      this.sessions.delete(sessionId);
      console.log(`🧹 Player session cleaned up: ${sessionId}`);
    }
  }

  /**
   * Get statistics for all active sessions
   */
  getSessionStats(): {
    totalSessions: number;
    idleSessions: number;
    speakingSessions: number;
    heygenSessions: number;
  } {
    const sessions = Array.from(this.sessions.values());
    
    return {
      totalSessions: sessions.length,
      idleSessions: sessions.filter(s => s.mode === VideoPlayerMode.IDLE).length,
      speakingSessions: sessions.filter(s => s.mode === VideoPlayerMode.SPEAKING).length,
      heygenSessions: sessions.filter(s => s.mode === VideoPlayerMode.HEYGEN_READY).length
    };
  }
}

// Global instance
export const videoPlayerManager = new VideoPlayerManager();