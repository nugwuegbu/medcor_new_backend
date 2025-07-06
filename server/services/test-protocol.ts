interface TestProtocolStage {
  stage: string;
  description: string;
  videoUrl?: string;
  audioProvider?: 'elevenlabs' | 'openai' | 'silent';
  duration: number;
  message: string;
}

export class TestProtocol {
  private isTestMode = false;
  private currentStage = 0;
  private testStages: TestProtocolStage[] = [
    {
      stage: 'waiting',
      description: 'Waiting video with ElevenLabs voice',
      videoUrl: '/waiting_heygen.mp4',
      audioProvider: 'elevenlabs',
      duration: 4000,
      message: 'This is waiting video. My voice is ElevenLabs. You should see a static avatar video with my voice speaking.'
    },
    {
      stage: 'speaking_placeholder',
      description: 'Mouth moving video with ElevenLabs voice',
      videoUrl: '/speak_heygen.mp4',
      audioProvider: 'elevenlabs',
      duration: 5000,
      message: 'This is mouth moving video. ElevenLabs voice continues. You should see animated mouth movements synchronized with my speech.'
    },
    {
      stage: 'heygen_transition',
      description: 'Switching to HeyGen realistic interactive avatar',
      videoUrl: 'heygen_live',
      audioProvider: 'silent',
      duration: 2000,
      message: 'Now I switch to HeyGen realistic interactive avatar. Connection establishing.'
    },
    {
      stage: 'heygen_active',
      description: 'HeyGen connection active with realistic avatar',
      videoUrl: 'heygen_live',
      audioProvider: 'heygen_voice',
      duration: 8000,
      message: 'I am HeyGen connection. This is realistic interactive avatar. Full synchronization active with natural movements and expressions.'
    },
    {
      stage: 'test_complete',
      description: 'Test protocol completed',
      videoUrl: '/waiting_heygen.mp4',
      audioProvider: 'silent',
      duration: 2000,
      message: 'Test protocol completed successfully. All systems verified.'
    }
  ];

  detectTestTrigger(message: string): boolean {
    return message.toLowerCase().includes('adana01');
  }

  async executeTestProtocol(sessionId: string): Promise<{
    isTestMode: boolean;
    currentStage: TestProtocolStage;
    totalStages: number;
    progress: number;
  }> {
    this.isTestMode = true;
    this.currentStage = 0;

    console.log(`🧪 TEST PROTOCOL ACTIVATED for session: ${sessionId}`);
    console.log(`📋 Total test stages: ${this.testStages.length}`);

    return this.getCurrentStageInfo();
  }

  async nextStage(): Promise<{
    isTestMode: boolean;
    currentStage: TestProtocolStage;
    totalStages: number;
    progress: number;
    isComplete: boolean;
  }> {
    if (!this.isTestMode) {
      throw new Error('Test protocol not active');
    }

    this.currentStage++;
    
    const currentStageInfo = this.getCurrentStageInfo();
    const isComplete = this.currentStage >= this.testStages.length;

    if (isComplete) {
      this.resetProtocol();
      console.log(`✅ TEST PROTOCOL COMPLETED`);
    } else {
      const stage = this.testStages[this.currentStage];
      console.log(`🧪 TEST STAGE ${this.currentStage + 1}: ${stage.stage} - ${stage.description}`);
      console.log(`📱 Video: ${stage.videoUrl}, Audio: ${stage.audioProvider}, Duration: ${stage.duration}ms`);
    }

    return {
      ...currentStageInfo,
      isComplete
    };
  }

  getCurrentStageInfo(): {
    isTestMode: boolean;
    currentStage: TestProtocolStage;
    totalStages: number;
    progress: number;
  } {
    const stage = this.testStages[this.currentStage] || this.testStages[0];
    const progress = Math.round(((this.currentStage + 1) / this.testStages.length) * 100);

    return {
      isTestMode: this.isTestMode,
      currentStage: stage,
      totalStages: this.testStages.length,
      progress
    };
  }

  async generateTestResponse(stage: TestProtocolStage): Promise<{
    mode: string;
    videoUrl?: string;
    audioUrl?: string;
    message: string;
    testInfo: {
      stage: string;
      description: string;
      expectedBehavior: string;
      duration: number;
      audioProvider: string;
    };
  }> {
    return {
      mode: stage.stage,
      videoUrl: stage.videoUrl,
      audioUrl: stage.audioProvider !== 'silent' ? 'generate_tts' : undefined,
      message: stage.message,
      testInfo: {
        stage: stage.stage,
        description: stage.description,
        expectedBehavior: this.getExpectedBehavior(stage),
        duration: stage.duration,
        audioProvider: stage.audioProvider || 'silent'
      }
    };
  }

  private getExpectedBehavior(stage: TestProtocolStage): string {
    switch (stage.stage) {
      case 'waiting':
        return 'User should see waiting_heygen.mp4 playing in loop, no audio';
      case 'speaking_placeholder':
        return 'User should see speak_heygen.mp4 with mouth movements, ElevenLabs Turkish voice playing';
      case 'heygen_transition':
        return 'Video should seamlessly transition from placeholder to real HeyGen avatar';
      case 'heygen_active':
        return 'Real HeyGen avatar should be visible and speaking with ElevenLabs voice';
      case 'test_complete':
        return 'System should return to normal operation mode';
      default:
        return 'Default behavior';
    }
  }

  getTestInstructions(): {
    trigger: string;
    description: string;
    stages: Array<{
      name: string;
      description: string;
      expectedBehavior: string;
      duration: string;
    }>;
  } {
    return {
      trigger: 'adana01',
      description: 'Complete test protocol for HeyGen optimization system',
      stages: this.testStages.map(stage => ({
        name: stage.stage,
        description: stage.description,
        expectedBehavior: this.getExpectedBehavior(stage),
        duration: `${stage.duration}ms`
      }))
    };
  }

  isInTestMode(): boolean {
    return this.isTestMode;
  }

  resetProtocol(): void {
    this.isTestMode = false;
    this.currentStage = 0;
    console.log(`🔄 TEST PROTOCOL RESET`);
  }

  // Auto-advance stages for automated testing
  async autoAdvanceStages(sessionId: string, callback: (stageInfo: any) => void): Promise<void> {
    if (!this.isTestMode) return;

    for (let i = 0; i < this.testStages.length; i++) {
      const stageInfo = await this.nextStage();
      callback(stageInfo);
      
      if (!stageInfo.isComplete) {
        await new Promise(resolve => setTimeout(resolve, stageInfo.currentStage.duration));
      }
    }
  }
}

export const testProtocol = new TestProtocol();