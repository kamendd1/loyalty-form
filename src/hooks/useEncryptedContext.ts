import { useState, useEffect } from 'react';
import { decryptPayload } from '../utils/crypto';
import { FormPayload } from '../types/payload';
import Logger from '../utils/logger';

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
        Logger.info('Context initialization', {
          environment: import.meta.env.DEV ? 'development' : 'production',
          hasMetaTag: !!metaTag,
          hasEncryptedData: !!encryptedData,
          hasAppSecret: !!import.meta.env.VITE_APP_SECRET,
          url: window.location.href,
          userAgent: navigator.userAgent
        });

        // Only set as mobile app if we have both meta tag and encrypted data
        setIsFromMobileApp(!!metaTag && !!encryptedData);

        // In development, use mock data
        if (import.meta.env.DEV) {
          Logger.debug('Using development mock data');
          setContextData(DEV_MOCK_DATA);
          setIsLoading(false);
          return;
        }

        // If we have encrypted data, try to decrypt it
        if (encryptedData) {
          Logger.info('Found encrypted context data');
          try {
            const decryptedData = decryptPayload(encryptedData) as FormPayload;
            if (decryptedData) {
              Logger.info('Successfully loaded context', {
                fields: Object.keys(decryptedData)
              });
              setContextData(decryptedData);
            }
          } catch (decryptError) {
            Logger.error('Failed to decrypt context', decryptError, {
              isMobileApp: !!metaTag
            });
            // Don't set error if we're not in mobile app
            if (metaTag) {
              setError('Failed to decrypt context data');
            }
          }
        } else {
          Logger.info('No encrypted data found, proceeding without context');
        }
      } catch (err) {
        Logger.error('Context processing error', err, {
          hasMetaTag: !!document.querySelector('meta[name="encrypted-context"]')
        });
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
};
