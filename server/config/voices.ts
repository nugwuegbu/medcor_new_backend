export const VOICE_CONFIG = {
  elevenlabs: {
    turkish: {
      voiceId: 'pWeLcyFEBT5svt9WMYAO',
      name: 'Turkish Medical Assistant',
      gender: 'female',
      description: 'Turkish speaking medical assistant voice'
    },
    english: {
      voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella - professional female voice
      name: 'English Medical Assistant', 
      gender: 'female',
      description: 'English speaking medical assistant voice'
    }
  },
  openai: {
    english: {
      voiceId: 'nova',
      name: 'Nova - OpenAI Voice',
      gender: 'female',
      description: 'Pleasant female voice for English'
    },
    backup: {
      voiceId: 'alloy',
      name: 'Alloy - OpenAI Voice', 
      gender: 'neutral',
      description: 'Neutral voice for fallback'
    }
  }
};

export function getVoiceForLanguage(language: 'tr' | 'en', provider: 'elevenlabs' | 'openai' = 'elevenlabs') {
  if (provider === 'elevenlabs') {
    return language === 'tr' 
      ? VOICE_CONFIG.elevenlabs.turkish
      : VOICE_CONFIG.elevenlabs.english;
  } else {
    return VOICE_CONFIG.openai.english;
  }
}