// Page-Based Camera Management System
// Each page has its own independent camera like Chrome tabs

interface PageCameraState {
  stream: MediaStream | null;
  isActive: boolean;
  isDisabled: boolean;
  lastAccess: number;
}

class PageCameraManager {
  private cameraStates: Map<string, PageCameraState> = new Map();
  
  // Get camera for specific page
  async getPageCamera(pageId: string): Promise<MediaStream | null> {
    console.log(`📄 PAGE CAMERA: Getting camera for page ${pageId}`);
    
    let pageState = this.cameraStates.get(pageId);
    
    if (!pageState) {
      pageState = {
        stream: null,
        isActive: false,
        isDisabled: false,
        lastAccess: Date.now()
      };
      this.cameraStates.set(pageId, pageState);
    }
    
    // Check if this page's camera is disabled
    if (pageState.isDisabled) {
      console.log(`📄 PAGE CAMERA: Camera disabled for page ${pageId}`);
      return null;
    }
    
    // If no stream exists, create new one
    if (!pageState.stream) {
      try {
        console.log(`📄 PAGE CAMERA: Creating new stream for page ${pageId}`);
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        pageState.stream = stream;
        pageState.isActive = true;
        pageState.lastAccess = Date.now();
        console.log(`📄 PAGE CAMERA: New stream created for page ${pageId}`, stream);
      } catch (err) {
        console.error(`📄 PAGE CAMERA: Failed to create stream for page ${pageId}:`, err);
        return null;
      }
    }
    
    // Update last access
    pageState.lastAccess = Date.now();
    return pageState.stream;
  }
  
  // Disable camera for specific page
  disablePageCamera(pageId: string): void {
    console.log(`📄 PAGE CAMERA: Disabling camera for page ${pageId}`);
    
    const pageState = this.cameraStates.get(pageId);
    if (pageState) {
      pageState.isDisabled = true;
      
      // Stop existing stream if active
      if (pageState.stream) {
        pageState.stream.getTracks().forEach(track => track.stop());
        pageState.stream = null;
        pageState.isActive = false;
        console.log(`📄 PAGE CAMERA: Stream stopped for page ${pageId}`);
      }
    }
  }
  
  // Enable camera for specific page
  enablePageCamera(pageId: string): void {
    console.log(`📄 PAGE CAMERA: Enabling camera for page ${pageId}`);
    
    const pageState = this.cameraStates.get(pageId);
    if (pageState) {
      pageState.isDisabled = false;
      console.log(`📄 PAGE CAMERA: Camera enabled for page ${pageId}`);
    }
  }
  
  // Check if page camera is disabled
  isPageCameraDisabled(pageId: string): boolean {
    const pageState = this.cameraStates.get(pageId);
    return pageState ? pageState.isDisabled : false;
  }
  
  // Stop camera for specific page
  stopPageCamera(pageId: string): void {
    console.log(`📄 PAGE CAMERA: Stopping camera for page ${pageId}`);
    
    const pageState = this.cameraStates.get(pageId);
    if (pageState && pageState.stream) {
      pageState.stream.getTracks().forEach(track => track.stop());
      pageState.stream = null;
      pageState.isActive = false;
      console.log(`📄 PAGE CAMERA: Stream stopped for page ${pageId}`);
    }
  }
  
  // Get all active pages
  getActivePages(): string[] {
    const activePages: string[] = [];
    this.cameraStates.forEach((state, pageId) => {
      if (state.isActive && state.stream) {
        activePages.push(pageId);
      }
    });
    return activePages;
  }
  
  // Cleanup unused cameras (older than 5 minutes)
  cleanup(): void {
    const now = Date.now();
    const CLEANUP_TIMEOUT = 5 * 60 * 1000; // 5 minutes
    
    this.cameraStates.forEach((state, pageId) => {
      if (now - state.lastAccess > CLEANUP_TIMEOUT && state.stream) {
        console.log(`📄 PAGE CAMERA: Cleaning up unused camera for page ${pageId}`);
        this.stopPageCamera(pageId);
      }
    });
  }
}

// Global instance
export const pageCameraManager = new PageCameraManager();

// Page-specific camera functions
export const PAGE_IDS = {
  MAIN: 'main',
  HAIR: 'hair',
  FACE: 'face',
  BOOK: 'book',
  DOCTORS: 'doctors',
  RECORDS: 'records',
  ADMIN: 'admin'
} as const;

// Hair Analysis page camera functions
export async function getHairAnalysisCamera(): Promise<MediaStream | null> {
  return pageCameraManager.getPageCamera(PAGE_IDS.HAIR);
}

export function disableHairAnalysisCamera(): void {
  pageCameraManager.disablePageCamera(PAGE_IDS.HAIR);
}

export function enableHairAnalysisCamera(): void {
  pageCameraManager.enablePageCamera(PAGE_IDS.HAIR);
}

export function isHairAnalysisCameraDisabled(): boolean {
  return pageCameraManager.isPageCameraDisabled(PAGE_IDS.HAIR);
}

// Face Analysis page camera functions
export async function getFaceAnalysisCamera(): Promise<MediaStream | null> {
  return pageCameraManager.getPageCamera(PAGE_IDS.FACE);
}

export function disableFaceAnalysisCamera(): void {
  pageCameraManager.disablePageCamera(PAGE_IDS.FACE);
}

export function enableFaceAnalysisCamera(): void {
  pageCameraManager.enablePageCamera(PAGE_IDS.FACE);
}

// Main page camera functions
export async function getMainPageCamera(): Promise<MediaStream | null> {
  return pageCameraManager.getPageCamera(PAGE_IDS.MAIN);
}

// Trigger system for Hair Analysis
export function triggerHairAnalysisCameraOff(): void {
  console.log("🔴 TRIGGER: kadirli - Hair Analysis camera disabled");
  disableHairAnalysisCamera();
}

export function triggerHairAnalysisCameraOn(): void {
  console.log("🟢 TRIGGER: kozan - Hair Analysis camera enabled");
  enableHairAnalysisCamera();
}

// Legacy compatibility
export function triggerCameraOff(): void {
  triggerHairAnalysisCameraOff();
}

export function triggerCameraOn(): void {
  triggerHairAnalysisCameraOn();
}

// Cleanup interval
setInterval(() => {
  pageCameraManager.cleanup();
}, 60000); // Every minute