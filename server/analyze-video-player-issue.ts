import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function analyzeAndSolveVideoProblem() {
  const problemDescription = `
## PROBLEM TANAMI:
Bir video player sistemimiz var. 2 saattir çözmeye çalıştığımız kritik bir sorun var:

### Mevcut Durum:
1. DynamicVideoPlayer component'i adana01 loop videosunu oynatıyor
2. Kullanıcı mesaj yazıp Enter'a bastığında veya ses kaydı yaptığında HeyGen avatar'a geçmesi gerekiyor
3. Ancak video durmuyor, mode heygen'e geçse bile adana01 videosu oynatılmaya devam ediyor
4. Console'da "Video progress: X%" logları devam ediyor
5. HeyGen avatar connection problemi yaşıyor

### Teknik Detaylar:
- Frontend: React, TypeScript
- Backend: Node.js, Express
- Video Player State Management: Backend'de VideoPlayerManager servisi
- Mode: 'loop' | 'heygen' | 'idle'
- Problem: Mode heygen'e geçiyor ama video element hala oynatılıyor

### Denenenler:
1. switchToHeyGen fonksiyonuna video.pause() ve video.src = '' eklendi
2. useEffect'te playerState kontrolü eklendi (reinit engellemeye çalışıldı)
3. Render logic'te conditional rendering yapıldı
4. handleUserInput'ta mode kontrolü yapıldı

### Başarısızlık Nedeni:
- Backend'de initializePlayer her zaman mode:'loop' ile başlatıyor
- Component re-render olduğunda tekrar init çağrılıyor ve mode loop'a dönüyor
- Video element unmount edilmediği için oynatmaya devam ediyor

### İSTENEN ÇÖZÜM:
1. Kullanıcı mesaj yazdığında veya ses kaydı yaptığında:
   - adana01 loop videosu HEMEN durmalı
   - HeyGen avatar aktif olmalı
   - Mode değişimi kalıcı olmalı (loop'a geri dönmemeli)
   - Frontend'e minimum değişiklik yapılmalı

Lütfen bu problemi analiz et ve çöz.
`;

  const codeContext = `
// DynamicVideoPlayer.tsx key parts:
const switchToHeyGen = async () => {
  console.log('🎬 FORCE SWITCHING TO HEYGEN MODE');
  
  // CRITICAL: Stop the video immediately
  if (videoRef.current) {
    videoRef.current.pause();
    videoRef.current.src = ''; // Clear the source to stop buffering
    console.log('🛑 Video stopped and cleared');
  }
  
  try {
    // Tell backend to switch to HeyGen mode
    const response = await fetch('/api/video/player/switch-heygen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });

    const data = await response.json();
    if (data.success) {
      setPlayerState(data.playerState);
      onModeChange('heygen');
      onUserInteraction();
      console.log('🎬 HEYGEN MODE FORCED - Backend updated');
    }
  } catch (error) {
    console.error('Failed to switch to HeyGen:', error);
  }
};

// Backend VideoPlayerManager.ts:
async initializePlayer(sessionId: string, videoId: string = 'adana01'): Promise<VideoPlayerState> {
  const playerState: VideoPlayerState = {
    id: sessionId,
    isPlaying: true,
    currentVideo: videoId,
    mode: 'loop', // ALWAYS STARTS WITH LOOP!
    lastInteraction: new Date(),
    loopCount: 0,
    sessionActive: true
  };

  this.playerStates.set(sessionId, playerState);
  console.log(\`🎬 Video Player Manager initialized: \${playerState.mode}\`);
  return playerState;
}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Sen bir React/TypeScript uzmanısın. Video player sistemlerinde uzmanlaşmış bir senior developer'sın. 
        Problemi analiz edip çözüm üreteceksin. Çözümün şu kriterlere uymalı:
        1. Frontend'e minimum değişiklik
        2. Kalıcı mode değişimi
        3. Video'nun kesin olarak durması
        4. HeyGen'e sorunsuz geçiş
        5. Re-render'da state korunması`
      },
      {
        role: "user",
        content: `${problemDescription}\n\nKOD CONTEXT:\n${codeContext}\n\n
        Lütfen:
        1. Problemi tanımla
        2. Root cause analizi yap
        3. Çözüm öner (kod ile birlikte)
        4. Çözümü şu kriterlere göre puanla:
           - Frontend etkilenmeme (30 puan)
           - State yönetimi doğruluğu (25 puan)
           - Video durma garantisi (20 puan)
           - HeyGen geçiş stabilitesi (15 puan)
           - Kod temizliği ve sürdürülebilirlik (10 puan)
        
        Her kriter için X/Y formatında puan ver ve toplam skoru hesapla.
        Eğer toplam skor %95'in altındaysa, kodu optimize et ve tekrar puanla.`
      }
    ],
    temperature: 0.2,
    max_tokens: 4000
  });

  console.log("OpenAI Analysis Result:");
  console.log(response.choices[0].message.content);
  return response.choices[0].message.content;
}

// Run the analysis
analyzeAndSolveVideoProblem().catch(console.error);