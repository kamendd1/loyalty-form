/**
 * Extracts filename from a URL or path
 * Examples:
 * - https://example.com/images/logo.png -> logo.png
 * - /path/to/logo.jpg -> logo.jpg
 * - just-filename.svg -> just-filename.svg
 */
export const extractFilename = (urlOrPath: string): string => {
  try {
    // Try to parse as URL first
    const url = new URL(urlOrPath);
    return url.pathname.split('/').pop() || '';
  } catch {
    // If not a URL, treat as path
    return urlOrPath.split(/[\/\\]/).pop() || '';
  }
};

/**
 * Sanitizes a filename by removing unsafe characters
 */
export const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '');
};
