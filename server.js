// Serverless function for Vercel
import jwt from 'jsonwebtoken';

// Get JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || process.env.VITE_JWT_SECRET;

// Log startup information
console.log('Starting serverless function...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Has JWT Secret:', !!JWT_SECRET);

// Create a request handler function for serverless environments
export default function handler(req, res) {
  // Log request details
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers));
  
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
      // Decode the JWT token
      const secretBuffer = JWT_SECRET ? Buffer.from(JWT_SECRET, 'base64') : 'development-secret';
      const decodedPayload = jwt.verify(xPayload, secretBuffer, { algorithms: ['HS256'] });
      console.log('Successfully decoded payload:', JSON.stringify(decodedPayload));
      
      // Extract User ID and EVSE ID from the payload if available
      const userId = decodedPayload.payload?.parameters?.userId || 'Not available';
      const evseId = decodedPayload.payload?.parameters?.evseId || 'Not available';
      const evseReference = decodedPayload.payload?.parameters?.evsePhysicalReference || 'Not available';
      const firstName = decodedPayload.payload?.parameters?.firstName || '';
      
      // Serve a complete form directly without any redirects
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Loyalty Form</title>
  <style>
    body { font-family: Arial, sans-serif; text-align: center; padding: 20px; max-width: 800px; margin: 0 auto; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
    .form-card { padding: 20px; }
    .logo-container { text-align: center; margin-bottom: 20px; }
    .logo { max-width: 200px; height: auto; }
    h1 { color: #333; margin-bottom: 20px; }
    .greeting { color: #4CAF50; }
    .context-info { margin-bottom: 20px; padding: 10px; background-color: #f0f0f0; border-radius: 4px; }
    .input-group { margin-bottom: 20px; }
    input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; }
    .input-help { font-size: 14px; color: #666; margin-top: 5px; }
    .error-text { color: #d32f2f; }
    .submit-button { width: 100%; padding: 12px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; font-size: 16px; cursor: pointer; }
    .submit-button:hover { background-color: #45a049; }
    .submit-button:disabled { background-color: #cccccc; cursor: not-allowed; }
    .success-message { display: none; text-align: center; padding: 20px; }
    .success-message h3 { color: #4CAF50; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="form-card">
      <div class="logo-container">
        <img src="https://play-lh.googleusercontent.com/-myH_Ievhf2k5S-JCRTqxJmmh_LmYgJ9rBB6L9z4aS64tKb07TkaVAszPFmXinbtJSQ=w7680-h4320-rw" alt="Company Logo" class="logo">
      </div>
      
      <h1>
        ${firstName ? `<span class="greeting">Hi ${firstName}, </span>` : ''}
        Enjoy lower KWh price while charging at our stores!
      </h1>
      
      <div class="context-info">
        <p><strong>Selected Charger:</strong> ${evseId}</p>
        <p><strong>EVSE Reference:</strong> ${evseReference}</p>
        <p><strong>User ID:</strong> ${userId}</p>
      </div>
      
      <form id="loyaltyForm">
        <div class="input-group">
          <input type="text" id="loyaltyNumber" maxlength="7" pattern="\d*" inputmode="numeric" placeholder="">
          <p class="input-help" id="inputHelp">Enter your loyalty card number</p>
        </div>
        
        <button type="submit" class="submit-button" id="submitButton">Submit</button>
      </form>
      
      <div id="successMessage" class="success-message">
        <h3>Thank you!</h3>
        <p>Your loyalty card number has been successfully submitted.</p>
        <p>You will now receive discounted charging rates at our locations.</p>
      </div>
      
      <script>
        document.getElementById('loyaltyForm').addEventListener('submit', function(e) {
          e.preventDefault();
          const loyaltyNumber = document.getElementById('loyaltyNumber').value;
          const inputHelp = document.getElementById('inputHelp');
          const submitButton = document.getElementById('submitButton');
          
          if (loyaltyNumber.length === 0) {
            inputHelp.textContent = 'Please enter your loyalty card number';
            inputHelp.className = 'input-help error-text';
            return;
          }
          
          if (!/^\d+$/.test(loyaltyNumber)) {
            inputHelp.textContent = 'Please enter numbers only';
            inputHelp.className = 'input-help error-text';
            return;
          }
          
          if (loyaltyNumber.length < 7) {
            inputHelp.textContent = 'Please enter a 7-digit card number';
            inputHelp.className = 'input-help error-text';
            return;
          }
          
          // Show success message
          document.getElementById('loyaltyForm').style.display = 'none';
          document.getElementById('successMessage').style.display = 'block';
        });
      </script>
    </div>
  </div>
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
