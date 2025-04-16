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
    // Check for token in meta tag
    const metaTag = document.querySelector('meta[name="encrypted-context"]');
    if (metaTag) {
      const content = metaTag.getAttribute('content');
      if (content) {
        Logger.info('Found JWT token in meta tag', {
          length: content.length
        });
        return content;
      }
    }

    // Check for token in X-Payload header (for server-side rendering)
    // Note: This won't work in client-side code due to CORS restrictions
    // This is just for documentation purposes
    
    // Check for token in URL query parameter (fallback)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
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

    Logger.warn('No JWT token found in any source');
    return null;
  } catch (error) {
    Logger.error('Error extracting JWT token', error);
    return null;
  }
};
