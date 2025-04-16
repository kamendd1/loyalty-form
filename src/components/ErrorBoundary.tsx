import React from 'react';
import Logger from '../utils/logger';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Logger.error('Error caught by boundary', error, {
      componentStack: errorInfo.componentStack,
      location: window.location.href
    });
  }

  render() {
    if (this.state.hasError) {
      // Add debug information
      const metaTag = document.querySelector('meta[name="encrypted-context"]');
      const allMetaTags = Array.from(document.querySelectorAll('meta')).map(tag => ({
        name: tag.getAttribute('name') || tag.getAttribute('property') || 'unnamed',
        content: tag.getAttribute('content')?.substring(0, 30) + '...' || 'no-content'
      }));
      
      // Check for JWT token format
      const encryptedData = metaTag?.getAttribute('content');
      const isJwtFormat = encryptedData ? /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(encryptedData) : false;
      const isBase64Format = encryptedData ? /^[A-Za-z0-9+/=]+$/.test(encryptedData) : false;
      
      // Check for X-Payload header (will likely be null due to CORS)
      let headerPayload = null;
      try {
        // This will likely fail due to CORS, but worth checking
        headerPayload = document.querySelector('meta[name="x-payload"]')?.getAttribute('content');
      } catch (e) {
        console.error('Error checking for X-Payload:', e);
      }
      
      const debugInfo = {
        metaTagPresent: !!metaTag,
        metaTagContent: metaTag?.getAttribute('content')?.substring(0, 50) + '...' || 'None',
        allMetaTags: allMetaTags,
        tokenAnalysis: encryptedData ? {
          length: encryptedData.length,
          isJwtFormat,
          isBase64Format,
          firstChars: encryptedData.substring(0, 20) + '...',
          lastChars: encryptedData.length > 20 ? '...' + encryptedData.substring(encryptedData.length - 20) : ''
        } : 'No token found',
        xPayloadHeader: headerPayload,
        environment: import.meta.env.DEV ? 'Development' : 'Production',
        hasAppSecret: !!import.meta.env.VITE_APP_SECRET,
        hasJwtSecret: !!import.meta.env.VITE_JWT_SECRET,
        error: this.state.error?.message || 'Unknown error',
        errorStack: this.state.error?.stack || 'No stack trace',
        errorType: this.state.error?.constructor.name || 'Unknown type',
        userAgent: navigator.userAgent,
        isMobile: /android|iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase()),
        url: window.location.href,
        search: window.location.search,
        referrer: document.referrer
      };

      // Log error details
      Logger.error('ErrorBoundary caught an error', this.state.error, {
        debugInfo,
        url: window.location.href,
        userAgent: navigator.userAgent
      });

      // Force error UI to appear on top
      return (
        <div className="container" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: '#fff', padding: '20px', overflow: 'auto' }}>
          <div className="form-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="error-message">
              <h2 style={{ color: '#d32f2f' }}>Form Error</h2>
              <p>Something went wrong while loading the form.</p>
              <p style={{ color: 'red', fontWeight: 'bold' }}>{this.state.error?.message}</p>
              
              <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f8f8', borderRadius: '4px', border: '1px solid #ddd' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>JWT Token Status</h3>
                <p><strong>Meta tag present:</strong> {debugInfo.metaTagPresent ? '✅ Yes' : '❌ No'}</p>
                {debugInfo.metaTagPresent && (
                  <>
                    <p><strong>Token format:</strong> {typeof debugInfo.tokenAnalysis === 'object' && debugInfo.tokenAnalysis.isJwtFormat ? '✅ Valid JWT format' : '❌ Not a JWT token'}</p>
                    <p><strong>JWT Secret configured:</strong> {debugInfo.hasJwtSecret ? '✅ Yes' : '❌ No'}</p>
                  </>
                )}
              </div>
              
              <details style={{ marginTop: '15px' }}>
                <summary style={{ cursor: 'pointer', padding: '10px', backgroundColor: '#eee', borderRadius: '4px' }}>Full Debug Information</summary>
                <pre style={{ textAlign: 'left', fontSize: '0.8rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '4px', marginTop: '10px', overflowX: 'auto' }}>
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
              
              <div style={{ marginTop: '20px' }}>
                <button 
                  onClick={() => {
                    // Copy debug info to clipboard
                    navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2))
                      .then(() => alert('Debug info copied to clipboard!'))
                      .catch(err => console.error('Failed to copy:', err));
                  }}
                  style={{ padding: '8px 16px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Copy Debug Info
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  style={{ marginLeft: '10px', padding: '8px 16px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
