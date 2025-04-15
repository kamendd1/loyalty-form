import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEncryptedContext } from '../hooks/useEncryptedContext';
import { getCurrentLogo, setCurrentLogo, getLogoByFilename } from '../utils/logoStorage';

const ErrorPage = lazy(() => import('./ErrorPage'));

const FormPage: React.FC = () => {
  const defaultLogo = "https://play-lh.googleusercontent.com/-myH_Ievhf2k5S-JCRTqxJmmh_LmYgJ9rBB6L9z4aS64tKb07TkaVAszPFmXinbtJSQ=w7680-h4320-rw";
  const [loyaltyNumber, setLoyaltyNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { logo: logoParam } = useParams();
  const [logoUrl, setLogoUrl] = useState<string>(getCurrentLogo() || defaultLogo);

  // Update logo URL
  const updateLogo = (newUrl: string) => {
    setLogoUrl(newUrl);
    setCurrentLogo(newUrl);
    // Extract filename from URL
    const filename = new URL(newUrl).pathname.split('/').pop() || 'logo';
    // Update URL with filename
    navigate(`/${filename}`);
  };

  // Handle URL parameters
  useEffect(() => {
    if (logoParam) {
      const logoUrl = getLogoByFilename(logoParam);
      if (logoUrl) {
        setLogoUrl(logoUrl);
        setCurrentLogo(logoUrl);
      } else {
        console.error('Logo not found:', logoParam);
        setLogoUrl(defaultLogo);
      }
    }
  }, [logoParam, defaultLogo]);

  const { contextData, isLoading, error: contextError, isFromMobileApp } = useEncryptedContext();

  // Pre-fill loyalty number if provided in context
  useEffect(() => {
    if (contextData?.loyaltyNumber) {
      const number = contextData.loyaltyNumber.toString();
      if (validateInput(number)) {
        setLoyaltyNumber(number);
      }
    }
  }, [contextData]);

  const validateInput = (value: string) => {
    if (!/^\d*$/.test(value)) {
      setError('Please enter numbers only');
      return false;
    }
    if (value.length > 7) {
      setError('Card number cannot be longer than 7 digits');
      return false;
    }
    setError('');
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 7) {
      setLoyaltyNumber(value);
      setError('');
    } else if (value === '') {
      setLoyaltyNumber('');
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loyaltyNumber.length === 0) {
      setError('Please enter your loyalty card number');
      return;
    }

    if (!validateInput(loyaltyNumber)) {
      return;
    }

    if (loyaltyNumber.length < 7) {
      setError('Please enter a 7-digit card number');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call with context data
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Navigate to success page with context and logo
    const successPath = logoParam ? `/${logoParam}/success` : '/success';
    navigate(successPath, { 
      state: { 
        loyaltyNumber,
        ...contextData
      }
    });
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="form-card">
          <div className="loading-spinner" />
          <p>Loading context...</p>
        </div>
      </div>
    );
  }

  if (isFromMobileApp && contextError) {
    return (
      <Suspense fallback={<div>Loading error information...</div>}>
        <ErrorPage message="Failed to load context" />
      </Suspense>
    );
  }

  return (
    <div className="container">
      <div className="form-card">
        <div className="logo-container">
          <a href="/logo" className="logo-link">
            <img 
              src={logoUrl}
              alt="Company Logo" 
              className="logo"
              onError={() => updateLogo(defaultLogo)}
            />
          </a>
        </div>
        
        <h1>
          {contextData?.firstName && contextData.firstName !== 'John' && contextData?.userId !== 'DEV_USER_001' && (
            <span className="greeting">Hi {contextData.firstName}, </span>
          )}
          Enjoy lower KWh price while charging at our stores!
        </h1>
        
        {contextData?.evseId && contextData.evseId !== 'DEV_EVSE_001' && contextData?.operatorId && contextData.operatorId !== 'DEV_OPERATOR_001' && contextData?.userId !== 'DEV_USER_001' && (
          <div className="context-info">
            <p>Selected Charger: {contextData.evseId}</p>
            <p>Operator: {contextData.operatorId}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              value={loyaltyNumber}
              onChange={handleInputChange}
              className={error ? 'error' : ''}
              maxLength={7}
              pattern="\d*"
              inputMode="numeric"
              placeholder=""
            />
            <p className={`input-help ${error ? 'error-text' : ''}`}>
              {error || 'Enter your loyalty card number'}
            </p>
          </div>
          
          <button 
            type="submit" 
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FormPage;
