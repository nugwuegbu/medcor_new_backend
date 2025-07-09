import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw, Download, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { Scissors } from 'lucide-react';

interface Window {
  YCE: {
    init: (options: any) => void;
    isInitialized: () => boolean;
    captureImage: () => Promise<any>;
    destroy: () => void;
  };
}

declare let window: Window;

interface HairAnalysisWidgetProps {
  onClose: () => void;
  videoStream?: MediaStream | null;
  capturePhotoRef?: React.MutableRefObject<(() => string | null) | null>;
  streamReady?: boolean;
}

interface HairAnalysisResult {
  hairType: string;
  hairCondition: string;
  scalpHealth: string;
  recommendations: string[];
  confidence: number;
}

export default function HairAnalysisWidget({ onClose, videoStream, capturePhotoRef, streamReady }: HairAnalysisWidgetProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<HairAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isYCEInitialized, setIsYCEInitialized] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("🎬 HAIR DEBUG: Hair analysis widget useEffect triggered");
    console.log("🎬 HAIR DEBUG: videoStream:", videoStream);
    console.log("🎬 HAIR DEBUG: streamReady:", streamReady);
    console.log("🎬 HAIR DEBUG: videoRef.current:", videoRef.current);
    
    if (streamReady && videoStream && videoRef.current) {
      console.log("🎬 HAIR DEBUG: Using shared video stream - stream ready");
      videoRef.current.srcObject = videoStream;
      videoRef.current.play().then(() => {
        setIsYCEInitialized(true);
        console.log("🎬 HAIR DEBUG: Video playing successfully");
      }).catch((error) => {
        console.error("🎬 HAIR ERROR: Video play failed:", error);
        setError("Failed to play video stream");
      });
    } else if (!streamReady || !videoStream) {
      console.log("🎬 HAIR DEBUG: Stream not ready yet, showing initializing message");
      setIsYCEInitialized(false);
    }

    return () => {
      console.log("🎬 HAIR DEBUG: Hair analysis cleanup");
      // Don't stop the stream if it's shared - let the main component handle it
      if (!videoStream && videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [videoStream, streamReady]);

  const analyzeHair = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      let imageBase64: string;

      // Use the shared camera capture function if available
      if (capturePhotoRef && capturePhotoRef.current) {
        console.log("🎬 HAIR DEBUG: Using shared camera capture function");
        const capturedImage = capturePhotoRef.current();
        if (capturedImage) {
          imageBase64 = capturedImage;
          console.log("🎬 HAIR DEBUG: Image captured from shared camera");
        } else {
          throw new Error('Failed to capture image from shared camera');
        }
      } else {
        // Fallback to local camera capture using HTML5 Canvas
        console.log("🎬 HAIR DEBUG: Using fallback canvas capture");
        const video = videoRef.current;
        
        if (!video || !video.videoWidth || !video.videoHeight) {
          throw new Error('Video not ready for capture');
        }

        // Create hidden canvas for capture
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
        const fullImageBase64 = canvas.toDataURL('image/jpeg', 0.8);
        imageBase64 = fullImageBase64.split(',')[1]; // Remove data:image/jpeg;base64, prefix
        console.log("🎬 HAIR DEBUG: Image captured via canvas");
      }
      
      // Send to backend API
      const response = await fetch('/api/hair-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: imageBase64,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.result) {
        const analysis: HairAnalysisResult = {
          hairType: `${result.result.hair_type?.curl_pattern || 'Normal'} - ${result.result.hair_type?.texture || 'Medium'} texture`,
          hairCondition: `${result.result.hair_condition?.damage_level || 'Healthy'} (Health Score: ${result.result.hair_condition?.health_score || 85}%)`,
          scalpHealth: result.result.scalp_analysis?.condition || 'Good',
          recommendations: result.result.hair_care_routine || [
            'Use moisturizing shampoo and conditioner',
            'Avoid excessive heat styling',
            'Regular scalp massage to improve circulation'
          ],
          confidence: result.result.confidence || 0.85
        };
        setAnalysisResult(analysis);
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      console.error('Hair analysis error:', error);
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
    <div className="flex flex-col h-full bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="text-center py-6 bg-white/80 backdrop-blur-sm border-b border-purple-200">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Scissors className="h-8 w-8 text-purple-600" />
          <h1 className="text-2xl font-bold text-purple-800">Hair Analysis</h1>
        </div>
        <p className="text-gray-600 text-sm">Advanced hair and scalp health assessment</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {!analysisResult ? (
          <div className="h-full flex flex-col">
            {/* Camera Container */}
            <div className="flex-1 relative bg-black/5 border-2 border-dashed border-purple-300 m-4 rounded-lg overflow-hidden">
              <div 
                ref={containerRef}
                className="absolute inset-0 flex items-center justify-center"
              >
                {!isYCEInitialized ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">
                      {error ? error : "Initializing camera..."}
                    </p>
                  </div>
                ) : (
                  <div className="relative w-full h-full">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover rounded-lg"
                      autoPlay
                      playsInline
                      muted
                    />
                    <canvas
                      ref={canvasRef}
                      className="hidden"
                    />
                    <div className="absolute bottom-4 left-4 right-4 text-center">
                      <p className="text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                        Position your head in the camera frame
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Analysis Button */}
            <div className="p-6 bg-white/80 backdrop-blur-sm border-t border-purple-200">
              <Button
                onClick={analyzeHair}
                disabled={isAnalyzing || !isYCEInitialized}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
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
                <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-6 space-y-6">
            {/* Results Header */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-800">Analysis Complete</h2>
              </div>
              <p className="text-sm text-gray-600">
                Confidence: {Math.round(analysisResult.confidence * 100)}%
              </p>
            </div>

            {/* Results Cards */}
            <div className="space-y-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-purple-200">
                <h3 className="font-semibold text-purple-800 mb-2">Hair Type</h3>
                <p className="text-gray-700">{analysisResult.hairType}</p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-purple-200">
                <h3 className="font-semibold text-purple-800 mb-2">Hair Condition</h3>
                <p className="text-gray-700">{analysisResult.hairCondition}</p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-purple-200">
                <h3 className="font-semibold text-purple-800 mb-2">Scalp Health</h3>
                <p className="text-gray-700">{analysisResult.scalpHealth}</p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-purple-200">
                <h3 className="font-semibold text-purple-800 mb-2">Recommendations</h3>
                <ul className="space-y-2">
                  {analysisResult.recommendations.map((rec, index) => (
                    <li key={index} className="text-gray-700 text-sm flex items-start gap-2">
                      <span className="text-purple-600 font-bold">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={resetAnalysis}
                variant="outline"
                className="flex-1 border-purple-300 text-purple-600 hover:bg-purple-50"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                New Analysis
              </Button>
              <Button
                onClick={downloadReport}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}