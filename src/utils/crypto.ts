import CryptoJS from 'crypto-js';

// In Vite, environment variables are accessed through import.meta.env
const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY;

if (!SECRET_KEY && !import.meta.env.DEV) {
  console.error('VITE_ENCRYPTION_KEY is not set in environment variables');
}

export const decryptPayload = (encryptedData: string): any => {
  if (!SECRET_KEY) {
    if (import.meta.env.DEV) {
      // In development, return mock data structure
      return {
        firstName: 'Dev',
        userId: '12345',
        evseId: 'DEV001',
        operatorId: 'DEVOP'
      };
    }
    throw new Error('Encryption key not configured');
  }

  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedText);
  } catch (error) {
    console.error('Failed to decrypt payload:', error);
    throw new Error('Failed to decrypt data');
  }
};
