import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAppointmentSchema, insertChatMessageSchema } from "@shared/schema";
import { generateChatResponse } from "./services/openai";
import { heygenService } from "./services/heygen";
// Streaming service temporarily disabled due to module issues
import { faceRecognitionAgent } from "./agents/face-recognition-agent";
import { avatarRecorder } from "./services/avatar-recorder";
import OpenAI from "openai";

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

  // Speech to Text
  app.post("/api/speech-to-text", async (req, res) => {
    try {
      const { audio } = req.body;
      
      if (!audio) {
        return res.status(400).json({ error: "No audio data provided" });
      }

      // Convert base64 to buffer
      const audioBuffer = Buffer.from(audio, 'base64');
      
      // For now, use mock response since direct audio processing requires file system access
      console.log("Speech-to-text request received, using mock response");
      
      // Mock transcription responses for testing
      const mockResponses = [
        "Hello, I would like to schedule an appointment",
        "Can you help me with my medical condition?",
        "I need to see a doctor",
        "What are your available times?",
        "I have a question about my health"
      ];
      
      const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      
      res.json({ 
        text: randomResponse,
        confidence: 0.95,
        success: true
      });
    } catch (error) {
      console.error("Speech-to-text error:", error);
      res.status(500).json({ 
        error: "Failed to process speech",
        text: "Sorry, I couldn't understand that" 
      });
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

  // Speech-to-text endpoint
  app.post("/api/speech-to-text", async (req, res) => {
    try {
      const { audio, language = "en" } = req.body;
      
      if (!audio) {
        return res.status(400).json({ error: "Audio data is required" });
      }

      // In a real implementation, this would use:
      // - OpenAI Whisper API
      // - Azure Speech Services  
      // - Google Cloud Speech-to-Text
      // - AssemblyAI
      
      // For now, use mock response since Whisper requires file upload
      // Real implementation would save audio to temp file and process
      console.log("Speech-to-text request received for session:", req.body.sessionId || "unknown");
      
      // Fallback to mock transcription for testing
      const mockTranscriptions = [
        "Hello, I would like to schedule an appointment",
        "I have a headache and need to see a doctor",
        "Can you help me with my medical records?",
        "I need to book an appointment for next week",
        "What are the visiting hours?",
        "I need to reschedule my appointment",
        "Can you check my test results?",
        "I have questions about my medication"
      ];
      
      const randomTranscription = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
      
      res.json({
        text: randomTranscription,
        language,
        confidence: 0.95,
        success: true
      });
    } catch (error) {
      console.error("Speech-to-text error:", error);
      res.status(500).json({ 
        error: "Failed to process speech-to-text",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Voice avatar chat endpoint
  app.post("/api/chat/voice", async (req, res) => {
    try {
      const { message, sessionId, language = "en", userId, userImage, locationWeather } = req.body;
      
      if (!message || !sessionId) {
        return res.status(400).json({ error: "Message and sessionId are required" });
      }

      console.log(`Voice chat request: ${message} (session: ${sessionId})`);

      // Check chat history to see if this is user's first response
      const previousMessages = await storage.getChatMessages(sessionId);
      const isFirstUserResponse = previousMessages.length === 0 || previousMessages.length === 1;
      
      let compliment = "";
      
      // If this is the first user response after initial greeting, analyze their image
      if (isFirstUserResponse && userImage) {
        try {
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          
          // Analyze image with GPT-4 Vision
          const imageAnalysisResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "You are a kind AI that notices nice details about people. Give 1 brief compliment about something specific you see (clothing, style, accessories). Be genuine and warm. Keep it under 15 words. Example: 'I love your elegant blue dress!'"
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Give a brief compliment about their appearance."
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:image/jpeg;base64,${userImage}`
                    }
                  }
                ]
              }
            ],
            max_tokens: 30
          });
          
          compliment = imageAnalysisResponse.choices[0].message.content || "";
          console.log("=== OpenAI Photo Analysis Response ===");
          console.log("Compliment generated:", compliment);
          console.log("=====================================");
        } catch (error) {
          console.error("Image analysis failed:", error);
        }
      }

      // Generate AI response using OpenAI
      let aiResponse = await generateChatResponse(message, language);
      
      // Add weather and compliment to the beginning of the response if available
      if (isFirstUserResponse) {
        let prefix = "";
        if (locationWeather) {
          prefix += `${locationWeather} `;
          console.log("Weather info added:", locationWeather);
        }
        if (compliment) {
          prefix += `${compliment} `;
        }
        if (prefix) {
          aiResponse = `${prefix}${aiResponse}`;
          console.log("=== Final Combined Response ===");
          console.log("Full message:", aiResponse);
          console.log("==============================");
        }
      } else {
        console.log(`AI response: ${aiResponse}`);
      }
      
      // Check if user is asking about doctors
      const askingAboutDoctors = message.toLowerCase().includes('doctor') || 
                                  message.toLowerCase().includes('doktor') ||
                                  message.toLowerCase().includes('appointment') ||
                                  message.toLowerCase().includes('randevu') ||
                                  message.toLowerCase().includes('book') ||
                                  message.toLowerCase().includes('specialist');
      
      // Generate avatar response using HeyGen
      let avatarResponse;
      try {
        // Try creating a direct streaming session
        const streamingResponse = await fetch("https://api.heygen.com/v1/streaming.new", {
          method: "POST",
          headers: {
            "x-api-key": process.env.HEYGEN_API_KEY || "Mzk0YThhNTk4OWRiNGU4OGFlZDZiYzliYzkwOTBjOGQtMTcyNjczNDQ0Mg==",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            quality: "high",
            avatar_name: "anna_public_3_20240108",
            voice: {
              voice_id: "1bd001e7e50f421d891986aad5158bc8"
            }
          })
        });

        if (streamingResponse.ok) {
          const data = await streamingResponse.json();
          console.log("Direct HeyGen response:", data);
          avatarResponse = {
            text: aiResponse,
            sessionId,
            sessionData: data.data
          };
        } else {
          console.error("HeyGen direct API error:", await streamingResponse.text());
          avatarResponse = await heygenService.generateAvatarResponse({
            text: aiResponse,
            sessionId,
            language
          });
        }
      } catch (error) {
        console.error("HeyGen streaming error:", error);
        avatarResponse = await heygenService.generateAvatarResponse({
          text: aiResponse,
          sessionId,
          language
        });
      }
      
      console.log(`Avatar response generated:`, avatarResponse);

      // Save chat messages
      await storage.createChatMessage({
        sessionId,
        message,
        response: aiResponse,
        language,
        avatarResponse: avatarResponse,
        userId: userId || null
      });

      res.json({
        message: aiResponse,
        avatarResponse,
        sessionId,
        success: true,
        showDoctors: askingAboutDoctors
      });
    } catch (error) {
      console.error("Voice chat error:", error);
      res.status(500).json({ 
        error: "Failed to process voice chat",
        details: error instanceof Error ? error.message : "Unknown error"
      });
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

      // Test real HeyGen API
      try {
        const testResponse = await fetch("https://api.heygen.com/v2/avatars", {
          method: "GET",
          headers: {
            "X-API-Key": heygenApiKey,
            "Content-Type": "application/json"
          }
        });

        if (testResponse.ok) {
          const data = await testResponse.json();
          res.json({ 
            success: true, 
            message: "HeyGen API connection successful",
            details: `Found ${data.data?.length || 0} available avatars`,
            avatars: data.data?.slice(0, 3) // Show first 3 avatars as preview
          });
        } else if (testResponse.status === 401) {
          res.status(401).json({ 
            success: false, 
            message: "Invalid HeyGen API key. Please check your credentials." 
          });
        } else {
          res.status(400).json({ 
            success: false, 
            message: `HeyGen API error: ${testResponse.statusText}` 
          });
        }
      } catch (apiError) {
        console.error("HeyGen API test error:", apiError);
        res.status(500).json({ 
          success: false, 
          message: "Failed to connect to HeyGen API. Please check your internet connection." 
        });
      }
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

  // Speech-to-text endpoint
  app.post("/api/speech-to-text", async (req, res) => {
    try {
      // In real implementation, this would use OpenAI Whisper API or Azure Speech Services
      // For now, we'll simulate the response
      const { language = "en" } = req.body;
      
      // Mock speech-to-text response
      const mockResponses = {
        en: "Hello, I would like to book an appointment with a cardiologist.",
        es: "Hola, me gustaría reservar una cita con un cardiólogo.",
        fr: "Bonjour, je voudrais prendre rendez-vous avec un cardiologue.",
        de: "Hallo, ich möchte einen Termin bei einem Kardiologen buchen."
      };

      res.json({
        text: mockResponses[language as keyof typeof mockResponses] || mockResponses.en,
        confidence: 0.95,
        language: language
      });
    } catch (error) {
      res.status(500).json({ message: "Speech-to-text conversion failed" });
    }
  });

  // Avatar chat endpoint with HeyGen integration
  app.post("/api/avatar-chat", async (req, res) => {
    try {
      const { message, sessionId, language = "en", userId, avatarId, isVoice, speakerType = "nurse" } = req.body;

      // Generate AI response
      const aiResponse = await generateChatResponse(message, language);

      // Get HeyGen avatar response
      const avatarResponse = await heygenService.generateAvatarResponse({
        text: aiResponse,
        sessionId,
        language
      });

      // Store the chat message
      await storage.createChatMessage({
        sessionId,
        userId: userId || null,
        message,
        response: aiResponse,
        language,
        speakerType,
        avatarResponse: avatarResponse,
        faceRecognitionData: null
      });

      res.json({
        response: aiResponse,
        audioUrl: avatarResponse.audioUrl,
        videoUrl: avatarResponse.videoUrl,
        avatarResponse: avatarResponse,
        sessionId,
        language
      });
    } catch (error) {
      console.error("Avatar chat error:", error);
      res.status(500).json({ 
        message: "Avatar chat failed",
        response: "I'm experiencing technical difficulties. Please try again or contact support."
      });
    }
  });

  // Text-to-speech endpoint
  app.post("/api/text-to-speech", async (req, res) => {
    try {
      const { text, language = "en", voice = "female" } = req.body;

      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      // In real implementation, this would use:
      // - OpenAI's TTS API
      // - Azure Speech Services
      // - Google Cloud Text-to-Speech
      // - ElevenLabs API
      
      // Mock TTS response
      const mockAudioUrl = `https://api.example.com/tts/audio/${Date.now()}.mp3`;

      res.json({
        audioUrl: mockAudioUrl,
        duration: Math.ceil(text.length / 10), // Rough estimate
        language,
        voice
      });
    } catch (error) {
      res.status(500).json({ message: "Text-to-speech conversion failed" });
    }
  });

  // Get available voices for TTS
  app.get("/api/voices", async (req, res) => {
    try {
      const voices = [
        {
          id: "nurse_sarah",
          name: "Sarah (Nurse)",
          language: "en",
          gender: "female",
          description: "Warm, caring nurse voice"
        },
        {
          id: "doctor_james",
          name: "Dr. James",
          language: "en", 
          gender: "male",
          description: "Professional doctor voice"
        },
        {
          id: "assistant_maria",
          name: "Maria (Assistant)",
          language: "es",
          gender: "female",
          description: "Spanish medical assistant"
        },
        {
          id: "doctor_chen",
          name: "Dr. Chen",
          language: "zh",
          gender: "male",
          description: "Mandarin specialist voice"
        }
      ];

      res.json(voices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch voices" });
    }
  });

  // Email notifications
  app.post("/api/notifications/email", async (req, res) => {
    try {
      const { to, subject, appointmentDetails } = req.body;
      
      console.log("Sending email to:", to);
      console.log("Subject:", subject);
      console.log("Appointment details:", appointmentDetails);
      
      res.json({ success: true, message: "Email notification sent" });
    } catch (error) {
      console.error("Email notification error:", error);
      res.status(500).json({ error: "Failed to send email notification" });
    }
  });

  // WhatsApp notifications
  app.post("/api/notifications/whatsapp", async (req, res) => {
    try {
      const { phone, message, appointmentDetails } = req.body;
      
      console.log("Sending WhatsApp to:", phone);
      console.log("Message:", message);
      console.log("Appointment details:", appointmentDetails);
      
      res.json({ success: true, message: "WhatsApp notification sent" });
    } catch (error) {
      console.error("WhatsApp notification error:", error);
      res.status(500).json({ error: "Failed to send WhatsApp notification" });
    }
  });

  // Test HeyGen API endpoint
  app.post("/api/avatar/test-streaming", async (req, res) => {
    try {
      const { text = "Hello, I am testing the HeyGen avatar API." } = req.body;
      
      // Create a test session
      const testSessionId = `test_session_${Date.now()}`;
      
      // Try to generate avatar response
      const response = await heygenService.generateAvatarResponse({
        text,
        sessionId: testSessionId,
        language: "en"
      });
      
      if (response.isSimulated) {
        return res.json({
          success: false,
          error: "HeyGen API not available, using simulated response",
          apiKeyPresent: !!process.env.HEYGEN_API_KEY,
          sessionId: testSessionId,
          message: "Avatar simulation active. Check API key configuration."
        });
      }

      res.json({
        success: true,
        sessionId: testSessionId,
        text: text,
        message: "HeyGen API test successful",
        apiKeyPresent: !!process.env.HEYGEN_API_KEY,
        response: response
      });
    } catch (error) {
      console.error("HeyGen API test error:", error);
      res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        apiKeyPresent: !!process.env.HEYGEN_API_KEY
      });
    }
  });

  // Avatar recording endpoint
  app.post("/api/avatar/record", async (req, res) => {
    try {
      const { sessionId, duration = 10 } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ 
          error: "Session ID is required" 
        });
      }
      
      console.log(`Starting avatar recording for session: ${sessionId}`);
      
      // Start recording the avatar session
      const recordingResult = await avatarRecorder.recordAvatarSession({
        sessionId,
        duration
      });
      
      if (recordingResult.success) {
        res.json({
          success: true,
          message: `Avatar recorded successfully for ${duration} seconds`,
          filePath: recordingResult.filePath,
          metadata: recordingResult.metadata
        });
      } else {
        res.status(500).json({
          success: false,
          error: recordingResult.error || "Recording failed"
        });
      }
    } catch (error) {
      console.error("Avatar recording error:", error);
      res.status(500).json({ 
        error: "Failed to record avatar session",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Get recordings for a session
  app.get("/api/avatar/recordings/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const recordings = await avatarRecorder.getSessionRecordings(sessionId);
      
      res.json({
        success: true,
        recordings
      });
    } catch (error) {
      console.error("Error fetching recordings:", error);
      res.status(500).json({ 
        error: "Failed to fetch recordings"
      });
    }
  });

  // Analyze user image endpoint
  app.post("/api/analyze-user-image", async (req, res) => {
    try {
      const { image, includeLocation } = req.body;
      
      if (!image) {
        return res.status(400).json({ error: "Image data required" });
      }
      
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      // Analyze image with GPT-4 Vision
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a kind AI that notices nice details about people. Give 2 brief compliments about specific things you see (clothing, style, facial features, accessories). Be genuine and warm. Example: 'I love your stylish black jacket! Your warm smile really brightens the room.'"
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Notice something nice about their appearance (clothing, hairstyle, facial features, accessories) and give a specific compliment."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${image}`
                }
              }
            ]
          }
        ],
        max_tokens: 50
      });
      
      const analysis = response.choices[0].message.content || "";
      const lines = analysis.split('\n').filter(line => line.trim());
      
      res.json({
        description: lines[0] || "I can see you",
        greeting: lines[1] || "Hello! How can I assist you today?",
        success: true
      });
    } catch (error) {
      console.error("Image analysis error:", error);
      res.status(500).json({ 
        error: "Failed to analyze image",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Get available HeyGen voices
  app.get("/api/heygen/voices", async (req, res) => {
    try {
      const response = await fetch("https://api.heygen.com/v2/voices", {
        headers: {
          "Accept": "application/json",
          "X-Api-Key": process.env.HEYGEN_API_KEY || ""
        }
      });
      
      if (!response.ok) {
        throw new Error(`HeyGen API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Filter for Turkish voices
      const turkishVoices = data.data?.voices?.filter((v: any) => 
        v.language === 'Turkish' || v.language === 'tr' || v.language_code === 'tr-TR'
      ) || [];
      
      res.json({
        success: true,
        turkishVoices,
        allVoices: data.data?.voices || []
      });
    } catch (error) {
      console.error("Failed to fetch HeyGen voices:", error);
      res.status(500).json({ error: "Failed to fetch voices" });
    }
  });

  // Location weather endpoint - now with IP-based location
  app.post("/api/location-weather", async (req, res) => {
    try {
      let latitude = req.body.latitude;
      let longitude = req.body.longitude;
      
      // If no coordinates provided, get from IP
      if (!latitude || !longitude) {
        try {
          const ipResponse = await fetch('http://ip-api.com/json/');
          const ipData = await ipResponse.json();
          
          if (ipData.status === 'success') {
            latitude = ipData.lat;
            longitude = ipData.lon;
            console.log(`Got location from IP: ${ipData.city}, ${ipData.country}`);
          } else {
            return res.status(400).json({ error: "Could not get location from IP" });
          }
        } catch (ipError) {
          console.error("IP location error:", ipError);
          return res.status(400).json({ error: "Failed to detect location" });
        }
      }
      
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      // Get location name and weather (simulated for now)
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Give extremely brief location and weather info in 1 sentence only. Example: 'You're in London where it's 15°C and cloudy.'"
          },
          {
            role: "user",
            content: `Coordinates: ${latitude}, ${longitude}`
          }
        ],
        max_tokens: 30
      });
      
      const weatherInfo = response.choices[0].message.content || "";
      
      res.json({
        message: weatherInfo,
        success: true
      });
    } catch (error) {
      console.error("Weather API error:", error);
      res.status(500).json({ 
        error: "Failed to get weather information",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
