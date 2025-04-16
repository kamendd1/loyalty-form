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
      
      // Create a simple HTML page that stores the payload in localStorage and redirects to the app
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Redirecting to Loyalty Form</title>
  <meta name="encrypted-context" content='${JSON.stringify(decodedPayload).replace(/'/g, "\'")}'/>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      margin: 0; 
      padding: 0; 
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f5f5f5;
      text-align: center;
    }
    .loader {
      border: 5px solid #f3f3f3;
      border-top: 5px solid #00E9A3;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 20px auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .container {
      max-width: 500px;
      padding: 30px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Redirecting to Loyalty Form</h1>
    <div class="loader"></div>
    <p>You'll be redirected to the form in a moment...</p>
  </div>
  <script>
    // Store both the raw JWT payload and the decoded payload
    sessionStorage.setItem('jwt_payload', '${xPayload}');
    // Store the decoded payload as JSON so the React app doesn't need to decode it again
    sessionStorage.setItem('decoded_payload', '${JSON.stringify(decodedPayload).replace(/'/g, "\'")}')
    // Also prepare it as a URL parameter
    const payloadParam = encodeURIComponent('${xPayload}');
    
    // Function to check if the app is loaded
    function checkAppLoaded() {
      const rootElement = document.getElementById('root');
      return rootElement && rootElement.childElementCount > 0;
    }
    
    // Log what we're doing for debugging
    console.log('Preparing to redirect to React app');
    
    // Redirect to the React app after a short delay
    setTimeout(function() {
      // Check if we've already redirected to avoid loops
      const hasRedirected = sessionStorage.getItem('hasRedirected');
      
      if (!hasRedirected) {
        // Mark that we've redirected
        sessionStorage.setItem('hasRedirected', 'true');
        console.log('Redirecting to React app with payload');
        // Redirect to the React app with the payload as a parameter
        window.location.href = '/?payload=' + payloadParam;
      } else {
        // Already redirected, check if app is loaded
        if (!checkAppLoaded()) {
          console.log('App not loaded after redirect, showing error');
          // App not loaded, show error
          document.querySelector('.loader').style.display = 'none';
          document.querySelector('p').innerHTML = 'App loading issue detected. <a href="/?payload=' + payloadParam + '">Click here</a> to try again.';
        } else {
          console.log('App loaded successfully');
        }
      }
    }, 1500);
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