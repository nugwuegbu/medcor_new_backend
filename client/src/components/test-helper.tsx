// Test Helper Component - Invisible background functionality
// This component does not render any UI, only provides test logging

import { useEffect } from 'react';

interface TestHelperProps {
  isTestMode?: boolean;
  testInfo?: any;
}

export const TestHelper = ({ isTestMode, testInfo }: TestHelperProps) => {
  useEffect(() => {
    if (isTestMode && testInfo) {
      console.log(`🧪 TEST HELPER: ${testInfo.protocolName} activated`);
      console.log(`📊 TEST PROGRESS: ${testInfo.progress}% complete`);
      console.log(`🎯 TEST STAGE: ${testInfo.currentStage?.name || 'Unknown'}`);
    }
  }, [isTestMode, testInfo]);

  // This component renders nothing - pure background functionality
  return null;
};

// Test command processor for chat
export const processTestCommand = (message: string): string | null => {
  const testCommands = [
    'adana01', 'adana02', 'adana03', 
    'test voice', 'test video', 'test system',
    'run tests', 'check audio', 'check video'
  ];

  const lowerMessage = message.toLowerCase().trim();
  
  for (const command of testCommands) {
    if (lowerMessage.includes(command)) {
      console.log(`🎯 TEST COMMAND DETECTED: ${command} in message: ${message}`);
      return command;
    }
  }

  return null;
};

// Test results logger
export const logTestResults = (results: any) => {
  console.log(`📋 TEST RESULTS:`, results);
  
  if (results.audioUrl) {
    console.log(`🔊 Audio URL available: ${results.audioUrl.length} characters`);
  }
  
  if (results.videoUrl) {
    console.log(`📹 Video URL: ${results.videoUrl}`);
  }
  
  if (results.testInfo) {
    console.log(`📊 Test Info: ${JSON.stringify(results.testInfo, null, 2)}`);
  }
};