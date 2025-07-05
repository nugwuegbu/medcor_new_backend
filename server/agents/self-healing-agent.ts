import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import { db, pool } from '../db';
import OpenAI from 'openai';

interface SystemHealth {
  database: {
    healthy: boolean;
    lastCheck: Date;
    connectionCount: number;
    errorCount: number;
  };
  avatar: {
    healthy: boolean;
    sessionActive: boolean;
    lastError?: string;
    errorCount: number;
  };
  api: {
    responseTime: number;
    errorRate: number;
    lastError?: string;
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
  uptime: number;
}

interface HealthIssue {
  type: 'database' | 'avatar' | 'api' | 'memory' | 'error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Date;
  autoFixed?: boolean;
  fixAttempts?: number;
}

export class SelfHealingAgent extends EventEmitter {
  private health: SystemHealth;
  private issues: HealthIssue[] = [];
  private monitoring = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private openai: OpenAI | null = null;
  private logFile = 'self-healing.log';
  
  constructor() {
    super();
    this.health = this.initializeHealth();
    
    // Initialize OpenAI if API key exists
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }
  
  private initializeHealth(): SystemHealth {
    return {
      database: {
        healthy: true,
        lastCheck: new Date(),
        connectionCount: 0,
        errorCount: 0
      },
      avatar: {
        healthy: true,
        sessionActive: false,
        errorCount: 0
      },
      api: {
        responseTime: 0,
        errorRate: 0
      },
      memory: {
        heapUsed: 0,
        heapTotal: 0,
        rss: 0
      },
      uptime: 0
    };
  }
  
  async start() {
    if (this.monitoring) return;
    
    this.monitoring = true;
    await this.log('Self-healing agent started', 'info');
    
    // Start monitoring loop
    this.checkInterval = setInterval(() => {
      this.performHealthCheck();
    }, 5000); // Check every 5 seconds
    
    // Monitor uncaught errors
    process.on('uncaughtException', (error) => {
      this.handleCriticalError(error, 'uncaughtException');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      this.handleCriticalError(reason as Error, 'unhandledRejection');
    });
    
    this.emit('started');
  }
  
  stop() {
    if (!this.monitoring) return;
    
    this.monitoring = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    this.log('Self-healing agent stopped', 'info');
    this.emit('stopped');
  }
  
  private async performHealthCheck() {
    try {
      // Update memory stats
      const memUsage = process.memoryUsage();
      this.health.memory = {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        rss: memUsage.rss
      };
      this.health.uptime = process.uptime();
      
      // Check database health
      await this.checkDatabaseHealth();
      
      // Check avatar sessions
      await this.checkAvatarHealth();
      
      // Check memory usage
      await this.checkMemoryHealth();
      
      // Analyze and fix issues
      await this.analyzeAndFix();
      
    } catch (error) {
      await this.log(`Health check error: ${error}`, 'error');
    }
  }
  
  private async checkDatabaseHealth() {
    try {
      // Test database connection
      const startTime = Date.now();
      const client = await pool.connect();
      const result = await client.query('SELECT 1');
      client.release();
      
      const responseTime = Date.now() - startTime;
      
      this.health.database.healthy = true;
      this.health.database.lastCheck = new Date();
      this.health.database.connectionCount = pool.totalCount;
      
      // Check if response time is too high
      if (responseTime > 1000) {
        this.reportIssue({
          type: 'database',
          severity: 'medium',
          description: `Database response time high: ${responseTime}ms`,
          timestamp: new Date()
        });
      }
      
    } catch (error) {
      this.health.database.healthy = false;
      this.health.database.errorCount++;
      
      this.reportIssue({
        type: 'database',
        severity: 'high',
        description: `Database connection failed: ${error}`,
        timestamp: new Date()
      });
      
      // Attempt to fix
      await this.fixDatabaseConnection();
    }
  }
  
  private async checkAvatarHealth() {
    // Check global avatar manager status
    const avatarManager = (global as any).avatarManager;
    if (avatarManager) {
      try {
        const sessionActive = avatarManager.avatar && avatarManager.avatar.state === 'connected';
        this.health.avatar.sessionActive = sessionActive;
        this.health.avatar.healthy = true;
        
        // Check for avatar errors in logs
        const recentLogs = await this.getRecentLogs();
        const avatarErrors = recentLogs.filter(log => 
          log.includes('avatar') && (log.includes('error') || log.includes('failed'))
        );
        
        if (avatarErrors.length > 0) {
          this.health.avatar.errorCount++;
          this.health.avatar.lastError = avatarErrors[0];
          
          if (this.health.avatar.errorCount > 3) {
            this.reportIssue({
              type: 'avatar',
              severity: 'medium',
              description: 'Multiple avatar errors detected',
              timestamp: new Date()
            });
          }
        }
      } catch (error) {
        this.health.avatar.healthy = false;
        await this.log(`Avatar health check failed: ${error}`, 'error');
      }
    }
  }
  
  private async checkMemoryHealth() {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
    const usagePercent = (heapUsedMB / heapTotalMB) * 100;
    
    // Warning at 80% memory usage
    if (usagePercent > 80) {
      this.reportIssue({
        type: 'memory',
        severity: usagePercent > 90 ? 'high' : 'medium',
        description: `High memory usage: ${usagePercent.toFixed(1)}% (${heapUsedMB.toFixed(1)}MB / ${heapTotalMB.toFixed(1)}MB)`,
        timestamp: new Date()
      });
      
      // Attempt garbage collection if critical
      if (usagePercent > 90 && global.gc) {
        await this.log('Forcing garbage collection due to high memory usage', 'warning');
        global.gc();
      }
    }
  }
  
  private async analyzeAndFix() {
    // Process recent issues
    const recentIssues = this.issues.filter(issue => 
      !issue.autoFixed && 
      (Date.now() - issue.timestamp.getTime()) < 300000 // Last 5 minutes
    );
    
    for (const issue of recentIssues) {
      if ((issue.fixAttempts || 0) >= 3) {
        continue; // Skip if already tried 3 times
      }
      
      try {
        switch (issue.type) {
          case 'database':
            await this.fixDatabaseConnection();
            break;
          case 'avatar':
            await this.fixAvatarSession();
            break;
          case 'memory':
            await this.fixMemoryIssue();
            break;
          case 'api':
            await this.analyzeAPIError(issue);
            break;
        }
        
        issue.fixAttempts = (issue.fixAttempts || 0) + 1;
      } catch (error) {
        await this.log(`Failed to fix ${issue.type} issue: ${error}`, 'error');
      }
    }
  }
  
  private async fixDatabaseConnection() {
    await this.log('Attempting to fix database connection...', 'info');
    
    try {
      // Try to reconnect
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      
      this.health.database.healthy = true;
      this.health.database.errorCount = 0;
      await this.log('Database connection restored', 'info');
      
      // Mark related issues as fixed
      this.issues.forEach(issue => {
        if (issue.type === 'database' && !issue.autoFixed) {
          issue.autoFixed = true;
        }
      });
      
    } catch (error) {
      await this.log(`Database fix failed: ${error}`, 'error');
    }
  }
  
  private async fixAvatarSession() {
    await this.log('Attempting to fix avatar session...', 'info');
    
    const avatarManager = (global as any).avatarManager;
    if (avatarManager && avatarManager.recreateAvatar) {
      try {
        await avatarManager.recreateAvatar();
        this.health.avatar.healthy = true;
        this.health.avatar.errorCount = 0;
        await this.log('Avatar session restored', 'info');
        
        this.issues.forEach(issue => {
          if (issue.type === 'avatar' && !issue.autoFixed) {
            issue.autoFixed = true;
          }
        });
      } catch (error) {
        await this.log(`Avatar fix failed: ${error}`, 'error');
      }
    }
  }
  
  private async fixMemoryIssue() {
    await this.log('Attempting to reduce memory usage...', 'info');
    
    // Clear old issues from memory
    this.issues = this.issues.filter(issue => 
      (Date.now() - issue.timestamp.getTime()) < 3600000 // Keep last hour
    );
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      await this.log('Garbage collection completed', 'info');
    }
  }
  
  private async analyzeAPIError(issue: HealthIssue) {
    if (!this.openai) return;
    
    try {
      // Use AI to analyze error and suggest fix
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a debugging assistant. Analyze the error and suggest a fix. Be concise."
          },
          {
            role: "user",
            content: `Error: ${issue.description}\nSuggest a fix or workaround.`
          }
        ],
        max_tokens: 200
      });
      
      const suggestion = response.choices[0].message.content;
      await this.log(`AI suggestion for ${issue.type}: ${suggestion}`, 'info');
      
    } catch (error) {
      await this.log(`AI analysis failed: ${error}`, 'error');
    }
  }
  
  private handleCriticalError(error: Error, type: string) {
    this.reportIssue({
      type: 'error',
      severity: 'critical',
      description: `${type}: ${error.message}\n${error.stack}`,
      timestamp: new Date()
    });
    
    this.log(`Critical error caught: ${type} - ${error.message}`, 'critical');
    
    // Emit event for external handling
    this.emit('criticalError', { error, type });
  }
  
  private reportIssue(issue: HealthIssue) {
    this.issues.push(issue);
    this.emit('issue', issue);
    this.log(`Issue reported: ${issue.type} - ${issue.severity} - ${issue.description}`, 'warning');
  }
  
  private async log(message: string, level: 'info' | 'warning' | 'error' | 'critical') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    
    console.log(logEntry.trim());
    
    try {
      await fs.appendFile(this.logFile, logEntry);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }
  
  private async getRecentLogs(): Promise<string[]> {
    try {
      const logContent = await fs.readFile(this.logFile, 'utf-8');
      const lines = logContent.split('\n');
      return lines.slice(-100); // Last 100 lines
    } catch {
      return [];
    }
  }
  
  getHealth(): SystemHealth {
    return { ...this.health };
  }
  
  getRecentIssues(limit = 10): HealthIssue[] {
    return this.issues.slice(-limit);
  }
  
  // Manual trigger for testing
  async simulateIssue(type: HealthIssue['type'], description: string) {
    this.reportIssue({
      type,
      severity: 'medium',
      description: `Simulated: ${description}`,
      timestamp: new Date()
    });
  }
}

// Create singleton instance
export const selfHealingAgent = new SelfHealingAgent();