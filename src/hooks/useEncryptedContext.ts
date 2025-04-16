import { useState, useEffect } from 'react';
import { decryptPayload } from '../utils/crypto'; // Keep for backward compatibility
import { decodeJwtPayload } from '../utils/jwtCrypto'; // Only import what we use
import { FormPayload } from '../types/payload';
import Logger from '../utils/logger';

// Mock data for development environment
const DEV_MOCK_DATA: FormPayload = {
  userId: 'DEV_USER_001',
  evseId: 'DEV_EVSE_001',
  operatorId: 'DEV_OPERATOR_001',
  appLanguage: 'en',
  firstName: 'John'
};

export const useEncryptedContext = () => {
  const [contextData, setContextData] = useState<FormPayload>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFromMobileApp, setIsFromMobileApp] = useState(false);

  useEffect(() => {
    // Log on mount
    console.log('useEncryptedContext mounted');
    Logger.info('useEncryptedContext mounted', {
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
    
    const readEncryptedContext = () => {
      try {
        // Check if we're being loaded from the mobile app
        console.log('Reading meta tag...');
        const metaTag = document.querySelector('meta[name="encrypted-context"]');
        console.log('Meta tag found:', !!metaTag);
        Logger.info('Meta tag check', {
          found: !!metaTag,
          attributes: metaTag ? Array.from(metaTag.attributes).map(attr => `${attr.name}=${attr.value}`).join(', ') : 'none'
        });
        
        const encryptedData = metaTag?.getAttribute('content');
        console.log('Meta tag content:', {
          hasContent: !!encryptedData,
          length: encryptedData?.length,
          preview: encryptedData ? encryptedData.substring(0, 20) + '...' : 'none'
        });
        
        // Log all meta tags for debugging
        const allMetaTags = document.querySelectorAll('meta');
        Logger.info('All meta tags', {
          count: allMetaTags.length,
          tags: Array.from(allMetaTags).map(tag => ({
            name: tag.getAttribute('name') || tag.getAttribute('property') || 'unnamed',
            content: tag.getAttribute('content')?.substring(0, 30) + '...' || 'no-content'
          }))
        });
        
        // Log initialization state
        Logger.info('Context initialization', {
          environment: import.meta.env.DEV ? 'development' : 'production',
          hasMetaTag: !!metaTag,
          hasEncryptedData: !!encryptedData,
          hasAppSecret: !!import.meta.env.VITE_APP_SECRET,
          url: window.location.href,
          userAgent: navigator.userAgent
        });

        // Check if we're being loaded from a mobile app using user agent
        const isMobileUserAgent = /android|iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase());
        Logger.info('Mobile detection', {
          userAgent: navigator.userAgent,
          isMobileUserAgent,
          hasMetaTag: !!metaTag,
          hasEncryptedData: !!encryptedData,
          referrer: document.referrer
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
          Logger.info('Found encrypted context data', {
            dataLength: encryptedData.length,
            dataPreview: encryptedData.substring(0, 30) + '...',
            isBase64Looking: /^[A-Za-z0-9+/=]+$/.test(encryptedData),
            isJwtFormat: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(encryptedData)
          });
          
          // First try JWT decoding (new method)
          try {
            Logger.info('Attempting JWT decoding first');
            const jwtData = decodeJwtPayload(encryptedData) as FormPayload;
            if (jwtData) {
              Logger.info('Successfully decoded JWT context', {
                fields: Object.keys(jwtData)
              });
              setContextData(jwtData);
              return; // Exit early if JWT decoding succeeds
            }
          } catch (jwtError) {
            Logger.warn('JWT decoding failed, falling back to legacy decryption', {
              error: jwtError instanceof Error ? jwtError.message : String(jwtError)
            });
            // Continue to legacy decryption method
          }
          
          // Fallback to legacy AES decryption
          try {
            Logger.info('Attempting legacy AES decryption');
            const decryptedData = decryptPayload(encryptedData) as FormPayload;
            if (decryptedData) {
              Logger.info('Successfully loaded context via legacy decryption', {
                fields: Object.keys(decryptedData)
              });
              setContextData(decryptedData);
            }
          } catch (decryptError) {
            Logger.error('All decryption methods failed', decryptError as Error, {
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
