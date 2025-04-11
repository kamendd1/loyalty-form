import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LogoPage: React.FC = () => {
  const [logoUrl, setLogoUrl] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!logoUrl) {
      setError('Please enter a logo URL');
      return;
    }

    // Store the logo URL in localStorage
    localStorage.setItem('customLogoUrl', logoUrl);
    
    // Navigate back to the form
    navigate('/');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoUrl(e.target.value);
    setError('');
  };

  return (
    <div className="container">
      <div className="form-card">
        <h1>Customize Logo</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="url"
              value={logoUrl}
              onChange={handleInputChange}
              className={error ? 'error' : ''}
              placeholder="Enter logo URL"
            />
            <p className={`input-help ${error ? 'error-text' : ''}`}>
              {error || 'Enter the URL of your logo image'}
            </p>
          </div>
          
          {logoUrl && (
            <div className="logo-preview">
              <p className="preview-text">Preview:</p>
              <img 
                src={logoUrl} 
                alt="Logo Preview" 
                className="logo"
                onError={() => setError('Invalid image URL')}
              />
            </div>
          )}
          
          <button 
            type="submit" 
            className="submit-button"
          >
            Save Logo
          </button>
        </form>
      </div>
    </div>
  );
};

export default LogoPage;
