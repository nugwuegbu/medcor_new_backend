import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  Camera, 
  Eye, 
  Sparkles, 
  Brain, 
  Zap, 
  CheckCircle, 
  X, 
  RotateCcw,
  AlertTriangle,
  Shield,
  Calendar,
  Droplets,
  Palette,
  Smile
} from 'lucide-react';

interface LipsAnalysisResult {
  lips_health: {
    overall_score: number;
    lip_condition: string;
    lip_color: string;
    lip_texture: string;
    lip_volume: string;
    hydration_level: string;
    pigmentation: string;
  };
  lips_conditions: {
    dryness: {
      severity: string;
      areas: string[];
    };
    pigmentation: {
      type: string;
      intensity: string;
    };
    texture: {
      smoothness: string;
      fine_lines: string;
    };
    volume: {
      upper_lip: string;
      lower_lip: string;
    };
  };
  recommendations: {
    daily_care: string[];
    weekly_treatments: string[];
    lifestyle_tips: string[];
    product_recommendations: string[];
  };
  avoid_practices: {
    daily_mistakes: string[];
    harmful_ingredients: string[];
    lifestyle_factors: string[];
  };
  confidence: number;
}

interface LipsAnalysisWidgetProps {
  onClose: () => void;
  videoStream: MediaStream | null;
  hasVideoStream: boolean;
}

export default function LipsAnalysisWidget({ onClose, videoStream, hasVideoStream }: LipsAnalysisWidgetProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<LipsAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [lipsDetected, setLipsDetected] = useState(false);
  const [lipsPosition, setLipsPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const analysisSteps = [
    "Capturing lip image...",
    "Analyzing lip texture and color...",
    "Detecting lip conditions...",
    "Generating personalized recommendations...",
    "Finalizing lip analysis..."
  ];

  const analysisIcons = [Camera, Eye, Sparkles, Brain, Zap];

  // Function to detect lips positioning
  const detectLipsPosition = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0);
    
    // Get image data for analysis
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Define lips detection area (center third of the image)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const detectionWidth = canvas.width / 3;
    const detectionHeight = canvas.height / 4;
    
    // Look for lips-like colors and find their bounds
    let lipsColorPixels = 0;
    let totalPixels = 0;
    let minX = canvas.width, maxX = 0;
    let minY = canvas.height, maxY = 0;
    
    for (let y = centerY - detectionHeight/2; y < centerY + detectionHeight/2; y++) {
      for (let x = centerX - detectionWidth/2; x < centerX + detectionWidth/2; x++) {
        if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
          const index = (y * canvas.width + x) * 4;
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];
          
          // Check if pixel color is lips-like (reddish/pinkish tones)
          if (r > g && r > b && r > 100 && (r - g) > 20 && (r - b) > 10) {
            lipsColorPixels++;
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
          }
          totalPixels++;
        }
      }
    }
    
    // Calculate lips detection confidence
    const lipsRatio = lipsColorPixels / totalPixels;
    const isLipsDetected = lipsRatio > 0.05; // 5% threshold for lips detection
    
    setLipsDetected(isLipsDetected);
    
    // Calculate lips position and size relative to video element
    if (isLipsDetected && minX < maxX && minY < maxY) {
      const videoRect = video.getBoundingClientRect();
      const scaleX = videoRect.width / canvas.width;
      const scaleY = videoRect.height / canvas.height;
      
      // Add some padding around detected lips
      const padding = 20;
      const lipsWidth = Math.max(80, (maxX - minX + padding * 2) * scaleX);
      const lipsHeight = Math.max(40, (maxY - minY + padding * 2) * scaleY);
      
      setLipsPosition({
        x: ((minX + maxX) / 2 - padding) * scaleX - lipsWidth / 2,
        y: ((minY + maxY) / 2 - padding) * scaleY - lipsHeight / 2,
        width: lipsWidth,
        height: lipsHeight
      });
    } else {
      setLipsPosition(null);
    }
  };

  // Start lips detection when camera is ready
  useEffect(() => {
    if (cameraReady && !isAnalyzing && !analysisResult) {
      detectionIntervalRef.current = setInterval(detectLipsPosition, 200); // Check every 200ms
      
      return () => {
        if (detectionIntervalRef.current) {
          clearInterval(detectionIntervalRef.current);
        }
      };
    }
  }, [cameraReady, isAnalyzing, analysisResult]);

  // Setup camera stream - working implementation restored
  useEffect(() => {
    if (videoStream && videoRef.current) {
      console.log('💋 LIPS DEBUG: Setting up video stream, retry count:', 0);
      
      const setupVideo = () => {
        if (videoRef.current && videoStream) {
          console.log('💋 LIPS DEBUG: Both stream and video element are ready');
          console.log('💋 LIPS DEBUG: Video stream details:', {
            id: videoStream.id,
            active: videoStream.active,
            tracks: videoStream.getTracks().length
          });
          
          videoRef.current.srcObject = videoStream;
          videoRef.current.autoplay = true;
          videoRef.current.playsInline = true;
          videoRef.current.muted = true;
          
          console.log('💋 LIPS DEBUG: Video element setup complete, waiting for ready state');
          
          videoRef.current.onloadedmetadata = () => {
            console.log('💋 LIPS DEBUG: onloadedmetadata event fired, dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
            setCameraReady(true);
            console.log('💋 LIPS DEBUG: Video is now ready!');
          };
          
          videoRef.current.onloadeddata = () => {
            console.log('💋 LIPS DEBUG: onloadeddata event fired');
          };
          
          videoRef.current.oncanplay = () => {
            console.log('💋 LIPS DEBUG: oncanplay event fired');
          };
          
          videoRef.current.play().then(() => {
            console.log('💋 LIPS DEBUG: Video play succeeded');
          }).catch((error) => {
            console.error('💋 LIPS DEBUG: Video play failed:', error);
          });
        }
      };
      
      setupVideo();
    }
  }, [videoStream]);

  const captureLipImage = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!videoRef.current || !canvasRef.current) {
        reject(new Error('Video or canvas not available'));
        return;
      }

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      ctx.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      resolve(imageData);
    });
  };

  const analyzeLips = async () => {
    if (!hasVideoStream) {
      setError('Camera not available');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setAnalysisStep(0);

    try {
      // Animate through analysis steps
      for (let i = 0; i < 5; i++) {
        setAnalysisStep(i);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      const imageData = await captureLipImage();
      
      const response = await fetch('/api/lips-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData,
          analysis_type: 'lips'
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      
      if (result.success) {
        setAnalysisResult(result.result);
      } else {
        setError(result.error || 'Analysis failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setAnalysisResult(null);
    setError(null);
    setIsAnalyzing(false);
    setAnalysisStep(0);
    setLipsDetected(false);
    setLipsPosition(null);
  };

  // Cleanup function
  useEffect(() => {
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, []);

  console.log('💋 LIPS WIDGET DEBUG: Props received:', { videoStream: !!videoStream, hasVideoStream });

  if (!hasVideoStream) {
    console.log('🚨 LIPS DEBUG: No video stream available');
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Camera Required</h3>
            <p className="text-gray-600 mb-4">Please enable camera access to use lips analysis</p>
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  console.log('🚨 LIPS DEBUG: Shared videoStream available, proceeding with widget');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-pink-100 rounded-lg">
                <Smile className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Lips Analysis</h2>
                <p className="text-sm text-gray-600">AI-powered lip health assessment</p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Video Container */}
        <div className="relative bg-black">
          <video
            ref={videoRef}
            className="w-full h-80 object-cover"
            autoPlay
            muted
            playsInline
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Lip Focus Guide */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative">
              <div className={`w-32 h-16 border-2 rounded-full border-dashed transition-all duration-300 ${
                lipsDetected 
                  ? 'border-pink-500 bg-pink-500/10' 
                  : 'border-pink-400 animate-pulse'
              }`}></div>
              
              {/* Positioning Status */}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                <div className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                  lipsDetected 
                    ? 'bg-pink-500 text-white' 
                    : 'bg-pink-500 text-white'
                }`}>
                  {lipsDetected ? 'Lips detected' : 'Position lips here'}
                </div>
              </div>
              
              {/* Movement Detection Indicator - Removed purple circle per user request */}
            </div>
          </div>

          {/* Green Broken Lines Around Detected Lips */}
          {lipsPosition && (
            <div 
              className="absolute pointer-events-none transition-all duration-300 ease-in-out"
              style={{
                left: lipsPosition.x,
                top: lipsPosition.y,
                width: lipsPosition.width,
                height: lipsPosition.height,
              }}
            >
              {/* Top broken line */}
              <div className="absolute top-0 left-0 w-full h-0.5 flex">
                <div className="w-4 h-full bg-green-400 animate-pulse"></div>
                <div className="w-2 h-full bg-transparent"></div>
                <div className="w-4 h-full bg-green-400 animate-pulse"></div>
                <div className="w-2 h-full bg-transparent"></div>
                <div className="w-4 h-full bg-green-400 animate-pulse"></div>
                <div className="w-2 h-full bg-transparent"></div>
                <div className="w-4 h-full bg-green-400 animate-pulse"></div>
                <div className="w-2 h-full bg-transparent"></div>
                <div className="w-4 h-full bg-green-400 animate-pulse"></div>
                <div className="w-2 h-full bg-transparent"></div>
                <div className="w-4 h-full bg-green-400 animate-pulse"></div>
                <div className="w-2 h-full bg-transparent"></div>
                <div className="w-4 h-full bg-green-400 animate-pulse"></div>
                <div className="w-2 h-full bg-transparent"></div>
                <div className="w-4 h-full bg-green-400 animate-pulse"></div>
                <div className="w-2 h-full bg-transparent"></div>
                <div className="w-4 h-full bg-green-400 animate-pulse"></div>
                <div className="w-2 h-full bg-transparent"></div>
                <div className="w-4 h-full bg-green-400 animate-pulse"></div>
                <div className="w-2 h-full bg-transparent"></div>
                <div className="w-4 h-full bg-green-400 animate-pulse"></div>
              </div>
              
              {/* Bottom broken line */}
              <div className="absolute bottom-0 left-0 w-full h-0.5 flex">
                <div className="w-4 h-full bg-green-400 animate-pulse"></div>
                <div className="w-2 h-full bg-transparent"></div>
                <div className="w-4 h-full bg-green-400 animate-pulse"></div>
                <div className="w-2 h-full bg-transparent"></div>
                <div className="w-4 h-full bg-green-400 animate-pulse"></div>
                <div className="w-2 h-full bg-transparent"></div>
                <div className="w-4 h-full bg-green-400 animate-pulse"></div>
                <div className="w-2 h-full bg-transparent"></div>
                <div className="w-4 h-full bg-green-400 animate-pulse"></div>
                <div className="w-2 h-full bg-transparent"></div>
                <div className="w-4 h-full bg-green-400 animate-pulse"></div>
                <div className="w-2 h-full bg-transparent"></div>
                <div className="w-4 h-full bg-green-400 animate-pulse"></div>
                <div className="w-2 h-full bg-transparent"></div>
                <div className="w-4 h-full bg-green-400 animate-pulse"></div>
                <div className="w-2 h-full bg-transparent"></div>
                <div className="w-4 h-full bg-green-400 animate-pulse"></div>
                <div className="w-2 h-full bg-transparent"></div>
                <div className="w-4 h-full bg-green-400 animate-pulse"></div>
                <div className="w-2 h-full bg-transparent"></div>
                <div className="w-4 h-full bg-green-400 animate-pulse"></div>
              </div>
              
              {/* Left broken line */}
              <div className="absolute left-0 top-0 w-0.5 h-full flex flex-col">
                <div className="w-full h-3 bg-green-400 animate-pulse"></div>
                <div className="w-full h-2 bg-transparent"></div>
                <div className="w-full h-3 bg-green-400 animate-pulse"></div>
                <div className="w-full h-2 bg-transparent"></div>
                <div className="w-full h-3 bg-green-400 animate-pulse"></div>
                <div className="w-full h-2 bg-transparent"></div>
                <div className="w-full h-3 bg-green-400 animate-pulse"></div>
                <div className="w-full h-2 bg-transparent"></div>
                <div className="w-full h-3 bg-green-400 animate-pulse"></div>
                <div className="w-full h-2 bg-transparent"></div>
                <div className="w-full h-3 bg-green-400 animate-pulse"></div>
                <div className="w-full h-2 bg-transparent"></div>
                <div className="w-full h-3 bg-green-400 animate-pulse"></div>
                <div className="w-full h-2 bg-transparent"></div>
                <div className="w-full h-3 bg-green-400 animate-pulse"></div>
                <div className="w-full h-2 bg-transparent"></div>
                <div className="w-full h-3 bg-green-400 animate-pulse"></div>
                <div className="w-full h-2 bg-transparent"></div>
                <div className="w-full h-3 bg-green-400 animate-pulse"></div>
              </div>
              
              {/* Right broken line */}
              <div className="absolute right-0 top-0 w-0.5 h-full flex flex-col">
                <div className="w-full h-3 bg-green-400 animate-pulse"></div>
                <div className="w-full h-2 bg-transparent"></div>
                <div className="w-full h-3 bg-green-400 animate-pulse"></div>
                <div className="w-full h-2 bg-transparent"></div>
                <div className="w-full h-3 bg-green-400 animate-pulse"></div>
                <div className="w-full h-2 bg-transparent"></div>
                <div className="w-full h-3 bg-green-400 animate-pulse"></div>
                <div className="w-full h-2 bg-transparent"></div>
                <div className="w-full h-3 bg-green-400 animate-pulse"></div>
                <div className="w-full h-2 bg-transparent"></div>
                <div className="w-full h-3 bg-green-400 animate-pulse"></div>
                <div className="w-full h-2 bg-transparent"></div>
                <div className="w-full h-3 bg-green-400 animate-pulse"></div>
                <div className="w-full h-2 bg-transparent"></div>
                <div className="w-full h-3 bg-green-400 animate-pulse"></div>
                <div className="w-full h-2 bg-transparent"></div>
                <div className="w-full h-3 bg-green-400 animate-pulse"></div>
                <div className="w-full h-2 bg-transparent"></div>
                <div className="w-full h-3 bg-green-400 animate-pulse"></div>
              </div>
            </div>
          )}

          {/* Analysis Overlays */}
          {!cameraReady ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
                <p className="text-white">
                  {error ? error : "Initializing camera..."}
                </p>
              </div>
            </div>
          ) : isAnalyzing ? (
            // Analysis Process Illustration
            <div className="absolute inset-4 bg-white/20 backdrop-blur-sm rounded-lg p-6 flex flex-col items-center justify-center">
              <div className="mb-6">
                <div className="relative">
                  <div className="w-20 h-20 mx-auto mb-4 relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 animate-pulse"></div>
                    <div className="absolute inset-2 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center">
                      {React.createElement(analysisIcons[analysisStep], {
                        className: "h-8 w-8 text-pink-600"
                      })}
                    </div>
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full animate-ping"></div>
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white drop-shadow-lg mb-2">AI Lips Analysis</h3>
                <p className="text-white font-medium mb-4 drop-shadow-lg">
                  {analysisSteps[analysisStep]}
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
                    <h3 className="font-bold text-white drop-shadow-lg text-base sm:text-lg">Lips Analysis Complete</h3>
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
                      <p className="font-bold text-white drop-shadow-lg text-xs uppercase tracking-wide">Lip Condition</p>
                      <p className="text-pink-200 font-semibold text-lg">{analysisResult.lips_health.lip_condition}</p>
                    </div>
                    <div className="bg-pink-500/20 backdrop-blur-sm p-3 rounded-lg border border-pink-400/30">
                      <p className="font-bold text-white drop-shadow-lg text-xs uppercase tracking-wide">Health Score</p>
                      <p className="text-pink-200 font-semibold text-lg">{analysisResult.lips_health.overall_score}/100</p>
                    </div>
                    <div className="bg-pink-500/20 backdrop-blur-sm p-3 rounded-lg border border-pink-400/30">
                      <p className="font-bold text-white drop-shadow-lg text-xs uppercase tracking-wide">Hydration</p>
                      <p className="text-pink-200 font-semibold text-lg">{analysisResult.lips_health.hydration_level}</p>
                    </div>
                    <div className="bg-pink-500/20 backdrop-blur-sm p-3 rounded-lg border border-pink-400/30">
                      <p className="font-bold text-white drop-shadow-lg text-xs uppercase tracking-wide">Confidence</p>
                      <p className="text-pink-200 font-semibold text-lg">{Math.round(analysisResult.confidence * 100)}%</p>
                    </div>
                  </div>
                  
                  {/* Lip Conditions */}
                  <div className="bg-purple-500/20 backdrop-blur-sm p-4 rounded-lg border border-purple-400/30">
                    <p className="font-bold text-white drop-shadow-lg mb-3 text-sm uppercase tracking-wide">Lip Conditions</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                        <span className="text-white/90 font-medium">Dryness:</span>
                        <span className="font-bold text-white">{analysisResult.lips_conditions.dryness.severity}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                        <span className="text-white/90 font-medium">Texture:</span>
                        <span className="font-bold text-white">{analysisResult.lips_conditions.texture.smoothness}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                        <span className="text-white/90 font-medium">Color:</span>
                        <span className="font-bold text-white">{analysisResult.lips_health.lip_color}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
                        <span className="text-white/90 font-medium">Volume:</span>
                        <span className="font-bold text-white">{analysisResult.lips_health.lip_volume}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Recommendations for Better Lip Health */}
                  {analysisResult.recommendations && (
                    <div className="space-y-4">
                      <div className="bg-green-500/20 backdrop-blur-sm p-4 rounded-lg border border-green-400/30">
                        <h4 className="font-bold text-green-200 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                          <Droplets className="h-4 w-4" />
                          Daily Lip Care
                        </h4>
                        <div className="space-y-2 text-sm">
                          {analysisResult.recommendations.daily_care.map((care, idx) => (
                            <div key={idx} className="flex items-start gap-2 p-2 bg-white/10 rounded-lg">
                              <span className="text-green-300 mt-1 font-bold">•</span>
                              <span className="text-green-100 font-medium leading-relaxed">{care}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="bg-blue-500/20 backdrop-blur-sm p-4 rounded-lg border border-blue-400/30">
                        <h4 className="font-bold text-blue-200 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                          <Calendar className="h-4 w-4" />
                          Weekly Treatments
                        </h4>
                        <div className="space-y-2 text-sm">
                          {analysisResult.recommendations.weekly_treatments.map((treatment, idx) => (
                            <div key={idx} className="flex items-start gap-2 p-2 bg-white/10 rounded-lg">
                              <span className="text-blue-300 mt-1 font-bold">•</span>
                              <span className="text-blue-100 font-medium leading-relaxed">{treatment}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="bg-purple-500/20 backdrop-blur-sm p-4 rounded-lg border border-purple-400/30">
                        <h4 className="font-bold text-purple-200 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                          <Palette className="h-4 w-4" />
                          Product Recommendations
                        </h4>
                        <div className="space-y-2 text-sm">
                          {analysisResult.recommendations.product_recommendations.map((product, idx) => (
                            <div key={idx} className="flex items-start gap-2 p-2 bg-white/10 rounded-lg">
                              <span className="text-purple-300 mt-1 font-bold">•</span>
                              <span className="text-purple-100 font-medium leading-relaxed">{product}</span>
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
                      
                      <div className="bg-orange-500/20 backdrop-blur-sm p-4 rounded-lg border border-orange-400/30">
                        <h4 className="font-bold text-orange-200 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                          <AlertTriangle className="h-4 w-4" />
                          Harmful Ingredients to Avoid
                        </h4>
                        <div className="space-y-2 text-sm">
                          {analysisResult.avoid_practices.harmful_ingredients.map((ingredient, idx) => (
                            <div key={idx} className="flex items-start gap-2 p-2 bg-white/10 rounded-lg">
                              <span className="text-orange-300 mt-1 font-bold">•</span>
                              <span className="text-orange-100 font-medium leading-relaxed">{ingredient}</span>
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

        {/* Analysis Button */}
        <div className="p-6 bg-white/80 backdrop-blur-sm border-t border-pink-200">
          <Button
            onClick={analyzeLips}
            disabled={isAnalyzing || !cameraReady}
            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            {isAnalyzing ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Analyzing Lips...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Smile className="h-4 w-4" />
                <span>Analyze Lips & Health</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}