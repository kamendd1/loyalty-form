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
        const metaTag = document.querySelector('meta[name="encrypted-context"]');
        const encryptedData = metaTag?.getAttribute('content');
        
        // Log initialization state
        console.log('Initialization:', {
          environment: import.meta.env.DEV ? 'development' : 'production',
          hasMetaTag: !!metaTag,
          hasEncryptedData: !!encryptedData,
          hasAppSecret: !!import.meta.env.VITE_APP_SECRET
        });

        // Only set as mobile app if we have both meta tag and encrypted data
        setIsFromMobileApp(!!metaTag && !!encryptedData);

        // In development, use mock data
        if (import.meta.env.DEV) {
          console.log('Using development mock data');
          setContextData(DEV_MOCK_DATA);
          setIsLoading(false);
          return;
        }

        // If we have encrypted data, try to decrypt it
        if (encryptedData) {
          console.log('Attempting to decrypt context data');
          try {
            const decryptedData = decryptPayload(encryptedData) as FormPayload;
            if (decryptedData) {
              console.log('Successfully decrypted context data');
              setContextData(decryptedData);
            }
          } catch (decryptError) {
            console.error('Decryption error:', decryptError);
            // Don't set error if we're not in mobile app
            if (metaTag) {
              setError('Failed to decrypt context data');
            }
          }
        } else {
          console.log('No encrypted data found, proceeding without context');
        }
      } catch (err) {
        console.error('Context processing error:', err);
        // Only set error if we're supposed to have context
        if (document.querySelector('meta[name="encrypted-context"]')) {
          setError('Error processing encrypted context');
        }
      } finally {
        setIsLoading(false);
      }
    };

    readEncryptedContext();
  }, []);

  return { contextData, isLoading, error, isFromMobileApp };

  return { contextData, isLoading, error };
};
