async function checkTurkishVoices() {
  const response = await fetch("https://api.heygen.com/v2/voices", {
    headers: {
      "Accept": "application/json",
      "X-Api-Key": process.env.HEYGEN_API_KEY || ""
    }
  });
  
  const data = await response.json();
  
  // Find Turkish voices
  const turkishVoices = data.data?.voices?.filter((v: any) => 
    v.language?.toLowerCase().includes('turkish') || 
    v.language?.toLowerCase() === 'tr' ||
    v.name?.toLowerCase().includes('turkish')
  ) || [];
  
  console.log("Found Turkish voices:");
  turkishVoices.forEach((voice: any) => {
    console.log(`- Name: ${voice.name}, ID: ${voice.voice_id}, Language: ${voice.language}`);
  });
  
  // Also check for voices that might be Turkish based on name
  const possibleTurkishVoices = data.data?.voices?.filter((v: any) => 
    v.name?.match(/zeynep|ayse|emel|hakan|kemal|mehmet|turk/i)
  ) || [];
  
  console.log("\nPossible Turkish voices by name:");
  possibleTurkishVoices.forEach((voice: any) => {
    console.log(`- Name: ${voice.name}, ID: ${voice.voice_id}, Language: ${voice.language}`);
  });
}

checkTurkishVoices().catch(console.error);