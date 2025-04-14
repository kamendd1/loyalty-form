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

  useEffect(() => {
    const readEncryptedContext = () => {
      try {
        // In development, use mock data
        if (import.meta.env.DEV) {
          setContextData(DEV_MOCK_DATA);
          setIsLoading(false);
          return;
        }

        // In production, read from meta tag
        const encryptedData = document.querySelector('meta[name="encrypted-context"]')?.getAttribute('content');
        
        if (!encryptedData) {
          setError('No encrypted context found');
          return;
        }

        const decryptedData = decryptPayload(encryptedData) as FormPayload;
        if (decryptedData) {
          setContextData(decryptedData);
        } else {
          setError('Failed to decrypt context data');
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

  return { contextData, isLoading, error };
};
