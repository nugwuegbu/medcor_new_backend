// Centralized Camera Management - Single Source of Truth
export const videoStreamRef = { current: null as MediaStream | null };

export async function ensureCameraReady(): Promise<MediaStream> {
  if (videoStreamRef.current) {
    console.log("🔵 Kamera zaten hazır:", videoStreamRef.current);
    return videoStreamRef.current;
  }
  
  try {
    console.log("🟡 Yeni kamera stream'i alınıyor...");
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoStreamRef.current = stream;
    console.log("🟢 Yeni stream alındı:", stream);
    return stream;
  } catch (err) {
    console.error("🔴 Kamera erişimi başarısız:", err);
    throw err;
  }
}

export function getCameraStream(): MediaStream | null {
  return videoStreamRef.current;
}

export function stopCameraStream(): void {
  if (videoStreamRef.current) {
    videoStreamRef.current.getTracks().forEach(track => track.stop());
    videoStreamRef.current = null;
    console.log("🔴 Kamera stream'i durduruldu");
  }
}