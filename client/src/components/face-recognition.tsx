import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, User, Shield, CheckCircle, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface FaceRecognitionProps {
  sessionId: string;
  onRecognitionComplete: (result: any) => void;
  onLanguageDetected: (language: string) => void;
}

interface RecognitionResult {
  recognized: boolean;
  userId?: number;
  confidence?: number;
  preferredLanguage?: string;
  profile?: any;
  faceId?: string;
  suggestedLanguage?: string;
  message: string;
}

export default function FaceRecognition({ 
  sessionId, 
  onRecognitionComplete, 
  onLanguageDetected 
}: FaceRecognitionProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState<RecognitionResult | null>(null);
  const [autoCapture, setAutoCapture] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Face recognition mutation
  const recognizeFaceMutation = useMutation({
    mutationFn: async (imageBase64: string) => {
      const response = await apiRequest("POST", "/api/face/recognize", {
        imageBase64,
        sessionId,
      });
      return response.json();
    },
    onSuccess: (result: RecognitionResult) => {
      setRecognitionResult(result);
      onRecognitionComplete(result);
      
      if (result.preferredLanguage) {
        onLanguageDetected(result.preferredLanguage);
      } else if (result.suggestedLanguage) {
        onLanguageDetected(result.suggestedLanguage);
      }
    },
    onError: (error) => {
      console.error("Face recognition failed:", error);
      setRecognitionResult({
        recognized: false,
        message: "Face recognition failed. Please try again."
      });
    },
  });

  // Register face mutation
  const registerFaceMutation = useMutation({
    mutationFn: async ({ imageBase64, userId, preferredLanguage }: { 
      imageBase64: string; 
      userId: number; 
      preferredLanguage: string; 
    }) => {
      const response = await apiRequest("POST", "/api/face/register", {
        imageBase64,
        userId,
        preferredLanguage,
      });
      return response.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        setRecognitionResult({
          recognized: true,
          message: "Face registered successfully! You can now use quick login."
        });
      }
    },
  });

  // Request camera permission and start video stream
  const requestCameraAccess = async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setPermissionGranted(true);
      setIsCapturing(true);

      // Auto-capture after 2 seconds if enabled
      if (autoCapture) {
        setTimeout(() => {
          captureAndRecognize();
        }, 2000);
      }

    } catch (error) {
      console.error("Camera access denied:", error);
      setRecognitionResult({
        recognized: false,
        message: "Camera access is required for face recognition. Please allow camera access and try again."
      });
    }
  };

  // Capture photo and perform face recognition
  const captureAndRecognize = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);

    // Send for recognition
    recognizeFaceMutation.mutate(imageBase64);

    // Stop camera after capture
    stopCamera();
  };

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  // Register face for returning patients
  const handleRegisterFace = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);
    
    // For demo purposes, use a mock user ID
    // In real implementation, this would come from user registration
    const mockUserId = Math.floor(Math.random() * 1000) + 1;
    const preferredLanguage = recognitionResult?.suggestedLanguage || "en";

    registerFaceMutation.mutate({
      imageBase64,
      userId: mockUserId,
      preferredLanguage,
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Face Recognition Login
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          Secure & Private
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!permissionGranted && !recognitionResult && (
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Allow camera access for instant recognition and faster login
            </p>
            <Button onClick={requestCameraAccess} className="w-full">
              <Camera className="h-4 w-4 mr-2" />
              Enable Face Recognition
            </Button>
          </div>
        )}

        {isCapturing && (
          <div className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full rounded-lg border"
                autoPlay
                muted
                playsInline
              />
              <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none">
                <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-primary"></div>
                <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-primary"></div>
                <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-primary"></div>
                <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-primary"></div>
              </div>
            </div>
            
            {!autoCapture && (
              <Button 
                onClick={captureAndRecognize} 
                className="w-full"
                disabled={recognizeFaceMutation.isPending}
              >
                {recognizeFaceMutation.isPending ? "Recognizing..." : "Capture & Recognize"}
              </Button>
            )}
            
            {autoCapture && (
              <div className="text-center">
                <div className="animate-pulse text-sm text-muted-foreground">
                  Look at the camera... Capturing in 2 seconds
                </div>
              </div>
            )}
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />

        {recognitionResult && (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg border ${
              recognitionResult.recognized 
                ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800" 
                : "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800"
            }`}>
              <div className="flex items-start gap-3">
                {recognitionResult.recognized ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <User className="h-5 w-5 text-yellow-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {recognitionResult.message}
                  </p>
                  
                  {recognitionResult.recognized && recognitionResult.confidence && (
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        Confidence: {Math.round(recognitionResult.confidence * 100)}%
                      </Badge>
                      {recognitionResult.preferredLanguage && (
                        <Badge variant="outline" className="text-xs">
                          Language: {recognitionResult.preferredLanguage.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                  )}

                  {!recognitionResult.recognized && recognitionResult.faceId && (
                    <div className="mt-3">
                      <Button 
                        size="sm" 
                        onClick={handleRegisterFace}
                        disabled={registerFaceMutation.isPending}
                      >
                        {registerFaceMutation.isPending ? "Registering..." : "Register for Quick Login"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={() => {
                setRecognitionResult(null);
                setPermissionGranted(false);
              }}
              className="w-full"
            >
              Try Again
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center">
          Your face data is processed securely and never stored as images. 
          Only encrypted recognition patterns are kept for faster login.
        </div>
      </CardContent>
    </Card>
  );
}