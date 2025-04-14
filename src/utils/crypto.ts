import CryptoJS from 'crypto-js';

// In Vite, environment variables are accessed through import.meta.env
const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default-dev-key';

// Debug log to verify environment variable loading
console.log('Encryption key loaded:', SECRET_KEY === 'default-dev-key' ? 'using default' : 'from env');

export const decryptPayload = (encryptedData: string): any => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedText);
  } catch (error) {
    console.error('Failed to decrypt payload:', error);
    return null;
  }
};
