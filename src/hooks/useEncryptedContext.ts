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
  
  // Add additional user-friendly information
  const [userName, setUserName] = useState<string>('');
  const [evseReference, setEvseReference] = useState<string>('');

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
        // Check for X-Payload header (as per vendor instructions)
        console.log('Looking for X-Payload header...');
        
        // Since we can't directly access headers in client-side code,
        // check if the vendor has added it as a meta tag
        const xPayloadMeta = document.querySelector('meta[name="X-Payload"]') || 
                            document.querySelector('meta[name="x-payload"]');
        
        // Also check the encrypted-context meta tag for backward compatibility
        const metaTag = document.querySelector('meta[name="encrypted-context"]');
        
        // Try to get the payload from various sources
        let encryptedData = null;
        
        // 1. Check URL parameters first (most reliable for WebView)
        const urlParams = new URLSearchParams(window.location.search);
        const payloadParam = urlParams.get('payload') || urlParams.get('token') || urlParams.get('x-payload');
        
        if (payloadParam) {
          encryptedData = payloadParam;
          console.log('Found payload in URL parameters:', !!encryptedData);
          Logger.info('Found payload in URL parameters', {
            hasContent: !!encryptedData,
            contentLength: encryptedData?.length,
            paramName: payloadParam === urlParams.get('payload') ? 'payload' : 
                       payloadParam === urlParams.get('token') ? 'token' : 'x-payload'
          });
        }
        // 2. Check meta tags
        else if (xPayloadMeta) {
          encryptedData = xPayloadMeta.getAttribute('content');
          console.log('Found X-Payload meta tag:', !!encryptedData);
          Logger.info('Found X-Payload meta tag', {
            hasContent: !!encryptedData,
            contentLength: encryptedData?.length
          });
        } else if (metaTag) {
          encryptedData = metaTag.getAttribute('content');
          console.log('Using encrypted-context meta tag as fallback');
        }
        
        // Log meta tag information
        console.log('Meta tag found:', !!metaTag);
        Logger.info('Meta tag check', {
          found: !!metaTag,
          attributes: metaTag ? Array.from(metaTag.attributes).map(attr => `${attr.name}=${attr.value}`).join(', ') : 'none'
        });
        
        console.log('Payload content:', {
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
            const jwtData = decodeJwtPayload(encryptedData) as any;
            
            // Extract user information from the JWT payload
            let extractedData: FormPayload = {};
            
            // Check if this is the new format with nested payload
            if (jwtData.payload && typeof jwtData.payload === 'object') {
              Logger.info('Found nested payload structure', {
                payloadType: jwtData.payload.type,
                hasParameters: !!jwtData.payload.parameters
              });
              
              // Extract user information from the parameters
              if (jwtData.payload.parameters) {
                extractedData = {
                  userId: jwtData.payload.parameters.userId?.toString(),
                  evseId: jwtData.payload.parameters.evseId?.toString(),
                  firstName: jwtData.payload.parameters.firstName || 'User'
                };
                
                // Set the EVSE reference if available
                if (jwtData.payload.parameters.evsePhysicalReference) {
                  setEvseReference(jwtData.payload.parameters.evsePhysicalReference);
                }
              }
            } else {
              // Assume direct mapping for backward compatibility
              extractedData = jwtData as FormPayload;
            }
            
            // Set user name from firstName or default to 'User'
            setUserName(extractedData.firstName || 'User');
            
            Logger.info('Successfully decoded JWT context', {
              fields: Object.keys(extractedData),
              userName: extractedData.firstName || 'User',
              evseId: extractedData.evseId
            });
            
            setContextData(extractedData);
            return; // Exit early if JWT decoding succeeds
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

  return { 
    contextData, 
    isLoading, 
    error, 
    isFromMobileApp,
    userName,
    evseReference
  };
};
