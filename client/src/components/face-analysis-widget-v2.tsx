import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScanFace as Face, AlertCircle, X, FileText, CheckCircle, RotateCcw, Loader2 } from 'lucide-react';
import FaceAnalysisReportForm from './face-analysis-report-form';

interface FaceAnalysisV2Props {
  isOpen: boolean;
  onClose: () => void;
  videoStream: MediaStream | null;
}

export function FaceAnalysisWidgetV2({ isOpen, onClose, videoStream }: FaceAnalysisV2Props) {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Setup camera stream - following hair widget pattern exactly
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 10;
    
    const setupVideoStream = () => {
      console.log("🎬 FACE V2 DEBUG: Setting up video stream, retry count:", retryCount);
      console.log("🎬 FACE V2 DEBUG: isOpen:", isOpen);
      console.log("🎬 FACE V2 DEBUG: videoStream exists:", !!videoStream);
      
      if (!videoStream) {
        console.log("🎬 FACE V2 DEBUG: No video stream provided yet");
        if (retryCount < maxRetries && isMounted) {
          retryCount++;
          setTimeout(setupVideoStream, 500);
        }
        return;
      }
      
      const videoEl = videoRef.current;
      if (!videoEl) {
        console.log("🎬 FACE V2 DEBUG: Video element not ready");
        console.log("🎬 FACE V2 DEBUG: videoRef.current:", videoRef.current);
        if (retryCount < maxRetries && isMounted) {
          retryCount++;
          setTimeout(setupVideoStream, 200);
        }
        return;
      }
      
      console.log("🎬 FACE V2 DEBUG: Both stream and video element are ready");
      console.log("🎬 FACE V2 DEBUG: Video stream details:", {
        id: videoStream.id,
        active: videoStream.active,
        tracks: videoStream.getTracks?.()?.length || 0
      });
      
      // Set up the video element
      videoEl.srcObject = videoStream;
      videoEl.autoplay = true;
      videoEl.playsInline = true;
      videoEl.muted = true;
      
      // Force show the video element
      videoEl.style.display = 'block';
      videoEl.style.visibility = 'visible';
      
      // Immediately set camera as ready since we have a valid stream
      console.log("🎬 FACE V2 DEBUG: Video element setup complete, forcing camera ready state");
      setCameraReady(true);
      
      console.log("🎬 FACE V2 DEBUG: Video element display:", videoEl.style.display);
      console.log("🎬 FACE V2 DEBUG: Video element visibility:", videoEl.style.visibility);
      
      // Multiple ways to detect when video is ready
      let isReady = false;
      
      const markReady = () => {
        if (isReady || !isMounted) return;
        isReady = true;
        
        console.log("🎬 FACE V2 DEBUG: Video is now ready!");
        setCameraReady(true);
      };
      
      // Check if already ready
      if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
        console.log("🎬 FACE V2 DEBUG: Video already has dimensions:", videoEl.videoWidth, "x", videoEl.videoHeight);
        markReady();
        return;
      }
      
      // Set up event listeners
      const onLoadedMetadata = () => {
        console.log("🎬 FACE V2 DEBUG: onloadedmetadata event fired, dimensions:", videoEl.videoWidth, "x", videoEl.videoHeight);
        if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
          markReady();
        }
      };
      
      const onLoadedData = () => {
        console.log("🎬 FACE V2 DEBUG: onloadeddata event fired");
        if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
          markReady();
        }
      };
      
      const onCanPlay = () => {
        console.log("🎬 FACE V2 DEBUG: oncanplay event fired");
        if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
          markReady();
        }
      };
      
      videoEl.addEventListener('loadedmetadata', onLoadedMetadata);
      videoEl.addEventListener('loadeddata', onLoadedData);
      videoEl.addEventListener('canplay', onCanPlay);
      
      // Polling backup (in case events don't fire)
      let pollCount = 0;
      const pollForReady = () => {
        if (isReady || !isMounted) return;
        
        pollCount++;
        console.log("🎬 FACE V2 DEBUG: Polling for ready state, attempt:", pollCount);
        
        if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
          console.log("🎬 FACE V2 DEBUG: Polling detected ready state");
          markReady();
        } else if (pollCount < 20) {
          setTimeout(pollForReady, 300);
        } else {
          console.log("🎬 FACE V2 DEBUG: Polling timeout, forcing ready state");
          setCameraReady(true);
        }
      };
      
      // Start polling after a short delay
      setTimeout(pollForReady, 500);
      
      // Try to play the video
      videoEl.play().then(() => {
        console.log("🎬 FACE V2 DEBUG: Video play succeeded");
      }).catch(err => {
        console.log("🎬 FACE V2 DEBUG: Video play failed but continuing:", err);
      });
      
      // Cleanup function for event listeners
      return () => {
        videoEl.removeEventListener('loadedmetadata', onLoadedMetadata);
        videoEl.removeEventListener('loadeddata', onLoadedData);
        videoEl.removeEventListener('canplay', onCanPlay);
      };
    };
    
    // Only setup if widget is open
    if (isOpen) {
      console.log("🎬 FACE V2 DEBUG: Widget is open, starting setup");
      console.log("🎬 FACE V2 DEBUG: videoStream prop:", videoStream);
      setupVideoStream();
    } else {
      console.log("🎬 FACE V2 DEBUG: Widget is not open, skipping setup");
    }
    
    return () => {
      isMounted = false;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setCameraReady(false);
    };
  }, [isOpen, videoStream]);

  const analyzeImage = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Camera not ready');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Ensure video has valid dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        throw new Error('Video not ready - no dimensions');
      }
      
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      console.log('Face Analysis V2: Canvas dimensions:', canvas.width, 'x', canvas.height);
      
      // Draw current video frame to canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      
      if (!imageData || imageData.length === 0) {
        throw new Error('Failed to capture image from video');
      }

      console.log('Face Analysis V2: Sending image for analysis');

      // Send to face analysis API
      const response = await fetch('/api/face-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData,
          analysis_type: 'comprehensive'
        }),
      });

      const data = await response.json();
      
      if (data.success && data.result) {
        console.log('Face Analysis V2: Analysis successful');
        setResult(data.result);
      } else {
        throw new Error(data.message || 'No results returned');
      }
    } catch (err: any) {
      console.error('Face Analysis V2: Error:', err);
      setError(err.message || 'Failed to analyze face. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetAnalysis = () => {
    setResult(null);
    setError(null);
    setLoading(false);
  };

  if (!isOpen) return null;

  // Show error state if no video stream
  if (!videoStream) {
    return (
      <div className="flex flex-col h-full relative">
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center bg-white/90 backdrop-blur-sm rounded-lg p-6">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Camera Access</h3>
            <p className="text-gray-600 text-sm">Face analysis requires camera access. Please ensure camera is enabled.</p>
            <Button onClick={onClose} className="mt-4">Close</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Camera Video Background - Exactly like Hair Analysis */}
      <div className="absolute inset-0 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>
      
      {/* Header */}
      <div className="relative z-10 text-center py-6 bg-white/20 backdrop-blur-sm border-b border-white/30">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Face className="h-8 w-8 text-purple-300" />
          <h1 className="text-2xl font-bold text-white drop-shadow-lg">Face Analysis</h1>
        </div>
        <p className="text-white/90 text-sm drop-shadow-lg">AI-powered facial health assessment</p>
        <p className="text-xs text-white/80 mt-2 drop-shadow-lg">
          Using Advanced YouCam AI Technology
        </p>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col">
        {!cameraReady ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center">
              <Loader2 className="animate-spin h-8 w-8 text-purple-500 mx-auto mb-4" />
              <p className="text-white">
                {error ? error : "Initializing camera..."}
              </p>
            </div>
          </div>
        ) : !result ? (
          <div className="absolute inset-4 bg-white/20 backdrop-blur-sm rounded-lg p-4 flex flex-col justify-center items-center">
            <div className="text-center">
              <div className="w-32 h-32 border-2 border-dashed border-purple-300 rounded-full flex items-center justify-center mb-4">
                <Face className="h-16 w-16 text-purple-400" />
              </div>
              <p className="text-white text-sm mb-6 drop-shadow-lg">
                Position your face in the camera frame for analysis
              </p>
              <Button
                onClick={analyzeImage}
                disabled={loading || !cameraReady}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Analyzing Face...
                  </>
                ) : (
                  <>
                    <Face className="h-5 w-5 mr-2" />
                    Analyze Face
                  </>
                )}
              </Button>
              
              {error && (
                <div className="mt-4 p-3 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-300" />
                  <span className="text-red-100 text-sm">{error}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="absolute inset-2 sm:inset-4 bg-white/20 backdrop-blur-sm rounded-lg p-2 sm:p-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <h3 className="font-bold text-white drop-shadow-lg text-base sm:text-lg">Face Analysis Complete</h3>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => setShowReportForm(true)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white flex-1 sm:flex-none"
                  size="sm"
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Get Report
                </Button>
                <Button
                  onClick={resetAnalysis}
                  variant="outline"
                  size="sm"
                  className="text-xs bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 flex-1 sm:flex-none"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  New Analysis
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  size="sm"
                  className="text-xs bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 flex-1 sm:flex-none"
                >
                  <X className="h-3 w-3 mr-1" />
                  Close
                </Button>
              </div>
            </div>
            
            {/* Results - Following Hair Analysis Pattern */}
            <div className="space-y-4">
              {/* Beauty Score */}
              <div className="bg-purple-500/20 backdrop-blur-sm p-5 rounded-lg border border-purple-400/30 text-center">
                <h3 className="text-3xl font-bold text-white drop-shadow-lg">
                  Beauty Score: {result.beauty_score || 85}/100
                </h3>
                <p className="text-lg text-purple-200 mt-2 drop-shadow-lg">
                  Face Shape: {result.face_shape || 'Oval'}
                </p>
              </div>

              {/* Skin Analysis */}
              {result.skin_analysis && (
                <div className="bg-purple-500/20 backdrop-blur-sm p-4 rounded-lg border border-purple-400/30">
                  <h4 className="font-bold text-purple-200 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <Face className="h-4 w-4" />
                    Skin Analysis
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                      <span className="text-white/90 font-medium">Texture:</span>
                      <span className="font-bold text-white">{result.skin_analysis.texture?.description || 'Normal'}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                      <span className="text-white/90 font-medium">Hydration:</span>
                      <span className="font-bold text-white">{result.skin_analysis.hydration?.level || 'Balanced'}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                      <span className="text-white/90 font-medium">Oiliness:</span>
                      <span className="font-bold text-white">{result.skin_analysis.oiliness?.overall || 'Normal'}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                      <span className="text-white/90 font-medium">Spots Score:</span>
                      <span className="font-bold text-white">{result.skin_analysis.spots?.score || 90}/100</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Facial Features */}
              {result.facial_features && (
                <div className="bg-blue-500/20 backdrop-blur-sm p-4 rounded-lg border border-blue-400/30">
                  <h4 className="font-bold text-blue-200 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <CheckCircle className="h-4 w-4" />
                    Facial Features
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                      <span className="text-white/90 font-medium">Symmetry:</span>
                      <span className="font-bold text-white">{result.facial_features?.symmetry || 'Balanced'}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                      <span className="text-white/90 font-medium">Jawline:</span>
                      <span className="font-bold text-white">{result.facial_features?.jawline || 'Defined'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {result.recommendations && (
                <div className="bg-green-500/20 backdrop-blur-sm p-4 rounded-lg border border-green-400/30">
                  <h4 className="font-bold text-green-200 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <CheckCircle className="h-4 w-4" />
                    Recommendations
                  </h4>
                  <div className="space-y-2 text-sm">
                    {(result.recommendations.skincare_routine || result.recommendations || []).slice(0, 4).map((rec: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 p-2 bg-white/10 rounded-lg">
                        <span className="text-green-300 mt-1 font-bold">•</span>
                        <span className="text-green-100 font-medium leading-relaxed">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Report Form */}
      {showReportForm && result && (
        <FaceAnalysisReportForm
          isOpen={showReportForm}
          onClose={() => setShowReportForm(false)}
          analysisResult={result}
          onSubmit={(formData) => {
            console.log('Face analysis report form submitted:', formData);
            setShowReportForm(false);
          }}
        />
      )}
    </div>
  );
}

export default FaceAnalysisWidgetV2;