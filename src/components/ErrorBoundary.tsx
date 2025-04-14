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
      const debugInfo = {
        metaTagPresent: !!metaTag,
        metaTagContent: metaTag?.getAttribute('content') || 'None',
        environment: import.meta.env.DEV ? 'Development' : 'Production',
        hasAppSecret: !!import.meta.env.VITE_APP_SECRET,
        error: this.state.error?.message || 'Unknown error',
        errorStack: this.state.error?.stack || 'No stack trace',
        errorType: this.state.error?.constructor.name || 'Unknown type'
      };

      // Log error details
      Logger.error('ErrorBoundary caught an error', this.state.error, {
        debugInfo,
        url: window.location.href,
        userAgent: navigator.userAgent
      });

      // Force error UI to appear on top
      return (
        <div className="container" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: '#fff' }}>
          <div className="form-card">
            <div className="error-message">
              <h2>Form Error</h2>
              <p>Something went wrong while loading the form.</p>
              <p style={{ color: 'red' }}>{this.state.error?.message}</p>
              <details>
                <summary>Debug Information</summary>
                <pre style={{ textAlign: 'left', fontSize: '0.8rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
