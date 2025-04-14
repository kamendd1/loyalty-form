import CryptoJS from 'crypto-js';
import Logger from './logger';

// In Vite, environment variables are accessed through import.meta.env
const SECRET_KEY = import.meta.env.VITE_APP_SECRET;

if (!SECRET_KEY && !import.meta.env.DEV) {
  console.error('VITE_APP_SECRET is not set in environment variables');
}

export const decryptPayload = (encryptedData: string): any => {
  // Log initial state
  Logger.info('Starting decryption attempt', {
    hasEncryptedData: !!encryptedData,
    encryptedDataLength: encryptedData?.length,
    hasSecretKey: !!SECRET_KEY,
    secretKeyLength: SECRET_KEY?.length,
    environment: import.meta.env.DEV ? 'development' : 'production'
  });

  if (!SECRET_KEY) {
    if (import.meta.env.DEV) {
      Logger.debug('Development mode: using mock data');
      return {
        firstName: 'Dev',
        userId: '12345',
        evseId: 'DEV001',
        operatorId: 'DEVOP'
      };
    }
    const error = new Error('Encryption key not configured');
    Logger.error('Encryption key missing in production environment', error);
    throw error;
  }

  if (!encryptedData) {
    const error = new Error('No encrypted data provided');
    Logger.error('Encrypted data missing', error);
    throw error;
  }

  try {
    Logger.info('Starting decryption process');
    
    // Log encrypted data format
    Logger.info('Encrypted data format check', {
      isString: typeof encryptedData === 'string',
      containsValidChars: /^[A-Za-z0-9+/=]+$/.test(encryptedData),
      length: encryptedData.length
    });

    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    Logger.info('Decryption step completed');

    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    Logger.info('Conversion to UTF8 completed', {
      hasContent: !!decryptedText,
      length: decryptedText?.length
    });
    
    if (!decryptedText) {
      const error = new Error('Decryption produced empty result');
      Logger.error('Empty decryption result', error);
      throw error;
    }

    try {
      Logger.info('Attempting to parse decrypted text');
      const parsed = JSON.parse(decryptedText);
      Logger.info('Successfully parsed payload', {
        hasData: !!parsed,
        fields: Object.keys(parsed)
      });
      return parsed;
    } catch (parseError) {
      Logger.error('JSON parse error', parseError, {
        error: parseError,
        decryptedText: decryptedText.substring(0, 100) + '...' // Show first 100 chars
      });
      throw new Error(`Invalid JSON format: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
    }
  } catch (error) {
    Logger.error('Decryption process failed', error, {
      error,
      errorType: error?.constructor?.name,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    if (error instanceof Error) {
      // Preserve the original error message but add more context
      throw new Error(`Decryption failed: ${error.message} (Check console for details)`);
    }
    throw new Error('Decryption failed: Unknown error (Check console for details)');
  }
};
