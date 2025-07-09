// Centralized Camera Management - Single Source of Truth
export const videoStreamRef = { current: null as MediaStream | null };
export let isCameraForcedOff = false; // Trigger control flag

export async function ensureCameraReady(): Promise<MediaStream> {
  if (isCameraForcedOff) {
    console.log("🔴 Kamera trigger ile kapatılmış - stream yok");
    throw new Error("Camera disabled by trigger");
  }
  
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

// Trigger functions for camera control
export function triggerCameraOff(): void {
  console.log("🔴 TRIGGER: kadirli - Kamera kapatılıyor");
  isCameraForcedOff = true;
  stopCameraStream();
}

export function triggerCameraOn(): void {
  console.log("🟢 TRIGGER: kozan - Kamera açılıyor");
  isCameraForcedOff = false;
}