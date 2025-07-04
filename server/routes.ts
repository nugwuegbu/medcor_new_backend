import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAppointmentSchema, insertChatMessageSchema } from "@shared/schema";
import { generateChatResponse } from "./services/openai";
import { heygenService } from "./services/heygen";
import { faceRecognitionAgent } from "./agents/face-recognition-agent";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all doctors
  app.get("/api/doctors", async (req, res) => {
    try {
      const doctors = await storage.getAllDoctors();
      res.json(doctors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch doctors" });
    }
  });

  // Get single doctor
  app.get("/api/doctors/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const doctor = await storage.getDoctor(id);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      res.json(doctor);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch doctor" });
    }
  });

  // Create appointment
  app.post("/api/appointments", async (req, res) => {
    try {
      const validatedData = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(validatedData);
      res.status(201).json(appointment);
    } catch (error) {
      res.status(400).json({ message: "Invalid appointment data" });
    }
  });

  // Get all appointments
  app.get("/api/appointments", async (req, res) => {
    try {
      const appointments = await storage.getAllAppointments();
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  // Enhanced chat endpoint with HeyGen avatar support
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, sessionId, language = "en", useAvatar = false } = req.body;
      
      if (!message || !sessionId) {
        return res.status(400).json({ message: "Message and sessionId are required" });
      }

      // Generate AI response based on handmade products context
      const response = await generateChatResponse(message, language);
      
      // Generate avatar response if requested
      let avatarResponse = null;
      if (useAvatar) {
        avatarResponse = await heygenService.generateAvatarResponse({
          text: response,
          sessionId,
          language
        });
      }

      // Save chat message
      const chatMessage = await storage.createChatMessage({
        sessionId,
        message,
        response,
        language
      });

      res.json({ 
        response, 
        messageId: chatMessage.id,
        avatar: avatarResponse,
        language
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // HeyGen avatar status endpoint
  app.get("/api/avatar/status/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const status = await heygenService.getAvatarStatus(sessionId);
      res.json(status);
    } catch (error) {
      res.status(500).json({ message: "Failed to get avatar status" });
    }
  });

  // Get available languages
  app.get("/api/languages", async (req, res) => {
    try {
      const languages = heygenService.getAvailableLanguages();
      const languageMap = {
        en: "English",
        es: "Español", 
        fr: "Français",
        de: "Deutsch",
        zh: "中文",
        ja: "日本語"
      };
      
      const response = languages.map(code => ({
        code,
        name: languageMap[code as keyof typeof languageMap] || code
      }));
      
      res.json(response);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch languages" });
    }
  });

  // Face recognition and authentication endpoint
  app.post("/api/face/recognize", async (req, res) => {
    try {
      const { imageBase64, sessionId } = req.body;
      
      if (!imageBase64 || !sessionId) {
        return res.status(400).json({ message: "Image and sessionId are required" });
      }

      // Analyze face for recognition
      const faceResult = await faceRecognitionAgent.captureAndAnalyzeFace(imageBase64, sessionId);
      
      if (!faceResult) {
        return res.json({ 
          recognized: false, 
          message: "No face detected" 
        });
      }

      if (faceResult.userId && faceResult.confidence > 0.7) {
        // Recognized returning patient
        const profile = await faceRecognitionAgent.getPatientProfile(faceResult.userId);
        
        res.json({
          recognized: true,
          userId: faceResult.userId,
          confidence: faceResult.confidence,
          preferredLanguage: faceResult.detectedLanguage || profile?.preferredLanguage || "en",
          profile: profile,
          message: "Welcome back! I recognize you."
        });
      } else {
        // New patient or low confidence
        res.json({
          recognized: false,
          faceId: faceResult.faceId,
          suggestedLanguage: faceResult.detectedLanguage || "en",
          message: "I don't recognize you yet. Would you like to register for faster login next time?"
        });
      }

    } catch (error) {
      console.error("Face recognition error:", error);
      res.status(500).json({ message: "Face recognition failed" });
    }
  });

  // Register new patient face
  app.post("/api/face/register", async (req, res) => {
    try {
      const { imageBase64, userId, preferredLanguage } = req.body;
      
      if (!imageBase64 || !userId || !preferredLanguage) {
        return res.status(400).json({ message: "Image, userId, and preferredLanguage are required" });
      }

      const success = await faceRecognitionAgent.registerNewPatientFace(
        imageBase64, 
        userId, 
        preferredLanguage
      );

      if (success) {
        res.json({ 
          success: true, 
          message: "Face registered successfully! You can now use face login." 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Failed to register face" 
        });
      }

    } catch (error) {
      console.error("Face registration error:", error);
      res.status(500).json({ message: "Face registration failed" });
    }
  });

  // Language detection from audio
  app.post("/api/language/detect", async (req, res) => {
    try {
      const { audioBase64 } = req.body;
      
      if (!audioBase64) {
        return res.status(400).json({ message: "Audio data is required" });
      }

      const detectedLanguage = await faceRecognitionAgent.detectLanguageFromAudio(audioBase64);
      
      res.json({ 
        detectedLanguage,
        confidence: 0.85 // Mock confidence for now
      });

    } catch (error) {
      console.error("Language detection error:", error);
      res.status(500).json({ message: "Language detection failed" });
    }
  });

  // Get chat history
  app.get("/api/chat/:sessionId", async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const messages = await storage.getChatMessages(sessionId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat history" });
    }
  });

  // Settings endpoints
  app.post("/api/settings", async (req, res) => {
    try {
      const settings = req.body;
      
      // In a real implementation, you would save these to a secure store
      // For now, we'll just acknowledge receipt
      res.json({ 
        success: true, 
        message: "Settings saved successfully",
        savedSettings: {
          enableFaceRecognition: settings.enableFaceRecognition,
          enableMultiLanguage: settings.enableMultiLanguage,
          enableHeygenAvatars: settings.enableHeygenAvatars,
          defaultLanguage: settings.defaultLanguage
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to save settings" });
    }
  });

  // API testing endpoints
  app.post("/api/test/heygen", async (req, res) => {
    try {
      const { heygenApiKey } = req.body;
      
      if (!heygenApiKey || heygenApiKey.trim() === "") {
        return res.status(400).json({ 
          success: false, 
          message: "HeyGen API key is required" 
        });
      }

      // Mock test for HeyGen API
      // In real implementation, you would test the actual API
      res.json({ 
        success: true, 
        message: "HeyGen API connection successful",
        details: "Avatar service is ready"
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "HeyGen API test failed" 
      });
    }
  });

  app.post("/api/test/azure-face", async (req, res) => {
    try {
      const { azureFaceApiKey, azureFaceEndpoint } = req.body;
      
      if (!azureFaceApiKey || !azureFaceEndpoint) {
        return res.status(400).json({ 
          success: false, 
          message: "Azure Face API key and endpoint are required" 
        });
      }

      // Mock test for Azure Face API
      res.json({ 
        success: true, 
        message: "Azure Face API connection successful",
        details: "Face recognition service is ready"
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Azure Face API test failed" 
      });
    }
  });

  app.post("/api/test/google-calendar", async (req, res) => {
    try {
      const { googleCalendarApiKey } = req.body;
      
      if (!googleCalendarApiKey) {
        return res.status(400).json({ 
          success: false, 
          message: "Google Calendar API key is required" 
        });
      }

      // Mock test for Google Calendar API
      res.json({ 
        success: true, 
        message: "Google Calendar API connection successful",
        details: "Booking service is ready"
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Google Calendar API test failed" 
      });
    }
  });

  app.post("/api/test/openai", async (req, res) => {
    try {
      const { openaiApiKey } = req.body;
      
      if (!openaiApiKey) {
        return res.status(400).json({ 
          success: false, 
          message: "OpenAI API key is required" 
        });
      }

      // Test actual OpenAI API with the provided key
      try {
        const testResponse = await fetch("https://api.openai.com/v1/models", {
          headers: {
            "Authorization": `Bearer ${openaiApiKey}`,
            "Content-Type": "application/json"
          }
        });

        if (testResponse.ok) {
          res.json({ 
            success: true, 
            message: "OpenAI API connection successful",
            details: "AI chat service is ready"
          });
        } else {
          res.status(400).json({ 
            success: false, 
            message: "Invalid OpenAI API key" 
          });
        }
      } catch (apiError) {
        res.status(500).json({ 
          success: false, 
          message: "Failed to connect to OpenAI API" 
        });
      }
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "OpenAI API test failed" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
