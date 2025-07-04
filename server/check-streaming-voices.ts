// Check which voices support streaming avatars
async function checkStreamingVoices() {
  const response = await fetch("https://api.heygen.com/v2/voices", {
    headers: {
      "Accept": "application/json", 
      "X-Api-Key": process.env.HEYGEN_API_KEY || ""
    }
  });
  
  const data = await response.json();
  
  // Find voices that support streaming
  console.log("Checking for streaming avatar compatible voices...\n");
  
  // Common streaming-compatible voice IDs based on HeyGen documentation
  const knownStreamingVoices = [
    "1bd001e7e50f421d891986aad5158bc8", // Default female
    "2d5b0e6cf36f46ba8b0f8f2e8a6c08d0", // Default male
  ];
  
  // Check if any Turkish voices match known streaming IDs
  const turkishVoices = data.data?.voices?.filter((v: any) => 
    v.language?.toLowerCase().includes('turkish') || 
    v.language?.toLowerCase() === 'tr'
  ) || [];
  
  console.log("Turkish voices found:");
  turkishVoices.forEach((voice: any) => {
    const isStreaming = knownStreamingVoices.includes(voice.voice_id);
    console.log(`- ${voice.name} (${voice.voice_id}) - ${voice.language} ${isStreaming ? '[STREAMING COMPATIBLE]' : ''}`);
  });
  
  // Also check standard voices that work with streaming
  console.log("\nDefault streaming voices:");
  const defaultVoices = data.data?.voices?.filter((v: any) => 
    knownStreamingVoices.includes(v.voice_id)
  ) || [];
  
  defaultVoices.forEach((voice: any) => {
    console.log(`- ${voice.name} (${voice.voice_id}) - ${voice.language} [STREAMING COMPATIBLE]`);
  });
}

checkStreamingVoices().catch(console.error);