import { useState, useEffect } from 'react';
import { decryptPayload } from '../utils/crypto';
import { FormPayload } from '../types/payload';

// Mock data for development environment
const DEV_MOCK_DATA: FormPayload = {
  userId: 'DEV_USER_001',
  evseId: 'DEV_EVSE_001',
  operatorId: 'DEV_OPERATOR_001',
  appLanguage: 'en',
  loyaltyNumber: '1234567',
  firstName: 'John'
};

export const useEncryptedContext = () => {
  const [contextData, setContextData] = useState<FormPayload>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFromMobileApp, setIsFromMobileApp] = useState(false);

  useEffect(() => {
    const readEncryptedContext = () => {
      try {
        // Check if we're being loaded from the mobile app
        const encryptedData = document.querySelector('meta[name="encrypted-context"]')?.getAttribute('content');
        setIsFromMobileApp(!!encryptedData);

        // In development, use mock data
        if (import.meta.env.DEV) {
          setContextData(DEV_MOCK_DATA);
          setIsLoading(false);
          return;
        }

        // If we have encrypted data, try to decrypt it
        if (encryptedData) {
          const decryptedData = decryptPayload(encryptedData) as FormPayload;
          if (decryptedData) {
            setContextData(decryptedData);
          } else {
            setError('Failed to decrypt context data');
          }
        }
      } catch (err) {
        setError('Error processing encrypted context');
        console.error('Context processing error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    readEncryptedContext();
  }, []);

  return { contextData, isLoading, error, isFromMobileApp };

  return { contextData, isLoading, error };
};
