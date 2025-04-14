import CryptoJS from 'crypto-js';
import Logger from './logger';

// In Vite, environment variables are accessed through import.meta.env
const SECRET_KEY = import.meta.env.VITE_APP_SECRET;

// Log environment variables on load
console.log('Crypto module initialized:', {
  isDev: import.meta.env.DEV,
  hasSecret: !!SECRET_KEY,
  envVars: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
});

if (!SECRET_KEY && !import.meta.env.DEV) {
  console.error('VITE_APP_SECRET is not set in environment variables');
}

export const decryptPayload = (encryptedData: string): any => {
  // Immediate console log for debugging
  console.log('Decryption called with:', {
    hasData: !!encryptedData,
    dataLength: encryptedData?.length,
    hasKey: !!SECRET_KEY,
    keyLength: SECRET_KEY?.length
  });
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

    console.log('Attempting decryption with:', {
      inputLength: encryptedData.length,
      keyLength: SECRET_KEY.length,
      input: encryptedData.substring(0, 20) + '...' // Show start of encrypted data
    });
    
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    console.log('Raw decryption output:', bytes.toString());
    Logger.info('Decryption step completed');

    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    console.log('UTF8 conversion result:', {
      rawLength: bytes.toString().length,
      textLength: decryptedText.length,
      textPreview: decryptedText.substring(0, 20) + '...'
    });
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
