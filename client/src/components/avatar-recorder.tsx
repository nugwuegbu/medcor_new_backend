import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Circle, StopCircle } from "lucide-react";

interface AvatarRecorderProps {
  onRecordingComplete: (videoUrl: string) => void;
}

export default function AvatarRecorder({ onRecordingComplete }: AvatarRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      // Find the HeyGen video element
      const heygenVideo = document.querySelector('video[id*="heygen"], video.avatar-video') as HTMLVideoElement;
      
      if (!heygenVideo || !heygenVideo.srcObject) {
        console.error("HeyGen video element not found");
        return;
      }

      // Get the video stream
      const stream = heygenVideo.srcObject as MediaStream;
      
      // Create a new MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        onRecordingComplete(url);
        
        // Save to localStorage for persistence
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          localStorage.setItem('avatar-idle-video', base64data);
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Auto-stop after 10 seconds to create a loop
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopRecording();
        }
      }, 10000);

    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const downloadRecording = () => {
    if (recordedVideoUrl) {
      const a = document.createElement('a');
      a.href = recordedVideoUrl;
      a.download = 'avatar-idle.webm';
      a.click();
    }
  };

  // Check if we already have a saved recording
  useEffect(() => {
    const savedVideo = localStorage.getItem('avatar-idle-video');
    if (savedVideo) {
      // Convert base64 back to blob URL
      fetch(savedVideo)
        .then(res => res.blob())
        .then(blob => {
          const url = URL.createObjectURL(blob);
          setRecordedVideoUrl(url);
          onRecordingComplete(url);
        });
    }
  }, [onRecordingComplete]);

  return (
    <div className="absolute top-4 right-4 z-50 bg-white rounded-lg shadow-lg p-4">
      <h3 className="text-sm font-semibold mb-2">Avatar Recorder</h3>
      <div className="flex gap-2">
        {!isRecording && !recordedVideoUrl && (
          <Button size="sm" onClick={startRecording} variant="outline">
            <Circle className="w-4 h-4 mr-1 text-red-500" />
            Record
          </Button>
        )}
        
        {isRecording && (
          <Button size="sm" onClick={stopRecording} variant="destructive">
            <StopCircle className="w-4 h-4 mr-1" />
            Stop
          </Button>
        )}
        
        {recordedVideoUrl && (
          <>
            <Button size="sm" onClick={downloadRecording} variant="outline">
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
            <Button size="sm" onClick={startRecording} variant="outline">
              <Circle className="w-4 h-4 mr-1 text-red-500" />
              Re-record
            </Button>
          </>
        )}
      </div>
      
      {isRecording && (
        <p className="text-xs text-gray-500 mt-2">Recording... (10s max)</p>
      )}
      
      {recordedVideoUrl && (
        <p className="text-xs text-green-600 mt-2">✓ Recording saved</p>
      )}
    </div>
  );
}