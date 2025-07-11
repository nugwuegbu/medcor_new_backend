import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { storage } from '../storage';
import type { User, LoginData, SignupData, JWTPayload } from '@shared/schema';

// JWT secret - in production this should be from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'medcor_jwt_secret_key_2025';
const JWT_EXPIRES_IN = '24h';

export class AuthService {
  
  /**
   * Hash password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }
  
  /**
   * Verify password against hash
   */
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
  
  /**
   * Generate JWT token
   */
  static generateToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }
  
  /**
   * Verify JWT token
   */
  static verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Register new user
   */
  static async signup(signupData: SignupData): Promise<{ user: User; token: string }> {
    // Check if user already exists
    const existingUserByEmail = await storage.getUserByEmail(signupData.email);
    if (existingUserByEmail) {
      throw new Error('User with this email already exists');
    }
    
    const existingUserByUsername = await storage.getUserByUsername(signupData.username);
    if (existingUserByUsername) {
      throw new Error('Username already taken');
    }
    
    // Hash password
    const hashedPassword = await this.hashPassword(signupData.password);
    
    // Create user
    const newUser = await storage.createUser({
      username: signupData.username,
      email: signupData.email,
      password: hashedPassword,
      name: signupData.name,
      phoneNumber: signupData.phoneNumber,
      role: signupData.role,
      preferredLanguage: 'en',
      isNewUser: true,
    });
    
    // Generate token
    const token = this.generateToken(newUser);
    
    return { user: newUser, token };
  }
  
  /**
   * Login user
   */
  static async login(loginData: LoginData): Promise<{ user: User; token: string }> {
    // Find user by email
    const user = await storage.getUserByEmail(loginData.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }
    
    // Verify password
    const isPasswordValid = await this.verifyPassword(loginData.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }
    
    // Update last login
    await storage.updateUserLastLogin(user.id);
    
    // Generate token
    const token = this.generateToken(user);
    
    return { user, token };
  }
  
  /**
   * Get user from token
   */
  static async getUserFromToken(token: string): Promise<User | null> {
    const payload = this.verifyToken(token);
    if (!payload) {
      return null;
    }
    
    const user = await storage.getUser(payload.userId);
    if (!user || !user.isActive) {
      return null;
    }
    
    return user;
  }
  
  /**
   * Change user password
   */
  static async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Verify current password
    const isCurrentPasswordValid = await this.verifyPassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }
    
    // Hash new password
    const hashedNewPassword = await this.hashPassword(newPassword);
    
    // Update password
    await storage.updateUserPassword(userId, hashedNewPassword);
  }
  
  /**
   * Create default test accounts
   */
  static async createDefaultAccounts(): Promise<void> {
    const defaultAccounts = [
      {
        username: 'admin',
        email: 'admin@medcor.ai',
        password: 'Admin123!',
        name: 'Admin User',
        role: 'admin' as const,
      },
      {
        username: 'clinic',
        email: 'clinic@medcor.ai',
        password: 'Clinic123!',
        name: 'Clinic Manager',
        role: 'clinic' as const,
      },
      {
        username: 'doctor',
        email: 'doctor@medcor.ai',
        password: 'Doctor123!',
        name: 'Dr. John Smith',
        role: 'doctor' as const,
      },
      {
        username: 'patient',
        email: 'patient@medcor.ai',
        password: 'Patient123!',
        name: 'Jane Doe',
        role: 'patient' as const,
      },
    ];
    
    for (const account of defaultAccounts) {
      try {
        // Check if account already exists
        const existingUser = await storage.getUserByEmail(account.email);
        if (!existingUser) {
          await this.signup({
            ...account,
            confirmPassword: account.password,
            phoneNumber: undefined,
          });
          console.log(`✅ Created default ${account.role} account: ${account.email}`);
        } else {
          console.log(`ℹ️ Default ${account.role} account already exists: ${account.email}`);
        }
      } catch (error) {
        console.error(`❌ Failed to create default ${account.role} account:`, error);
      }
    }
  }
}