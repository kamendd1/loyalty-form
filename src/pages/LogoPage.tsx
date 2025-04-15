import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setCurrentLogo, storeLogo } from '../utils/logoStorage';

const LogoPage: React.FC = () => {
  const [logoUrl, setLogoUrl] = useState('');
  const [customFilename, setCustomFilename] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!logoUrl) {
      setError('Please enter a logo URL');
      return;
    }

    try {
      // Store and set as current
      const sanitizedFilename = customFilename
        .toLowerCase()
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/[^a-z0-9-_.]/g, '') // Remove invalid characters
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

      const filename = storeLogo(logoUrl, sanitizedFilename || undefined);
      setCurrentLogo(logoUrl);
      
      // Clear form
      setLogoUrl('');
      setCustomFilename('');
      
      // Navigate back to form with filename
      navigate(`/${filename}`);
    } catch (err) {
      setError('Invalid logo URL');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoUrl(e.target.value);
    setError('');
  };

  return (
    <div className="container">
      <div className="form-card">
        <h1>Add Logo</h1>
        
        <form onSubmit={handleSubmit} className="add-logo-form">
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
          
          <div className="input-group">
            <input
              type="text"
              value={customFilename}
              onChange={(e) => setCustomFilename(e.target.value)}
              placeholder="Custom filename (e.g., lidl-logo.png)"
            />
            <p className={`input-help ${customFilename ? 'url-preview' : ''}`}>
              {customFilename 
                ? `Will be accessible at /${customFilename.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_.]/g, '')}` 
                : 'Leave empty to use filename from URL'}
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
            Add Logo
          </button>
        </form>
      </div>
    </div>
  );
};

export default LogoPage;
