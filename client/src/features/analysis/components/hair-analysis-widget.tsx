import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw, Download, Upload, AlertCircle, CheckCircle, Scissors, X } from 'lucide-react';

interface HairAnalysisWidgetProps {
  onClose: () => void;
  videoStream: MediaStream; // REQUIRED - must be passed from parent
  capturePhotoRef?: React.MutableRefObject<(() => string | null) | null>;
}

interface HairAnalysisResult {
  hairType: string;
  hairCondition: string;
  scalpHealth: string;
  recommendations: string[];
  confidence: number;
}

export default function HairAnalysisWidget({ onClose, videoStream, capturePhotoRef }: HairAnalysisWidgetProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<HairAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debug log for props
  console.log("🎬 HAIR WIDGET DEBUG: Props received:", { videoStream, hasVideoStream: !!videoStream });

  // Setup camera stream - with improved timing and debugging
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 10;
    
    const setupVideoStream = () => {
      console.log("🎬 HAIR DEBUG: Setting up video stream, retry count:", retryCount);
      
      if (!videoStream) {
        console.log("🎬 HAIR DEBUG: No video stream provided yet");
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(setupVideoStream, 500);
        }
        return;
      }
      
      const videoEl = videoRef.current;
      if (!videoEl) {
        console.log("🎬 HAIR DEBUG: Video element not ready");
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(setupVideoStream, 200);
        }
        return;
      }
      
      console.log("🎬 HAIR DEBUG: Both stream and video element are ready");
      console.log("🎬 HAIR DEBUG: Video stream details:", {
        id: videoStream.id,
        active: videoStream.active,
        tracks: videoStream.getTracks?.()?.length || 0
      });
      
      // Set up the video element
      videoEl.srcObject = videoStream;
      videoEl.autoplay = true;
      videoEl.playsInline = true;
      videoEl.muted = true;
      
      console.log("🎬 HAIR DEBUG: Video element setup complete, waiting for ready state");
      
      // Multiple ways to detect when video is ready
      let isReady = false;
      
      const markReady = () => {
        if (isReady || !isMounted) return;
        isReady = true;
        
        console.log("🎬 HAIR DEBUG: Video is now ready!");
        setCameraReady(true);
      };
      
      // Check if already ready
      if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
        console.log("🎬 HAIR DEBUG: Video already has dimensions:", videoEl.videoWidth, "x", videoEl.videoHeight);
        markReady();
        return;
      }
      
      // Set up event listeners
      const onLoadedMetadata = () => {
        console.log("🎬 HAIR DEBUG: onloadedmetadata event fired, dimensions:", videoEl.videoWidth, "x", videoEl.videoHeight);
        if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
          markReady();
        }
      };
      
      const onLoadedData = () => {
        console.log("🎬 HAIR DEBUG: onloadeddata event fired");
        if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
          markReady();
        }
      };
      
      const onCanPlay = () => {
        console.log("🎬 HAIR DEBUG: oncanplay event fired");
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
        console.log("🎬 HAIR DEBUG: Polling for ready state, attempt:", pollCount);
        
        if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
          console.log("🎬 HAIR DEBUG: Polling detected ready state");
          markReady();
        } else if (pollCount < 15) {
          setTimeout(pollForReady, 100); // Reduced from 300ms to 100ms for faster polling
        } else {
          console.log("🎬 HAIR DEBUG: Polling timeout, forcing ready state");
          setCameraReady(true);
        }
      };
      
      // Start polling immediately - removed delay for faster initialization
      pollForReady();
      
      // Try to play the video
      videoEl.play().then(() => {
        console.log("🎬 HAIR DEBUG: Video play succeeded");
      }).catch(err => {
        console.log("🎬 HAIR DEBUG: Video play failed but continuing:", err);
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
    console.log("🚨 HAIR DEBUG: No videoStream prop - showing error");
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-lg mb-4">⚠️</div>
            <p className="text-gray-600">Hair Analysis requires camera access</p>
            <p className="text-red-500 text-xs mt-2">ERROR: No shared video stream available</p>
          </div>
        </div>
      </div>
    );
  }
  
  console.log("🚨 HAIR DEBUG: Shared videoStream available, proceeding with widget");

  const analyzeHair = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      console.log("🎬 HAIR DEBUG: Starting hair analysis");
      
      // Track analysis usage
      const sessionId = sessionStorage.getItem('sessionId') || Date.now().toString();
      const userStr = localStorage.getItem('user');
      const tenantId = localStorage.getItem('tenantId');
      
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          await fetch('/api/track-analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patientId: user.id || user.patient_id || 0,
              tenantId: tenantId ? parseInt(tenantId) : null,
              sessionId: sessionId,
              analysisType: 'hair',
              widgetLocation: 'chat_widget'
            })
          });
          console.log('Hair analysis tracked successfully');
        } catch (err) {
          console.error('Failed to track hair analysis:', err);
        }
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
      console.log("🎬 HAIR DEBUG: Image captured, size:", imageBase64.length);
      
      // Call the hair analysis API
      const response = await fetch('/api/hair-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: imageBase64
        })
      });
      
      if (!response.ok) {
        throw new Error(`Hair analysis API failed: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("🎬 HAIR DEBUG: API response:", result);
      
      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }
      
      // Convert API response to widget format
      const hairAnalysis: HairAnalysisResult = {
        hairType: `${result.result.hair_type.texture} - ${result.result.hair_type.curl_pattern}`,
        hairCondition: `${result.result.hair_condition.damage_level} (Health Score: ${result.result.hair_condition.health_score}%)`,
        scalpHealth: result.result.scalp_analysis.condition,
        recommendations: result.result.hair_care_routine || [
          "Use moisturizing shampoo and conditioner 2-3 times per week",
          "Apply heat protectant before styling",
          "Regular scalp massage to improve blood circulation",
          "Consider deep conditioning treatment monthly",
          "Avoid excessive heat styling above 180°C"
        ],
        confidence: result.result.confidence || 0.88
      };
      
      setAnalysisResult(hairAnalysis);
      console.log("🎬 HAIR DEBUG: Analysis completed successfully");
      
    } catch (error) {
      console.error('🎬 HAIR ERROR: Analysis failed:', error);
      setError('Analysis failed. Please ensure good lighting and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setAnalysisResult(null);
    setError(null);
  };

  const downloadReport = () => {
    if (!analysisResult) return;

    const reportData = {
      timestamp: new Date().toISOString(),
      analysis: analysisResult,
      type: 'hair_analysis'
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `hair_analysis_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Camera Video Background */}
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
          <Scissors className="h-8 w-8 text-purple-300" />
          <h1 className="text-2xl font-bold text-white drop-shadow-lg">Hair Analysis</h1>
        </div>
        <p className="text-white/90 text-sm drop-shadow-lg">Advanced hair and scalp health assessment</p>
        <p className="text-xs text-white/80 mt-2 drop-shadow-lg">
          Using Perfect Corp YouCam AI Technology
        </p>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col">
        {!cameraReady ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-white">
                {error ? error : "Initializing camera..."}
              </p>
            </div>
          </div>
        ) : !analysisResult ? (
          <div className="absolute inset-4 bg-white/20 backdrop-blur-sm rounded-lg p-4 flex flex-col justify-center items-center">
            <div className="text-center">
              <div className="w-32 h-32 border-2 border-dashed border-purple-300 rounded-full flex items-center justify-center mb-4">
                <Scissors className="h-16 w-16 text-purple-400" />
              </div>
              <p className="text-white text-sm mb-6 drop-shadow-lg">
                Position your head in the camera frame for hair analysis
              </p>
              <Button
                onClick={analyzeHair}
                disabled={isAnalyzing || !cameraReady}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Analyzing Hair...
                  </>
                ) : (
                  <>
                    <Scissors className="h-5 w-5 mr-2" />
                    Analyze Hair & Scalp
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
                <h3 className="font-bold text-white drop-shadow-lg text-base sm:text-lg">Hair Analysis Complete</h3>
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
                <div className="bg-purple-500/20 backdrop-blur-sm p-3 rounded-lg border border-purple-400/30">
                  <p className="font-bold text-white drop-shadow-lg text-xs uppercase tracking-wide">Hair Type</p>
                  <p className="text-purple-200 font-semibold text-lg">{analysisResult.hair_type?.curl_pattern || analysisResult.hairType}</p>
                </div>
                <div className="bg-purple-500/20 backdrop-blur-sm p-3 rounded-lg border border-purple-400/30">
                  <p className="font-bold text-white drop-shadow-lg text-xs uppercase tracking-wide">Confidence</p>
                  <p className="text-purple-200 font-semibold text-lg">{Math.round(analysisResult.confidence * 100)}%</p>
                </div>
              </div>
              
              {/* Hair Type Details */}
              {analysisResult.hair_type && (
                <div className="bg-purple-500/20 backdrop-blur-sm p-4 rounded-lg border border-purple-400/30">
                  <h4 className="font-bold text-purple-200 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <Scissors className="h-4 w-4" />
                    Hair Type Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                      <span className="text-white/90 font-medium">Curl Pattern:</span>
                      <span className="font-bold text-white">{analysisResult.hair_type.curl_pattern}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                      <span className="text-white/90 font-medium">Texture:</span>
                      <span className="font-bold text-white">{analysisResult.hair_type.texture}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                      <span className="text-white/90 font-medium">Density:</span>
                      <span className="font-bold text-white">{analysisResult.hair_type.density}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                      <span className="text-white/90 font-medium">Porosity:</span>
                      <span className="font-bold text-white">{analysisResult.hair_type.porosity}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Hair Condition */}
              <div className="bg-blue-500/20 backdrop-blur-sm p-4 rounded-lg border border-blue-400/30">
                <h4 className="font-bold text-blue-200 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <CheckCircle className="h-4 w-4" />
                  Hair Condition
                </h4>
                {analysisResult.hair_condition ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                      <span className="text-white/90 font-medium">Health Score:</span>
                      <span className="font-bold text-white">{analysisResult.hair_condition.health_score}/100</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                      <span className="text-white/90 font-medium">Damage Level:</span>
                      <span className="font-bold text-white">{analysisResult.hair_condition.damage_level}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                      <span className="text-white/90 font-medium">Dryness:</span>
                      <span className="font-bold text-white">{analysisResult.hair_condition.dryness}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                      <span className="text-white/90 font-medium">Shine Level:</span>
                      <span className="font-bold text-white">{analysisResult.hair_condition.shine_level}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-blue-100 text-sm font-medium">{analysisResult.hairCondition}</p>
                )}
              </div>
              
              {/* Scalp Health */}
              <div className="bg-green-500/20 backdrop-blur-sm p-4 rounded-lg border border-green-400/30">
                <h4 className="font-bold text-green-200 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <CheckCircle className="h-4 w-4" />
                  Scalp Health
                </h4>
                {analysisResult.scalp_analysis ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                      <span className="text-white/90 font-medium">Condition:</span>
                      <span className="font-bold text-white">{analysisResult.scalp_analysis.condition}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                      <span className="text-white/90 font-medium">Dandruff:</span>
                      <span className="font-bold text-white">{analysisResult.scalp_analysis.dandruff}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                      <span className="text-white/90 font-medium">Irritation:</span>
                      <span className="font-bold text-white">{analysisResult.scalp_analysis.irritation}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-green-100 text-sm font-medium">{analysisResult.scalpHealth}</p>
                )}
              </div>
              
              {/* Care Recommendations */}
              <div className="bg-orange-500/20 backdrop-blur-sm p-4 rounded-lg border border-orange-400/30">
                <h4 className="font-bold text-orange-200 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <CheckCircle className="h-4 w-4" />
                  Care Recommendations
                </h4>
                <div className="space-y-2 text-sm">
                  {(analysisResult.hair_care_routine || analysisResult.recommendations || []).map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 bg-white/10 rounded-lg">
                      <span className="text-orange-300 mt-1 font-bold">•</span>
                      <span className="text-orange-100 font-medium leading-relaxed">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}