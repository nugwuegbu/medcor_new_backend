import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { X, Crown, Upload, Sparkles, Palette, RefreshCw, Download, ChevronLeft, ChevronRight, Loader2, Camera } from 'lucide-react';
import { videoStreamRef, ensureCameraReady } from "../utils/camera-manager";

interface HairExtensionWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HairExtensionStyle {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  description: string;
  length: string;
  texture: string;
  color: string;
}

interface HairExtensionCategory {
  id: string;
  name: string;
  icon: string;
  styles: HairExtensionStyle[];
}

const HairExtensionWidget: React.FC<HairExtensionWidgetProps> = ({ isOpen, onClose }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [categories, setCategories] = useState<HairExtensionCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<HairExtensionStyle | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'select' | 'process' | 'result'>('upload');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize hair extension categories and styles
  useEffect(() => {
    if (isOpen) {
      loadHairExtensionStyles();
      setCurrentStep('upload');
      setSelectedImage(null);
      setProcessedImage(null);
      setError(null);
      // Auto-start camera when widget opens
      requestCameraPermission();
    }
    
    // Cleanup camera when widget closes
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
    };
  }, [isOpen]);

  const loadHairExtensionStyles = async () => {
    try {
      const response = await fetch('/api/hair-extension/styles');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || getMockCategories());
      } else {
        setCategories(getMockCategories());
      }
    } catch (error) {
      console.error('Failed to load hair extension styles:', error);
      setCategories(getMockCategories());
    }
  };

  // Camera functions - Fixed initialization
  const requestCameraPermission = async () => {
    try {
      console.log('📷 Hair Extension: Requesting camera permission...');
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        } 
      });
      
      console.log('📷 Hair Extension: Camera stream obtained');
      setCameraStream(stream);
      setHasPermission(true);
      setShowCamera(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;
        
        // Multiple event handlers for better compatibility
        videoRef.current.onloadedmetadata = () => {
          console.log('📷 Hair Extension: Video metadata loaded');
          if (videoRef.current) {
            videoRef.current.play().catch(console.error);
          }
        };
        
        videoRef.current.oncanplay = () => {
          console.log('📷 Hair Extension: Video can play');
        };
        
        // Force play after short delay
        setTimeout(() => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            videoRef.current.play().catch(console.error);
          }
        }, 100);
      }
    } catch (error) {
      console.error('📷 Hair Extension: Camera access denied:', error);
      setError('Camera access is required for hair extension preview. Please enable camera permissions.');
      setHasPermission(false);
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setSelectedImage(imageData);
        setCurrentStep('select');
        setShowCamera(false);
        
        // Stop camera stream after capture
        if (cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop());
          setCameraStream(null);
        }
        
        console.log('📷 Hair Extension: Photo captured successfully');
      }
    }
  };

  const retakePhoto = () => {
    setSelectedImage(null);
    setCurrentStep('upload');
    requestCameraPermission();
  };

  const getMockCategories = (): HairExtensionCategory[] => [
    {
      id: 'long-straight',
      name: 'Long & Straight',
      icon: '💇‍♀️',
      styles: [
        {
          id: 'classic-long',
          name: 'Classic Long',
          category: 'long-straight',
          thumbnail: '/api/placeholder/hair-extension-1.jpg',
          description: 'Elegant long straight hair extension',
          length: '24 inches',
          texture: 'Straight',
          color: 'Natural Brown'
        },
        {
          id: 'silky-straight',
          name: 'Silky Straight',
          category: 'long-straight',
          thumbnail: '/api/placeholder/hair-extension-2.jpg',
          description: 'Ultra-smooth silky straight extensions',
          length: '22 inches',
          texture: 'Straight',
          color: 'Blonde'
        }
      ]
    },
    {
      id: 'curly-wavy',
      name: 'Curly & Wavy',
      icon: '🌊',
      styles: [
        {
          id: 'beach-waves',
          name: 'Beach Waves',
          category: 'curly-wavy',
          thumbnail: '/api/placeholder/hair-extension-3.jpg',
          description: 'Natural beach wave texture',
          length: '20 inches',
          texture: 'Wavy',
          color: 'Caramel'
        },
        {
          id: 'spiral-curls',
          name: 'Spiral Curls',
          category: 'curly-wavy',
          thumbnail: '/api/placeholder/hair-extension-4.jpg',
          description: 'Bouncy spiral curl pattern',
          length: '18 inches',
          texture: 'Curly',
          color: 'Dark Brown'
        }
      ]
    },
    {
      id: 'color-fantasy',
      name: 'Color Fantasy',
      icon: '🎨',
      styles: [
        {
          id: 'rainbow-ombre',
          name: 'Rainbow Ombre',
          category: 'color-fantasy',
          thumbnail: '/api/placeholder/hair-extension-5.jpg',
          description: 'Vibrant rainbow ombre effect',
          length: '26 inches',
          texture: 'Straight',
          color: 'Rainbow'
        },
        {
          id: 'pastel-pink',
          name: 'Pastel Pink',
          category: 'color-fantasy',
          thumbnail: '/api/placeholder/hair-extension-6.jpg',
          description: 'Soft pastel pink extensions',
          length: '24 inches',
          texture: 'Wavy',
          color: 'Pastel Pink'
        }
      ]
    }
  ];

  const captureFromCamera = async () => {
    try {
      if (videoStreamRef.current && videoRef.current) {
        const canvas = document.createElement('canvas');
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const imageData = canvas.toDataURL('image/jpeg', 0.8);
          setSelectedImage(imageData);
          setCurrentStep('select');
        }
      }
    } catch (error) {
      console.error('Error capturing from camera:', error);
      setError('Failed to capture image from camera');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setCurrentStep('select');
      };
      reader.readAsDataURL(file);
    }
  };

  const processHairExtension = async () => {
    if (!selectedImage || !selectedStyle) return;

    setIsProcessing(true);
    setCurrentStep('process');
    setAnalysisProgress(0);
    setError(null);

    try {
      // Simulate processing steps
      const steps = [
        { message: 'Uploading image...', progress: 20 },
        { message: 'Analyzing facial features...', progress: 40 },
        { message: 'Detecting hair structure...', progress: 60 },
        { message: 'Applying hair extension...', progress: 80 },
        { message: 'Finalizing result...', progress: 100 }
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setAnalysisProgress(step.progress);
      }

      // Process the hair extension
      const response = await fetch('/api/hair-extension/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: selectedImage,
          styleId: selectedStyle.id,
          category: selectedStyle.category
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setProcessedImage(result.processedImage);
        setCurrentStep('result');
      } else {
        throw new Error('Failed to process hair extension');
      }
    } catch (error) {
      console.error('Hair extension processing error:', error);
      setError('Failed to process hair extension. Please try again.');
      setCurrentStep('select');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (processedImage) {
      const link = document.createElement('a');
      link.href = processedImage;
      link.download = `hair-extension-${Date.now()}.jpg`;
      link.click();
    }
  };

  const resetWidget = () => {
    setSelectedImage(null);
    setProcessedImage(null);
    setSelectedStyle(null);
    setCurrentStep('upload');
    setError(null);
    setAnalysisProgress(0);
  };

  // Setup camera stream - enhanced initialization
  useEffect(() => {
    if (isOpen && videoRef.current && videoStreamRef.current) {
      const video = videoRef.current;
      video.srcObject = videoStreamRef.current;
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      
      video.onloadedmetadata = () => {
        console.log('📷 Hair Extension: Shared video metadata loaded');
        video.play().catch(console.error);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">AI Hair Extension</h2>
                <p className="text-purple-100">Transform your look with virtual hair extensions</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Step 1: Upload Image */}
          {currentStep === 'upload' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-4">Upload Your Photo</h3>
                <p className="text-gray-600 mb-6">Choose a photo or capture from camera to try hair extensions</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Camera Capture */}
                <div className="bg-gray-50 rounded-xl p-6 text-center">
                  <h4 className="font-semibold mb-4">Capture from Camera</h4>
                  {showCamera && cameraStream ? (
                    <div className="space-y-4">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-48 object-cover rounded-lg bg-gray-200"
                      />
                      <Button
                        onClick={capturePhoto}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Capture Photo
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                        {hasPermission ? (
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                            <p className="text-gray-500">Starting camera...</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="h-12 w-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                              <Sparkles className="h-6 w-6 text-white" />
                            </div>
                            <p className="text-gray-500">Camera access required</p>
                          </div>
                        )}
                      </div>
                      {!hasPermission && (
                        <Button
                          onClick={requestCameraPermission}
                          className="w-full bg-purple-600 hover:bg-purple-700"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Enable Camera
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* File Upload */}
                <div className="bg-gray-50 rounded-xl p-6 text-center">
                  <h4 className="font-semibold mb-4">Upload from Device</h4>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-purple-500 transition-colors">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-4">Click to upload or drag & drop</p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="border-purple-600 text-purple-600 hover:bg-purple-50"
                    >
                      Choose File
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Select Hair Extension Style */}
          {currentStep === 'select' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentStep('upload')}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div>
                  <h3 className="text-xl font-semibold">Choose Hair Extension Style</h3>
                  <p className="text-gray-600">Select the perfect hair extension for your look</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Selected Image Preview */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold mb-3">Your Photo</h4>
                  {selectedImage && (
                    <img
                      src={selectedImage}
                      alt="Selected"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                </div>

                {/* Categories */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Categories</h4>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full p-3 rounded-lg text-left transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{category.icon}</span>
                          <span className="font-medium">{category.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Styles */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Hair Styles</h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {selectedCategory && categories
                      .find(cat => cat.id === selectedCategory)
                      ?.styles.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => setSelectedStyle(style)}
                          className={`w-full p-3 rounded-lg text-left transition-colors ${
                            selectedStyle?.id === style.id
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="font-medium">{style.name}</div>
                            <div className="text-sm opacity-75">
                              {style.length} • {style.texture} • {style.color}
                            </div>
                            <div className="text-xs opacity-60">{style.description}</div>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              {/* Apply Button */}
              {selectedStyle && (
                <div className="flex justify-center">
                  <Button
                    onClick={processHairExtension}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3"
                    disabled={isProcessing}
                  >
                    <Crown className="h-5 w-5 mr-2" />
                    Apply Hair Extension
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Processing */}
          {currentStep === 'process' && (
            <div className="space-y-6 text-center">
              <div className="mx-auto w-24 h-24 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                <Loader2 className="h-12 w-12 text-white animate-spin" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Processing Your Hair Extension</h3>
                <p className="text-gray-600">Please wait while we apply your selected hair extension style</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${analysisProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500">{analysisProgress}% complete</p>
            </div>
          )}

          {/* Step 4: Result */}
          {currentStep === 'result' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Your Hair Extension Result</h3>
                <p className="text-gray-600">Here's how you look with your new hair extension!</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Before */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-center">Before</h4>
                  {selectedImage && (
                    <img
                      src={selectedImage}
                      alt="Before"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  )}
                </div>

                {/* After */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-center">After</h4>
                  {processedImage && (
                    <img
                      src={processedImage}
                      alt="After"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-4">
                <Button
                  onClick={downloadResult}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Result
                </Button>
                <Button
                  onClick={resetWidget}
                  variant="outline"
                  className="border-purple-600 text-purple-600 hover:bg-purple-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Another Style
                </Button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-600">{error}</p>
              <Button
                onClick={() => setError(null)}
                variant="outline"
                className="mt-2 border-red-300 text-red-600 hover:bg-red-50"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HairExtensionWidget;