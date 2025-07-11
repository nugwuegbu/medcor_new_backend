import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth';
import type { User } from '@shared/schema';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

/**
 * Middleware to authenticate users via JWT token
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ 
        error: 'Access token required',
        message: 'Please provide a valid authentication token'
      });
      return;
    }

    const user = await AuthService.getUserFromToken(token);
    if (!user) {
      res.status(401).json({ 
        error: 'Invalid token',
        message: 'Authentication token is invalid or expired'
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ 
      error: 'Authentication failed',
      message: 'Failed to authenticate user'
    });
  }
};

/**
 * Middleware to check if user has required role
 */
export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please authenticate to access this resource'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
      return;
    }

    next();
  };
};

/**
 * Middleware for admin-only access
 */
export const requireAdmin = requireRole(['admin']);

/**
 * Middleware for doctor-only access
 */
export const requireDoctor = requireRole(['doctor', 'admin']);

/**
 * Middleware for clinic staff access
 */
export const requireClinic = requireRole(['clinic', 'admin']);

/**
 * Middleware for patient access (most permissive)
 */
export const requirePatient = requireRole(['patient', 'doctor', 'clinic', 'admin']);

/**
 * Optional authentication - sets user if token is valid but doesn't require it
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const user = await AuthService.getUserFromToken(token);
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Don't fail on optional auth - just continue without user
    next();
  }
};