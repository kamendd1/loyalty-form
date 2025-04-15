import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getLogoByFilename } from '../utils/logoStorage';

const SuccessPage: React.FC = () => {
  const defaultLogo = "https://play-lh.googleusercontent.com/-myH_Ievhf2k5S-JCRTqxJmmh_LmYgJ9rBB6L9z4aS64tKb07TkaVAszPFmXinbtJSQ=w7680-h4320-rw";
  const [logoUrl, setLogoUrl] = useState<string>(defaultLogo);
  const navigate = useNavigate();
  const { logo: logoParam } = useParams();

  useEffect(() => {
    if (logoParam) {
      const storedLogo = getLogoByFilename(logoParam);
      if (storedLogo) {
        setLogoUrl(storedLogo);
      }
    }
  }, [logoParam]);

  return (
    <div className="container">
      <div className="form-card">
        <div className="logo-container">
          <a href={`/${logoParam}/logo`} className="logo-link">
            <img 
              src={logoUrl}
              alt="Company Logo" 
              className="logo"
              onError={() => setLogoUrl(defaultLogo)}
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
