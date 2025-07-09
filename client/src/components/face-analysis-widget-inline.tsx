import { useState, useRef } from 'react';
import { ChevronLeft, Camera, Loader2, User as Face, FileText } from "lucide-react";
import FaceAnalysisReportForm from "./face-analysis-report-form";

interface FaceAnalysisWidgetInlineProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FaceAnalysisWidgetInline({ isOpen, onClose }: FaceAnalysisWidgetInlineProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' }
      });
      
      streamRef.current = stream;
      setCameraActive(true);
      setError(null);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {
          // Ignore play errors during HMR
        });
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Camera access denied. Please check your camera permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const analyzeImage = async () => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) return;

    setLoading(true);
    setError(null);
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      const base64Data = imageData.split(',')[1];
      
      const response = await fetch('/api/face-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResult(data.result);
        stopCamera();
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      console.error('Analysis error:', err);
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
        className="absolute top-[85px] left-[25px] flex items-center gap-1 px-4 py-2 bg-purple-600 text-white rounded-md shadow-md hover:shadow-lg hover:bg-purple-700 transition-all transform hover:scale-105 z-50"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="font-medium text-sm">Back</span>
      </button>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 pt-24">
        {!result ? (
          <div className="w-full max-w-sm">
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
                    <p className="text-sm">Camera not ready</p>
                  </div>
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-600 text-sm">{error}</p>
                <button 
                  onClick={startCamera}
                  className="mt-2 text-blue-600 hover:underline text-sm"
                >
                  Restart Camera
                </button>
              </div>
            )}

            {/* Start/Analyze Buttons */}
            {!cameraActive ? (
              <button
                onClick={startCamera}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-all"
              >
                <Camera size={20} />
                Start Camera
              </button>
            ) : (
              <button
                onClick={analyzeImage}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-all disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Face size={20} />}
                {loading ? 'Analyzing...' : 'Analyze My Face'}
              </button>
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
                </div>
              </div>

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