import React, { useEffect } from 'react';

const RedirectPage: React.FC = () => {
  useEffect(() => {
    // Here you would typically trigger your mobile app's deep link
    // For example: window.location.href = 'your-app-scheme://return'
    console.log('Redirecting to mobile app...');
  }, []);

  return (
    <div className="container">
      <div className="form-card">
        <div className="redirect-content">
          <div className="loading-spinner"></div>
          <p>Returning to app...</p>
        </div>
      </div>
    </div>
  );
};

export default RedirectPage;
