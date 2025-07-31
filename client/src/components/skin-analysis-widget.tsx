import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw, Download, Upload, AlertCircle, CheckCircle, Heart, X, Calendar, Shield, AlertTriangle, Sparkles, Zap, Eye, Brain } from 'lucide-react';

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
  const [analysisStep, setAnalysisStep] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debug log for props
  console.log("🌟 SKIN WIDGET DEBUG: Props received:", { videoStream, hasVideoStream: !!videoStream });

  // Setup camera stream - working implementation restored
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
      
      // Polling backup (in case events don't fire) - faster initialization
      let pollCount = 0;
      const pollForReady = () => {
        if (isReady || !isMounted) return;
        
        pollCount++;
        console.log("🌟 SKIN DEBUG: Polling for ready state, attempt:", pollCount);
        
        if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
          console.log("🌟 SKIN DEBUG: Polling detected ready state");
          markReady();
        } else if (pollCount < 15) {
          setTimeout(pollForReady, 100); // Reduced from 300ms to 100ms
        } else {
          console.log("🌟 SKIN DEBUG: Polling timeout, forcing ready state");
          setCameraReady(true);
        }
      };
      
      // Start polling immediately - removed delay
      pollForReady();
      
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
    setAnalysisStep(0);

    try {
      console.log("🌟 SKIN DEBUG: Starting skin analysis");
      
      // Show analysis steps with delays
      const steps = [
        "Capturing your image...",
        "Analyzing skin texture...",
        "Detecting skin conditions...",
        "Generating recommendations...",
        "Finalizing analysis..."
      ];
      
      for (let i = 0; i < steps.length; i++) {
        setAnalysisStep(i);
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
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
      setAnalysisStep(0);
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
            ) : isAnalyzing ? (
              // Analysis Process Illustration
              <div className="absolute inset-4 bg-white/20 backdrop-blur-sm rounded-lg p-6 flex flex-col items-center justify-center">
                <div className="mb-6">
                  <div className="relative">
                    <div className="w-20 h-20 mx-auto mb-4 relative">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 animate-pulse"></div>
                      <div className="absolute inset-2 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center">
                        {analysisStep === 0 && <Camera className="h-8 w-8 text-pink-600" />}
                        {analysisStep === 1 && <Eye className="h-8 w-8 text-purple-600" />}
                        {analysisStep === 2 && <Sparkles className="h-8 w-8 text-pink-600" />}
                        {analysisStep === 3 && <Brain className="h-8 w-8 text-purple-600" />}
                        {analysisStep === 4 && <Zap className="h-8 w-8 text-pink-600" />}
                      </div>
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full animate-ping"></div>
                  </div>
                </div>
                
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white drop-shadow-lg mb-2">AI Skin Analysis</h3>
                  <p className="text-white font-medium mb-4 drop-shadow-lg">
                    {analysisStep === 0 && "Capturing your image..."}
                    {analysisStep === 1 && "Analyzing skin texture..."}
                    {analysisStep === 2 && "Detecting skin conditions..."}
                    {analysisStep === 3 && "Generating recommendations..."}
                    {analysisStep === 4 && "Finalizing analysis..."}
                  </p>
                  
                  <div className="w-48 h-2 bg-white/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-300 ease-out"
                      style={{ width: `${((analysisStep + 1) / 5) * 100}%` }}
                    ></div>
                  </div>
                  
                  <p className="text-xs text-white/80 mt-2 drop-shadow-lg">
                    Using Perfect Corp YouCam AI Technology
                  </p>
                </div>
              </div>
            ) : (
              // Analysis Results Overlay
              analysisResult && (
                <div className="absolute inset-2 sm:inset-4 bg-white/20 backdrop-blur-sm rounded-lg p-2 sm:p-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      <h3 className="font-bold text-white drop-shadow-lg text-base sm:text-lg">Analysis Complete</h3>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
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
                  
                  {/* Results */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="bg-pink-500/20 backdrop-blur-sm p-3 rounded-lg border border-pink-400/30">
                        <p className="font-bold text-white drop-shadow-lg text-xs uppercase tracking-wide">Skin Type</p>
                        <p className="text-pink-200 font-semibold text-lg">{analysisResult.skin_health.skin_type}</p>
                      </div>
                      <div className="bg-pink-500/20 backdrop-blur-sm p-3 rounded-lg border border-pink-400/30">
                        <p className="font-bold text-white drop-shadow-lg text-xs uppercase tracking-wide">Health Score</p>
                        <p className="text-pink-200 font-semibold text-lg">{analysisResult.skin_health.overall_score}/100</p>
                      </div>
                      <div className="bg-pink-500/20 backdrop-blur-sm p-3 rounded-lg border border-pink-400/30">
                        <p className="font-bold text-white drop-shadow-lg text-xs uppercase tracking-wide">Skin Tone</p>
                        <p className="text-pink-200 font-semibold text-lg">{analysisResult.skin_health.skin_tone}</p>
                      </div>
                      <div className="bg-pink-500/20 backdrop-blur-sm p-3 rounded-lg border border-pink-400/30">
                        <p className="font-bold text-white drop-shadow-lg text-xs uppercase tracking-wide">Confidence</p>
                        <p className="text-pink-200 font-semibold text-lg">{Math.round(analysisResult.confidence * 100)}%</p>
                      </div>
                    </div>
                    
                    {/* Skin Conditions */}
                    <div className="bg-purple-500/20 backdrop-blur-sm p-4 rounded-lg border border-purple-400/30">
                      <p className="font-bold text-white drop-shadow-lg mb-3 text-sm uppercase tracking-wide">Skin Conditions</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                          <span className="text-white/90 font-medium">Acne:</span>
                          <span className="font-bold text-white">{analysisResult.skin_conditions.acne.severity}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                          <span className="text-white/90 font-medium">Wrinkles:</span>
                          <span className="font-bold text-white">{analysisResult.skin_conditions.wrinkles.forehead}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                          <span className="text-white/90 font-medium">Dark Spots:</span>
                          <span className="font-bold text-white">{analysisResult.skin_conditions.dark_spots.count} spots</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                          <span className="text-white/90 font-medium">Pores:</span>
                          <span className="font-bold text-white">{analysisResult.skin_conditions.pores.visibility}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                          <span className="text-white/90 font-medium">Skin Age:</span>
                          <span className="font-bold text-white">{analysisResult.skin_health.skin_age} years</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                          <span className="text-white/90 font-medium">Undertone:</span>
                          <span className="font-bold text-white">{analysisResult.skin_health.undertone}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Recommendations for Better Skin Health */}
                    {analysisResult.recommendations && (
                      <div className="space-y-4">
                        <div className="bg-green-500/20 backdrop-blur-sm p-4 rounded-lg border border-green-400/30">
                          <h4 className="font-bold text-green-200 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                            <CheckCircle className="h-4 w-4" />
                            Daily Habits for Healthy Skin
                          </h4>
                          <div className="space-y-2 text-sm">
                            {analysisResult.recommendations.daily_habits.map((habit, idx) => (
                              <div key={idx} className="flex items-start gap-2 p-2 bg-white/10 rounded-lg">
                                <span className="text-green-300 mt-1 font-bold">•</span>
                                <span className="text-green-100 font-medium leading-relaxed">{habit}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="bg-blue-500/20 backdrop-blur-sm p-4 rounded-lg border border-blue-400/30">
                          <h4 className="font-bold text-blue-200 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                            <Calendar className="h-4 w-4" />
                            Weekly Practices
                          </h4>
                          <div className="space-y-2 text-sm">
                            {analysisResult.recommendations.weekly_practices.map((practice, idx) => (
                              <div key={idx} className="flex items-start gap-2 p-2 bg-white/10 rounded-lg">
                                <span className="text-blue-300 mt-1 font-bold">•</span>
                                <span className="text-blue-100 font-medium leading-relaxed">{practice}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="bg-purple-500/20 backdrop-blur-sm p-4 rounded-lg border border-purple-400/30">
                          <h4 className="font-bold text-purple-200 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                            <Heart className="h-4 w-4" />
                            Lifestyle Tips
                          </h4>
                          <div className="space-y-2 text-sm">
                            {analysisResult.recommendations.lifestyle_tips.map((tip, idx) => (
                              <div key={idx} className="flex items-start gap-2 p-2 bg-white/10 rounded-lg">
                                <span className="text-purple-300 mt-1 font-bold">•</span>
                                <span className="text-purple-100 font-medium leading-relaxed">{tip}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Things to Avoid */}
                    {analysisResult.avoid_practices && (
                      <div className="space-y-4">
                        <div className="bg-red-500/20 backdrop-blur-sm p-4 rounded-lg border border-red-400/30">
                          <h4 className="font-bold text-red-200 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                            <X className="h-4 w-4" />
                            Daily Mistakes to Avoid
                          </h4>
                          <div className="space-y-2 text-sm">
                            {analysisResult.avoid_practices.daily_mistakes.map((mistake, idx) => (
                              <div key={idx} className="flex items-start gap-2 p-2 bg-white/10 rounded-lg">
                                <span className="text-red-300 mt-1 font-bold">•</span>
                                <span className="text-red-100 font-medium leading-relaxed">{mistake}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="bg-orange-500/20 backdrop-blur-sm p-3 rounded-lg border border-orange-400/30">
                          <h4 className="font-semibold text-orange-200 mb-2 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            ⚠️ Harmful Ingredients to Avoid
                          </h4>
                          <div className="space-y-1 text-xs">
                            {analysisResult.avoid_practices.harmful_ingredients.map((ingredient, idx) => (
                              <div key={idx} className="flex items-start gap-1">
                                <span className="text-orange-300 mt-1">•</span>
                                <span className="text-orange-100">{ingredient}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="bg-yellow-500/20 backdrop-blur-sm p-3 rounded-lg border border-yellow-400/30">
                          <h4 className="font-semibold text-yellow-200 mb-2 flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            🚫 Lifestyle Factors to Avoid
                          </h4>
                          <div className="space-y-1 text-xs">
                            {analysisResult.avoid_practices.lifestyle_factors.map((factor, idx) => (
                              <div key={idx} className="flex items-start gap-1">
                                <span className="text-yellow-300 mt-1">•</span>
                                <span className="text-yellow-100">{factor}</span>
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