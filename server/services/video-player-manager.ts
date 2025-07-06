// Video Player Manager - Dynamic video loop system with HeyGen integration
export interface VideoPlayerState {
  id: string;
  isPlaying: boolean;
  currentVideo: string | null;
  mode: 'loop' | 'heygen' | 'idle';
  lastInteraction: Date;
  loopCount: number;
  sessionActive: boolean;
}

export interface VideoUploadData {
  id: string;
  filename: string;
  url: string;
  duration: number; // in seconds
  uploadedAt: Date;
}

export class VideoPlayerManager {
  private static instance: VideoPlayerManager;
  private playerStates: Map<string, VideoPlayerState> = new Map();
  private uploadedVideos: Map<string, VideoUploadData> = new Map();
  private readonly INTERACTION_TIMEOUT = 180000; // 3 minutes in milliseconds

  static getInstance(): VideoPlayerManager {
    if (!VideoPlayerManager.instance) {
      VideoPlayerManager.instance = new VideoPlayerManager();
    }
    return VideoPlayerManager.instance;
  }

  // Initialize player for session
  initializePlayer(sessionId: string, videoId: string = 'adana01'): VideoPlayerState {
    const video = this.uploadedVideos.get(videoId);
    if (!video) {
      throw new Error(`Video ${videoId} not found`);
    }

    const playerState: VideoPlayerState = {
      id: sessionId,
      isPlaying: true,
      currentVideo: videoId,
      mode: 'loop',
      lastInteraction: new Date(),
      loopCount: 0,
      sessionActive: true
    };

    this.playerStates.set(sessionId, playerState);
    console.log(`🎬 Video Player Manager initialized: ${playerState.mode}`);
    return playerState;
  }

  // Switch to HeyGen mode when user interacts
  switchToHeyGen(sessionId: string): VideoPlayerState {
    const state = this.playerStates.get(sessionId);
    if (!state) {
      throw new Error(`Player session ${sessionId} not found`);
    }

    state.mode = 'heygen';
    state.isPlaying = false;
    state.lastInteraction = new Date();
    
    console.log(`🎬 Switching to HeyGen mode for session: ${sessionId}`);
    this.playerStates.set(sessionId, state);
    return state;
  }

  // Switch back to loop mode after timeout
  switchToLoop(sessionId: string): VideoPlayerState {
    const state = this.playerStates.get(sessionId);
    if (!state) {
      throw new Error(`Player session ${sessionId} not found`);
    }

    state.mode = 'loop';
    state.isPlaying = true;
    state.lastInteraction = new Date();
    state.loopCount++;
    
    console.log(`🎬 Switching back to loop mode for session: ${sessionId}, loop count: ${state.loopCount}`);
    this.playerStates.set(sessionId, state);
    return state;
  }

  // Check if should switch back to loop mode due to inactivity
  checkInactivityTimeout(sessionId: string): boolean {
    const state = this.playerStates.get(sessionId);
    if (!state || state.mode !== 'heygen') {
      return false;
    }

    const timeSinceInteraction = Date.now() - state.lastInteraction.getTime();
    return timeSinceInteraction > this.INTERACTION_TIMEOUT;
  }

  // Get current player state
  getPlayerState(sessionId: string): VideoPlayerState | null {
    return this.playerStates.get(sessionId) || null;
  }

  // Upload a new video
  uploadVideo(videoData: VideoUploadData): void {
    this.uploadedVideos.set(videoData.id, videoData);
    console.log(`📹 Video uploaded: ${videoData.id} - ${videoData.filename}`);
  }

  // Get video data
  getVideo(videoId: string): VideoUploadData | null {
    return this.uploadedVideos.get(videoId) || null;
  }

  // Get all uploaded videos
  getAllVideos(): VideoUploadData[] {
    return Array.from(this.uploadedVideos.values());
  }

  // Update interaction timestamp
  updateInteraction(sessionId: string): void {
    const state = this.playerStates.get(sessionId);
    if (state) {
      state.lastInteraction = new Date();
      this.playerStates.set(sessionId, state);
    }
  }

  // Clean up inactive sessions
  cleanupInactiveSessions(): void {
    const now = Date.now();
    const sessionsToRemove: string[] = [];

    this.playerStates.forEach((state, sessionId) => {
      const timeSinceInteraction = now - state.lastInteraction.getTime();
      // Remove sessions inactive for more than 10 minutes
      if (timeSinceInteraction > 600000) {
        sessionsToRemove.push(sessionId);
      }
    });

    sessionsToRemove.forEach(sessionId => {
      this.playerStates.delete(sessionId);
      console.log(`🧹 Cleaned up inactive session: ${sessionId}`);
    });
  }

  // Get loop video URL for continuous playback
  getLoopVideoUrl(videoId: string): string | null {
    const video = this.uploadedVideos.get(videoId);
    return video ? video.url : null;
  }
}

export const videoPlayerManager = VideoPlayerManager.getInstance();