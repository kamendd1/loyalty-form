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
  <pre>[https://loyalty-form.vercel.app/?payload=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjp7InR5cGUiOiJ0ZXN0IiwicGFyYW1ldGVycyI6eyJldnNlSWQiOjEyMywicGh5c2ljYWxSZWZlcmVuY2UiOiJURVNUMTIzIn19fQ.oeWfxkKYi9SQqKNavZOEuXSxq4wYXoCdG2ncRvAwQrA</pre>](https://loyalty-form.vercel.app/?payload=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjp7InR5cGUiOiJ0ZXN0IiwicGFyYW1ldGVycyI6eyJldnNlSWQiOjEyMywicGh5c2ljYWxSZWZlcmVuY2UiOiJURVNUMTIzIn19fQ.oeWfxkKYi9SQqKNavZOEuXSxq4wYXoCdG2ncRvAwQrA</pre>)
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
      const secretBuffer = JWT_SECRET ? Buffer.from(JWT_SECRET, 'base64') : 'development-secret';
      const decodedPayload = jwt.verify(xPayload, secretBuffer, { algorithms: ['HS256'] });
      console.log('Successfully decoded payload:', JSON.stringify(decodedPayload));
      
      // Directly serve the React app with the payload embedded
      // This avoids redirect issues with Vercel routing
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Loyalty Form</title>
  <meta name="encrypted-context" content='${JSON.stringify(decodedPayload).replace(/'/g, "\\'")}'/>
</head>
<body>
  <div id="root"></div>
  
  <!-- Load the React app scripts with correct hashed filenames -->
  <link rel="stylesheet" href="/assets/index-BN_SKaEV.css">
  <script type="module" src="/assets/index-CwYl2miS.js"></script>
  
  <!-- Fallback if scripts don't load -->
  <script>
    // Check if the React app loaded successfully
    setTimeout(function() {
      if (document.getElementById('root').children.length === 0) {
        // React app didn't load, show a simple form as fallback
        document.getElementById('root').innerHTML = 
          '<div style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; text-align: center; padding: 20px;">' +
            '<h1>Loyalty Form</h1>' +
            '<p>Enter your loyalty card number to receive discounted charging rates.</p>' +
            '<form id="fallbackForm" style="max-width: 400px; margin: 0 auto;">' +
              '<input type="text" id="loyaltyNumber" maxlength="7" pattern="\\d*" inputmode="numeric" ' +
                'style="width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ccc; border-radius: 4px;" ' +
                'placeholder="Enter 7-digit loyalty number" />' +
              '<p id="inputHelp" style="text-align: left; font-size: 14px;">Enter your loyalty card number</p>' +
              '<button type="submit" ' +
                'style="width: 100%; background: linear-gradient(90deg, #00E9A3, #00C389); color: white; border: none; ' +
                'padding: 12px; border-radius: 28px; cursor: pointer; font-size: 16px;">' +
                'Submit' +
              '</button>' +
            '</form>' +
          '</div>';
        
        // Add simple form validation
        document.getElementById('fallbackForm').addEventListener('submit', function(e) {
          e.preventDefault();
          const input = document.getElementById('loyaltyNumber');
          const help = document.getElementById('inputHelp');
          
          if (!/^\d{7}$/.test(input.value)) {
            help.textContent = 'Please enter a valid 7-digit number';
            help.style.color = 'red';
            return;
          }
          
          // Show success message
          document.getElementById('fallbackForm').innerHTML = 
            '<h2 style="color: #00C389;">Thank you!</h2>' +
            '<p>Your loyalty card number has been successfully submitted.</p>' +
            '<p>You will now receive discounted charging rates at our locations.</p>';
        });
      }
    }, 3000);
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