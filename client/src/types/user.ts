// User and authentication types
export type UserRole = 'superadmin' | 'admin' | 'doctor' | 'patient' | 'nurse';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId?: string;
  profileImage?: string;
  phoneNumber?: string;
  createdAt?: string;
  updatedAt?: string;
  permissions?: string[];
  metadata?: Record<string, any>;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  tenantId?: string;
  rememberMe?: boolean;
}

export interface SignupData extends LoginCredentials {
  name: string;
  phoneNumber?: string;
  role?: UserRole;
  termsAccepted: boolean;
}