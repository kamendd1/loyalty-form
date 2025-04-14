import React from 'react';

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
    console.error('Error caught by boundary:', error, errorInfo);
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
        error: this.state.error?.message || 'Unknown error'
      };

      return (
        <div className="container">
          <div className="form-card">
            <div className="error-message">
              <p>Something went wrong while loading the form.</p>
              <details>
                <summary>Debug Information</summary>
                <pre style={{ textAlign: 'left', fontSize: '0.8rem' }}>
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
