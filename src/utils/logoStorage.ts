interface LogoMap {
  [filename: string]: {
    url: string;
    addedAt: number;
  };
}

const LOGO_MAP_KEY = 'logoMap';
const CURRENT_LOGO_KEY = 'currentLogoUrl';

/**
 * Get all stored logos
 */
export const getStoredLogos = (): LogoMap => {
  try {
    const logosJson = localStorage.getItem(LOGO_MAP_KEY);
    return logosJson ? JSON.parse(logosJson) : {};
  } catch {
    return {};
  }
};

/**
 * Store a logo URL
 */
export const storeLogo = (url: string, customName?: string): string => {
  try {
    // Validate URL
    const parsedUrl = new URL(url);
    
    // Get filename from URL or use custom name
    const filename = customName || parsedUrl.pathname.split('/').pop() || 'logo';
    
    // Get existing logos
    const logos = getStoredLogos();
    
    // Add new logo
    logos[filename] = {
      url,
      addedAt: Date.now()
    };
    
    // Save to storage
    localStorage.setItem(LOGO_MAP_KEY, JSON.stringify(logos));
    
    return filename;
  } catch (err) {
    console.error('Failed to store logo:', err);
    throw new Error('Invalid logo URL');
  }
};

/**
 * Get current active logo URL
 */
export const getCurrentLogo = (): string | null => {
  try {
    return localStorage.getItem(CURRENT_LOGO_KEY);
  } catch {
    return null;
  }
};

/**
 * Set current active logo URL
 */
export const setCurrentLogo = (url: string): void => {
  try {
    localStorage.setItem(CURRENT_LOGO_KEY, url);
  } catch (err) {
    console.error('Failed to set current logo:', err);
  }
};

/**
 * Delete a logo
 */
export const getLogoByFilename = (filename: string): string | null => {
  try {
    const logos = getStoredLogos();
    return logos[filename]?.url || null;
  } catch {
    return null;
  }
};

export const deleteLogo = (filename: string): void => {
  try {
    const logos = getStoredLogos();
    const url = logos[filename]?.url;
    delete logos[filename];
    localStorage.setItem(LOGO_MAP_KEY, JSON.stringify(logos));
    
    // If this was the current logo, clear it
    if (url && getCurrentLogo() === url) {
      localStorage.removeItem(CURRENT_LOGO_KEY);
    }
  } catch (err) {
    console.error('Failed to delete logo:', err);
  }
};
