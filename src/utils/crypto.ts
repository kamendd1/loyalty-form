import CryptoJS from 'crypto-js';

// In Vite, environment variables are accessed through import.meta.env
const SECRET_KEY = import.meta.env.VITE_APP_SECRET;

if (!SECRET_KEY && !import.meta.env.DEV) {
  console.error('VITE_APP_SECRET is not set in environment variables');
}

export const decryptPayload = (encryptedData: string): any => {
  if (!SECRET_KEY) {
    if (import.meta.env.DEV) {
      console.log('Development mode: using mock data');
      return {
        firstName: 'Dev',
        userId: '12345',
        evseId: 'DEV001',
        operatorId: 'DEVOP'
      };
    }
    console.error('Encryption key missing in production environment');
    throw new Error('Encryption key not configured');
  }

  if (!encryptedData) {
    console.error('No encrypted data provided');
    throw new Error('No encrypted data provided');
  }

  try {
    console.log('Attempting to decrypt payload...');
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedText) {
      console.error('Decryption produced empty result');
      throw new Error('Decryption failed - empty result');
    }

    try {
      const parsed = JSON.parse(decryptedText);
      console.log('Successfully decrypted and parsed payload');
      return parsed;
    } catch (parseError) {
      console.error('Failed to parse decrypted data:', parseError);
      throw new Error('Invalid data format after decryption');
    }
  } catch (error) {
    console.error('Decryption error:', error);
    if (error instanceof Error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
    throw new Error('Decryption failed: Unknown error');
  }
};
