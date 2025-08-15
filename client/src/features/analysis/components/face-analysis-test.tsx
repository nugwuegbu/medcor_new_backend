import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { X, User as Face, Camera } from "lucide-react";

interface FaceAnalysisTestProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FaceAnalysisTest({ isOpen, onClose }: FaceAnalysisTestProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/face-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: 'test' })
      });
      const data = await response.json();
      setResult(data.result);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center" 
      style={{ 
        zIndex: 99999, 
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      <div 
        className="rounded-xl shadow-2xl p-6 w-full max-w-md mx-4" 
        style={{ 
          backgroundColor: 'white', 
          zIndex: 100000,
          color: 'black'
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Face className="h-5 w-5" />
            Face Analysis Test
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-100 rounded-lg text-center">
            <Face className="h-12 w-12 mx-auto text-purple-600 mb-2" />
            <p className="text-sm text-gray-600">Perfect Corp Face Analysis</p>
          </div>
          
          <Button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3"
          >
            {loading ? 'Analyzing...' : 'Test Face Analysis'}
          </Button>
          
          {result && (
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-3">Test Results:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Age:</span>
                  <span>{result.age} years</span>
                </div>
                <div className="flex justify-between">
                  <span>Gender:</span>
                  <span>{result.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span>Emotion:</span>
                  <span>{result.emotion}</span>
                </div>
                <div className="flex justify-between">
                  <span>Beauty Score:</span>
                  <span>{result.beauty_score}/100</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}