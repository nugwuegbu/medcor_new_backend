import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, User as Face, Camera, Loader2, CheckCircle, Eye } from "lucide-react";

interface FaceAnalysisCameraProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FaceAnalysisCamera({ isOpen, onClose }: FaceAnalysisCameraProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Debug log
  console.log('FaceAnalysisCamera render:', { isOpen });
  
  // Test API on component mount
  useEffect(() => {
    if (isOpen) {
      console.log('🟢 FaceAnalysisCamera opened! Testing API...');
      fetch('/api/face-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: 'test_component_mount' })
      })
      .then(res => res.json())
      .then(data => {
        console.log('✅ API test from component SUCCESS:', data);
      })
      .catch(err => {
        console.error('❌ API test failed:', err);
      });
    }
  }, [isOpen]);

  // Remove portal - render directly
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'auto';
        stopCamera();
      };
    }
  }, [isOpen]);

  // Use existing camera stream from widget if available
  const connectToExistingCamera = useCallback(() => {
    const existingVideo = document.querySelector('video') as HTMLVideoElement;
    if (existingVideo && existingVideo.srcObject) {
      console.log('Found existing camera stream');
      const stream = existingVideo.srcObject as MediaStream;
      setCameraStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsRecording(true);
      }
      return true;
    }
    return false;
  }, []);

  // Start new camera if no existing stream
  const startNewCamera = useCallback(async () => {
    try {
      console.log('Starting new camera stream');
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported in this browser');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        } 
      });
      
      console.log('Camera stream obtained:', stream);
      setCameraStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsRecording(true);
        console.log('Video playing successfully');
      }
      
      setError(null);
    } catch (err) {
      console.error('Camera error:', err);
      setError(`Camera access failed: ${err.message}`);
    }
  }, []);

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen && !cameraStream) {
      // Try to connect to existing camera first
      if (!connectToExistingCamera()) {
        // If no existing camera, start new one
        startNewCamera();
      }
    }
  }, [isOpen, cameraStream, connectToExistingCamera, startNewCamera]);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsRecording(false);
  }, [cameraStream]);

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Camera not ready');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Could not get canvas context');
      }

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      context.drawImage(video, 0, 0);
      
      // Convert to base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      const base64Data = imageData.split(',')[1];
      
      console.log('Captured image, analyzing with Perfect Corp API...');
      
      // Send to backend for analysis
      const response = await fetch('/api/face-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data })
      });
      
      const data = await response.json();
      console.log('Perfect Corp API response:', data);
      
      if (data.success) {
        setResult(data.result);
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const resetAnalysis = useCallback(() => {
    setResult(null);
    setError(null);
    
    // Restart camera if needed
    if (!cameraStream) {
      if (!connectToExistingCamera()) {
        startNewCamera();
      }
    }
  }, [cameraStream, connectToExistingCamera, startNewCamera]);

  if (!isOpen) {
    console.log('❌ FaceAnalysisCamera NOT rendering - isOpen is false');
    return null;
  }
  
  // Debug log
  console.log('✅ FaceAnalysisCamera SHOULD render modal now - isOpen is true');

  const modalContent = (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999999,
        pointerEvents: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '32px',
          width: '650px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative',
          overflow: 'auto'
        }}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px',
          borderBottom: '2px solid #e5e7eb',
          paddingBottom: '16px'
        }}>
          <h2 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: '#1f2937', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            margin: 0
          }}>
            <Eye size={28} style={{ color: '#7c3aed' }} />
            Live Face Analysis
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Camera Status */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isRecording ? (
              <CheckCircle size={16} style={{ color: '#059669' }} />
            ) : (
              <Loader2 size={16} className="animate-spin" style={{ color: '#7c3aed' }} />
            )}
            <span style={{ fontSize: '14px', color: isRecording ? '#059669' : '#6b7280' }}>
              Camera: {isRecording ? 'Live' : 'Connecting...'}
            </span>
          </div>
        </div>

        {/* Video Display */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ 
            position: 'relative',
            width: '480px',
            height: '360px',
            margin: '0 auto',
            border: '3px solid #7c3aed',
            borderRadius: '16px',
            overflow: 'hidden',
            backgroundColor: '#f8fafc'
          }}>
            <video
              ref={videoRef}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              autoPlay
              muted
              playsInline
            />
            
            {!isRecording && (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                color: 'white'
              }}>
                <Camera size={48} style={{ marginBottom: '12px' }} />
                <p style={{ fontSize: '16px', margin: 0 }}>Connecting to camera...</p>
              </div>
            )}
          </div>
        </div>

        {/* Analysis Button */}
        {!result && isRecording && (
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <button
              onClick={captureAndAnalyze}
              disabled={loading}
              style={{
                padding: '16px 32px',
                backgroundColor: loading ? '#9ca3af' : '#7c3aed',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                margin: '0 auto'
              }}
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Face size={20} />}
              {loading ? 'Analyzing...' : 'Analyze My Face'}
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#fef2f2', 
            border: '1px solid #fecaca',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <p style={{ color: '#dc2626', fontSize: '14px', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div style={{ 
            padding: '24px', 
            backgroundColor: '#f0fdf4', 
            border: '2px solid #bbf7d0',
            borderRadius: '16px',
            marginBottom: '20px'
          }}>
            <h3 style={{ 
              fontWeight: '700', 
              color: '#059669', 
              marginBottom: '20px',
              fontSize: '20px',
              textAlign: 'center'
            }}>
              Perfect Corp Analysis Results
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '16px',
              fontSize: '15px'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '12px 16px',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #bbf7d0'
              }}>
                <span style={{ color: '#374151', fontWeight: '500' }}>Age:</span>
                <span style={{ fontWeight: '700', color: '#059669' }}>{result.age} years</span>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '12px 16px',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #bbf7d0'
              }}>
                <span style={{ color: '#374151', fontWeight: '500' }}>Gender:</span>
                <span style={{ fontWeight: '700', color: '#059669' }}>{result.gender}</span>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '12px 16px',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #bbf7d0'
              }}>
                <span style={{ color: '#374151', fontWeight: '500' }}>Emotion:</span>
                <span style={{ fontWeight: '700', color: '#059669' }}>{result.emotion}</span>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '12px 16px',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #bbf7d0'
              }}>
                <span style={{ color: '#374151', fontWeight: '500' }}>Beauty Score:</span>
                <span style={{ fontWeight: '700', color: '#059669' }}>{result.beauty_score}/100</span>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '12px 16px',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #bbf7d0'
              }}>
                <span style={{ color: '#374151', fontWeight: '500' }}>Face Shape:</span>
                <span style={{ fontWeight: '700', color: '#059669' }}>{result.face_shape}</span>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '12px 16px',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #bbf7d0'
              }}>
                <span style={{ color: '#374151', fontWeight: '500' }}>Skin Tone:</span>
                <span style={{ fontWeight: '700', color: '#059669' }}>{result.skin_tone}</span>
              </div>
            </div>
            
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                onClick={resetAnalysis}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#7c3aed',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Analyze Again
              </button>
            </div>
          </div>
        )}

        {/* Hidden canvas for image capture */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );

  // Render directly without portal
  return modalContent;
}