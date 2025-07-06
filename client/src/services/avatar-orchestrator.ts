export interface AvatarState {
  mode: 'waiting' | 'speaking' | 'heygen_active' | 'elevenlabs_fallback';
  sessionId?: string;
  isHeygenReady: boolean;
  isHeygenHealthy: boolean;
  lastActivity: Date;
}

export interface AvatarResponse {
  mode: 'waiting' | 'speaking' | 'heygen_active' | 'elevenlabs_fallback';
  videoUrl?: string;
  audioUrl?: string;
  sessionId?: string;
  message?: string;
  shouldTransition?: boolean;
}

export class AvatarOrchestratorClient {
  private baseUrl = '';

  async initializeSession(sessionId: string): Promise<AvatarResponse> {
    const response = await fetch('/api/avatar/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });

    if (!response.ok) {
      throw new Error('Failed to initialize avatar session');
    }

    return response.json();
  }

  async handleUserMessage(sessionId: string, message: string): Promise<AvatarResponse> {
    const response = await fetch('/api/avatar/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message })
    });

    if (!response.ok) {
      throw new Error('Failed to process avatar message');
    }

    return response.json();
  }

  async getSessionState(sessionId: string): Promise<AvatarState> {
    const response = await fetch(`/api/avatar/status/${sessionId}`);

    if (!response.ok) {
      throw new Error('Failed to get avatar status');
    }

    return response.json();
  }

  async cleanupSession(sessionId: string): Promise<void> {
    const response = await fetch(`/api/avatar/session/${sessionId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to cleanup session');
    }
  }

  async getStats(): Promise<{
    activeSessions: number;
    heygenSessions: number;
    timestamp: string;
  }> {
    const response = await fetch('/api/avatar/stats');

    if (!response.ok) {
      throw new Error('Failed to get avatar stats');
    }

    return response.json();
  }
}

export const avatarOrchestratorClient = new AvatarOrchestratorClient();