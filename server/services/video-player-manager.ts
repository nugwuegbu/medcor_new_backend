import { storage } from '../storage';
import { type Video, type InsertVideo } from '@shared/schema';

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

export class VideoPlayerManager {
  private static instance: VideoPlayerManager;
  private playerStates: Map<string, VideoPlayerState> = new Map();
  private readonly INTERACTION_TIMEOUT = 180000; // 3 minutes in milliseconds

  static getInstance(): VideoPlayerManager {
    if (!VideoPlayerManager.instance) {
      VideoPlayerManager.instance = new VideoPlayerManager();
    }
    return VideoPlayerManager.instance;
  }

  // Initialize player for session  
  async initializePlayer(sessionId: string, videoId: string = 'adana01'): Promise<VideoPlayerState> {
    // CRITICAL: Clean up any existing sessions first to prevent conflicts
    console.log(`🧹 Cleaning up existing sessions before creating ${sessionId}`);
    const existingSessions = Array.from(this.playerStates.keys());
    
    // If this exact session exists, preserve its mode
    const existingState = this.playerStates.get(sessionId);
    if (existingState) {
      console.log(`🎬 Player already exists for session ${sessionId} with mode: ${existingState.mode}`);
      if (existingState.mode === 'heygen') {
        console.log(`🚫 Preserving HeyGen mode - NOT resetting to loop`);
        return existingState;
      }
    }
    
    // Clean up OTHER sessions to prevent conflicts
    for (const otherSessionId of existingSessions) {
      if (otherSessionId !== sessionId) {
        console.log(`🗑️ Removing conflicting session: ${otherSessionId}`);
        this.playerStates.delete(otherSessionId);
      }
    }

    const video = await storage.getVideo(videoId);
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
    console.log(`🎬 Video Player Manager initialized: ${playerState.mode} (cleaned up ${existingSessions.length - 1} other sessions)`);
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

  // Switch back to loop mode after timeout - DISABLED
  switchToLoop(sessionId: string): VideoPlayerState {
    const state = this.playerStates.get(sessionId);
    if (!state) {
      throw new Error(`Player session ${sessionId} not found`);
    }

    // DISABLED: Never switch back to loop once HeyGen is activated
    console.log(`🎬 Ignoring switch to loop request for session: ${sessionId} - staying in HeyGen mode`);
    return state; // Return current state without changing mode
  }

  // Check if should switch back to loop mode due to inactivity
  // DISABLED: Once in HeyGen mode, stay in HeyGen mode permanently
  checkInactivityTimeout(sessionId: string): boolean {
    // Always return false - never switch back to loop once HeyGen is activated
    return false;
  }

  // Get current player state
  getPlayerState(sessionId: string): VideoPlayerState | null {
    return this.playerStates.get(sessionId) || null;
  }

  // Upload a new video
  async uploadVideo(videoData: InsertVideo): Promise<Video> {
    const video = await storage.createVideo(videoData);
    console.log(`📹 Video uploaded to storage: ${video.id} - ${video.filename}`);
    return video;
  }

  // Get video data
  async getVideo(videoId: string): Promise<Video | null> {
    return await storage.getVideo(videoId) || null;
  }

  // Get all uploaded videos
  async getAllVideos(): Promise<Video[]> {
    return await storage.getAllVideos();
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
  async getLoopVideoUrl(videoId: string): Promise<string | null> {
    const video = await storage.getVideo(videoId);
    return video ? video.url : null;
  }
}

export const videoPlayerManager = VideoPlayerManager.getInstance();