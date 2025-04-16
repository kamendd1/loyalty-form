import { Buffer } from 'buffer';
import jwt from 'jsonwebtoken';
import Logger from './logger';

/**
 * Decodes and verifies a JWT token using HS256 algorithm
 * @param token - The JWT token to decode
 * @returns Decoded payload or null if verification fails
 */
export const decodeJwtPayload = (token: string): any => {
  if (!token) {
    Logger.error('Missing JWT token');
    return null;
  }

  try {
    Logger.info('Attempting to decode JWT token', {
      tokenLength: token.length,
      tokenPreview: token.substring(0, 20) + '...'
    });

    // Check if the token has the correct format (3 parts separated by dots)
    if (!/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(token)) {
      Logger.warn('Token does not appear to be in JWT format', {
        token: token.substring(0, 30) + '...'
      });
    }

    // Get the secret key from environment variables
    const base64Key = import.meta.env.VITE_JWT_SECRET;
    
    if (!base64Key) {
      Logger.error('Missing JWT secret key in environment variables');
      throw new Error('Server misconfiguration: missing JWT secret');
    }

    // Convert the base64-encoded secret to a Buffer
    const secretKey = Buffer.from(base64Key, 'base64');
    
    // Verify and decode the token
    const decodedPayload = jwt.verify(token, secretKey, { algorithms: ['HS256'] });
    
    Logger.info('Successfully decoded JWT payload', {
      fields: Object.keys(decodedPayload)
    });
    
    return decodedPayload;
  } catch (error) {
    Logger.error('JWT token verification failed', error, {
      errorMessage: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
};

/**
 * Attempts to extract a JWT token from various sources
 * @returns The JWT token or null if not found
 */
export const extractJwtToken = (): string | null => {
  try {
    // First, check for token in X-Payload meta tag (as per vendor instructions)
    // The vendor might be adding this as a meta tag instead of a header
    const xPayloadMeta = document.querySelector('meta[name="X-Payload"]') || 
                         document.querySelector('meta[name="x-payload"]');
    if (xPayloadMeta) {
      const content = xPayloadMeta.getAttribute('content');
      if (content) {
        Logger.info('Found JWT token in X-Payload meta tag', {
          length: content.length
        });
        return content;
      }
    }
    
    // Check for token in encrypted-context meta tag (our previous implementation)
    const metaTag = document.querySelector('meta[name="encrypted-context"]');
    if (metaTag) {
      const content = metaTag.getAttribute('content');
      if (content) {
        Logger.info('Found JWT token in encrypted-context meta tag', {
          length: content.length
        });
        return content;
      }
    }

    // Check for token in URL query parameter (fallback)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token') || urlParams.get('payload');
    if (tokenParam) {
      Logger.info('Found JWT token in URL parameter', {
        length: tokenParam.length
      });
      return tokenParam;
    }

    // Check for token in localStorage (if previously stored)
    const storedToken = localStorage.getItem('jwt_token');
    if (storedToken) {
      Logger.info('Found JWT token in localStorage', {
        length: storedToken.length
      });
      return storedToken;
    }
    
    // Log all meta tags for debugging
    const allMetaTags = document.querySelectorAll('meta');
    Logger.info('All meta tags (looking for payload)', {
      count: allMetaTags.length,
      tags: Array.from(allMetaTags).map(tag => ({
        name: tag.getAttribute('name') || tag.getAttribute('property') || 'unnamed',
        content: tag.getAttribute('content')?.substring(0, 30) + '...' || 'no-content'
      }))
    });

    Logger.warn('No JWT token found in any source');
    return null;
  } catch (error) {
    Logger.error('Error extracting JWT token', error);
    return null;
  }
};
