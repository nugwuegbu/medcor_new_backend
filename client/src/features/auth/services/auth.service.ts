import { LoginCredentials, SignupData, User } from '@/types/user';
import { API_BASE_URL, STORAGE_KEYS } from '@/constants';

export class AuthService {
  private static baseUrl = `${API_BASE_URL}/api/auth`;

  static async login(credentials: LoginCredentials): Promise<{ token: string; user: User }> {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    
    // Store token and user data
    if (credentials.rememberMe) {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data.user));
    } else {
      sessionStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
      sessionStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data.user));
    }

    return data;
  }

  static async signup(data: SignupData): Promise<{ token: string; user: User }> {
    const response = await fetch(`${this.baseUrl}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Signup failed');
    }

    return response.json();
  }

  static async logout(): Promise<void> {
    const token = this.getToken();
    
    if (token) {
      try {
        await fetch(`${this.baseUrl}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    // Clear storage
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.USER_DATA);
  }

  static async resetPassword(email: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send reset email');
    }
  }

  static async verifyToken(): Promise<User | null> {
    const token = this.getToken();
    
    if (!token) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Token verification failed');
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      // Token is invalid, clear storage
      this.logout();
      return null;
    }
  }

  static getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || 
           sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  static getUser(): User | null {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER_DATA) || 
                    sessionStorage.getItem(STORAGE_KEYS.USER_DATA);
    
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }
}