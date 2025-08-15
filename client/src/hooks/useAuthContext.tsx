import { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthState, LoginCredentials, SignupData } from '@/types/user';
import { AuthService } from '@/features/auth/services/auth.service';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Check for existing authentication on mount
    const verifyAuth = async () => {
      const token = AuthService.getToken();
      const user = AuthService.getUser();
      
      if (token && user) {
        // Verify token is still valid
        const verifiedUser = await AuthService.verifyToken();
        if (verifiedUser) {
          setState({
            isAuthenticated: true,
            user: verifiedUser,
            token,
            loading: false,
            error: null,
          });
        } else {
          setState({
            isAuthenticated: false,
            user: null,
            token: null,
            loading: false,
            error: null,
          });
        }
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    verifyAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { token, user } = await AuthService.login(credentials);
      setState({
        isAuthenticated: true,
        user,
        token,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
      throw error;
    }
  };

  const signup = async (data: SignupData) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { token, user } = await AuthService.signup(data);
      setState({
        isAuthenticated: true,
        user,
        token,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
      throw error;
    }
  };

  const logout = async () => {
    await AuthService.logout();
    setState({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
      error: null,
    });
  };

  const resetPassword = async (email: string) => {
    await AuthService.resetPassword(email);
  };

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};