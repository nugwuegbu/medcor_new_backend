import { useState, useEffect } from 'react';

interface ConsentData {
  timestamp: string;
  version: string;
  ipAddress?: string;
  userAgent: string;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  acceptedDisclaimer: boolean;
}

interface ConsentManagerState {
  hasConsent: boolean;
  consentData: ConsentData | null;
  showConsentModal: boolean;
}

const CONSENT_VERSION = '1.0.0';
const CONSENT_STORAGE_KEY = 'medcor_user_consent';
const CONSENT_EXPIRY_DAYS = 365; // 1 year

export const useConsentManager = () => {
  const [state, setState] = useState<ConsentManagerState>({
    hasConsent: false,
    consentData: null,
    showConsentModal: false
  });

  useEffect(() => {
    checkExistingConsent();
  }, []);

  const checkExistingConsent = () => {
    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (stored) {
        const consentData: ConsentData = JSON.parse(stored);
        const consentDate = new Date(consentData.timestamp);
        const expiryDate = new Date(consentDate.getTime() + (CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000));
        const isValid = new Date() < expiryDate && consentData.version === CONSENT_VERSION;

        if (isValid && consentData.acceptedTerms && consentData.acceptedPrivacy && consentData.acceptedDisclaimer) {
          setState({
            hasConsent: true,
            consentData,
            showConsentModal: false
          });
          return;
        }
      }
    } catch (error) {
      console.error('Error checking consent:', error);
    }

    // No valid consent found
    setState({
      hasConsent: false,
      consentData: null,
      showConsentModal: true
    });
  };

  const giveConsent = async () => {
    try {
      const consentData: ConsentData = {
        timestamp: new Date().toISOString(),
        version: CONSENT_VERSION,
        userAgent: navigator.userAgent,
        acceptedTerms: true,
        acceptedPrivacy: true,
        acceptedDisclaimer: true
      };

      // Store consent locally
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentData));

      // Store consent on server for audit trail
      try {
        await fetch('/api/consent/record', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(consentData)
        });
      } catch (serverError) {
        console.warn('Failed to record consent on server:', serverError);
        // Continue anyway - local storage is sufficient for basic functionality
      }

      setState({
        hasConsent: true,
        consentData,
        showConsentModal: false
      });

      return true;
    } catch (error) {
      console.error('Error recording consent:', error);
      return false;
    }
  };

  const revokeConsent = () => {
    try {
      localStorage.removeItem(CONSENT_STORAGE_KEY);
      
      // Clear any other stored data
      localStorage.removeItem('medcor_chat_history');
      localStorage.removeItem('medcor_user_preferences');
      localStorage.removeItem('medcor_face_recognition');

      setState({
        hasConsent: false,
        consentData: null,
        showConsentModal: true
      });

      // Notify server of consent revocation
      fetch('/api/consent/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      }).catch(error => {
        console.warn('Failed to notify server of consent revocation:', error);
      });

      return true;
    } catch (error) {
      console.error('Error revoking consent:', error);
      return false;
    }
  };

  const showConsentModal = () => {
    setState(prev => ({
      ...prev,
      showConsentModal: true
    }));
  };

  const hideConsentModal = () => {
    setState(prev => ({
      ...prev,
      showConsentModal: false
    }));
  };

  const declineConsent = () => {
    // Clear any stored data and redirect away
    localStorage.clear();
    
    setState({
      hasConsent: false,
      consentData: null,
      showConsentModal: false
    });

    // Redirect to a "service unavailable" page or external site
    window.location.href = 'https://www.google.com';
  };

  const getConsentStatus = () => {
    return {
      hasValidConsent: state.hasConsent,
      consentVersion: state.consentData?.version,
      consentDate: state.consentData?.timestamp,
      daysUntilExpiry: state.consentData ? 
        Math.ceil((new Date(state.consentData.timestamp).getTime() + (CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000) - Date.now()) / (24 * 60 * 60 * 1000)) 
        : 0
    };
  };

  const updateConsent = () => {
    // Force re-consent if terms have been updated
    setState(prev => ({
      ...prev,
      hasConsent: false,
      showConsentModal: true
    }));
  };

  return {
    hasConsent: state.hasConsent,
    consentData: state.consentData,
    showConsentModal: state.showConsentModal,
    giveConsent,
    revokeConsent,
    declineConsent,
    showConsentModalFn: showConsentModal,
    hideConsentModal,
    getConsentStatus,
    updateConsent,
    checkExistingConsent
  };
};