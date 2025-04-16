import { useState, useEffect } from 'react';
import { decryptPayload } from '../utils/crypto'; // Keep for backward compatibility
import { decodeJwtPayload } from '../utils/jwtCrypto'; // Only import what we use
import { FormPayload } from '../types/payload';
import Logger from '../utils/logger';
import { fetchUserInfo } from '../utils/userApi';

// Mock data for development environment
const DEV_MOCK_DATA: FormPayload = {
  userId: 'DEV_USER_001',
  evseId: 'DEV_EVSE_001',
  operatorId: 'DEV_OPERATOR_001',
  appLanguage: 'en',
  firstName: 'John'
};

// API configuration - these should be provided by the environment or configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_TOKEN = import.meta.env.VITE_API_TOKEN || '';

export const useEncryptedContext = () => {
  const [contextData, setContextData] = useState<FormPayload>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFromMobileApp, setIsFromMobileApp] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [evseReference, setEvseReference] = useState<string>('');
  const [isUserInfoLoading, setIsUserInfoLoading] = useState(false);

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
        
        // First, check for pre-decoded payload from server.js
        const decodedPayloadJson = sessionStorage.getItem('decoded_payload');
        if (decodedPayloadJson) {
          try {
            console.log('Found pre-decoded payload in sessionStorage');
            const decodedData = JSON.parse(decodedPayloadJson);
            console.log('Pre-decoded payload:', decodedData);
            
            // Extract user information directly from the decoded payload
            let extractedData: FormPayload = {};
            
            // Check for nested payload structure
            if (decodedData.payload && typeof decodedData.payload === 'object') {
              console.log('Using nested payload structure from pre-decoded data');
              
              if (decodedData.payload.parameters) {
                extractedData = {
                  userId: String(decodedData.payload.parameters.userId || ''),
                  evseId: String(decodedData.payload.parameters.evseId || ''),
                  firstName: decodedData.payload.parameters.firstName || ''
                };
                
                if (decodedData.payload.parameters.evsePhysicalReference) {
                  setEvseReference(String(decodedData.payload.parameters.evsePhysicalReference));
                }
              }
            }
            
            // Set user name
            setUserName(extractedData.firstName || 'User');
            
            // Set context data
            setContextData(extractedData);
            setIsLoading(false);
            
            // If we have a userId but no firstName, fetch user info from API
            if (extractedData.userId && !extractedData.firstName && API_BASE_URL && API_TOKEN) {
              fetchUserInfoFromApi(extractedData.userId);
            }
            
            return; // Exit early since we have the decoded data
          } catch (parseError) {
            console.error('Error parsing pre-decoded payload:', parseError);
            // Fall through to regular decoding methods
          }
        }
        
        // If we don't have pre-decoded payload, try to get encrypted data from various sources
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
        // 2. Check sessionStorage (set by server.js)
        else if (sessionStorage.getItem('jwt_payload')) {
          encryptedData = sessionStorage.getItem('jwt_payload');
          console.log('Found payload in sessionStorage:', !!encryptedData);
          Logger.info('Found payload in sessionStorage', {
            hasContent: !!encryptedData,
            contentLength: encryptedData?.length
          });
        }
        // 3. Check meta tags
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
          
          // First try JWT decoding
          try {
            Logger.info('Attempting JWT decoding');
            const jwtData = decodeJwtPayload(encryptedData);
            
            if (jwtData) {
              // Log the full JWT data for debugging
              console.log('Decoded JWT data:', jwtData);
              Logger.info('JWT data structure', {
                keys: Object.keys(jwtData),
                hasPayload: !!jwtData.payload,
                payloadType: jwtData.payload?.type
              });
              
              let extractedData: FormPayload = {};
              
              // Check if it has a nested payload structure (new format)
              if (jwtData.payload && typeof jwtData.payload === 'object') {
                Logger.info('Detected nested payload structure', {
                  payloadType: jwtData.payload.type,
                  hasParameters: !!jwtData.payload.parameters
                });
                
                // Extract from nested parameters
                if (jwtData.payload.parameters) {
                  console.log('Parameters found:', jwtData.payload.parameters);
                  
                  // Convert numeric IDs to strings to ensure type safety
                  extractedData = {
                    userId: String(jwtData.payload.parameters.userId || ''),
                    evseId: String(jwtData.payload.parameters.evseId || ''),
                    firstName: jwtData.payload.parameters.firstName || ''
                  };
                  
                  // Set the EVSE reference if available
                  if (jwtData.payload.parameters.evsePhysicalReference) {
                    setEvseReference(String(jwtData.payload.parameters.evsePhysicalReference));
                  }
                }
              } else if (jwtData.parameters && typeof jwtData.parameters === 'object') {
                // Alternative structure where parameters might be at the top level
                console.log('Top-level parameters found:', jwtData.parameters);
                
                extractedData = {
                  userId: String(jwtData.parameters.userId || ''),
                  evseId: String(jwtData.parameters.evseId || ''),
                  firstName: jwtData.parameters.firstName || ''
                };
                
                if (jwtData.parameters.evsePhysicalReference) {
                  setEvseReference(String(jwtData.parameters.evsePhysicalReference));
                }
              } else {
                // Last resort: try direct mapping
                console.log('Using direct mapping as fallback');
                extractedData = {
                  userId: String(jwtData.userId || ''),
                  evseId: String(jwtData.evseId || ''),
                  firstName: jwtData.firstName || ''
                };
              }
              
              // Set user name from firstName or default to 'User'
              setUserName(extractedData.firstName || 'User');
              
              Logger.info('Successfully decoded JWT context', {
                fields: Object.keys(extractedData),
                userName: extractedData.firstName || 'User',
                evseId: extractedData.evseId,
                userId: extractedData.userId
              });
              
              setContextData(extractedData);
              setIsLoading(false);
              
              // If we have a userId but no firstName, fetch user info from API
              if (extractedData.userId && !extractedData.firstName && API_BASE_URL && API_TOKEN) {
                fetchUserInfoFromApi(extractedData.userId);
              }
              
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
        Logger.error('Context processing error', err as Error, {
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

  // Function to fetch user info from API
  const fetchUserInfoFromApi = async (userId: string) => {
    if (!userId || !API_BASE_URL || !API_TOKEN) return;
    
    try {
      setIsUserInfoLoading(true);
      Logger.info('Fetching user info from API', { userId });
      
      const userData = await fetchUserInfo(userId, API_TOKEN, API_BASE_URL);
      
      if (userData && userData.firstName) {
        // Update context data with the fetched first name
        setContextData(prevData => ({
          ...prevData,
          firstName: userData.firstName
        }));
        
        // Update user name
        setUserName(userData.firstName);
        
        Logger.info('Updated user info from API', {
          userId,
          firstName: userData.firstName
        });
      }
    } catch (err) {
      Logger.error('Error fetching user info', err as Error);
    } finally {
      setIsUserInfoLoading(false);
    }
  };

  return { 
    contextData, 
    isLoading: isLoading || isUserInfoLoading, 
    error, 
    isFromMobileApp,
    userName,
    evseReference
  };
};
