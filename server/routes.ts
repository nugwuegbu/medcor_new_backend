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

  const httpServer = createServer(app);
  return httpServer;
}
