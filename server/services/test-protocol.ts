interface TestProtocolStage {
  stage: string;
  description: string;
  videoUrl?: string;
  audioProvider?: 'elevenlabs' | 'openai' | 'heygen' | 'silent';
  duration: number;
  message: string;
}

interface TestProtocolConfig {
  name: string;
  description: string;
  stages: TestProtocolStage[];
}

export class TestProtocol {
  private isTestMode = false;
  private currentStage = 0;
  private currentProtocol: string = '';
  
  private testProtocols: { [key: string]: TestProtocolConfig } = {
    'adana01': {
      name: 'ADANA01: Waiting Video + ElevenLabs + HeyGen',
      description: 'Test waiting video with ElevenLabs voice, then HeyGen avatar',
      stages: [
        {
          stage: 'waiting_video',
          description: 'Waiting video with ElevenLabs voice',
          videoUrl: '/waiting_heygen.mp4',
          audioProvider: 'elevenlabs',
          duration: 4000,
          message: 'ADANA01 Test: This is waiting video. My voice is ElevenLabs voice. You should hear clear audio with static avatar.'
        },
        {
          stage: 'heygen_active',
          description: 'HeyGen avatar with HeyGen voice',
          videoUrl: 'heygen_live',
          audioProvider: 'heygen',
          duration: 5000,
          message: 'ADANA01 Test: Now I am HeyGen voice with HeyGen avatar. This is realistic interactive avatar with natural voice.'
        }
      ]
    },
    'adana02': {
      name: 'ADANA02: Speaking Video + OpenAI + HeyGen',
      description: 'Test speaking video with OpenAI voice, then HeyGen avatar',
      stages: [
        {
          stage: 'speak_video_with_voice',
          description: 'Speaking video with OpenAI voice',
          videoUrl: '/speak_heygen.mp4',
          audioProvider: 'openai',
          duration: 4000,
          message: 'ADANA02 Test: This is speaking video with mouth movements. My voice is OpenAI voice. You should hear clear audio with animated mouth.'
        },
        {
          stage: 'heygen_active',
          description: 'HeyGen avatar with HeyGen voice',
          videoUrl: 'heygen_live',
          audioProvider: 'heygen',
          duration: 5000,
          message: 'ADANA02 Test: Now I am HeyGen voice with HeyGen avatar. This is realistic interactive avatar with natural voice.'
        }
      ]
    },
    'adana03': {
      name: 'ADANA03: All Voices Test',
      description: 'Test all voice providers with different videos',
      stages: [
        {
          stage: 'elevenlabs_test',
          description: 'ElevenLabs voice test',
          videoUrl: '/waiting_heygen.mp4',
          audioProvider: 'elevenlabs',
          duration: 4000,
          message: 'ADANA03 Test: I am ElevenLabs voice. This is waiting video with ElevenLabs voice provider.'
        },
        {
          stage: 'openai_test',
          description: 'OpenAI voice test',
          videoUrl: '/speak_heygen.mp4',
          audioProvider: 'openai',
          duration: 4000,
          message: 'ADANA03 Test: I am OpenAI voice. This is speaking video with OpenAI voice provider.'
        },
        {
          stage: 'heygen_test',
          description: 'HeyGen voice test',
          videoUrl: 'heygen_live',
          audioProvider: 'heygen',
          duration: 5000,
          message: 'ADANA03 Test: I am HeyGen voice. This is HeyGen avatar with HeyGen voice provider.'
        }
      ]
    }
  };

  detectTestTrigger(message: string): string[] {
    const msg = message.toLowerCase().replace(/[\s,]+/g, ' '); // Normalize spaces and commas
    const triggers: string[] = [];
    
    if (msg.includes('adana01')) triggers.push('adana01');
    if (msg.includes('adana02')) triggers.push('adana02');
    if (msg.includes('adana03')) triggers.push('adana03');
    
    return triggers;
  }

  async executeTestProtocol(sessionId: string, protocolName: string): Promise<{
    isTestMode: boolean;
    currentStage: TestProtocolStage;
    totalStages: number;
    progress: number;
    protocolName: string;
    protocolDescription: string;
  }> {
    const protocol = this.testProtocols[protocolName];
    if (!protocol) {
      throw new Error(`Unknown test protocol: ${protocolName}`);
    }

    this.isTestMode = true;
    this.currentStage = 0;
    this.currentProtocol = protocolName;

    console.log(`🧪 TEST PROTOCOL ACTIVATED: ${protocol.name} for session: ${sessionId}`);
    console.log(`📋 Total test stages: ${protocol.stages.length}`);

    const stageInfo = this.getCurrentStageInfo();
    return {
      ...stageInfo,
      protocolName: protocol.name,
      protocolDescription: protocol.description
    };
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
    const protocol = this.testProtocols[this.currentProtocol];
    if (!protocol) {
      throw new Error(`No active protocol: ${this.currentProtocol}`);
    }
    
    const stage = protocol.stages[this.currentStage] || protocol.stages[0];
    const progress = Math.round(((this.currentStage + 1) / protocol.stages.length) * 100);

    return {
      isTestMode: this.isTestMode,
      currentStage: stage,
      totalStages: protocol.stages.length,
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