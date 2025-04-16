import React, { useState, useEffect } from 'react';

interface DebugInfo {
  metaTags: Array<{name: string, content: string}>;
  urlInfo: {
    url: string;
    referrer: string;
    userAgent: string;
  };
  headers?: Record<string, string>;
  environment: {
    isDev: boolean;
    hasJwtSecret: boolean;
    hasAppSecret: boolean;
  };
}

const InlineDebugger: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    metaTags: [],
    urlInfo: { url: '', referrer: '', userAgent: '' },
    environment: { isDev: false, hasJwtSecret: false, hasAppSecret: false }
  });
  
  // Check for debug mode in URL or localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const debugMode = urlParams.get('debug') === 'true' || localStorage.getItem('debug_mode') === 'true';
    
    if (debugMode) {
      setIsVisible(true);
      localStorage.setItem('debug_mode', 'true');
    }
    
    // Collect debug information
    collectDebugInfo();
    
    // Add tap counter for secret debug activation
    let tapCount = 0;
    let lastTap = 0;
    
    const handleTap = () => {
      const now = new Date().getTime();
      if (now - lastTap < 500) {
        tapCount++;
        if (tapCount >= 5) {
          setIsVisible(true);
          localStorage.setItem('debug_mode', 'true');
          tapCount = 0;
        }
      } else {
        tapCount = 1;
      }
      lastTap = now;
    };
    
    document.addEventListener('click', handleTap);
    return () => document.removeEventListener('click', handleTap);
  }, []);
  
  const collectDebugInfo = () => {
    // Collect meta tags
    const metaTags = Array.from(document.querySelectorAll('meta')).map(tag => ({
      name: tag.getAttribute('name') || tag.getAttribute('property') || 'unnamed',
      content: tag.getAttribute('content') || 'no content'
    }));
    
    // Collect URL info
    const urlInfo = {
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent
    };
    
    // Check environment variables
    const environment = {
      isDev: import.meta.env.DEV,
      hasJwtSecret: !!import.meta.env.VITE_JWT_SECRET,
      hasAppSecret: !!import.meta.env.VITE_APP_SECRET
    };
    
    setDebugInfo({
      metaTags,
      urlInfo,
      environment
    });
  };
  
  const closeDebugger = () => {
    setIsVisible(false);
    localStorage.removeItem('debug_mode');
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2))
      .then(() => alert('Debug info copied to clipboard!'))
      .catch(err => console.error('Failed to copy:', err));
  };
  
  if (!isVisible) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.9)',
      zIndex: 9999,
      color: 'white',
      padding: '20px',
      fontFamily: 'monospace',
      fontSize: '14px',
      overflow: 'auto'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ color: '#4caf50' }}>Debug Information</h1>
        
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ color: '#2196f3' }}>Meta Tags</h2>
          {debugInfo.metaTags.length === 0 ? (
            <p>No meta tags found</p>
          ) : (
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {debugInfo.metaTags.map((tag, index) => (
                <li key={index} style={{ 
                  marginBottom: '8px', 
                  padding: '8px', 
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '4px'
                }}>
                  <strong>{tag.name}:</strong> {tag.content}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ color: '#2196f3' }}>URL Information</h2>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            <li style={{ marginBottom: '8px' }}><strong>URL:</strong> {debugInfo.urlInfo.url}</li>
            <li style={{ marginBottom: '8px' }}><strong>Referrer:</strong> {debugInfo.urlInfo.referrer || 'None'}</li>
            <li style={{ marginBottom: '8px' }}><strong>User Agent:</strong> {debugInfo.urlInfo.userAgent}</li>
          </ul>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ color: '#2196f3' }}>Environment</h2>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            <li style={{ marginBottom: '8px' }}>
              <strong>Mode:</strong> {debugInfo.environment.isDev ? 'Development' : 'Production'}
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>JWT Secret:</strong> {debugInfo.environment.hasJwtSecret ? 'Configured ✅' : 'Missing ❌'}
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>App Secret:</strong> {debugInfo.environment.hasAppSecret ? 'Configured ✅' : 'Missing ❌'}
            </li>
          </ul>
        </div>
        
        <div style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
          <button 
            onClick={copyToClipboard}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Copy Debug Info
          </button>
          <button 
            onClick={closeDebugger}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InlineDebugger;
