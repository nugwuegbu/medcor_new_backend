import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw, Download, Upload, AlertCircle, CheckCircle, Heart, X, Calendar, Shield, AlertTriangle } from 'lucide-react';

interface SkinAnalysisWidgetProps {
  onClose: () => void;
  videoStream: MediaStream | null;
  capturePhotoRef?: React.MutableRefObject<(() => string | null) | null>;
}

interface SkinAnalysisResult {
  skin_health: {
    overall_score: number;
    skin_age: number;
    skin_type: string;
    skin_tone: string;
    undertone: string;
  };
  skin_conditions: {
    acne: {
      severity: string;
      count: number;
      type: string;
      score: number;
    };
    wrinkles: {
      forehead: string;
      crow_feet: string;
      laugh_lines: string;
      overall_score: number;
    };
    dark_spots: {
      count: number;
      intensity: string;
      type: string;
      score: number;
    };
    pores: {
      visibility: string;
      t_zone: string;
      cheeks: string;
      score: number;
    };
  };
  recommendations: {
    daily_habits: string[];
    weekly_practices: string[];
    lifestyle_tips: string[];
  };
  avoid_practices: {
    daily_mistakes: string[];
    harmful_ingredients: string[];
    lifestyle_factors: string[];
  };
  confidence: number;
}

export default function SkinAnalysisWidget({ onClose, videoStream, capturePhotoRef }: SkinAnalysisWidgetProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SkinAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debug log for props
  console.log("🌟 SKIN WIDGET DEBUG: Props received:", { videoStream, hasVideoStream: !!videoStream });

  // Setup camera stream - with improved timing and debugging
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 10;
    
    const setupVideoStream = () => {
      console.log("🌟 SKIN DEBUG: Setting up video stream, retry count:", retryCount);
      
      if (!videoStream) {
        console.log("🌟 SKIN DEBUG: No video stream provided yet");
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(setupVideoStream, 500);
        }
        return;
      }
      
      const videoEl = videoRef.current;
      if (!videoEl) {
        console.log("🌟 SKIN DEBUG: Video element not ready");
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(setupVideoStream, 200);
        }
        return;
      }
      
      console.log("🌟 SKIN DEBUG: Both stream and video element are ready");
      console.log("🌟 SKIN DEBUG: Video stream details:", {
        id: videoStream.id,
        active: videoStream.active,
        tracks: videoStream.getTracks?.()?.length || 0
      });
      
      // Set up the video element
      videoEl.srcObject = videoStream;
      videoEl.autoplay = true;
      videoEl.playsInline = true;
      videoEl.muted = true;
      
      console.log("🌟 SKIN DEBUG: Video element setup complete, waiting for ready state");
      
      // Multiple ways to detect when video is ready
      let isReady = false;
      
      const markReady = () => {
        if (isReady || !isMounted) return;
        isReady = true;
        
        console.log("🌟 SKIN DEBUG: Video is now ready!");
        setCameraReady(true);
      };
      
      // Check if already ready
      if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
        console.log("🌟 SKIN DEBUG: Video already has dimensions:", videoEl.videoWidth, "x", videoEl.videoHeight);
        markReady();
        return;
      }
      
      // Set up event listeners
      const onLoadedMetadata = () => {
        console.log("🌟 SKIN DEBUG: onloadedmetadata event fired, dimensions:", videoEl.videoWidth, "x", videoEl.videoHeight);
        if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
          markReady();
        }
      };
      
      const onLoadedData = () => {
        console.log("🌟 SKIN DEBUG: onloadeddata event fired");
        if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
          markReady();
        }
      };
      
      const onCanPlay = () => {
        console.log("🌟 SKIN DEBUG: oncanplay event fired");
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
        console.log("🌟 SKIN DEBUG: Polling for ready state, attempt:", pollCount);
        
        if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
          console.log("🌟 SKIN DEBUG: Polling detected ready state");
          markReady();
        } else if (pollCount < 20) {
          setTimeout(pollForReady, 300);
        } else {
          console.log("🌟 SKIN DEBUG: Polling timeout, forcing ready state");
          setCameraReady(true);
        }
      };
      
      // Start polling after a short delay
      setTimeout(pollForReady, 500);
      
      // Try to play the video
      videoEl.play().then(() => {
        console.log("🌟 SKIN DEBUG: Video play succeeded");
      }).catch(err => {
        console.log("🌟 SKIN DEBUG: Video play failed but continuing:", err);
      });
      
      // Cleanup function for event listeners
      return () => {
        videoEl.removeEventListener('loadedmetadata', onLoadedMetadata);
        videoEl.removeEventListener('loadeddata', onLoadedData);
        videoEl.removeEventListener('canplay', onCanPlay);
      };
    };
    
    // Start the setup
    setupVideoStream();
    
    return () => {
      isMounted = false;
    };
  }, [videoStream]);

  if (!videoStream) {
    console.log("🚨 SKIN DEBUG: No videoStream prop - showing error");
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-lg mb-4">⚠️</div>
            <p className="text-gray-600">Skin Analysis requires camera access</p>
            <p className="text-red-500 text-xs mt-2">ERROR: No shared video stream available</p>
          </div>
        </div>
      </div>
    );
  }
  
  console.log("🚨 SKIN DEBUG: Shared videoStream available, proceeding with widget");

  const analyzeSkin = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      console.log("🌟 SKIN DEBUG: Starting skin analysis");
      
      // Capture image from video
      const video = videoRef.current;
      if (!video || !video.videoWidth || !video.videoHeight) {
        throw new Error('Video not ready for capture');
      }

      // Create canvas for image capture
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Canvas context not available');
      }

      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);
      console.log("🌟 SKIN DEBUG: Image captured, size:", imageBase64.length);
      
      // Call YouCam API for skin analysis
      const response = await fetch('/api/skin-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: imageBase64.split(',')[1], // Remove data:image/jpeg;base64, prefix
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      console.log("🌟 SKIN DEBUG: API Response:", result);
      
      if (result.success && result.result) {
        setAnalysisResult(result.result);
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
      
    } catch (error) {
      console.error('🌟 SKIN ERROR: Analysis failed:', error);
      setError(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setAnalysisResult(null);
    setError(null);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className="p-6 text-center border-b border-pink-200">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Heart className="h-6 w-6 text-pink-600" />
          <h2 className="text-xl font-bold text-pink-700">Skin Analysis</h2>
        </div>
        <p className="text-sm text-gray-600">Advanced skin health assessment</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Video Display */}
        <div className="relative flex-1 bg-black/5 border-2 border-dashed border-pink-300 rounded-lg m-4 overflow-hidden">
          {/* Video Element */}
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover rounded-lg"
            autoPlay
            playsInline
            muted
          />
          
          {/* Overlay Content */}
          <div 
            ref={containerRef}
            className="absolute inset-0 flex items-center justify-center"
          >
            {!cameraReady ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
                <p className="text-gray-600">
                  {error ? error : "Initializing camera..."}
                </p>
              </div>
            ) : (
              // Analysis Results Overlay
              analysisResult && (
                <div className="absolute inset-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-gray-800">Analysis Complete</h3>
                    </div>
                    <Button
                      onClick={resetAnalysis}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Reset
                    </Button>
                  </div>
                  
                  {/* Results */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="font-medium text-gray-700">Skin Type</p>
                        <p className="text-pink-600">{analysisResult.skin_health.skin_type}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Health Score</p>
                        <p className="text-pink-600">{analysisResult.skin_health.overall_score}/100</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Skin Tone</p>
                        <p className="text-pink-600">{analysisResult.skin_health.skin_tone}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Confidence</p>
                        <p className="text-pink-600">{Math.round(analysisResult.confidence * 100)}%</p>
                      </div>
                    </div>
                    
                    {/* Skin Conditions */}
                    <div>
                      <p className="font-medium text-gray-700 mb-2">Skin Conditions</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span>Acne:</span>
                          <span className="font-medium">{analysisResult.skin_conditions.acne.severity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Wrinkles:</span>
                          <span className="font-medium">{analysisResult.skin_conditions.wrinkles.forehead}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Dark Spots:</span>
                          <span className="font-medium">{analysisResult.skin_conditions.dark_spots.count} spots</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pores:</span>
                          <span className="font-medium">{analysisResult.skin_conditions.pores.visibility}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Skin Age:</span>
                          <span className="font-medium">{analysisResult.skin_health.skin_age} years</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Undertone:</span>
                          <span className="font-medium">{analysisResult.skin_health.undertone}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Recommendations for Better Skin Health */}
                    {analysisResult.recommendations && (
                      <div className="space-y-3">
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                          <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            ✅ Daily Habits for Healthy Skin
                          </h4>
                          <div className="space-y-1 text-xs">
                            {analysisResult.recommendations.daily_habits.map((habit, idx) => (
                              <div key={idx} className="flex items-start gap-1">
                                <span className="text-green-600 mt-1">•</span>
                                <span className="text-green-700">{habit}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            📅 Weekly Practices
                          </h4>
                          <div className="space-y-1 text-xs">
                            {analysisResult.recommendations.weekly_practices.map((practice, idx) => (
                              <div key={idx} className="flex items-start gap-1">
                                <span className="text-blue-600 mt-1">•</span>
                                <span className="text-blue-700">{practice}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                          <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            💜 Lifestyle Tips
                          </h4>
                          <div className="space-y-1 text-xs">
                            {analysisResult.recommendations.lifestyle_tips.map((tip, idx) => (
                              <div key={idx} className="flex items-start gap-1">
                                <span className="text-purple-600 mt-1">•</span>
                                <span className="text-purple-700">{tip}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Things to Avoid */}
                    {analysisResult.avoid_practices && (
                      <div className="space-y-3">
                        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                          <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                            <X className="h-4 w-4" />
                            ❌ Daily Mistakes to Avoid
                          </h4>
                          <div className="space-y-1 text-xs">
                            {analysisResult.avoid_practices.daily_mistakes.map((mistake, idx) => (
                              <div key={idx} className="flex items-start gap-1">
                                <span className="text-red-600 mt-1">•</span>
                                <span className="text-red-700">{mistake}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                          <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            ⚠️ Harmful Ingredients to Avoid
                          </h4>
                          <div className="space-y-1 text-xs">
                            {analysisResult.avoid_practices.harmful_ingredients.map((ingredient, idx) => (
                              <div key={idx} className="flex items-start gap-1">
                                <span className="text-orange-600 mt-1">•</span>
                                <span className="text-orange-700">{ingredient}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                          <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            🚫 Lifestyle Factors to Avoid
                          </h4>
                          <div className="space-y-1 text-xs">
                            {analysisResult.avoid_practices.lifestyle_factors.map((factor, idx) => (
                              <div key={idx} className="flex items-start gap-1">
                                <span className="text-yellow-600 mt-1">•</span>
                                <span className="text-yellow-700">{factor}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Analysis Button */}
        <div className="p-6 bg-white/80 backdrop-blur-sm border-t border-pink-200">
          <Button
            onClick={analyzeSkin}
            disabled={isAnalyzing || !cameraReady}
            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            {isAnalyzing ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Analyzing Skin...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                <span>Analyze Skin & Health</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}