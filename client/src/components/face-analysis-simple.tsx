import React, { useState } from 'react';
import { X, User as Face } from "lucide-react";

interface FaceAnalysisSimpleProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FaceAnalysisSimple({ isOpen, onClose }: FaceAnalysisSimpleProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/face-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: 'test' })
      });
      
      const data = await response.json();
      console.log('API Response:', data);
      
      if (data.success) {
        setResult(data.result);
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          width: '400px',
          maxWidth: '90vw',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Face size={20} />
            Face Analysis Test
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#f3f4f6', 
            borderRadius: '8px', 
            textAlign: 'center',
            marginBottom: '16px'
          }}>
            <Face size={48} style={{ margin: '0 auto 8px', color: '#7c3aed' }} />
            <p style={{ fontSize: '14px', color: '#6b7280' }}>Perfect Corp Face Analysis</p>
          </div>
          
          <button
            onClick={handleTest}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#9ca3af' : '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Testing...' : 'Test Face Analysis API'}
          </button>
        </div>
        
        {error && (
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#fef2f2', 
            border: '1px solid #fecaca',
            borderRadius: '6px',
            marginBottom: '16px'
          }}>
            <p style={{ color: '#dc2626', fontSize: '14px' }}>{error}</p>
          </div>
        )}
        
        {result && (
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#f3e8ff', 
            borderRadius: '8px' 
          }}>
            <h3 style={{ fontWeight: '600', color: '#6b21a8', marginBottom: '12px' }}>Analysis Results:</h3>
            <div style={{ fontSize: '14px', color: '#374151' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Age:</span>
                <span style={{ fontWeight: '500' }}>{result.age} years</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Gender:</span>
                <span style={{ fontWeight: '500' }}>{result.gender}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Emotion:</span>
                <span style={{ fontWeight: '500' }}>{result.emotion}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Beauty Score:</span>
                <span style={{ fontWeight: '500' }}>{result.beauty_score}/100</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Face Shape:</span>
                <span style={{ fontWeight: '500' }}>{result.face_shape}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Skin Tone:</span>
                <span style={{ fontWeight: '500' }}>{result.skin_tone}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}