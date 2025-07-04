interface FaceRecognitionResult {
  faceId: string;
  confidence: number;
  userId?: number;
  detectedLanguage?: string;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface PatientProfile {
  userId: number;
  faceId: string;
  preferredLanguage: string;
  lastSeen: Date;
  chatHistory: any[];
  medicalHistory: any[];
  appointments: any[];
}

interface FaceData {
  imageBase64: string;
  timestamp: Date;
  sessionId: string;
}

export class FaceRecognitionAgent {
  private faceApiKey: string;
  private faceApiEndpoint: string;
  private languageDetectionApiKey: string;

  constructor() {
    // Using Azure Face API or AWS Rekognition
    this.faceApiKey = process.env.AZURE_FACE_API_KEY || process.env.AWS_REKOGNITION_ACCESS_KEY || "";
    this.faceApiEndpoint = process.env.AZURE_FACE_ENDPOINT || "https://your-region.api.cognitive.microsoft.com/face/v1.0";
    this.languageDetectionApiKey = process.env.AZURE_TEXT_ANALYTICS_KEY || "";
  }

  async captureAndAnalyzeFace(imageBase64: string, sessionId: string): Promise<FaceRecognitionResult | null> {
    try {
      if (!this.faceApiKey) {
        console.log("Face API not configured, returning mock data");
        return this.getMockFaceResult();
      }

      // Convert base64 to binary data
      const imageBuffer = Buffer.from(imageBase64.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');

      // Step 1: Detect face in image
      const detectResponse = await fetch(`${this.faceApiEndpoint}/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Ocp-Apim-Subscription-Key': this.faceApiKey,
        },
        body: imageBuffer,
      });

      if (!detectResponse.ok) {
        throw new Error(`Face detection failed: ${detectResponse.status}`);
      }

      const faceData = await detectResponse.json();
      
      if (!faceData || faceData.length === 0) {
        return null; // No face detected
      }

      const face = faceData[0];
      const faceId = face.faceId;

      // Step 2: Try to identify the face against stored faces
      const identifyResult = await this.identifyFace(faceId);

      // Step 3: Store face data for future recognition
      await this.storeFaceData({
        imageBase64,
        timestamp: new Date(),
        sessionId,
      }, faceId);

      return {
        faceId,
        confidence: identifyResult.confidence,
        userId: identifyResult.userId,
        detectedLanguage: identifyResult.detectedLanguage,
        bbox: {
          x: face.faceRectangle.left,
          y: face.faceRectangle.top,
          width: face.faceRectangle.width,
          height: face.faceRectangle.height,
        },
      };

    } catch (error) {
      console.error("Face recognition error:", error);
      return this.getMockFaceResult();
    }
  }

  async identifyFace(faceId: string): Promise<{ userId?: number; confidence: number; detectedLanguage?: string }> {
    try {
      if (!this.faceApiKey) {
        return { confidence: 0.85, userId: 1, detectedLanguage: "en" };
      }

      // Use Azure Face API or AWS Rekognition to identify against person group
      const personGroupId = "hospital_patients";
      
      const identifyResponse = await fetch(`${this.faceApiEndpoint}/identify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': this.faceApiKey,
        },
        body: JSON.stringify({
          faceIds: [faceId],
          personGroupId: personGroupId,
          maxNumOfCandidatesReturned: 1,
          confidenceThreshold: 0.7,
        }),
      });

      if (!identifyResponse.ok) {
        return { confidence: 0 };
      }

      const identifyData = await identifyResponse.json();
      
      if (identifyData.length > 0 && identifyData[0].candidates.length > 0) {
        const candidate = identifyData[0].candidates[0];
        const userId = await this.getUserIdFromPersonId(candidate.personId);
        
        return {
          userId,
          confidence: candidate.confidence,
          detectedLanguage: await this.getStoredLanguagePreference(userId),
        };
      }

      return { confidence: 0 };

    } catch (error) {
      console.error("Face identification error:", error);
      return { confidence: 0 };
    }
  }

  async registerNewPatientFace(imageBase64: string, userId: number, preferredLanguage: string): Promise<boolean> {
    try {
      if (!this.faceApiKey) {
        console.log("Mock registering face for user:", userId);
        return true;
      }

      const imageBuffer = Buffer.from(imageBase64.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
      const personGroupId = "hospital_patients";

      // Create person in person group
      const createPersonResponse = await fetch(`${this.faceApiEndpoint}/persongroups/${personGroupId}/persons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': this.faceApiKey,
        },
        body: JSON.stringify({
          name: `patient_${userId}`,
          userData: JSON.stringify({ userId, preferredLanguage }),
        }),
      });

      if (!createPersonResponse.ok) {
        throw new Error(`Failed to create person: ${createPersonResponse.status}`);
      }

      const personData = await createPersonResponse.json();
      const personId = personData.personId;

      // Add face to person
      const addFaceResponse = await fetch(
        `${this.faceApiEndpoint}/persongroups/${personGroupId}/persons/${personId}/persistedFaces`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'Ocp-Apim-Subscription-Key': this.faceApiKey,
          },
          body: imageBuffer,
        }
      );

      if (!addFaceResponse.ok) {
        throw new Error(`Failed to add face: ${addFaceResponse.status}`);
      }

      // Train the person group
      await this.trainPersonGroup(personGroupId);

      return true;

    } catch (error) {
      console.error("Error registering patient face:", error);
      return false;
    }
  }

  async detectLanguageFromAudio(audioBase64: string): Promise<string> {
    try {
      if (!this.languageDetectionApiKey) {
        return "en"; // Default fallback
      }

      // Convert audio to text first, then detect language
      const transcript = await this.speechToText(audioBase64);
      
      if (!transcript) {
        return "en";
      }

      // Use Azure Text Analytics for language detection
      const response = await fetch('https://your-region.cognitiveservices.azure.com/text/analytics/v3.1/languages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': this.languageDetectionApiKey,
        },
        body: JSON.stringify({
          documents: [
            {
              id: "1",
              text: transcript,
            },
          ],
        }),
      });

      if (!response.ok) {
        return "en";
      }

      const data = await response.json();
      const detectedLanguage = data.documents[0]?.detectedLanguage?.iso6391Name || "en";
      
      return detectedLanguage;

    } catch (error) {
      console.error("Language detection error:", error);
      return "en";
    }
  }

  async getPatientProfile(userId: number): Promise<PatientProfile | null> {
    try {
      // This would typically query your database
      // For now, return mock data structure
      return {
        userId,
        faceId: `face_${userId}`,
        preferredLanguage: "en",
        lastSeen: new Date(),
        chatHistory: [],
        medicalHistory: [],
        appointments: [],
      };

    } catch (error) {
      console.error("Error getting patient profile:", error);
      return null;
    }
  }

  private async speechToText(audioBase64: string): Promise<string> {
    try {
      // Use Azure Speech Service or Google Speech-to-Text
      // This is a simplified implementation
      return "Hello, I need to book an appointment"; // Mock response
    } catch (error) {
      console.error("Speech to text error:", error);
      return "";
    }
  }

  private async trainPersonGroup(personGroupId: string): Promise<void> {
    try {
      await fetch(`${this.faceApiEndpoint}/persongroups/${personGroupId}/train`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.faceApiKey,
        },
      });
    } catch (error) {
      console.error("Training error:", error);
    }
  }

  private async getUserIdFromPersonId(personId: string): Promise<number> {
    // Map person ID to user ID from your database
    // This is a simplified implementation
    return 1;
  }

  private async getStoredLanguagePreference(userId?: number): Promise<string> {
    // Get language preference from database
    return "en";
  }

  private async storeFaceData(faceData: FaceData, faceId: string): Promise<void> {
    // Store face data securely in your database
    // Include privacy compliance measures
    console.log("Storing face data for session:", faceData.sessionId);
  }

  private getMockFaceResult(): FaceRecognitionResult {
    return {
      faceId: `mock_face_${Date.now()}`,
      confidence: 0.85,
      userId: 1,
      detectedLanguage: "en",
      bbox: {
        x: 100,
        y: 100,
        width: 200,
        height: 200,
      },
    };
  }
}

export const faceRecognitionAgent = new FaceRecognitionAgent();