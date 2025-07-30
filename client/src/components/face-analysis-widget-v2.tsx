import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Camera, Loader2, User as Face, FileText, AlertCircle, RefreshCw } from "lucide-react";
import FaceAnalysisReportForm from "./face-analysis-report-form";

interface FaceAnalysisWidgetV2Props {
  isOpen: boolean;
  onClose: () => void;
  videoStream: MediaStream | null;
}

export default function FaceAnalysisWidgetV2({ isOpen, onClose, videoStream }: FaceAnalysisWidgetV2Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Setup video stream from parent - similar to hair/lips widgets with retry logic
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 10;
    
    const setupVideoStream = () => {
      console.log("🎬 FACE V2 DEBUG: Setting up video stream, retry count:", retryCount);
      
      if (!videoStream) {
        console.log("🎬 FACE V2 DEBUG: No video stream provided yet");
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(setupVideoStream, 500);
        }
        return;
      }
      
      const videoEl = videoRef.current;
      if (!videoEl) {
        console.log("🎬 FACE V2 DEBUG: Video element not ready");
        if (retryCount < maxRetries) {
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
      
      console.log("🎬 FACE V2 DEBUG: Video element setup complete, waiting for ready state");
      
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
      
      // Cleanup function
      return () => {
        videoEl.removeEventListener('loadedmetadata', onLoadedMetadata);
        videoEl.removeEventListener('loadeddata', onLoadedData);
        videoEl.removeEventListener('canplay', onCanPlay);
      };
    };
    
    // Start the setup process
    setupVideoStream();
    
    // Cleanup
    return () => {
      console.log('Face Analysis V2: Cleanup');
      isMounted = false;
      setCameraReady(false);
    };
  }, [videoStream]);

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) {
      setError('Camera not ready. Please wait a moment and try again.');
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Failed to get canvas context');
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      console.log('Face Analysis V2: Capturing image, dimensions:', canvas.width, 'x', canvas.height);

      // Draw the current video frame to canvas
      context.drawImage(video, 0, 0);

      // Convert to base64
      const imageBase64 = canvas.toDataURL('image/png').split(',')[1];
      
      console.log('Face Analysis V2: Image captured, size:', imageBase64.length);
      return imageBase64;
    } catch (err) {
      console.error('Face Analysis V2: Error capturing image:', err);
      throw err;
    }
  };

  const analyzeImage = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Capture the image
      const imageBase64 = await captureImage();
      if (!imageBase64) {
        throw new Error('Failed to capture image');
      }

      console.log('Face Analysis V2: Sending to API...');

      // Send to backend API
      const response = await fetch('/api/face-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageBase64 }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Face analysis failed');
      }

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

  if (!isOpen) return null;

  // Show error state if no video stream
  if (!videoStream) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="text-center bg-white/90 backdrop-blur-sm rounded-lg p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Camera Access</h3>
          <p className="text-gray-600 text-sm">Face analysis requires camera access. Please ensure camera is enabled.</p>
          <Button onClick={onClose} className="mt-4" size="sm">Close</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Video preview - contained within widget bounds */}
      <div className="relative flex-1 flex items-center justify-center p-4">
        <video
          ref={videoRef}
          className="w-full h-full max-h-[250px] rounded-lg shadow-md object-cover bg-black"
          autoPlay
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Camera status */}
      {!cameraReady && !result && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg">
          <div className="text-center">
            <Loader2 className="animate-spin h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-gray-600">Initializing camera...</p>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="absolute bottom-4 left-4 right-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Control buttons */}
      {!result && (
        <div className="p-4 flex gap-3 justify-center bg-white/90 backdrop-blur-sm">
          <Button
            onClick={analyzeImage}
            disabled={!cameraReady || loading}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
            size="sm"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Face className="mr-2 h-4 w-4" />
                Analyze Face
              </>
            )}
          </Button>
          <Button variant="outline" onClick={onClose} size="sm">
            Cancel
          </Button>
        </div>
      )}

      {/* Results display - scrollable container */}
      {result && !showReportForm && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white/90 backdrop-blur-sm">
          {/* Beauty Score */}
          <div className="text-center py-2">
            <h3 className="text-xl font-bold text-purple-700">
              Beauty Score: {result.beauty_score || 85}/100
            </h3>
            <p className="text-sm text-gray-600">Face Shape: {result.face_shape || 'Oval'}</p>
          </div>

          {/* Skin Analysis */}
          {result.skin_analysis && (
            <div className="bg-purple-50/80 backdrop-blur-sm p-3 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2 text-sm">Skin Analysis</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Texture: {result.skin_analysis.texture?.description || 'Normal'}</div>
                <div>Hydration: {result.skin_analysis.hydration?.level || 'Balanced'}</div>
                <div>Oiliness: {result.skin_analysis.oiliness?.overall || 'Normal'}</div>
                <div>Spots: {result.skin_analysis.spots?.score || 90}/100</div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations && (
            <div className="bg-blue-50/80 backdrop-blur-sm p-3 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2 text-sm">Recommendations</h4>
              <ul className="list-disc list-inside text-xs text-gray-700 space-y-1">
                {result.recommendations.skincare_routine?.slice(0, 3).map((rec: string, idx: number) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Action buttons for results */}
      {result && !showReportForm && (
        <div className="p-4 flex gap-3 justify-center bg-white/90 backdrop-blur-sm border-t">
          <Button
            onClick={() => setShowReportForm(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
            size="sm"
          >
            <FileText className="mr-2 h-4 w-4" />
            Get Report
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setResult(null);
              setError(null);
            }}
            size="sm"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            New Analysis
          </Button>
        </div>
      )}

      {/* Report form */}
      {showReportForm && result && (
        <FaceAnalysisReportForm
          isOpen={showReportForm}
          analysisResult={result}
          onClose={() => setShowReportForm(false)}
          onSubmit={async (formData: {
            patientName: string;
            patientEmail: string;
            patientPhone: string;
            patientJob: string;
          }) => {
            console.log('Face Analysis V2: Report requested for:', formData.patientEmail);
            setShowReportForm(false);
          }}
        />
      )}
    </div>
  );
}