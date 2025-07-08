import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, User as Face, Camera, Loader2, CheckCircle } from "lucide-react";

interface FaceAnalysisFixedProps {
  isOpen: boolean;
  onClose: () => void;
}

// Perfect Corp YCE SDK types - Fixed from ChatGPT analysis
declare global {
  interface Window {
    YCE?: {
      init: (options: any) => void;
      isInitialized: () => boolean;
      captureImage: () => Promise<any>;
      destroy: () => void;
      ready: boolean;
    };
  }
}

export default function FaceAnalysisFixed({ isOpen, onClose }: FaceAnalysisFixedProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [sdkInitialized, setSdkInitialized] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // SDK Loading with proper timing - Based on ChatGPT solution
  const loadSDK = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      // Check if SDK already loaded
      if (window.YCE && window.YCE.ready) {
        setSdkLoaded(true);
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://plugins-media.perfectcorp.com/smb/sdk.js?apiKey=xsQ0rgMLPQmEoow2SLNuqjTaILjhHAVY';
      script.async = true;
      
      script.onload = () => {
        // Wait for YCE to be available
        const checkYCE = () => {
          if (window.YCE) {
            console.log('YCE SDK loaded successfully');
            setSdkLoaded(true);
            resolve();
          } else {
            setTimeout(checkYCE, 100);
          }
        };
        checkYCE();
      };
      
      script.onerror = () => {
        console.error('Failed to load YCE SDK');
        setError('Failed to load Perfect Corp SDK');
        reject(new Error('SDK loading failed'));
      };
      
      document.head.appendChild(script);
    });
  }, []);

  // Initialize SDK with proper container reference
  const initializeSDK = useCallback(async () => {
    if (!window.YCE || !containerRef.current) {
      console.log('SDK or container not ready');
      return;
    }

    try {
      console.log('Initializing YCE SDK...');
      
      const options = {
        apiKey: 'xsQ0rgMLPQmEoow2SLNuqjTaILjhHAVY',
        accountId: process.env.REACT_APP_YCE_ACCOUNT_ID,
        email: process.env.REACT_APP_YCE_EMAIL,
        mode: 'ui',
        container: containerRef.current,
        onReady: () => {
          console.log('YCE SDK ready');
          setSdkInitialized(true);
          setCameraActive(true);
        },
        onImageCaptured: (imageData: any) => {
          console.log('YCE SDK image captured:', imageData);
          setResult(imageData);
        },
        onError: (error: any) => {
          console.error('YCE SDK error:', error);
          setError('SDK initialization failed');
        },
        ui: {
          theme: 'light',
          showInstructions: true,
        },
        capture: {
          faceQuality: true,
          resolution: { width: 640, height: 480 }
        }
      };
      
      window.YCE.init(options);
      console.log('YCE SDK initialized');
      
    } catch (error) {
      console.error('SDK initialization error:', error);
      setError('Failed to initialize camera');
    }
  }, []);

  // Portal setup
  useEffect(() => {
    if (isOpen) {
      const element = document.createElement('div');
      element.id = 'face-analysis-fixed-portal';
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
      document.body.style.overflow = 'hidden';

      return () => {
        if (document.body.contains(element)) {
          document.body.removeChild(element);
        }
        document.body.style.overflow = 'auto';
        
        // Cleanup SDK
        if (window.YCE && window.YCE.destroy) {
          window.YCE.destroy();
        }
      };
    }
  }, [isOpen]);

  // Load SDK when modal opens
  useEffect(() => {
    if (isOpen && !sdkLoaded) {
      loadSDK();
    }
  }, [isOpen, sdkLoaded, loadSDK]);

  // Initialize SDK when loaded and container is ready
  useEffect(() => {
    if (sdkLoaded && containerRef.current && !sdkInitialized) {
      initializeSDK();
    }
  }, [sdkLoaded, sdkInitialized, initializeSDK]);

  // Fallback to backend API if SDK fails
  const analyzeWithBackend = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/face-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: 'fallback_test' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResult(data.result);
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      console.error('Backend analysis error:', err);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
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
          width: '600px',
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
            Perfect Corp YCE SDK - Fixed
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
            <X size={20} />
          </button>
        </div>

        {/* SDK Status */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            {sdkLoaded ? (
              <CheckCircle size={16} style={{ color: '#059669' }} />
            ) : (
              <Loader2 size={16} className="animate-spin" style={{ color: '#7c3aed' }} />
            )}
            <span style={{ fontSize: '14px', color: sdkLoaded ? '#059669' : '#6b7280' }}>
              SDK Status: {sdkLoaded ? 'Loaded' : 'Loading...'}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {sdkInitialized ? (
              <CheckCircle size={16} style={{ color: '#059669' }} />
            ) : (
              <Loader2 size={16} className="animate-spin" style={{ color: '#7c3aed' }} />
            )}
            <span style={{ fontSize: '14px', color: sdkInitialized ? '#059669' : '#6b7280' }}>
              Camera: {sdkInitialized ? 'Ready' : 'Initializing...'}
            </span>
          </div>
        </div>

        {/* YCE SDK Container */}
        <div style={{ marginBottom: '20px' }}>
          <div 
            ref={containerRef}
            style={{
              width: '100%',
              height: '400px',
              border: '2px solid #7c3aed',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {!sdkLoaded && (
              <div style={{ textAlign: 'center', color: '#6b7280' }}>
                <Loader2 size={32} className="animate-spin" style={{ marginBottom: '12px' }} />
                <p>Loading Perfect Corp SDK...</p>
              </div>
            )}
            
            {sdkLoaded && !sdkInitialized && (
              <div style={{ textAlign: 'center', color: '#6b7280' }}>
                <Camera size={32} style={{ marginBottom: '12px' }} />
                <p>Initializing camera...</p>
              </div>
            )}
          </div>
        </div>

        {/* Fallback Button */}
        {sdkLoaded && !sdkInitialized && (
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <button
              onClick={analyzeWithBackend}
              disabled={loading}
              style={{
                padding: '12px 24px',
                backgroundColor: loading ? '#9ca3af' : '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: '0 auto'
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Face size={16} />}
              {loading ? 'Analyzing...' : 'Use Backend API (Fallback)'}
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
            borderRadius: '12px'
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
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span>Age:</span>
                <span style={{ fontWeight: '600' }}>{result.age} years</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span>Gender:</span>
                <span style={{ fontWeight: '600' }}>{result.gender}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span>Emotion:</span>
                <span style={{ fontWeight: '600' }}>{result.emotion}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span>Beauty Score:</span>
                <span style={{ fontWeight: '600' }}>{result.beauty_score}/100</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, portalElement);
}