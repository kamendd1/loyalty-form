import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FormPage: React.FC = () => {
  const [loyaltyNumber, setLoyaltyNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Navigate to success page
    navigate('/success');
  };

  return (
    <div className="container">
      <div className="form-card">
        <div className="logo-container">
          <img 
            src="https://www.logo.wine/a/logo/E.Leclerc/E.Leclerc-Logo.wine.svg" 
            alt="E.Leclerc Logo" 
            className="logo"
          />
        </div>
        
        <h1>Enjoy lower KWh price while charging at our stores!</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              value={loyaltyNumber}
              onChange={handleInputChange}
              className={error ? 'error' : ''}
              maxLength={7}
              pattern="\d*"
              placeholder="Enter your loyalty card number"
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
