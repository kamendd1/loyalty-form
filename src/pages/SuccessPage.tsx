import React from 'react';
import { useNavigate } from 'react-router-dom';

const SuccessPage: React.FC = () => {
  const defaultLogo = "https://play-lh.googleusercontent.com/-myH_Ievhf2k5S-JCRTqxJmmh_LmYgJ9rBB6L9z4aS64tKb07TkaVAszPFmXinbtJSQ=w7680-h4320-rw";
  const customLogo = localStorage.getItem('customLogoUrl');
  const navigate = useNavigate();
  return (
    <div className="container">
      <div className="form-card">
        <div className="logo-container">
          <a href="/logo" className="logo-link">
            <img 
              src={customLogo || defaultLogo}
              alt="Company Logo" 
              className="logo"
            />
          </a>
        </div>
        
        <div className="success-content">
          <div className="success-icon">✓</div>
          <h1>Thank you!</h1>
          <p className="success-message">Loyalty card number is correct! Enjoy your discounts!</p>
          <button 
            onClick={() => navigate('/redirect')} 
            className="return-button"
          >
            Return to App
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;
