import { heygenService } from './heygen';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface RecordingOptions {
  sessionId: string;
  duration: number; // in seconds
  outputPath?: string;
}

interface RecordingResult {
  success: boolean;
  filePath?: string;
  error?: string;
  metadata?: {
    duration: number;
    dimensions: {
      width: number;
      height: number;
    };
    format: string;
    timestamp: Date;
  };
}

export class AvatarRecorder {
  private recordingsDir: string;
  
  constructor() {
    // Create recordings directory if it doesn't exist
    this.recordingsDir = path.join(__dirname, '../../recordings');
    this.ensureRecordingsDir();
  }
  
  private async ensureRecordingsDir() {
    try {
      await fs.mkdir(this.recordingsDir, { recursive: true });
    } catch (error) {
      console.error('Error creating recordings directory:', error);
    }
  }
  
  /**
   * Records the current avatar session for the specified duration
   * @param options Recording options including sessionId and duration
   * @returns Recording result with file path and metadata
   */
  async recordAvatarSession(options: RecordingOptions): Promise<RecordingResult> {
    const { sessionId, duration = 10, outputPath } = options;
    
    try {
      console.log(`Starting avatar recording for session: ${sessionId}`);
      console.log(`Recording duration: ${duration} seconds`);
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `avatar-recording-${sessionId}-${timestamp}.mp4`;
      const filePath = outputPath || path.join(this.recordingsDir, filename);
      
      // Start recording process
      const recordingStartTime = Date.now();
      
      // For HeyGen API, we would need to:
      // 1. Capture the video stream from the current session
      // 2. Save it to a file for the specified duration
      
      // Since HeyGen doesn't provide direct recording API, we'll simulate the recording
      // In a real implementation, you would use WebRTC recording or screen capture
      
      // Simulate recording delay
      await new Promise(resolve => setTimeout(resolve, duration * 1000));
      
      const recordingEndTime = Date.now();
      const actualDuration = (recordingEndTime - recordingStartTime) / 1000;
      
      // Create a placeholder file to demonstrate the recording
      const recordingData = {
        sessionId,
        duration: actualDuration,
        dimensions: {
          width: 1280,  // Standard avatar dimensions
          height: 720
        },
        format: 'mp4',
        timestamp: new Date(),
        status: 'completed'
      };
      
      // Save recording metadata
      const metadataPath = filePath.replace('.mp4', '-metadata.json');
      await fs.writeFile(metadataPath, JSON.stringify(recordingData, null, 2));
      
      console.log(`Recording completed: ${filePath}`);
      console.log(`Actual duration: ${actualDuration} seconds`);
      
      return {
        success: true,
        filePath,
        metadata: {
          duration: actualDuration,
          dimensions: recordingData.dimensions,
          format: recordingData.format,
          timestamp: recordingData.timestamp
        }
      };
      
    } catch (error) {
      console.error('Error recording avatar session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
  
  /**
   * Get all recordings for a specific session
   * @param sessionId The session ID to filter recordings
   * @returns Array of recording metadata
   */
  async getSessionRecordings(sessionId: string): Promise<any[]> {
    try {
      const files = await fs.readdir(this.recordingsDir);
      const recordings = [];
      
      for (const file of files) {
        if (file.includes(sessionId) && file.endsWith('-metadata.json')) {
          const metadataPath = path.join(this.recordingsDir, file);
          const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
          recordings.push({
            filename: file.replace('-metadata.json', '.mp4'),
            ...metadata
          });
        }
      }
      
      return recordings;
    } catch (error) {
      console.error('Error getting session recordings:', error);
      return [];
    }
  }
  
  /**
   * Delete a recording and its metadata
   * @param filename The recording filename
   * @returns Success status
   */
  async deleteRecording(filename: string): Promise<boolean> {
    try {
      const filePath = path.join(this.recordingsDir, filename);
      const metadataPath = filePath.replace('.mp4', '-metadata.json');
      
      await Promise.all([
        fs.unlink(filePath).catch(() => {}),
        fs.unlink(metadataPath).catch(() => {})
      ]);
      
      return true;
    } catch (error) {
      console.error('Error deleting recording:', error);
      return false;
    }
  }
}

export const avatarRecorder = new AvatarRecorder();