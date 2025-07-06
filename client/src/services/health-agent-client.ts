interface NetworkMetrics {
  latency: number;
  bandwidth: number;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  location: {
    country: string;
    city: string;
    region: string;
    timezone: string;
  };
  serverDistance: number;
  recommendedMode: 'heygen_premium' | 'heygen_standard' | 'placeholder_optimized' | 'audio_only';
}

interface ServiceHealth {
  heygen: {
    status: 'online' | 'degraded' | 'offline';
    responseTime: number;
    errorRate: number;
    lastChecked: Date;
  };
  elevenlabs: {
    status: 'online' | 'degraded' | 'offline';
    responseTime: number;
    errorRate: number;
    lastChecked: Date;
  };
  openai: {
    status: 'online' | 'degraded' | 'offline';
    responseTime: number;
    errorRate: number;
    lastChecked: Date;
  };
}

interface OptimizedConfiguration {
  shouldUseHeyGen: boolean;
  videoMode: 'heygen' | 'placeholder';
  ttsProvider: 'elevenlabs' | 'openai';
  videoQuality: string;
  preloadAssets: string[];
  reconnectionDelay: number;
}

export class HealthAgentClient {
  private sessionId: string | null = null;
  private networkMetrics: NetworkMetrics | null = null;
  private configuration: OptimizedConfiguration | null = null;
  private monitoringActive = false;

  async initializeSession(sessionId: string): Promise<void> {
    this.sessionId = sessionId;
    
    // Start background health monitoring
    await this.analyzeNetwork();
    await this.getOptimizedConfiguration();
    
    // Start continuous monitoring
    this.startMonitoring();
  }

  async analyzeNetwork(): Promise<NetworkMetrics> {
    try {
      const response = await fetch(`/api/health/network/${this.sessionId || ''}`);
      
      if (!response.ok) {
        throw new Error('Network analysis failed');
      }

      this.networkMetrics = await response.json();
      console.log('🌐 Network Analysis:', this.networkMetrics);
      
      return this.networkMetrics;
    } catch (error) {
      console.error('Network analysis error:', error);
      // Return safe defaults
      this.networkMetrics = {
        latency: 200,
        bandwidth: 5000,
        connectionQuality: 'fair',
        location: { country: 'Unknown', city: 'Unknown', region: 'Unknown', timezone: 'UTC' },
        serverDistance: 1000,
        recommendedMode: 'placeholder_optimized'
      };
      return this.networkMetrics;
    }
  }

  async getServiceHealth(): Promise<ServiceHealth> {
    try {
      const response = await fetch('/api/health/services');
      
      if (!response.ok) {
        throw new Error('Service health check failed');
      }

      const serviceHealth = await response.json();
      console.log('🏥 Service Health:', serviceHealth);
      
      return serviceHealth;
    } catch (error) {
      console.error('Service health check error:', error);
      throw error;
    }
  }

  async getOptimizedConfiguration(): Promise<OptimizedConfiguration> {
    if (!this.sessionId) {
      throw new Error('Session not initialized');
    }

    try {
      const response = await fetch(`/api/health/optimization/${this.sessionId}`);
      
      if (!response.ok) {
        throw new Error('Failed to get optimization configuration');
      }

      this.configuration = await response.json();
      console.log('⚙️ Optimized Configuration:', this.configuration);
      
      // Preload recommended assets
      this.preloadAssets(this.configuration.preloadAssets);
      
      return this.configuration;
    } catch (error) {
      console.error('Optimization configuration error:', error);
      // Return safe defaults
      this.configuration = {
        shouldUseHeyGen: false,
        videoMode: 'placeholder',
        ttsProvider: 'openai',
        videoQuality: 'medium',
        preloadAssets: ['/waiting_heygen.mp4', '/speak_heygen.mp4'],
        reconnectionDelay: 2000
      };
      return this.configuration;
    }
  }

  async reportSessionMetrics(responseTime: number, errors: string[] = []): Promise<void> {
    if (!this.sessionId) return;

    try {
      await fetch('/api/health/session-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          responseTime,
          errors
        })
      });
    } catch (error) {
      console.error('Failed to report session metrics:', error);
    }
  }

  async getHealthSummary(): Promise<{
    network: NetworkMetrics | null;
    services: ServiceHealth;
    strategy: any;
    activeSessions: number;
  }> {
    try {
      const response = await fetch('/api/health/summary');
      
      if (!response.ok) {
        throw new Error('Failed to get health summary');
      }

      return await response.json();
    } catch (error) {
      console.error('Health summary error:', error);
      throw error;
    }
  }

  shouldUseHeyGen(): boolean {
    return this.configuration?.shouldUseHeyGen ?? false;
  }

  getVideoMode(): 'heygen' | 'placeholder' {
    return this.configuration?.videoMode ?? 'placeholder';
  }

  getPreferredTTSProvider(): 'elevenlabs' | 'openai' {
    return this.configuration?.ttsProvider ?? 'openai';
  }

  getReconnectionDelay(): number {
    return this.configuration?.reconnectionDelay ?? 2000;
  }

  getConnectionQuality(): 'excellent' | 'good' | 'fair' | 'poor' {
    return this.networkMetrics?.connectionQuality ?? 'fair';
  }

  private preloadAssets(assets: string[]): void {
    assets.forEach(asset => {
      if (asset.endsWith('.mp4')) {
        // Preload video
        const video = document.createElement('video');
        video.preload = 'auto';
        video.src = asset;
        video.style.display = 'none';
        document.body.appendChild(video);
        
        // Remove after loading
        video.addEventListener('loadeddata', () => {
          document.body.removeChild(video);
        });
      } else if (asset.endsWith('.mp3')) {
        // Preload audio
        const audio = document.createElement('audio');
        audio.preload = 'auto';
        audio.src = asset;
        audio.style.display = 'none';
        document.body.appendChild(audio);
        
        // Remove after loading
        audio.addEventListener('loadeddata', () => {
          document.body.removeChild(audio);
        });
      }
    });
  }

  private startMonitoring(): void {
    if (this.monitoringActive) return;
    
    this.monitoringActive = true;
    
    // Monitor every 60 seconds
    setInterval(async () => {
      try {
        await this.getOptimizedConfiguration();
      } catch (error) {
        console.error('Monitoring error:', error);
      }
    }, 60000);
  }

  stopMonitoring(): void {
    this.monitoringActive = false;
  }

  // Connection quality-based video optimization
  getOptimalVideoSettings(): {
    quality: 'high' | 'medium' | 'low';
    useHeyGen: boolean;
    fallbackMode: 'placeholder' | 'audio_only';
  } {
    const quality = this.getConnectionQuality();
    
    switch (quality) {
      case 'excellent':
        return { quality: 'high', useHeyGen: true, fallbackMode: 'placeholder' };
      case 'good':
        return { quality: 'medium', useHeyGen: true, fallbackMode: 'placeholder' };
      case 'fair':
        return { quality: 'low', useHeyGen: false, fallbackMode: 'placeholder' };
      default:
        return { quality: 'low', useHeyGen: false, fallbackMode: 'audio_only' };
    }
  }

  // Handle connection errors with intelligent retry
  async handleConnectionError(error: Error): Promise<boolean> {
    console.warn('Connection error detected:', error.message);
    
    // Report the error
    await this.reportSessionMetrics(5000, [error.message]);
    
    // Wait for optimized reconnection delay
    const delay = this.getReconnectionDelay();
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Refresh configuration
    await this.getOptimizedConfiguration();
    
    return this.shouldUseHeyGen();
  }
}

export const healthAgentClient = new HealthAgentClient();