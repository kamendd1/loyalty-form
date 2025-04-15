import React, { useEffect, useState } from 'react';

interface ErrorPageProps {
  message?: string;
}

const ErrorPage: React.FC<ErrorPageProps> = ({ message = 'Form Loading Error' }) => {
  const [debugInfo, setDebugInfo] = useState({
    metaTag: null as Element | null,
    metaContent: '',
    hasSecret: false,
    isDev: false,
    error: null as Error | null
  });

  useEffect(() => {
    try {
      // Get meta tag info
      const metaTag = document.querySelector('meta[name="encrypted-context"]');
      const metaContent = metaTag?.getAttribute('content') || '';

      // Get environment info
      const hasSecret = !!import.meta.env.VITE_APP_SECRET;
      const isDev = import.meta.env.DEV;

      setDebugInfo({
        metaTag,
        metaContent,
        hasSecret,
        isDev,
        error: null
      });
    } catch (error) {
      setDebugInfo(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Unknown error')
      }));
    }
  }, []);

  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#fff',
      zIndex: 9999,
      padding: '20px',
      fontFamily: 'monospace'
    }}>
      <h1 style={{ color: 'red' }}>{message}</h1>
      <div style={{ marginBottom: '20px' }}>
        <h2>Debug Information:</h2>
        <pre style={{ 
          background: '#f5f5f5',
          padding: '10px',
          borderRadius: '4px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}>
          {JSON.stringify({
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            metaTagPresent: !!debugInfo.metaTag,
            metaContentLength: debugInfo.metaContent.length,
            metaContentPreview: debugInfo.metaContent 
              ? `${debugInfo.metaContent.substring(0, 50)}...` 
              : 'none',
            hasSecret: debugInfo.hasSecret,
            isDev: debugInfo.isDev,
            error: debugInfo.error?.message
          }, null, 2)}
        </pre>
      </div>
      <div>
        <button onClick={() => window.location.reload()} style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer'
        }}>
          Retry Loading Form
        </button>
      </div>
    </div>
  );
};

export default ErrorPage;
