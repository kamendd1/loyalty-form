import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEncryptedContext } from '../hooks/useEncryptedContext';

const FormPage: React.FC = () => {
  const defaultLogo = "https://play-lh.googleusercontent.com/-myH_Ievhf2k5S-JCRTqxJmmh_LmYgJ9rBB6L9z4aS64tKb07TkaVAszPFmXinbtJSQ=w7680-h4320-rw";
  const customLogo = localStorage.getItem('customLogoUrl');
  const [loyaltyNumber, setLoyaltyNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { contextData, isLoading, error: contextError } = useEncryptedContext();

  // Pre-fill loyalty number if provided in context
  React.useEffect(() => {
    if (contextData.loyaltyNumber) {
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
    
    // Navigate to success page with context
    navigate('/success', { 
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

  if (contextError) {
    return (
      <div className="container">
        <div className="form-card">
          <div className="error-message">
            <p>Failed to load context. Please try again.</p>
            {import.meta.env.DEV && <p>{contextError}</p>}
          </div>
        </div>
      </div>
    );
  }

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
        
        <h1>
          {contextData.firstName && (
            <span className="greeting">Hi {contextData.firstName}, </span>
          )}
          Enjoy lower KWh price while charging at our stores!
        </h1>
        
        {contextData.evseId && (
          <div className="context-info">
            <p>Selected Charger: {contextData.evseId}</p>
            {contextData.operatorId && <p>Operator: {contextData.operatorId}</p>}
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
