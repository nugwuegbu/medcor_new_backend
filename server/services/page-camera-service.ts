// Backend Page Camera Service - Chrome Tab-like System
// Each page has independent camera state and controls

export interface PageCameraState {
  pageId: string;
  isActive: boolean;
  isDisabled: boolean;
  lastAccess: number;
  sessionId: string;
  userId?: string;
}

export class PageCameraService {
  private static instance: PageCameraService;
  private pageStates: Map<string, PageCameraState> = new Map();
  
  public static getInstance(): PageCameraService {
    if (!PageCameraService.instance) {
      PageCameraService.instance = new PageCameraService();
    }
    return PageCameraService.instance;
  }
  
  // Generate unique page session key
  private getPageKey(sessionId: string, pageId: string): string {
    return `${sessionId}:${pageId}`;
  }
  
  // Initialize page camera state
  initPageCamera(sessionId: string, pageId: string, userId?: string): PageCameraState {
    const pageKey = this.getPageKey(sessionId, pageId);
    
    console.log(`📄 BACKEND: Initializing camera for page ${pageId} (session: ${sessionId})`);
    
    const pageState: PageCameraState = {
      pageId,
      isActive: true,
      isDisabled: false,
      lastAccess: Date.now(),
      sessionId,
      userId
    };
    
    this.pageStates.set(pageKey, pageState);
    console.log(`📄 BACKEND: Page camera initialized for ${pageId}`);
    
    return pageState;
  }
  
  // Get page camera state
  getPageCamera(sessionId: string, pageId: string): PageCameraState | null {
    const pageKey = this.getPageKey(sessionId, pageId);
    const pageState = this.pageStates.get(pageKey);
    
    if (pageState) {
      pageState.lastAccess = Date.now();
      console.log(`📄 BACKEND: Camera accessed for page ${pageId}`);
    }
    
    return pageState || null;
  }
  
  // Check if page camera is available
  isPageCameraAvailable(sessionId: string, pageId: string): boolean {
    const pageState = this.getPageCamera(sessionId, pageId);
    return pageState ? pageState.isActive && !pageState.isDisabled : false;
  }
  
  // Disable page camera
  disablePageCamera(sessionId: string, pageId: string): boolean {
    const pageKey = this.getPageKey(sessionId, pageId);
    const pageState = this.pageStates.get(pageKey);
    
    if (pageState) {
      pageState.isDisabled = true;
      pageState.lastAccess = Date.now();
      console.log(`📄 BACKEND: Camera disabled for page ${pageId} (session: ${sessionId})`);
      return true;
    }
    
    return false;
  }
  
  // Enable page camera
  enablePageCamera(sessionId: string, pageId: string): boolean {
    const pageKey = this.getPageKey(sessionId, pageId);
    const pageState = this.pageStates.get(pageKey);
    
    if (pageState) {
      pageState.isDisabled = false;
      pageState.lastAccess = Date.now();
      console.log(`📄 BACKEND: Camera enabled for page ${pageId} (session: ${sessionId})`);
      return true;
    }
    
    return false;
  }
  
  // Get all active pages for session
  getActivePages(sessionId: string): PageCameraState[] {
    const activePages: PageCameraState[] = [];
    
    this.pageStates.forEach((state, key) => {
      if (key.startsWith(`${sessionId}:`) && state.isActive && !state.isDisabled) {
        activePages.push(state);
      }
    });
    
    return activePages;
  }
  
  // Cleanup old page sessions
  cleanup(): void {
    const now = Date.now();
    const CLEANUP_TIMEOUT = 10 * 60 * 1000; // 10 minutes
    
    this.pageStates.forEach((state, key) => {
      if (now - state.lastAccess > CLEANUP_TIMEOUT) {
        console.log(`📄 BACKEND: Cleaning up old page camera: ${key}`);
        this.pageStates.delete(key);
      }
    });
  }
  
  // Get page statistics
  getPageStats(sessionId: string): { total: number; active: number; disabled: number } {
    let total = 0;
    let active = 0;
    let disabled = 0;
    
    this.pageStates.forEach((state, key) => {
      if (key.startsWith(`${sessionId}:`)) {
        total++;
        if (state.isActive && !state.isDisabled) active++;
        if (state.isDisabled) disabled++;
      }
    });
    
    return { total, active, disabled };
  }
}

// Page ID constants
export const PAGE_IDS = {
  MAIN: 'main',
  HAIR: 'hair',
  FACE: 'face',
  BOOK: 'book',
  DOCTORS: 'doctors',
  RECORDS: 'records',
  ADMIN: 'admin'
} as const;

// Global service instance
export const pageCameraService = PageCameraService.getInstance();

// Cleanup interval
setInterval(() => {
  pageCameraService.cleanup();
}, 60000); // Every minute