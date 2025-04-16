// Server implementation for both Vercel and local development
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import express from 'express';

// Load environment variables from .env file
dotenv.config();

// Get JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || process.env.VITE_JWT_SECRET;

// Log startup information
console.log('Starting serverless function...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Has JWT Secret:', !!JWT_SECRET);

// Create a request handler function that works for both Express and serverless
async function handler(req, res) {
  // Log request details
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Set CORS headers to allow all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Payload');
  
  // Handle OPTIONS requests (preflight)
  if (req.method === 'OPTIONS') {
    res.statusCode = 204; // No content
    res.end();
    return;
  }
  
  // Only handle GET requests
  if (req.method === 'GET') {
    // Get the X-Payload header (case insensitive) or from URL query
    const urlParams = req.url.includes('?') ? new URLSearchParams(req.url.split('?')[1]) : new URLSearchParams();
    const xPayload = req.headers['x-payload'] || req.headers['X-Payload'] || urlParams.get('payload');
    
    // If no payload is provided, show the default page
    if (!xPayload) {
      // Create a simple HTML page with instructions
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Loyalty Form Server</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
    .note { background: #fffde7; padding: 15px; border-left: 4px solid #ffd600; margin: 20px 0; }
  </style>
</head>
<body>
  <h1>Loyalty Form Server</h1>
  <p>This server is designed to receive requests with JWT tokens and display a loyalty form.</p>
  
  <div class="note">
    <p><strong>Note:</strong> You're seeing this page because you accessed the server directly in a browser without an X-Payload header.</p>
    <p>In normal operation, this server will receive requests from the vendor's backend with a JWT token.</p>
  </div>
  
  <h2>Test with a Sample JWT Token</h2>
  <p>You can test this server by adding a payload parameter to the URL:</p>
  <pre>https://loyalty-form.vercel.app/?payload=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjp7InR5cGUiOiJ0ZXN0IiwicGFyYW1ldGVycyI6eyJldnNlSWQiOjEyMywicGh5c2ljYWxSZWZlcmVuY2UiOiJURVNUMTIzIn19fQ.oeWfxkKYi9SQqKNavZOEuXSxq4wYXoCdG2ncRvAwQrA</pre>
</body>
</html>`;
      
      // Send the HTML response
      res.setHeader('Content-Type', 'text/html');
      res.statusCode = 200;
      res.end(html);
      return;
    }
    
    // We have a payload, so let's process it
    console.log('Received payload:', xPayload.substring(0, 30) + '...');
    
    try {
      // Decode the JWT token to verify it's valid
      let decodedPayload;
      try {
        // First try to verify with the base64-decoded secret
        const secretBuffer = JWT_SECRET ? Buffer.from(JWT_SECRET, 'base64') : 'development-secret';
        decodedPayload = jwt.verify(xPayload, secretBuffer, { algorithms: ['HS256'] });
      } catch (verifyError) {
        // If that fails, try with the raw secret
        try {
          decodedPayload = jwt.verify(xPayload, JWT_SECRET || 'development-secret', { algorithms: ['HS256'] });
        } catch (rawError) {
          // If in development, try to decode without verification
          if (process.env.NODE_ENV !== 'production') {
            decodedPayload = jwt.decode(xPayload);
            console.log('Development mode: Decoded JWT without verification');
          } else {
            throw rawError;
          }
        }
      }
      console.log('Successfully decoded payload:', JSON.stringify(decodedPayload));
      
      // Extract user information from the payload
      let userId = '';
      let evseId = '';
      let firstName = '';
      let lastName = '';
      let evseReference = '';
      
      // Handle different payload formats
      if (decodedPayload.payload && typeof decodedPayload.payload === 'object') {
        // New format with nested payload
        const params = decodedPayload.payload.parameters || {};
        userId = params.userId || '';
        evseId = params.evseId || '';
        firstName = params.firstName || '';
        evseReference = params.evsePhysicalReference || params.physicalReference || '';
      } else {
        // Direct mapping format
        userId = decodedPayload.userId || '';
        evseId = decodedPayload.evseId || '';
        firstName = decodedPayload.firstName || '';
        evseReference = decodedPayload.evseReference || '';
      }
      
      // If we have a userId but no firstName, fetch user info
      if (userId && !firstName) {
        try {
          const apiBaseUrl = process.env.API_BASE_URL || process.env.VITE_API_BASE_URL;
          const apiToken = process.env.API_TOKEN || process.env.VITE_API_TOKEN;
          
          const response = await fetch(`${apiBaseUrl}/public-api/resources/users/v1.0/${userId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            firstName = userData.firstName || '';
            lastName = userData.lastName || '';
            console.log('Successfully fetched user info:', { firstName, lastName });
          } else {
            console.error('Failed to fetch user info:', response.status);
          }
        } catch (error) {
          console.error('Error fetching user info:', error);
        }
      }
      
      // Create a complete HTML form with all styling embedded
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Loyalty Form</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      margin: 0; 
      padding: 0; 
      background-color: #f5f5f5; 
    }
    .container {
      max-width: 500px;
      margin: 0 auto;
      padding: 20px;
    }
    .form-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      padding: 24px;
      margin-top: 20px;
    }
    .logo-container {
      text-align: center;
      margin-bottom: 24px;
    }
    .logo {
      max-width: 180px;
      max-height: 60px;
    }
    h1 {
      font-size: 1.5rem;
      margin-bottom: 24px;
      color: #333;
      text-align: center;
    }
    .greeting {
      color: #00C389;
      font-weight: bold;
    }
    .context-info {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 24px;
      font-size: 0.9rem;
      color: #666;
    }
    .context-info p {
      margin: 4px 0;
    }
    .input-group {
      margin-bottom: 24px;
    }
    input {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 1rem;
      box-sizing: border-box;
    }
    input.error {
      border-color: #ff5252;
    }
    .input-help {
      font-size: 0.9rem;
      color: #666;
      margin-top: 8px;
    }
    .error-text {
      color: #ff5252;
    }
    .submit-button {
      width: 100%;
      background: linear-gradient(90deg, #00E9A3, #00C389);
      color: white;
      border: none;
      border-radius: 28px;
      padding: 12px;
      font-size: 1rem;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .submit-button:hover {
      opacity: 0.9;
    }
    .submit-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .success-message {
      display: none;
      text-align: center;
    }
    .success-message h3 {
      color: #00C389;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="form-card">
      <div class="logo-container">
        <img src="https://play-lh.googleusercontent.com/-myH_Ievhf2k5S-JCRTqxJmmh_LmYgJ9rBB6L9z4aS64tKb07TkaVAszPFmXinbtJSQ=w7680-h4320-rw" alt="Company Logo" class="logo" id="companyLogo">
      </div>
      
      <h1 id="formTitle">
        ${firstName ? `<span class="greeting">Hi ${firstName}${lastName ? ' ' + lastName : ''}, </span>` : ''}
        Enjoy lower KWh price while charging at our stores!
      </h1>
      
      ${evseId || evseReference ? `
      <div class="context-info">
        ${evseId ? '<p>Selected Charger: ' + evseId + '</p>' : ''}
        ${evseReference ? '<p>EVSE Reference: ' + evseReference + '</p>' : ''}
        ${userId ? '<p>User ID: ' + userId + '</p>' : ''}
      </div>
      ` : ''}
      
      <form id="loyaltyForm">
        <div class="input-group">
          <input type="text" id="loyaltyNumber" maxlength="7" pattern="\\d*" inputmode="numeric" placeholder="">
          <p class="input-help" id="inputHelp">Enter your loyalty card number</p>
        </div>
        
        <button type="submit" class="submit-button" id="submitButton">Submit</button>
      </form>
      
      <div id="successMessage" class="success-message">
        <h3>Thank you!</h3>
        <p>Your loyalty card number has been successfully submitted.</p>
        <p>You will now receive discounted charging rates at our locations.</p>
      </div>
    </div>
  </div>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // Store payload data for use in JavaScript
      const userData = {
        userId: "${userId}",
        evseId: "${evseId}",
        firstName: "${firstName}",
        evseReference: "${evseReference}"
      };
      
      // No need to fetch user info in the client since we already have it from the server
      }
      
      // Form validation
      const form = document.getElementById('loyaltyForm');
      const input = document.getElementById('loyaltyNumber');
      const inputHelp = document.getElementById('inputHelp');
      const submitButton = document.getElementById('submitButton');
      const successMessage = document.getElementById('successMessage');
      
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        const value = input.value;
        
        // Validate input
        if (value.length === 0) {
          inputHelp.textContent = 'Please enter your loyalty card number';
          inputHelp.className = 'input-help error-text';
          input.className = 'error';
          return;
        }
        
        if (!/^\\d+$/.test(value)) {
          inputHelp.textContent = 'Please enter numbers only';
          inputHelp.className = 'input-help error-text';
          input.className = 'error';
          return;
        }
        
        if (value.length < 7) {
          inputHelp.textContent = 'Please enter a 7-digit card number';
          inputHelp.className = 'input-help error-text';
          input.className = 'error';
          return;
        }
        
        // Disable button and show loading state
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';
        
        // Simulate API call
        setTimeout(function() {
          // Hide form and show success message
          form.style.display = 'none';
          successMessage.style.display = 'block';
        }, 1000);
      });
      
      // Logo replacement functionality
      const logoElement = document.getElementById('companyLogo');
      
      // Check if we have a specific logo for this EVSE
      if (userData.evseId === '171') {
        // Example: Replace logo for a specific EVSE ID
        logoElement.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/2560px-Google_2015_logo.svg.png';
      } else if (userData.evseReference && userData.evseReference.includes('3864')) {
        // Example: Replace logo based on EVSE reference
        logoElement.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/2560px-Amazon_logo.svg.png';
      }
    });
  </script>
</body>
</html>`;
      
      // Send the HTML response
      res.setHeader('Content-Type', 'text/html');
      res.statusCode = 200;
      res.end(html);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      res.statusCode = 500;
      res.end(`Error decoding JWT token: ${error.message}`);
    }
  } else {
    // For all other request methods, return 405 Method Not Allowed
    res.statusCode = 405;
    res.end('Method Not Allowed');
  }
}

// Set up Express server for local development
if (process.env.NODE_ENV !== 'production') {
  const app = express();
  const PORT = process.env.PORT || 3000;
  
  // Use the handler function for specific routes
  app.get('/', handler);
  app.get('/index.html', handler);
  
  // Start the server
  app.listen(PORT, () => {
    console.log(`Local server running at http://localhost:${PORT}`);
  });
}

// Export the handler for Vercel
export default handler;
