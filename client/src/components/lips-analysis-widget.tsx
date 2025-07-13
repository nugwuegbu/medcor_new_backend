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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const analysisSteps = [
    "Capturing lip image...",
    "Analyzing lip texture and color...",
    "Detecting lip conditions...",
    "Generating personalized recommendations...",
    "Finalizing lip analysis..."
  ];

  const analysisIcons = [Camera, Eye, Sparkles, Brain, Zap];

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
  };

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
              <div className="w-32 h-16 border-2 border-pink-400 rounded-full border-dashed animate-pulse"></div>
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                <div className="bg-pink-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Position lips here
                </div>
              </div>
            </div>
          </div>

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
              <div className="absolute inset-4 bg-white/20 backdrop-blur-sm rounded-lg p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <h3 className="font-semibold text-white drop-shadow-lg">Lips Analysis Complete</h3>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={resetAnalysis}
                      variant="outline"
                      size="sm"
                      className="text-xs bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      New Analysis
                    </Button>
                    <Button
                      onClick={onClose}
                      variant="outline"
                      size="sm"
                      className="text-xs bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Close
                    </Button>
                  </div>
                </div>
                
                {/* Results */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="font-medium text-white drop-shadow-lg">Lip Condition</p>
                      <p className="text-pink-300 font-semibold">{analysisResult.lips_health.lip_condition}</p>
                    </div>
                    <div>
                      <p className="font-medium text-white drop-shadow-lg">Health Score</p>
                      <p className="text-pink-300 font-semibold">{analysisResult.lips_health.overall_score}/100</p>
                    </div>
                    <div>
                      <p className="font-medium text-white drop-shadow-lg">Hydration</p>
                      <p className="text-pink-300 font-semibold">{analysisResult.lips_health.hydration_level}</p>
                    </div>
                    <div>
                      <p className="font-medium text-white drop-shadow-lg">Confidence</p>
                      <p className="text-pink-300 font-semibold">{Math.round(analysisResult.confidence * 100)}%</p>
                    </div>
                  </div>
                  
                  {/* Lip Conditions */}
                  <div>
                    <p className="font-medium text-white drop-shadow-lg mb-2">Lip Conditions</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-white/80">Dryness:</span>
                        <span className="font-medium text-white">{analysisResult.lips_conditions.dryness.severity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/80">Texture:</span>
                        <span className="font-medium text-white">{analysisResult.lips_conditions.texture.smoothness}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/80">Color:</span>
                        <span className="font-medium text-white">{analysisResult.lips_health.lip_color}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/80">Volume:</span>
                        <span className="font-medium text-white">{analysisResult.lips_health.lip_volume}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Recommendations for Better Lip Health */}
                  {analysisResult.recommendations && (
                    <div className="space-y-3">
                      <div className="bg-green-500/20 backdrop-blur-sm p-3 rounded-lg border border-green-400/30">
                        <h4 className="font-semibold text-green-200 mb-2 flex items-center gap-2">
                          <Droplets className="h-4 w-4" />
                          💧 Daily Lip Care
                        </h4>
                        <div className="space-y-1 text-xs">
                          {analysisResult.recommendations.daily_care.map((care, idx) => (
                            <div key={idx} className="flex items-start gap-1">
                              <span className="text-green-300 mt-1">•</span>
                              <span className="text-green-100">{care}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="bg-blue-500/20 backdrop-blur-sm p-3 rounded-lg border border-blue-400/30">
                        <h4 className="font-semibold text-blue-200 mb-2 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          📅 Weekly Treatments
                        </h4>
                        <div className="space-y-1 text-xs">
                          {analysisResult.recommendations.weekly_treatments.map((treatment, idx) => (
                            <div key={idx} className="flex items-start gap-1">
                              <span className="text-blue-300 mt-1">•</span>
                              <span className="text-blue-100">{treatment}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="bg-purple-500/20 backdrop-blur-sm p-3 rounded-lg border border-purple-400/30">
                        <h4 className="font-semibold text-purple-200 mb-2 flex items-center gap-2">
                          <Palette className="h-4 w-4" />
                          💄 Product Recommendations
                        </h4>
                        <div className="space-y-1 text-xs">
                          {analysisResult.recommendations.product_recommendations.map((product, idx) => (
                            <div key={idx} className="flex items-start gap-1">
                              <span className="text-purple-300 mt-1">•</span>
                              <span className="text-purple-100">{product}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Things to Avoid */}
                  {analysisResult.avoid_practices && (
                    <div className="space-y-3">
                      <div className="bg-red-500/20 backdrop-blur-sm p-3 rounded-lg border border-red-400/30">
                        <h4 className="font-semibold text-red-200 mb-2 flex items-center gap-2">
                          <X className="h-4 w-4" />
                          ❌ Daily Mistakes to Avoid
                        </h4>
                        <div className="space-y-1 text-xs">
                          {analysisResult.avoid_practices.daily_mistakes.map((mistake, idx) => (
                            <div key={idx} className="flex items-start gap-1">
                              <span className="text-red-300 mt-1">•</span>
                              <span className="text-red-100">{mistake}</span>
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