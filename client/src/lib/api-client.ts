/**
 * API Client for Frontend-Backend Communication
 * This replaces the existing queryClient to use centralized API configuration
 */

import { API_ENDPOINTS, API_CONFIG, AUTH_CONFIG, ERROR_CONFIG } from '@/config/api';

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.defaultHeaders = API_CONFIG.HEADERS;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  /**
   * Get stored authentication token
   */
  private getAuthToken(): string | null {
    return localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
  }

  /**
   * Set authentication token
   */
  public setAuthToken(token: string): void {
    localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
  }

  /**
   * Remove authentication token
   */
  public removeAuthToken(): void {
    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.TOKEN_EXPIRES_KEY);
  }

  /**
   * Get headers with authentication
   */
  private getHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers = { ...this.defaultHeaders };
    
    // Add authentication token if available
    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Add custom headers
    if (customHeaders) {
      Object.assign(headers, customHeaders);
    }
    
    return headers;
  }

  /**
   * Handle API response
   */
  private async handleResponse(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type');
    
    // Handle different response types
    let data;
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else if (contentType?.includes('text/')) {
      data = await response.text();
    } else {
      data = await response.blob();
    }

    // Handle error responses
    if (!response.ok) {
      const errorMessage = data?.message || data?.error || response.statusText;
      
      // Handle specific error types
      if (response.status === 401) {
        this.removeAuthToken();
        throw new Error(`401: ${errorMessage || ERROR_CONFIG.UNAUTHORIZED_MESSAGE}`);
      }
      
      if (response.status >= 500) {
        throw new Error(`${response.status}: ${errorMessage || ERROR_CONFIG.SERVER_ERROR_MESSAGE}`);
      }
      
      throw new Error(`${response.status}: ${errorMessage}`);
    }

    return data;
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest(
    url: string,
    options: ApiRequestOptions = {}
  ): Promise<any> {
    const {
      method = 'GET',
      headers: customHeaders,
      body,
      timeout = this.timeout
    } = options;

    const headers = this.getHeaders(customHeaders);
    
    // Prepare request configuration
    const config: RequestInit = {
      method,
      headers,
      ...(body && { body: typeof body === 'string' ? body : JSON.stringify(body) }),
    };

    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return await this.handleResponse(response);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }
      
      throw new Error(ERROR_CONFIG.NETWORK_ERROR_MESSAGE);
    }
  }

  /**
   * Make GET request
   */
  public async get<T = any>(url: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<T> {
    return this.makeRequest(url, { ...options, method: 'GET' });
  }

  /**
   * Make POST request
   */
  public async post<T = any>(url: string, data?: any, options?: Omit<ApiRequestOptions, 'method'>): Promise<T> {
    return this.makeRequest(url, { ...options, method: 'POST', body: data });
  }

  /**
   * Make PUT request
   */
  public async put<T = any>(url: string, data?: any, options?: Omit<ApiRequestOptions, 'method'>): Promise<T> {
    return this.makeRequest(url, { ...options, method: 'PUT', body: data });
  }

  /**
   * Make DELETE request
   */
  public async delete<T = any>(url: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<T> {
    return this.makeRequest(url, { ...options, method: 'DELETE' });
  }

  /**
   * Make PATCH request
   */
  public async patch<T = any>(url: string, data?: any, options?: Omit<ApiRequestOptions, 'method'>): Promise<T> {
    return this.makeRequest(url, { ...options, method: 'PATCH', body: data });
  }

  /**
   * Upload file
   */
  public async uploadFile<T = any>(url: string, file: File, additionalData?: Record<string, any>): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return this.makeRequest(url, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let browser set it
        ...this.getHeaders(),
        'Content-Type': undefined as any,
      },
    });
  }

  /**
   * Download file
   */
  public async downloadFile(url: string): Promise<Blob> {
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }
    
    return response.blob();
  }
}

// Create singleton instance
const apiClient = new ApiClient();

// Export both the class and instance
export { ApiClient, apiClient };
export default apiClient;

// Backward compatibility - maintain existing apiRequest function
export const apiRequest = async (path: string, options: ApiRequestOptions = {}) => {
  const url = path.startsWith('http') ? path : `${API_CONFIG.BASE_URL}${path}`;
  return apiClient.makeRequest(url, options);
};