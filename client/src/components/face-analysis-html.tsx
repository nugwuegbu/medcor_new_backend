import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, User as Face, Camera, Loader2 } from "lucide-react";

interface FaceAnalysisHtmlProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FaceAnalysisHtml({ isOpen, onClose }: FaceAnalysisHtmlProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Create portal element
      const element = document.createElement('div');
      element.id = 'face-analysis-html-portal';
      element.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 999999;
        pointer-events: auto;
      `;
      document.body.appendChild(element);
      setPortalElement(element);

      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      return () => {
        if (document.body.contains(element)) {
          document.body.removeChild(element);
        }
        document.body.style.overflow = 'auto';
        stopCamera();
      };
    }
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
        setError(null);
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Camera access denied. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        return imageData;
      }
    }
    return null;
  };

  const analyzeImage = async () => {
    const imageData = captureImage();
    if (!imageData) {
      setError('Failed to capture image');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/face-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageBase64: imageData.split(',')[1] // Remove data:image/jpeg;base64, prefix
        })
      });
      
      const data = await response.json();
      console.log('Perfect Corp API Response:', data);
      
      if (data.success) {
        setResult(data.result);
        stopCamera(); // Stop camera after successful analysis
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetAnalysis = () => {
    setResult(null);
    setCapturedImage(null);
    setError(null);
    startCamera();
  };

  if (!isOpen || !portalElement) return null;

  const modalContent = (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999
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
          borderRadius: '16px',
          padding: '24px',
          width: '500px',
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
          marginBottom: '20px',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '16px'
        }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#1f2937', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            margin: 0
          }}>
            <Face size={24} style={{ color: '#7c3aed' }} />
            Perfect Corp Face Analysis
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
              color: '#6b7280',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.color = '#374151';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Camera Section */}
        {!result && (
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ 
              position: 'relative',
              width: '320px',
              height: '240px',
              margin: '0 auto 20px',
              border: '2px solid #7c3aed',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: '#f3f4f6'
            }}>
              <video
                ref={videoRef}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: cameraActive ? 'block' : 'none'
                }}
                autoPlay
                muted
                playsInline
              />
              
              {!cameraActive && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280'
                }}>
                  <Camera size={48} style={{ marginBottom: '12px', color: '#7c3aed' }} />
                  <p style={{ fontSize: '14px', margin: 0 }}>Camera not active</p>
                </div>
              )}

              {capturedImage && (
                <img
                  src={capturedImage}
                  alt="Captured"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              )}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              {!cameraActive ? (
                <button
                  onClick={startCamera}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#7c3aed',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Camera size={16} />
                  Start Camera
                </button>
              ) : (
                <button
                  onClick={analyzeImage}
                  disabled={loading}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: loading ? '#9ca3af' : '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Face size={16} />}
                  {loading ? 'Analyzing...' : 'Analyze Face'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#fef2f2', 
            border: '1px solid #fecaca',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <p style={{ color: '#dc2626', fontSize: '14px', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#f0fdf4', 
            border: '1px solid #bbf7d0',
            borderRadius: '12px',
            marginBottom: '16px'
          }}>
            <h3 style={{ 
              fontWeight: '600', 
              color: '#059669', 
              marginBottom: '16px',
              fontSize: '18px'
            }}>
              Analysis Results
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '12px',
              fontSize: '14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #dcfce7' }}>
                <span style={{ color: '#374151' }}>Age:</span>
                <span style={{ fontWeight: '600', color: '#059669' }}>{result.age} years</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #dcfce7' }}>
                <span style={{ color: '#374151' }}>Gender:</span>
                <span style={{ fontWeight: '600', color: '#059669' }}>{result.gender}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #dcfce7' }}>
                <span style={{ color: '#374151' }}>Emotion:</span>
                <span style={{ fontWeight: '600', color: '#059669' }}>{result.emotion}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #dcfce7' }}>
                <span style={{ color: '#374151' }}>Beauty Score:</span>
                <span style={{ fontWeight: '600', color: '#059669' }}>{result.beauty_score}/100</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #dcfce7' }}>
                <span style={{ color: '#374151' }}>Face Shape:</span>
                <span style={{ fontWeight: '600', color: '#059669' }}>{result.face_shape}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #dcfce7' }}>
                <span style={{ color: '#374151' }}>Skin Tone:</span>
                <span style={{ fontWeight: '600', color: '#059669' }}>{result.skin_tone}</span>
              </div>
            </div>
            
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button
                onClick={resetAnalysis}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#7c3aed',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
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

  return createPortal(modalContent, portalElement);
}