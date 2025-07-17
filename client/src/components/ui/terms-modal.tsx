import React, { useState, useEffect } from 'react';
import { X, Shield, FileText, AlertTriangle, CheckCircle, Clock, Eye, Users, Heart, Lock } from 'lucide-react';
import { Button } from './button';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onDecline: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  onDecline
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'disclaimer' | 'privacy' | 'terms'>('overview');
  const [hasReadAll, setHasReadAll] = useState({
    disclaimer: false,
    privacy: false,
    terms: false
  });
  const [scrollProgress, setScrollProgress] = useState({
    disclaimer: 0,
    privacy: 0,
    terms: 0
  });
  const [acceptAll, setAcceptAll] = useState(false);

  if (!isOpen) return null;

  const markAsRead = (tab: 'disclaimer' | 'privacy' | 'terms') => {
    setHasReadAll(prev => ({ ...prev, [tab]: true }));
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>, tab: 'disclaimer' | 'privacy' | 'terms') => {
    const element = e.target as HTMLDivElement;
    const scrollPercentage = (element.scrollTop / (element.scrollHeight - element.clientHeight)) * 100;
    setScrollProgress(prev => ({ ...prev, [tab]: scrollPercentage }));
    
    if (scrollPercentage > 80) {
      markAsRead(tab);
    }
  };

  const allRead = Object.values(hasReadAll).every(Boolean);
  const canProceed = allRead && acceptAll;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full">
                <Shield className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  Welcome to Medcor AI Assistant
                </h2>
                <p className="text-purple-100 mt-1">
                  Please review our terms before accessing AI-powered healthcare features
                </p>
              </div>
            </div>
            <button
              onClick={onDecline}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Progress Indicator */}
          <div className="mt-4 flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            <span>Reading Progress: {Math.round((Object.values(scrollProgress).reduce((a, b) => a + b, 0) / 3))}%</span>
            <div className="flex-1 bg-white/20 rounded-full h-2 ml-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-300"
                style={{ width: `${Math.round((Object.values(scrollProgress).reduce((a, b) => a + b, 0) / 3))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="p-6 bg-gray-50 dark:bg-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`p-4 rounded-xl border-2 transition-all ${
                activeTab === 'overview'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-purple-300'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Eye className={`h-6 w-6 ${activeTab === 'overview' ? 'text-purple-600' : 'text-gray-500'}`} />
                <span className={`text-sm font-medium ${activeTab === 'overview' ? 'text-purple-900 dark:text-purple-200' : 'text-gray-700 dark:text-gray-300'}`}>
                  Overview
                </span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('disclaimer')}
              className={`p-4 rounded-xl border-2 transition-all ${
                activeTab === 'disclaimer'
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-red-300'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <AlertTriangle className={`h-6 w-6 ${activeTab === 'disclaimer' ? 'text-red-600' : 'text-gray-500'}`} />
                <span className={`text-sm font-medium ${activeTab === 'disclaimer' ? 'text-red-900 dark:text-red-200' : 'text-gray-700 dark:text-gray-300'}`}>
                  Medical Disclaimer
                </span>
                {hasReadAll.disclaimer && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                {!hasReadAll.disclaimer && scrollProgress.disclaimer > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-red-500 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${scrollProgress.disclaimer}%` }}
                    />
                  </div>
                )}
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('privacy')}
              className={`p-4 rounded-xl border-2 transition-all ${
                activeTab === 'privacy'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-blue-300'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Lock className={`h-6 w-6 ${activeTab === 'privacy' ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className={`text-sm font-medium ${activeTab === 'privacy' ? 'text-blue-900 dark:text-blue-200' : 'text-gray-700 dark:text-gray-300'}`}>
                  Privacy Policy
                </span>
                {hasReadAll.privacy && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                {!hasReadAll.privacy && scrollProgress.privacy > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${scrollProgress.privacy}%` }}
                    />
                  </div>
                )}
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('terms')}
              className={`p-4 rounded-xl border-2 transition-all ${
                activeTab === 'terms'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-green-300'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <FileText className={`h-6 w-6 ${activeTab === 'terms' ? 'text-green-600' : 'text-gray-500'}`} />
                <span className={`text-sm font-medium ${activeTab === 'terms' ? 'text-green-900 dark:text-green-200' : 'text-gray-700 dark:text-gray-300'}`}>
                  Terms of Service
                </span>
                {hasReadAll.terms && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                {!hasReadAll.terms && scrollProgress.terms > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-green-500 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${scrollProgress.terms}%` }}
                    />
                  </div>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-4">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Your Health, Our Priority
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Before accessing our AI-powered healthcare assistant, please review our legal terms to understand 
                  how we protect your data and ensure safe, responsible use of medical AI technology.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-700">
                  <AlertTriangle className="h-8 w-8 text-red-600 mb-3" />
                  <h4 className="font-semibold text-red-900 dark:text-red-200 mb-2">Medical Disclaimer</h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Our AI assistant provides information only - not medical diagnosis or treatment advice.
                  </p>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-700">
                  <Lock className="h-8 w-8 text-blue-600 mb-3" />
                  <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Privacy Protection</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Your personal health data is encrypted and protected according to HIPAA standards.
                  </p>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-700">
                  <FileText className="h-8 w-8 text-green-600 mb-3" />
                  <h4 className="font-semibold text-green-900 dark:text-green-200 mb-2">Terms of Service</h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Clear guidelines for using our platform responsibly and safely.
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-700">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-1">Reading Requirements</h4>
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                      You must scroll through and read each section completely. Progress indicators will track your reading, 
                      and you'll need to accept all terms before accessing AI features.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'disclaimer' && (
            <MedicalDisclaimer onRead={() => markAsRead('disclaimer')} onScroll={(e) => handleScroll(e, 'disclaimer')} />
          )}
          {activeTab === 'privacy' && (
            <PrivacyPolicy onRead={() => markAsRead('privacy')} onScroll={(e) => handleScroll(e, 'privacy')} />
          )}
          {activeTab === 'terms' && (
            <TermsOfService onRead={() => markAsRead('terms')} onScroll={(e) => handleScroll(e, 'terms')} />
          )}
        </div>

        {/* Consent Checkbox */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="accept-all"
              checked={acceptAll}
              onChange={(e) => setAcceptAll(e.target.checked)}
              disabled={!allRead}
              className="mt-1 w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 disabled:opacity-50"
            />
            <label 
              htmlFor="accept-all" 
              className={`text-sm ${!allRead ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'} cursor-pointer`}
            >
              I have read and agree to the <strong>Medical Disclaimer</strong>, <strong>Privacy Policy</strong>, and <strong>Terms of Service</strong>. 
              I understand that this AI assistant is for informational purposes only and does not replace professional medical advice.
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {canProceed ? (
                <span className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Ready to proceed
                </span>
              ) : !allRead ? (
                <span className="flex items-center gap-2 text-orange-600">
                  <Clock className="h-4 w-4" />
                  Please read all sections
                </span>
              ) : (
                <span className="flex items-center gap-2 text-blue-600">
                  <AlertTriangle className="h-4 w-4" />
                  Please accept terms
                </span>
              )}
            </div>
            
            {/* Reading Progress Summary */}
            <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
              <span>Progress:</span>
              <div className={`w-3 h-3 rounded-full ${hasReadAll.disclaimer ? 'bg-green-500' : 'bg-gray-300'}`} title="Medical Disclaimer" />
              <div className={`w-3 h-3 rounded-full ${hasReadAll.privacy ? 'bg-green-500' : 'bg-gray-300'}`} title="Privacy Policy" />
              <div className={`w-3 h-3 rounded-full ${hasReadAll.terms ? 'bg-green-500' : 'bg-gray-300'}`} title="Terms of Service" />
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onDecline}
              className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <X className="h-4 w-4 mr-1" />
              Decline & Exit
            </Button>
            <Button
              onClick={onAccept}
              disabled={!canProceed}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed px-6"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Accept & Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MedicalDisclaimer: React.FC<{ onRead: () => void; onScroll?: (e: React.UIEvent<HTMLDivElement>) => void }> = ({ onRead, onScroll }) => {
  React.useEffect(() => {
    const timer = setTimeout(onRead, 5000); // Mark as read after 5 seconds
    return () => clearTimeout(timer);
  }, [onRead]);

  return (
    <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300" onScroll={onScroll}>
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <h3 className="font-bold text-red-800 dark:text-red-200 mb-2 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          IMPORTANT MEDICAL DISCLAIMER
        </h3>
        <p className="text-red-700 dark:text-red-300 font-medium">
          This AI assistant is NOT a substitute for professional medical advice, diagnosis, or treatment.
        </p>
      </div>

      <div className="space-y-4">
        <section>
          <h4 className="font-semibold mb-2">Not Medical Advice</h4>
          <p>
            The information provided by MedCor.ai and its AI assistant is for educational and informational 
            purposes only. It should not be considered medical advice, diagnosis, or treatment recommendations. 
            The AI responses are generated based on general medical knowledge and do not account for your 
            specific medical history, current conditions, or individual circumstances.
          </p>
        </section>

        <section>
          <h4 className="font-semibold mb-2">Professional Medical Consultation Required</h4>
          <p>
            Always consult with qualified healthcare professionals for medical concerns. Never disregard 
            professional medical advice or delay seeking treatment because of information provided by this AI assistant. 
            If you have a medical emergency, contact emergency services immediately.
          </p>
        </section>

        <section>
          <h4 className="font-semibold mb-2">Limitations of AI Technology</h4>
          <p>
            While our AI uses advanced technology, it has limitations and may provide incomplete or inaccurate 
            information. The AI cannot:
          </p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Perform physical examinations</li>
            <li>Access your complete medical history</li>
            <li>Provide personalized medical diagnoses</li>
            <li>Replace human medical judgment</li>
            <li>Prescribe medications or treatments</li>
          </ul>
        </section>

        <section>
          <h4 className="font-semibold mb-2">Liability Disclaimer</h4>
          <p>
            MedCor.ai, its developers, and affiliated healthcare institutions disclaim all liability for any 
            damages, injuries, or adverse outcomes resulting from the use of information provided by this AI assistant. 
            Users assume full responsibility for their healthcare decisions.
          </p>
        </section>

        <section>
          <h4 className="font-semibold mb-2">Emergency Situations</h4>
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-3">
            <p className="font-medium text-red-800 dark:text-red-200">
              If you are experiencing a medical emergency, do not use this AI assistant. 
              Call emergency services immediately (911 in the US, 999 in the UK, 112 in EU).
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

const PrivacyPolicy: React.FC<{ onRead: () => void; onScroll?: (e: React.UIEvent<HTMLDivElement>) => void }> = ({ onRead, onScroll }) => {
  React.useEffect(() => {
    const timer = setTimeout(onRead, 5000);
    return () => clearTimeout(timer);
  }, [onRead]);

  return (
    <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300" onScroll={onScroll}>
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          DATA PROTECTION & PRIVACY POLICY
        </h3>
        <p className="text-blue-700 dark:text-blue-300">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <div className="space-y-4">
        <section>
          <h4 className="font-semibold mb-2">Information We Collect</h4>
          <p className="mb-2">We collect the following types of information:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li><strong>Chat conversations:</strong> Messages exchanged with the AI assistant</li>
            <li><strong>Facial recognition data:</strong> Encrypted facial patterns for quick login (optional)</li>
            <li><strong>Camera analysis:</strong> Images captured for skin, hair, and lips analysis</li>
            <li><strong>Voice recordings:</strong> Audio data for voice-to-text conversion</li>
            <li><strong>Location data:</strong> General location for weather and nearby services (optional)</li>
            <li><strong>Usage analytics:</strong> Interaction patterns and feature usage statistics</li>
          </ul>
        </section>

        <section>
          <h4 className="font-semibold mb-2">How We Use Your Information</h4>
          <ul className="list-disc ml-6 space-y-1">
            <li>Provide personalized AI assistance and recommendations</li>
            <li>Improve service quality and user experience</li>
            <li>Enable face recognition login functionality</li>
            <li>Process beauty and health analysis requests</li>
            <li>Generate usage analytics for service optimization</li>
            <li>Comply with legal and regulatory requirements</li>
          </ul>
        </section>

        <section>
          <h4 className="font-semibold mb-2">Data Security & Encryption</h4>
          <p>
            We implement industry-standard security measures to protect your data:
          </p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>End-to-end encryption for all data transmission</li>
            <li>Encrypted storage of facial recognition patterns</li>
            <li>Regular security audits and vulnerability assessments</li>
            <li>Access controls and authentication protocols</li>
            <li>Automatic data anonymization for analytics</li>
          </ul>
        </section>

        <section>
          <h4 className="font-semibold mb-2">Data Retention & Deletion</h4>
          <p>
            Your data is retained according to the following schedule:
          </p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li><strong>Chat history:</strong> 12 months or until account deletion</li>
            <li><strong>Facial recognition data:</strong> Until explicitly removed by user</li>
            <li><strong>Analysis images:</strong> 30 days or until analysis completion</li>
            <li><strong>Voice recordings:</strong> Immediately after text conversion</li>
            <li><strong>Usage analytics:</strong> 24 months in anonymized form</li>
          </ul>
        </section>

        <section>
          <h4 className="font-semibold mb-2">Third-Party Services</h4>
          <p>We use the following third-party services that may access your data:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li><strong>OpenAI:</strong> For AI conversation processing</li>
            <li><strong>HeyGen:</strong> For avatar video generation</li>
            <li><strong>YouCam API:</strong> For beauty analysis features</li>
            <li><strong>Azure Face API:</strong> For facial recognition services</li>
            <li><strong>ElevenLabs:</strong> For text-to-speech conversion</li>
          </ul>
        </section>

        <section>
          <h4 className="font-semibold mb-2">Your Rights</h4>
          <p>Under GDPR and other privacy laws, you have the right to:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Access your personal data</li>
            <li>Correct inaccurate information</li>
            <li>Delete your account and data</li>
            <li>Export your data</li>
            <li>Opt-out of facial recognition</li>
            <li>Withdraw consent at any time</li>
          </ul>
        </section>

        <section>
          <h4 className="font-semibold mb-2">Contact Information</h4>
          <p>
            For privacy-related questions or to exercise your rights, contact us at:
            <br />Email: privacy@medcor.ai
            <br />Address: [Company Address]
          </p>
        </section>
      </div>
    </div>
  );
};

const TermsOfService: React.FC<{ onRead: () => void; onScroll?: (e: React.UIEvent<HTMLDivElement>) => void }> = ({ onRead, onScroll }) => {
  React.useEffect(() => {
    const timer = setTimeout(onRead, 5000);
    return () => clearTimeout(timer);
  }, [onRead]);

  return (
    <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300" onScroll={onScroll}>
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <h3 className="font-bold text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          TERMS OF SERVICE AGREEMENT
        </h3>
        <p className="text-green-700 dark:text-green-300">
          By using MedCor.ai, you agree to these terms and conditions.
        </p>
      </div>

      <div className="space-y-4">
        <section>
          <h4 className="font-semibold mb-2">Acceptance of Terms</h4>
          <p>
            By accessing and using MedCor.ai services, you acknowledge that you have read, 
            understood, and agree to be bound by these Terms of Service and our Privacy Policy. 
            If you do not agree to these terms, you may not use our services.
          </p>
        </section>

        <section>
          <h4 className="font-semibold mb-2">Service Description</h4>
          <p>
            MedCor.ai provides an AI-powered healthcare communication platform that includes:
          </p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Interactive AI chatbot for health-related conversations</li>
            <li>Facial recognition for convenient login</li>
            <li>Beauty and wellness analysis tools</li>
            <li>Doctor availability and appointment scheduling</li>
            <li>Multi-language support and communication</li>
          </ul>
        </section>

        <section>
          <h4 className="font-semibold mb-2">User Responsibilities</h4>
          <p>As a user of MedCor.ai, you agree to:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Provide accurate and truthful information</li>
            <li>Use the service only for lawful purposes</li>
            <li>Not attempt to circumvent security measures</li>
            <li>Respect intellectual property rights</li>
            <li>Not share your account credentials</li>
            <li>Report any security vulnerabilities</li>
          </ul>
        </section>

        <section>
          <h4 className="font-semibold mb-2">Prohibited Uses</h4>
          <p>You may not use MedCor.ai for:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Illegal activities or violation of laws</li>
            <li>Spreading misinformation about health topics</li>
            <li>Harassment, abuse, or harmful content</li>
            <li>Attempting to reverse engineer our technology</li>
            <li>Commercial use without proper licensing</li>
            <li>Accessing other users' private information</li>
          </ul>
        </section>

        <section>
          <h4 className="font-semibold mb-2">Intellectual Property</h4>
          <p>
            All content, features, and functionality of MedCor.ai are owned by the company 
            and protected by intellectual property laws. You may not copy, modify, distribute, 
            or create derivative works without written permission.
          </p>
        </section>

        <section>
          <h4 className="font-semibold mb-2">Service Availability</h4>
          <p>
            We strive to maintain service availability but do not guarantee uninterrupted access. 
            Services may be temporarily unavailable due to maintenance, updates, or technical issues. 
            We reserve the right to modify or discontinue services with notice.
          </p>
        </section>

        <section>
          <h4 className="font-semibold mb-2">Limitation of Liability</h4>
          <p>
            MedCor.ai and its affiliates shall not be liable for any indirect, incidental, 
            special, or consequential damages arising from your use of our services. 
            Our liability is limited to the maximum extent permitted by law.
          </p>
        </section>

        <section>
          <h4 className="font-semibold mb-2">Subscription and Billing</h4>
          <p>
            For healthcare institutions using our platform:
          </p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Subscription fees are billed according to chosen plan</li>
            <li>Auto-renewal unless cancelled before renewal date</li>
            <li>Refunds processed according to our refund policy</li>
            <li>Usage limits apply based on subscription tier</li>
          </ul>
        </section>

        <section>
          <h4 className="font-semibold mb-2">Termination</h4>
          <p>
            Either party may terminate this agreement at any time. We reserve the right 
            to suspend or terminate accounts that violate these terms. Upon termination, 
            your right to use the service ceases immediately.
          </p>
        </section>

        <section>
          <h4 className="font-semibold mb-2">Changes to Terms</h4>
          <p>
            We may update these terms periodically. Users will be notified of significant 
            changes via email or in-app notification. Continued use after changes constitutes 
            acceptance of the updated terms.
          </p>
        </section>

        <section>
          <h4 className="font-semibold mb-2">Contact Information</h4>
          <p>
            For questions about these terms, contact us at:
            <br />Email: legal@medcor.ai
            <br />Address: [Company Address]
          </p>
        </section>
      </div>
    </div>
  );
};