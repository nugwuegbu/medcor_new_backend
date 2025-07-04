import { AvatarManager } from './avatar-manager';
import { TaskType, TaskMode } from '@heygen/streaming-avatar';

interface AnalysisResult {
  description: string;
  greeting: string;
  location?: {
    city: string;
    country: string;
    weather?: string;
  };
}

export class InteractiveDialogueService {
  private static instance: InteractiveDialogueService;
  
  static getInstance(): InteractiveDialogueService {
    if (!this.instance) {
      this.instance = new InteractiveDialogueService();
    }
    return this.instance;
  }

  async captureAndAnalyzeUser(videoElement: HTMLVideoElement): Promise<AnalysisResult | null> {
    try {
      // Create canvas to capture frame
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return null;
      
      // Draw current frame
      ctx.drawImage(videoElement, 0, 0);
      
      // Convert to base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      const base64Image = imageData.split(',')[1];
      
      // Send to backend for analysis
      const response = await fetch('/api/analyze-user-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          includeLocation: true
        })
      });
      
      if (!response.ok) throw new Error('Failed to analyze image');
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error capturing/analyzing user:', error);
      return null;
    }
  }

  async getLocationPermission(): Promise<GeolocationPosition | null> {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => {
          console.error('Location error:', error);
          resolve(null);
        },
        { enableHighAccuracy: true }
      );
    });
  }

  async startInteractiveGreeting(videoElement: HTMLVideoElement): Promise<void> {
    try {
      console.log("Interactive greeting started, waiting for user to settle...");
      
      // Wait a moment for user to settle
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log("Capturing and analyzing user image...");
      // Capture and analyze
      const analysis = await this.captureAndAnalyzeUser(videoElement);
      
      if (!analysis) {
        console.error('Could not analyze user');
        return;
      }
      
      console.log("Analysis received:", analysis);
      
      // Get avatar instance
      const avatar = await AvatarManager.getOrCreateAvatar(
        "Mzk0YThhNTk4OWRiNGU4OGFlZDZiYzliYzkwOTBjOGQtMTcyNjczNDQ0Mg=="
      );
      
      console.log("Speaking greeting:", analysis.greeting);
      // First greeting based on appearance
      await avatar.speak({
        text: analysis.greeting,
        taskType: TaskType.REPEAT,
        taskMode: TaskMode.SYNC
      });
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log("Asking for location permission...");
      // Ask for location permission
      await avatar.speak({
        text: "May I know your location to provide you with local weather information?",
        taskType: TaskType.REPEAT,
        taskMode: TaskMode.SYNC
      });
      
      console.log("Getting location...");
      // Get location
      const position = await this.getLocationPermission();
      console.log("Location received:", position);
      
      if (position) {
        // Get weather info
        const weatherResponse = await fetch('/api/location-weather', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        });
        
        if (weatherResponse.ok) {
          const weatherData = await weatherResponse.json();
          
          // Speak clinic greeting, weather info, and personalized compliment
          const combinedMessage = `Hi! Welcome to Medcor Clinic. How can I help you? ${weatherData.message} By the way, ${analysis.description}`;
          
          await avatar.speak({
            text: combinedMessage,
            taskType: TaskType.REPEAT,
            taskMode: TaskMode.SYNC
          });
        }
      } else {
        // If no location, still give the compliment
        await avatar.speak({
          text: `No problem! ${analysis.description}`,
          taskType: TaskType.REPEAT,
          taskMode: TaskMode.SYNC
        });
      }
    } catch (error) {
      console.error('Interactive greeting error:', error);
    }
  }
}

export const interactiveDialogue = InteractiveDialogueService.getInstance();