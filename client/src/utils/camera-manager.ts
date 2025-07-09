// Centralized Camera Management - Single Source of Truth
export const videoStreamRef = { current: null as MediaStream | null };
export let isHairAnalysisCameraOff = false; // Specific trigger for Hair Analysis only

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

export async function ensureHairAnalysisCameraReady(): Promise<MediaStream> {
  if (isHairAnalysisCameraOff) {
    console.log("🔴 Hair analysis kamera trigger ile kapatılmış - stream yok");
    throw new Error("Hair analysis camera disabled by trigger");
  }
  
  return ensureCameraReady();
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

// Trigger functions for Hair Analysis camera control only
export function triggerHairAnalysisCameraOff(): void {
  console.log("🔴 TRIGGER: kadirli - Hair analysis kamera kapatılıyor");
  isHairAnalysisCameraOff = true;
  // Don't stop main camera stream - only affects Hair analysis
}

export function triggerHairAnalysisCameraOn(): void {
  console.log("🟢 TRIGGER: kozan - Hair analysis kamera açılıyor");
  isHairAnalysisCameraOff = false;
}

// Legacy functions for backward compatibility (now only affect Hair analysis)
export function triggerCameraOff(): void {
  triggerHairAnalysisCameraOff();
}

export function triggerCameraOn(): void {
  triggerHairAnalysisCameraOn();
}