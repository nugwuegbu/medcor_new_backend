import React, { useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { X, User as Face } from "lucide-react";

// Perfect Corp YCE SDK types
declare global {
  interface Window {
    YCE: {
      init: (options: any) => void;
      isInitialized: () => boolean;
      captureImage: () => Promise<any>;
      destroy: () => void;
    };
  }
}

interface FaceAnalysisResult {
  age?: number;
  gender?: string;
  emotion?: string;
  beauty_score?: number;
  face_shape?: string;
  skin_tone?: string;
  confidence?: number;
  features?: {
    eyes?: string;
    nose?: string;
    lips?: string;
    eyebrows?: string;
  };
}

interface FaceAnalysisWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export default function FaceAnalysisWidget({ isOpen, onClose, className = "" }: FaceAnalysisWidgetProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FaceAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleStartAnalysis = useCallback(async () => {
    try {
      console.log('Starting Perfect Corp YCE SDK face analysis...');
      setLoading(true);
      setError(null);
      setResult(null);
      
      // Initialize YCE SDK if available
      if (window.YCE && !window.YCE.isInitialized()) {
        console.log('Initializing YCE SDK...');
        
        const options = {
          apiKey: import.meta.env.VITE_YCE_API_KEY || import.meta.env.REACT_APP_YCE_API_KEY,
          accountId: import.meta.env.VITE_YCE_ACCOUNT_ID || import.meta.env.REACT_APP_YCE_ACCOUNT_ID,
          email: import.meta.env.VITE_YCE_EMAIL || import.meta.env.REACT_APP_YCE_EMAIL,
          mode: 'ui',
          container: containerRef.current,
          onReady: () => {
            console.log('YCE SDK ready');
            setCameraActive(true);
          },
          onImageCaptured: (imageData: any) => {
            console.log('YCE SDK image captured:', imageData);
            setResult(imageData);
          },
          ui: {
            theme: 'light',
            showInstructions: true,
          },
          capture: {
            faceQuality: true,
            resolution: { width: 640, height: 480 }
          }
        };
        
        window.YCE.init(options);
        console.log('YCE SDK initialized');
      } else if (window.YCE && window.YCE.isInitialized()) {
        console.log('YCE SDK already initialized');
        setCameraActive(true);
      } else {
        console.log('YCE SDK not available, using fallback camera');
        
        // Fallback to regular camera
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 640, 
            height: 480,
            facingMode: 'user'
          } 
        });
        
        if (cameraRef.current) {
          cameraRef.current.srcObject = stream;
          setCameraActive(true);
        }
      }
    } catch (error) {
      console.error('Face analysis initialization error:', error);
      setError("Camera access denied or not available");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTakePhoto = useCallback(async () => {
    if (!cameraRef.current || !cameraActive) {
      console.log('Photo capture skipped - camera not active');
      return;
    }
    
    try {
      console.log('Starting face photo capture...');
      setLoading(true);
      setError(null);
      
      // Use YCE SDK if available
      if (window.YCE && window.YCE.isInitialized()) {
        console.log('Using YCE SDK for face analysis');
        
        const result = await window.YCE.captureImage();
        console.log('YCE SDK analysis result:', result);
        
        if (result && result.success) {
          setResult(result.data);
        } else {
          throw new Error('YCE SDK analysis failed');
        }
      } else {
        console.log('YCE SDK not available, using canvas capture');
        
        // Fallback to canvas capture
        const canvas = document.createElement('canvas');
        const video = cameraRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error("Could not get canvas context");
        }
        
        ctx.drawImage(video, 0, 0);
        const imageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        
        console.log('Image captured, base64 length:', imageBase64.length);
        
        // Send to backend for analysis
        const response = await fetch('/api/face-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageBase64 })
        });
        
        const data = await response.json();
        console.log('Face analysis API response:', data);
        
        if (data.success) {
          setResult(data.result);
        } else {
          setError(data.error || 'Analysis failed');
        }
      }
    } catch (error) {
      console.error('Face analysis error:', error);
      setError(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }, [cameraActive]);

  const handleClose = useCallback(() => {
    // Clean up camera stream
    if (cameraRef.current && cameraRef.current.srcObject) {
      const stream = cameraRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    
    // Clean up YCE SDK
    if (window.YCE && window.YCE.destroy) {
      window.YCE.destroy();
    }
    
    setCameraActive(false);
    setResult(null);
    setError(null);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Face className="h-5 w-5" />
            Face Analysis
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Camera Preview */}
        <div className="mb-4">
          <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden border-2 border-purple-200">
            {/* YCE SDK Container */}
            <div ref={containerRef} className="absolute inset-0" />
            
            {/* Fallback Video */}
            <video
              ref={cameraRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />
            
            {!cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-gray-500 text-center">
                  <div className="w-16 h-16 mx-auto mb-3 bg-purple-100 rounded-full flex items-center justify-center">
                    <Face className="h-8 w-8 text-purple-600" />
                  </div>
                  <p className="text-sm">Click "Start Camera" to begin</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-col gap-3 mb-4">
          <Button
            onClick={handleStartAnalysis}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Initializing...' : 'Start Camera'}
          </Button>
          
          <Button
            onClick={handleTakePhoto}
            disabled={!cameraActive || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze Face'}
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Analysis Results */}
        {result && (
          <div className="p-4 bg-purple-50 rounded-lg">
            <h3 className="font-semibold text-purple-800 mb-3">Analysis Results:</h3>
            <div className="space-y-2 text-sm">
              {result.age && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Age:</span>
                  <span className="font-medium">{result.age} years</span>
                </div>
              )}
              {result.gender && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Gender:</span>
                  <span className="font-medium">{result.gender}</span>
                </div>
              )}
              {result.emotion && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Emotion:</span>
                  <span className="font-medium">{result.emotion}</span>
                </div>
              )}
              {result.beauty_score && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Beauty Score:</span>
                  <span className="font-medium">{result.beauty_score}/100</span>
                </div>
              )}
              {result.face_shape && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Face Shape:</span>
                  <span className="font-medium">{result.face_shape}</span>
                </div>
              )}
              {result.skin_tone && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Skin Tone:</span>
                  <span className="font-medium">{result.skin_tone}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}