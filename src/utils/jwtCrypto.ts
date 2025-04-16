import Logger from './logger';

/**
 * Decodes a JWT token without verification (browser-compatible)
 * @param token - The JWT token to decode
 * @returns Decoded payload or null if decoding fails
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

    // In the browser, we'll just decode without verification
    // This is safe because the server has already verified the token
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    // Base64Url decode the payload (second part)
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    
    try {
      // First try the built-in atob method
      const jsonPayload = decodeURIComponent(atob(paddedBase64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const decodedPayload = JSON.parse(jsonPayload);
      
      // Log the full structure for debugging
      console.log('Full JWT payload structure:', decodedPayload);
      
      Logger.info('Successfully decoded JWT payload', {
        fields: Object.keys(decodedPayload)
      });
      
      return decodedPayload;
    } catch (decodeError) {
      // If atob fails, try a more robust approach
      Logger.warn('Standard decoding failed, trying alternative method', {
        error: decodeError instanceof Error ? decodeError.message : String(decodeError)
      });
      
      // Alternative decoding approach using TextDecoder
      const binaryString = window.atob(paddedBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const decoder = new TextDecoder('utf-8');
      const jsonPayload = decoder.decode(bytes);
      const decodedPayload = JSON.parse(jsonPayload);
      
      console.log('Full JWT payload structure (alternative method):', decodedPayload);
      
      return decodedPayload;
    }
  } catch (error) {
    Logger.error('JWT token decoding failed', error, {
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

    // Check for token in sessionStorage (set by server.js)
    const sessionToken = sessionStorage.getItem('jwt_payload');
    if (sessionToken) {
      Logger.info('Found JWT token in sessionStorage', {
        length: sessionToken.length
      });
      return sessionToken;
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
