import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Camera, Loader2, User as Face, FileText, AlertCircle, RefreshCw, Shield } from "lucide-react";
import FaceAnalysisReportForm from "./face-analysis-report-form";
import { videoStreamRef, ensureCameraReady } from "../utils/camera-manager";

interface FaceAnalysisWidgetInlineProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FaceAnalysisWidgetInline({ isOpen, onClose }: FaceAnalysisWidgetInlineProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking');
  const [showReportForm, setShowReportForm] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check camera permission and start camera on component mount
  useEffect(() => {
    if (isOpen) {
      checkCameraPermission();
      // Automatically start camera after a short delay
      setTimeout(() => {
        startCamera();
      }, 500);
    } else {
      // Clean up when closing
      stopCamera();
    }
  }, [isOpen]);

  const checkCameraPermission = async () => {
    try {
      setCameraPermission('checking');
      
      // Check if browser supports permissions API
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setCameraPermission(permission.state as 'granted' | 'denied' | 'prompt');
        
        if (permission.state === 'granted') {
          startCamera();
        }
      } else {
        // Fallback: try to access camera directly
        setCameraPermission('prompt');
      }
    } catch (err) {
      console.error('Permission check failed:', err);
      setCameraPermission('prompt');
    }
  };

  const startCamera = async () => {
    try {
      setError(null);
      setCameraPermission('checking');
      console.log('Face Analysis: Starting camera...');
      
      // Use the shared camera stream from camera-manager
      const sharedStream = await ensureCameraReady();
      
      if (!sharedStream || sharedStream.getTracks().length === 0) {
        throw new Error('Failed to get camera stream');
      }
      
      console.log('Face Analysis: Using shared camera stream:', sharedStream.getVideoTracks().length, 'video tracks');
      
      streamRef.current = sharedStream;
      setCameraActive(true);
      setCameraPermission('granted');
      setRetryCount(0);
      
      if (videoRef.current) {
        // Clone the stream to avoid conflicts
        const clonedStream = sharedStream.clone();
        videoRef.current.srcObject = clonedStream;
        
        // Set up event handlers before play
        videoRef.current.onloadedmetadata = () => {
          console.log('Face Analysis: Video metadata loaded');
          videoRef.current?.play().then(() => {
            console.log('Face Analysis: Video playing successfully');
          }).catch(err => {
            console.error('Face Analysis: Error playing video:', err);
          });
        };
        
        videoRef.current.oncanplay = () => {
          console.log('Face Analysis: Video can play');
        };
        
        videoRef.current.onerror = (e) => {
          console.error('Face Analysis: Video error:', e);
        };
        
        // Try to play immediately if already loaded
        if (videoRef.current.readyState >= 2) {
          videoRef.current.play().catch(console.error);
        }
      }
    } catch (err: any) {
      console.error('Face Analysis Camera error:', err);
      setCameraActive(false);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraPermission('denied');
        setError('Camera access denied. Please allow camera permissions and try again.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found. Please ensure your device has a camera connected.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Camera is already in use by another application. Please close other apps using your camera.');
      } else if (err.name === 'OverconstrainedError') {
        setError('Camera constraints not supported. Trying with basic settings...');
        // Retry with basic constraints
        if (retryCount < 2) {
          setRetryCount(prev => prev + 1);
          setTimeout(async () => {
            try {
              const basicStream = await navigator.mediaDevices.getUserMedia({ video: true });
              streamRef.current = basicStream;
              setCameraActive(true);
              setCameraPermission('granted');
              if (videoRef.current) {
                videoRef.current.srcObject = basicStream;
                videoRef.current.play().catch(console.error);
              }
            } catch {
              setError('Unable to access camera with any settings.');
            }
          }, 1000);
        }
      } else {
        setError(`Camera error: ${err.message || 'Unknown error occurred'}`);
      }
    }
  };

  const stopCamera = () => {
    console.log('Face Analysis: Stopping camera...');
    // Stop the cloned stream from video element
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Face Analysis: Stopped cloned track:', track.kind);
      });
      videoRef.current.srcObject = null;
      videoRef.current.pause();
    }
    streamRef.current = null;
    setCameraActive(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const analyzeImage = async () => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) {
      setError('Camera not ready. Please start the camera first.');
      return;
    }

    setLoading(true);
    setError(null);
    console.log('Face Analysis: Starting image capture...');
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) {
        setError('Canvas not available');
        return;
      }

      // Check if video is actually playing
      if (video.readyState < 2) {
        setError('Video not ready. Please wait for camera to initialize.');
        setLoading(false);
        return;
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      console.log('Face Analysis: Video dimensions:', video.videoWidth, 'x', video.videoHeight);
      console.log('Face Analysis: Canvas dimensions:', canvas.width, 'x', canvas.height);
      
      // Draw the current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      const base64Data = imageData.split(',')[1];
      
      console.log('Face Analysis: Image captured, base64 length:', base64Data.length);
      
      if (!base64Data || base64Data.length < 100) {
        setError('Failed to capture image. Please ensure camera is working.');
        setLoading(false);
        return;
      }
      
      const response = await fetch('/api/face-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data })
      });
      
      const data = await response.json();
      console.log('Face Analysis: API response:', data);
      
      if (data.success) {
        setResult(data.result);
        stopCamera();
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      console.error('Face Analysis error:', err);
      setError('An error occurred during analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetAnalysis = () => {
    setResult(null);
    setError(null);
    startCamera();
  };

  const handleReportSubmit = async (formData: {
    patientName: string;
    patientEmail: string;
    patientPhone: string;
    patientJob: string;
  }) => {
    try {
      const response = await fetch('/api/face-analysis-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          analysisResult: result,
        }),
      });

      if (response.ok) {
        setShowReportForm(false);
        alert('PDF report has been generated and sent to your email!');
      } else {
        alert('Error generating report. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Error generating report. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-100/95 to-blue-100/95 backdrop-blur-sm z-50 rounded-lg overflow-hidden flex flex-col">
      {/* Back Button */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 flex items-center gap-1 px-4 py-2 bg-purple-600 text-white rounded-md shadow-md hover:shadow-lg hover:bg-purple-700 transition-all transform hover:scale-105 z-50"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="font-medium text-sm">Back</span>
      </button>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 pt-16">
        {!result ? (
          <div className="w-full max-w-sm">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-purple-700 mb-2">MEDCOR Face Analysis</h2>
              <p className="text-gray-600">Powered by YouCam API technology</p>
            </div>

            {/* Camera Permission States */}
            {cameraPermission === 'denied' ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                  <div>
                    <h3 className="font-semibold text-red-800">Camera Access Denied</h3>
                    <p className="text-red-600 text-sm">Please enable camera permissions to continue</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-3 mb-3">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    How to Enable Camera:
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Click the camera icon in your browser's address bar</li>
                    <li>• Select "Always allow" for camera access</li>
                    <li>• Refresh this page if needed</li>
                    <li>• Make sure no other app is using your camera</li>
                  </ul>
                </div>
                
                <button 
                  onClick={checkCameraPermission}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all"
                >
                  <RefreshCw size={16} />
                  Try Again
                </button>
              </div>
            ) : cameraPermission === 'checking' ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                  <div>
                    <h3 className="font-semibold text-blue-800">Checking Camera Access</h3>
                    <p className="text-blue-600 text-sm">Please allow camera permissions when prompted</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Camera View */}
                <div className="relative bg-black rounded-lg overflow-hidden mb-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-48 object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {!cameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
                      <div className="text-center text-white">
                        <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">
                          {cameraPermission === 'prompt' ? 'Click Start Camera' : 'Initializing camera...'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      <div>
                        <p className="text-red-600 text-sm font-medium mb-1">Camera Error</p>
                        <p className="text-red-600 text-sm">{error}</p>
                        <button 
                          onClick={startCamera}
                          className="mt-2 text-blue-600 hover:underline text-sm font-medium"
                        >
                          Try Again
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Analyze Button */}
                <button
                  onClick={analyzeImage}
                  disabled={loading || !cameraActive || cameraPermission !== 'granted'}
                  className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-all disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Analyzing...
                    </>
                  ) : !cameraActive ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Initializing Camera...
                    </>
                  ) : (
                    <>
                      <Face size={20} />
                      Analyze My Face
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        ) : (
          /* Results Display */
          <div className="w-full max-w-sm max-h-96 overflow-y-auto bg-white rounded-lg shadow-lg">
            <div className="p-4">
              <h3 className="text-lg font-bold text-purple-600 mb-4 text-center">
                MEDCOR AI Analysis Results
              </h3>
              
              {/* Basic Info */}
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2">Basic Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="text-gray-600">Age:</span>
                    <span className="font-semibold ml-1">{result.age} years</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="text-gray-600">Gender:</span>
                    <span className="font-semibold ml-1">{result.gender}</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="text-gray-600">Emotion:</span>
                    <span className="font-semibold ml-1">{result.emotion}</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="text-gray-600">Beauty:</span>
                    <span className="font-semibold ml-1 text-purple-600">{result.beauty_score}/100</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="text-gray-600">Face Shape:</span>
                    <span className="font-semibold ml-1">{result.face_shape || 'Oval'}</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="text-gray-600">Skin Tone:</span>
                    <span className="font-semibold ml-1">{result.skin_tone || 'Medium'}</span>
                  </div>
                </div>
              </div>

              {/* Facial Features */}
              {result.features && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Facial Features</h4>
                  <div className="space-y-2 text-sm">
                    {result.features.eyes && (
                      <div className="bg-indigo-50 p-2 rounded">
                        <span className="text-gray-600 font-medium">Eyes:</span>
                        <div className="text-xs mt-1">
                          <span className="text-gray-700">Shape: {result.features.eyes.shape}</span>
                          {result.features.eyes.size && <span className="text-gray-700 ml-3">Size: {result.features.eyes.size}</span>}
                          {result.features.eyes.distance && <span className="text-gray-700 ml-3">Distance: {result.features.eyes.distance}</span>}
                          {result.features.eyes.dark_circles && <div className="text-gray-700">Dark Circles: {result.features.eyes.dark_circles}</div>}
                          {result.features.eyes.puffiness && <div className="text-gray-700">Puffiness: {result.features.eyes.puffiness}</div>}
                        </div>
                      </div>
                    )}
                    {result.features.nose && (
                      <div className="bg-purple-50 p-2 rounded">
                        <span className="text-gray-600 font-medium">Nose:</span>
                        <span className="ml-2 text-gray-700">Shape: {result.features.nose.shape}, Size: {result.features.nose.size}</span>
                      </div>
                    )}
                    {result.features.lips && (
                      <div className="bg-pink-50 p-2 rounded">
                        <span className="text-gray-600 font-medium">Lips:</span>
                        <span className="ml-2 text-gray-700">Shape: {result.features.lips.shape}, Fullness: {result.features.lips.fullness}</span>
                      </div>
                    )}
                    {result.features.eyebrows && (
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="text-gray-600 font-medium">Eyebrows:</span>
                        <span className="ml-2 text-gray-700">Shape: {result.features.eyebrows.shape}, Thickness: {result.features.eyebrows.thickness}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Skin Analysis */}
              {result.skin_analysis && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Skin Analysis</h4>
                  <div className="space-y-2 text-sm">
                    <div className="bg-blue-50 p-2 rounded">
                      <span className="text-gray-600">Texture:</span>
                      <span className="font-semibold ml-1">{result.skin_analysis.texture?.description} ({result.skin_analysis.texture?.score}/100)</span>
                    </div>
                    <div className="bg-green-50 p-2 rounded">
                      <span className="text-gray-600">Hydration:</span>
                      <span className="font-semibold ml-1">{result.skin_analysis.hydration?.level} ({result.skin_analysis.hydration?.score}/100)</span>
                    </div>
                    <div className="bg-yellow-50 p-2 rounded">
                      <span className="text-gray-600">Skin Type:</span>
                      <span className="font-semibold ml-1">{result.skin_analysis.oiliness?.overall}</span>
                    </div>
                    {result.skin_analysis.pores && (
                      <div className="bg-orange-50 p-2 rounded">
                        <span className="text-gray-600">Pores:</span>
                        <span className="font-semibold ml-1">{result.skin_analysis.pores.visibility} ({result.skin_analysis.pores.score}/100)</span>
                      </div>
                    )}
                    {result.skin_analysis.wrinkles && (
                      <div className="bg-red-50 p-2 rounded">
                        <span className="text-gray-600">Wrinkles:</span>
                        <span className="font-semibold ml-1">Score: {result.skin_analysis.wrinkles.score}/100</span>
                      </div>
                    )}
                    {result.skin_analysis.acne && (
                      <div className="bg-purple-50 p-2 rounded">
                        <span className="text-gray-600">Acne:</span>
                        <span className="font-semibold ml-1">{result.skin_analysis.acne.severity}</span>
                      </div>
                    )}
                    {result.skin_analysis.dark_spots && (
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="text-gray-600">Dark Spots:</span>
                        <span className="font-semibold ml-1">{result.skin_analysis.dark_spots.count} spots</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Makeup Recommendations */}
              {result.makeup_recommendations && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Makeup Recommendations</h4>
                  <div className="space-y-2 text-sm">
                    {result.makeup_recommendations.foundation && (
                      <div className="bg-yellow-50 p-2 rounded">
                        <span className="text-gray-600">Foundation:</span>
                        <span className="font-semibold ml-1">{result.makeup_recommendations.foundation.shade}</span>
                      </div>
                    )}
                    {result.makeup_recommendations.lipstick && (
                      <div className="bg-pink-50 p-2 rounded">
                        <span className="text-gray-600">Lipstick:</span>
                        <span className="font-semibold ml-1">{result.makeup_recommendations.lipstick.colors?.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Skincare Routine */}
              {result.recommendations?.skincare_routine && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Skincare Routine</h4>
                  <ul className="text-sm space-y-1">
                    {result.recommendations.skincare_routine.slice(0, 3).map((item: string, index: number) => (
                      <li key={index} className="text-gray-600 text-xs">• {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={resetAnalysis}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all text-sm"
                >
                  Analyze Again
                </button>
                
                <button
                  onClick={() => setShowReportForm(true)}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-all text-sm"
                >
                  <FileText size={16} />
                  Send me full report free
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Report Form Modal */}
      <FaceAnalysisReportForm
        isOpen={showReportForm}
        onClose={() => setShowReportForm(false)}
        analysisResult={result}
        onSubmit={handleReportSubmit}
      />
    </div>
  );
}