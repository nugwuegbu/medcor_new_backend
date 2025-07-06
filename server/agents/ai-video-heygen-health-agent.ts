import fetch from 'node-fetch';

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

interface OptimizationStrategy {
  useHeyGen: boolean;
  preferredTTSProvider: 'elevenlabs' | 'openai';
  videoQuality: 'high' | 'medium' | 'low' | 'placeholder';
  preloadStrategy: 'aggressive' | 'moderate' | 'conservative';
  reconnectionPolicy: 'immediate' | 'delayed' | 'background_only';
}

export class AIVideoHeyGenHealthAgent {
  private networkMetrics: NetworkMetrics | null = null;
  private serviceHealth: ServiceHealth;
  private optimizationStrategy: OptimizationStrategy;
  private sessionHealth: Map<string, { score: number; issues: string[]; lastUpdate: Date }> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    this.serviceHealth = {
      heygen: { status: 'online', responseTime: 0, errorRate: 0, lastChecked: new Date() },
      elevenlabs: { status: 'online', responseTime: 0, errorRate: 0, lastChecked: new Date() },
      openai: { status: 'online', responseTime: 0, errorRate: 0, lastChecked: new Date() }
    };
    
    this.optimizationStrategy = {
      useHeyGen: true,
      preferredTTSProvider: 'elevenlabs',
      videoQuality: 'high',
      preloadStrategy: 'moderate',
      reconnectionPolicy: 'immediate'
    };
    
    // Start continuous monitoring
    this.startHealthMonitoring();
  }

  async analyzeNetworkConditions(userIP?: string): Promise<NetworkMetrics> {
    try {
      const startTime = Date.now();
      
      // Get user location and network info
      const locationData = await this.getUserLocation(userIP);
      
      // Test latency to various endpoints
      const latencyTests = await Promise.all([
        this.testEndpointLatency('https://api.heygen.com/v1/avatars', 'HeyGen'),
        this.testEndpointLatency('https://api.elevenlabs.io/v1/voices', 'ElevenLabs'),
        this.testEndpointLatency('https://api.openai.com/v1/models', 'OpenAI'),
        this.testEndpointLatency('https://cloudflare.com/cdn-cgi/trace', 'CDN')
      ]);
      
      const avgLatency = latencyTests.reduce((sum, test) => sum + test.latency, 0) / latencyTests.length;
      
      // Estimate bandwidth (simplified)
      const bandwidth = await this.estimateBandwidth();
      
      // Calculate server distance (Dubai-based calculation)
      const serverDistance = this.calculateServerDistance(locationData.latitude, locationData.longitude);
      
      // Determine connection quality
      const connectionQuality = this.assessConnectionQuality(avgLatency, bandwidth);
      
      this.networkMetrics = {
        latency: avgLatency,
        bandwidth,
        connectionQuality,
        location: {
          country: locationData.country,
          city: locationData.city,
          region: locationData.region,
          timezone: locationData.timezone
        },
        serverDistance,
        recommendedMode: this.recommendOptimalMode(avgLatency, bandwidth, serverDistance)
      };
      
      console.log(`🌐 Network Analysis Complete:`, this.networkMetrics);
      return this.networkMetrics;
      
    } catch (error) {
      console.error('Network analysis failed:', error);
      // Return safe defaults
      return {
        latency: 200,
        bandwidth: 5000,
        connectionQuality: 'fair',
        location: { country: 'Unknown', city: 'Unknown', region: 'Unknown', timezone: 'UTC' },
        serverDistance: 1000,
        recommendedMode: 'placeholder_optimized'
      };
    }
  }

  private async getUserLocation(userIP?: string): Promise<any> {
    try {
      const response = await fetch('http://ip-api.com/json/');
      return await response.json();
    } catch (error) {
      return { country: 'Unknown', city: 'Dubai', region: 'ME', timezone: 'Asia/Dubai', lat: 25.2, lon: 55.3 };
    }
  }

  private async testEndpointLatency(endpoint: string, service: string): Promise<{ service: string; latency: number }> {
    const startTime = Date.now();
    try {
      await fetch(endpoint, { 
        method: 'HEAD', 
        timeout: 5000,
        headers: { 'User-Agent': 'HealthCheck/1.0' }
      });
      const latency = Date.now() - startTime;
      console.log(`⚡ ${service} latency: ${latency}ms`);
      return { service, latency };
    } catch (error) {
      const latency = Date.now() - startTime;
      console.log(`❌ ${service} timeout: ${latency}ms`);
      return { service, latency: Math.max(latency, 5000) };
    }
  }

  private async estimateBandwidth(): Promise<number> {
    // Simplified bandwidth estimation (in Kbps)
    // In production, this would test actual data transfer
    try {
      const startTime = Date.now();
      const response = await fetch('https://httpbin.org/bytes/1024', { timeout: 3000 });
      await response.buffer();
      const duration = Date.now() - startTime;
      const kbps = (1024 * 8) / (duration / 1000) / 1000; // Convert to Kbps
      return Math.max(kbps, 1000); // Minimum 1Mbps assumption
    } catch (error) {
      return 5000; // Default 5Mbps
    }
  }

  private calculateServerDistance(lat: number, lon: number): number {
    // Dubai coordinates as reference
    const dubaiLat = 25.2048;
    const dubaiLon = 55.2708;
    
    const R = 6371; // Earth's radius in km
    const dLat = (lat - dubaiLat) * Math.PI / 180;
    const dLon = (lon - dubaiLon) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(dubaiLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private assessConnectionQuality(latency: number, bandwidth: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (latency < 50 && bandwidth > 10000) return 'excellent';
    if (latency < 100 && bandwidth > 5000) return 'good';
    if (latency < 200 && bandwidth > 2000) return 'fair';
    return 'poor';
  }

  private recommendOptimalMode(latency: number, bandwidth: number, distance: number): 'heygen_premium' | 'heygen_standard' | 'placeholder_optimized' | 'audio_only' {
    if (latency < 50 && bandwidth > 10000 && distance < 500) {
      return 'heygen_premium';
    } else if (latency < 150 && bandwidth > 5000 && distance < 2000) {
      return 'heygen_standard';
    } else if (bandwidth > 2000) {
      return 'placeholder_optimized';
    } else {
      return 'audio_only';
    }
  }

  async monitorServiceHealth(): Promise<ServiceHealth> {
    const healthChecks = await Promise.all([
      this.checkHeyGenHealth(),
      this.checkElevenLabsHealth(),
      this.checkOpenAIHealth()
    ]);

    this.serviceHealth = {
      heygen: healthChecks[0],
      elevenlabs: healthChecks[1],
      openai: healthChecks[2]
    };

    // Update optimization strategy based on health
    this.updateOptimizationStrategy();
    
    return this.serviceHealth;
  }

  private async checkHeyGenHealth(): Promise<ServiceHealth['heygen']> {
    const startTime = Date.now();
    try {
      const response = await fetch('https://api.heygen.com/v1/avatars', {
        timeout: 5000,
        headers: { 'X-API-Key': process.env.HEYGEN_API_KEY || 'test' }
      });
      
      const responseTime = Date.now() - startTime;
      const status = response.ok ? 'online' : 'degraded';
      
      return {
        status,
        responseTime,
        errorRate: response.ok ? 0 : 0.1,
        lastChecked: new Date()
      };
    } catch (error) {
      return {
        status: 'offline',
        responseTime: Date.now() - startTime,
        errorRate: 1,
        lastChecked: new Date()
      };
    }
  }

  private async checkElevenLabsHealth(): Promise<ServiceHealth['elevenlabs']> {
    const startTime = Date.now();
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        timeout: 5000,
        headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY || 'test' }
      });
      
      const responseTime = Date.now() - startTime;
      const status = response.ok ? 'online' : 'degraded';
      
      return {
        status,
        responseTime,
        errorRate: response.ok ? 0 : 0.1,
        lastChecked: new Date()
      };
    } catch (error) {
      return {
        status: 'offline',
        responseTime: Date.now() - startTime,
        errorRate: 1,
        lastChecked: new Date()
      };
    }
  }

  private async checkOpenAIHealth(): Promise<ServiceHealth['openai']> {
    const startTime = Date.now();
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        timeout: 5000,
        headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY || 'test'}` }
      });
      
      const responseTime = Date.now() - startTime;
      const status = response.ok ? 'online' : 'degraded';
      
      return {
        status,
        responseTime,
        errorRate: response.ok ? 0 : 0.1,
        lastChecked: new Date()
      };
    } catch (error) {
      return {
        status: 'offline',
        responseTime: Date.now() - startTime,
        errorRate: 1,
        lastChecked: new Date()
      };
    }
  }

  private updateOptimizationStrategy(): void {
    const { heygen, elevenlabs, openai } = this.serviceHealth;
    
    // Determine if HeyGen should be used
    this.optimizationStrategy.useHeyGen = heygen.status === 'online' && heygen.responseTime < 3000;
    
    // Choose preferred TTS provider
    if (elevenlabs.status === 'online' && elevenlabs.responseTime < openai.responseTime) {
      this.optimizationStrategy.preferredTTSProvider = 'elevenlabs';
    } else {
      this.optimizationStrategy.preferredTTSProvider = 'openai';
    }
    
    // Adjust video quality based on network conditions
    if (this.networkMetrics) {
      if (this.networkMetrics.connectionQuality === 'excellent') {
        this.optimizationStrategy.videoQuality = 'high';
      } else if (this.networkMetrics.connectionQuality === 'good') {
        this.optimizationStrategy.videoQuality = 'medium';
      } else {
        this.optimizationStrategy.videoQuality = 'placeholder';
      }
    }
    
    console.log(`🔧 Optimization Strategy Updated:`, this.optimizationStrategy);
  }

  async getOptimizedConfiguration(sessionId: string): Promise<{
    shouldUseHeyGen: boolean;
    videoMode: 'heygen' | 'placeholder';
    ttsProvider: 'elevenlabs' | 'openai';
    videoQuality: string;
    preloadAssets: string[];
    reconnectionDelay: number;
  }> {
    // Analyze current session health
    const sessionHealth = this.sessionHealth.get(sessionId);
    
    return {
      shouldUseHeyGen: this.optimizationStrategy.useHeyGen && (!sessionHealth || sessionHealth.score > 0.7),
      videoMode: this.optimizationStrategy.useHeyGen ? 'heygen' : 'placeholder',
      ttsProvider: this.optimizationStrategy.preferredTTSProvider,
      videoQuality: this.optimizationStrategy.videoQuality,
      preloadAssets: this.getPreloadAssets(),
      reconnectionDelay: this.calculateReconnectionDelay()
    };
  }

  private getPreloadAssets(): string[] {
    const assets = ['/waiting_heygen.mp4', '/speak_heygen.mp4'];
    
    if (this.optimizationStrategy.preloadStrategy === 'aggressive') {
      assets.push('/audio/notification.mp3', '/audio/error.mp3');
    }
    
    return assets;
  }

  private calculateReconnectionDelay(): number {
    if (!this.networkMetrics) return 1000;
    
    switch (this.networkMetrics.connectionQuality) {
      case 'excellent': return 500;
      case 'good': return 1000;
      case 'fair': return 2000;
      default: return 5000;
    }
  }

  updateSessionHealth(sessionId: string, metrics: { responseTime: number; errors: string[] }): void {
    const score = Math.max(0, 1 - (metrics.responseTime / 5000) - (metrics.errors.length * 0.2));
    
    this.sessionHealth.set(sessionId, {
      score,
      issues: metrics.errors,
      lastUpdate: new Date()
    });
    
    // Auto-cleanup old sessions
    if (this.sessionHealth.size > 50) {
      const oldestSession = Array.from(this.sessionHealth.entries())
        .sort(([,a], [,b]) => a.lastUpdate.getTime() - b.lastUpdate.getTime())[0];
      this.sessionHealth.delete(oldestSession[0]);
    }
  }

  private startHealthMonitoring(): void {
    // Monitor every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      await this.monitorServiceHealth();
    }, 30000);
    
    // Initial health check
    this.monitorServiceHealth();
  }

  stopHealthMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  getHealthSummary(): {
    network: NetworkMetrics | null;
    services: ServiceHealth;
    strategy: OptimizationStrategy;
    activeSessions: number;
  } {
    return {
      network: this.networkMetrics,
      services: this.serviceHealth,
      strategy: this.optimizationStrategy,
      activeSessions: this.sessionHealth.size
    };
  }
}

export const aiVideoHeyGenHealthAgent = new AIVideoHeyGenHealthAgent();