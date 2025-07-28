import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, User as Face, Camera, Loader2, CheckCircle, Eye } from "lucide-react";
import { ensureCameraReady, getCameraStream, videoStreamRef } from '@/utils/camera-manager';

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

  // Use shared camera manager for consistency with other analysis components
  const connectToSharedCamera = useCallback(async () => {
    try {
      console.log('🔴 FACE: Connecting to shared camera system...');
      
      // Get stream from shared camera manager
      const stream = await ensureCameraReady();
      console.log('🔴 FACE: Got shared camera stream:', stream);
      
      setCameraStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsRecording(true);
        console.log('🔴 FACE: Video playing successfully');
      }
      
      setError(null);
    } catch (err) {
      console.error('🔴 FACE: Camera access failed:', err);
      setError(`Camera access failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, []);

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen && !cameraStream) {
      console.log('🔴 FACE: Modal opened, initializing camera...');
      connectToSharedCamera();
    }
  }, [isOpen, cameraStream, connectToSharedCamera]);

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
      connectToSharedCamera();
    }
  }, [cameraStream, connectToSharedCamera]);

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
              Camera: {isRecording ? 'Live & Ready' : 'Initializing...'}
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
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white'
              }}>
                <Camera size={48} style={{ marginBottom: '12px' }} />
                <p style={{ fontSize: '16px', margin: 0 }}>Starting camera...</p>
                <p style={{ fontSize: '12px', marginTop: '8px', opacity: 0.8 }}>Using shared camera system</p>
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
            backgroundColor: '#ffffff', 
            borderRadius: '16px',
            marginBottom: '20px',
            maxHeight: '500px',
            overflowY: 'auto'
          }}>
            <h3 style={{ 
              fontWeight: '700', 
              color: '#7c3aed', 
              marginBottom: '24px',
              fontSize: '24px',
              textAlign: 'center',
              padding: '20px 20px 0'
            }}>
              MEDCOR AI Analysis Results
            </h3>
            
            {/* Basic Demographics */}
            <div style={{ padding: '0 20px 20px' }}>
              <h4 style={{ color: '#374151', fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                Basic Information
              </h4>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '12px',
                fontSize: '14px'
              }}>

                <div style={{ 
                  padding: '10px 14px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ color: '#6b7280' }}>Emotion:</span>
                  <span style={{ fontWeight: '600', color: '#374151' }}>{result.emotion}</span>
                </div>
                <div style={{ 
                  padding: '10px 14px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ color: '#6b7280' }}>Beauty Score:</span>
                  <span style={{ fontWeight: '600', color: '#7c3aed' }}>{result.beauty_score}/100</span>
                </div>
              </div>
            </div>

            {/* Facial Features */}
            {result.features && (
              <div style={{ padding: '0 20px 20px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                <h4 style={{ color: '#374151', fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                  Facial Features Analysis
                </h4>
                <div style={{ fontSize: '14px' }}>
                  {result.features.eyes && (
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ color: '#6b7280' }}>Eyes: </span>
                      <span style={{ color: '#374151' }}>
                        {result.features.eyes.shape || result.features.eyes} shape, 
                        {result.features.eyes.size && ` ${result.features.eyes.size} size`}
                        {result.features.eyes.dark_circles !== 'None' && `, ${result.features.eyes.dark_circles} dark circles`}
                      </span>
                    </div>
                  )}
                  {result.features.lips && (
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ color: '#6b7280' }}>Lips: </span>
                      <span style={{ color: '#374151' }}>
                        {result.features.lips.shape || result.features.lips} shape
                        {result.features.lips.fullness && `, ${result.features.lips.fullness} fullness`}
                      </span>
                    </div>
                  )}
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ color: '#6b7280' }}>Face Shape: </span>
                    <span style={{ color: '#374151' }}>{result.face_shape}</span>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ color: '#6b7280' }}>Skin Tone: </span>
                    <span style={{ color: '#374151' }}>{result.skin_tone}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Skin Analysis */}
            {result.skin_analysis && (
              <div style={{ padding: '0 20px 20px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                <h4 style={{ color: '#374151', fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                  Skin Analysis (15 Conditions)
                </h4>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '8px',
                  fontSize: '13px'
                }}>
                  {result.skin_analysis.texture && (
                    <div style={{ 
                      padding: '8px 12px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '6px'
                    }}>
                      <div style={{ color: '#6b7280', fontSize: '12px' }}>Texture</div>
                      <div style={{ fontWeight: '600', color: '#374151' }}>
                        {result.skin_analysis.texture.description} ({result.skin_analysis.texture.score}/100)
                      </div>
                    </div>
                  )}
                  {result.skin_analysis.hydration && (
                    <div style={{ 
                      padding: '8px 12px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '6px'
                    }}>
                      <div style={{ color: '#6b7280', fontSize: '12px' }}>Hydration</div>
                      <div style={{ fontWeight: '600', color: '#374151' }}>
                        {result.skin_analysis.hydration.level} ({result.skin_analysis.hydration.score}/100)
                      </div>
                    </div>
                  )}
                  {result.skin_analysis.pores && (
                    <div style={{ 
                      padding: '8px 12px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '6px'
                    }}>
                      <div style={{ color: '#6b7280', fontSize: '12px' }}>Pores</div>
                      <div style={{ fontWeight: '600', color: '#374151' }}>
                        {result.skin_analysis.pores.visibility} ({result.skin_analysis.pores.score}/100)
                      </div>
                    </div>
                  )}
                  {result.skin_analysis.oiliness && (
                    <div style={{ 
                      padding: '8px 12px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '6px'
                    }}>
                      <div style={{ color: '#6b7280', fontSize: '12px' }}>Skin Type</div>
                      <div style={{ fontWeight: '600', color: '#374151' }}>
                        {result.skin_analysis.oiliness.overall}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Makeup Recommendations */}
            {result.makeup_recommendations && (
              <div style={{ padding: '0 20px 20px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                <h4 style={{ color: '#374151', fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                  Makeup Recommendations
                </h4>
                <div style={{ fontSize: '14px' }}>
                  {result.makeup_recommendations.foundation && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '4px' }}>Foundation</div>
                      <div style={{ 
                        padding: '8px 12px',
                        backgroundColor: '#fef3c7',
                        borderRadius: '6px',
                        fontSize: '13px'
                      }}>
                        Shade: {result.makeup_recommendations.foundation.shade}, 
                        Undertone: {result.makeup_recommendations.foundation.undertone}
                      </div>
                    </div>
                  )}
                  {result.makeup_recommendations.lipstick && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '4px' }}>Lipstick</div>
                      <div style={{ 
                        padding: '8px 12px',
                        backgroundColor: '#fce7f3',
                        borderRadius: '6px',
                        fontSize: '13px'
                      }}>
                        Colors: {result.makeup_recommendations.lipstick.colors.join(', ')}, 
                        Finish: {result.makeup_recommendations.lipstick.finish}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Skincare Recommendations */}
            {result.recommendations && (
              <div style={{ padding: '0 20px 20px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                <h4 style={{ color: '#374151', fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                  Personalized Skincare Routine
                </h4>
                <ul style={{ fontSize: '13px', color: '#374151', paddingLeft: '20px', margin: 0 }}>
                  {result.recommendations.skincare_routine.map((item: string, index: number) => (
                    <li key={index} style={{ marginBottom: '6px' }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div style={{ padding: '20px', textAlign: 'center', borderTop: '1px solid #e5e7eb' }}>
              <button
                onClick={resetAnalysis}
                style={{
                  padding: '12px 32px',
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