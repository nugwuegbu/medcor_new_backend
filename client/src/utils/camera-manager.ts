// Centralized Camera Management - Single Source of Truth
export const videoStreamRef = { current: null as MediaStream | null };

export async function ensureCameraReady(): Promise<MediaStream> {
  if (videoStreamRef.current) {
    console.log("🔵 Camera already ready:", videoStreamRef.current);
    return videoStreamRef.current;
  }
  
  try {
    console.log("🟡 Getting new camera stream...");
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoStreamRef.current = stream;
    console.log("🟢 New stream acquired:", stream);
    return stream;
  } catch (err) {
    console.error("🔴 Camera access failed:", err);
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
    console.log("🔴 Camera stream stopped");
  }
}