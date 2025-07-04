import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "../storage";
import { faceRecognitionAgent } from "../agents/face-recognition-agent";
import type { Express } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";

interface OAuthProfile {
  id: string;
  provider: string;
  email?: string;
  name?: string;
  picture?: string;
}

// Configure session middleware
export function configureSession(app: Express) {
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    tableName: "auth_sessions",
    ttl: 30 * 24 * 60 * 60 // 30 days
  });

  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'medcor-ai-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
  }));

  app.use(passport.initialize());
  app.use(passport.session());
}

// Configure OAuth providers
export function configureOAuthProviders() {
  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback"
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const oauthProfile: OAuthProfile = {
          id: profile.id,
          provider: 'google',
          email: profile.emails?.[0]?.value,
          name: profile.displayName,
          picture: profile.photos?.[0]?.value
        };
        
        const user = await handleOAuthLogin(oauthProfile);
        done(null, user);
      } catch (error) {
        done(error as Error);
      }
    }));
  }

  // For Apple and Facebook, we'll use mock strategies for now
  // In production, you'd install and configure:
  // - passport-apple for Apple Sign In
  // - passport-facebook for Facebook Login

  // Serialize/Deserialize user
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}

// Handle OAuth login/signup
async function handleOAuthLogin(profile: OAuthProfile) {
  // Check if user exists by OAuth provider ID
  let user = await storage.getUserByOAuthId(profile.provider, profile.id);
  
  if (!user && profile.email) {
    // Check if user exists by email
    user = await storage.getUserByEmail(profile.email);
    
    if (user) {
      // Link OAuth account to existing user
      await storage.linkOAuthAccount(user.id, profile.provider, profile.id);
    }
  }
  
  if (!user) {
    // Create new user
    user = await storage.createUser({
      username: `${profile.provider}_${profile.id}`, // Generate unique username
      password: `oauth_${profile.provider}_${profile.id}_${Date.now()}`, // Generate secure password for OAuth users
      email: profile.email || `${profile.provider}_${profile.id}@medcor.ai`,
      name: profile.name || 'Guest User',
      profilePicture: profile.picture,
      oauthProvider: profile.provider,
      oauthProviderId: profile.id,
      isNewUser: true, // Flag to show phone number collection
      faceRegistered: false,
      role: 'patient'
    });
  }
  
  // Update last login
  await storage.updateUserLastLogin(user.id);
  
  return user;
}

// Face recognition authentication
export async function authenticateWithFace(imageBase64: string, sessionId: string) {
  try {
    // Analyze face and get recognition result
    const faceResult = await faceRecognitionAgent.captureAndAnalyzeFace(imageBase64, sessionId);
    
    if (!faceResult) {
      return { success: false, message: "Face detection failed" };
    }
    
    // Try to identify the face
    const identification = await faceRecognitionAgent.identifyFace(faceResult.faceId);
    
    if (identification.userId && identification.confidence > 0.8) {
      // High confidence match - log the user in
      const user = await storage.getUser(identification.userId);
      
      if (user && user.faceRegistered) {
        await storage.updateUserLastLogin(user.id);
        
        return { 
          success: true, 
          user,
          confidence: identification.confidence,
          message: "Face recognized successfully"
        };
      }
    }
    
    return { 
      success: false, 
      faceId: faceResult.faceId,
      message: "Face not recognized. Please login with your account."
    };
  } catch (error) {
    console.error("Face authentication error:", error);
    return { 
      success: false, 
      message: "Face recognition error occurred" 
    };
  }
}

// Register face for user
export async function registerFaceForUser(userId: number, imageBase64: string) {
  try {
    const user = await storage.getUser(userId);
    if (!user) {
      return { success: false, message: "User not found" };
    }
    
    // Register face with face recognition service
    const registered = await faceRecognitionAgent.registerNewPatientFace(
      imageBase64,
      userId,
      user.preferredLanguage || 'en'
    );
    
    if (registered) {
      // Update user record
      await storage.updateUser(userId, { faceRegistered: true });
      
      return { 
        success: true, 
        message: "Face registered successfully for quick login" 
      };
    }
    
    return { 
      success: false, 
      message: "Face registration failed" 
    };
  } catch (error) {
    console.error("Face registration error:", error);
    return { 
      success: false, 
      message: "Face registration error occurred" 
    };
  }
}

// Update user phone number
export async function updateUserPhoneNumber(userId: number, phoneNumber: string) {
  try {
    await storage.updateUser(userId, { 
      phoneNumber,
      isNewUser: false // Clear new user flag
    });
    
    return { success: true };
  } catch (error) {
    console.error("Phone number update error:", error);
    return { success: false, message: "Failed to update phone number" };
  }
}

// Check if user is authenticated
export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Check if user needs to complete profile
export function checkProfileComplete(req: any, res: any, next: any) {
  if (req.user && req.user.isNewUser) {
    return res.status(200).json({ 
      needsProfileCompletion: true,
      user: req.user 
    });
  }
  next();
}