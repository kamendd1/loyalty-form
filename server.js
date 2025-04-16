// Serverless function for Vercel
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

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
    
    // Check if this is a redirected request (has payload in URL and no X-Payload header)
    const isRedirectedRequest = urlParams.has('payload') && !req.headers['x-payload'] && !req.headers['X-Payload'];
    
    console.log('Is redirected request:', isRedirectedRequest);
    
    // Even for redirected requests, we'll redirect to the React app's form page
    if (isRedirectedRequest) {
      console.log('This is a redirected request with payload in URL - redirecting to React app');
      
      try {
        // Decode the JWT token to verify it's valid
        const secretBuffer = JWT_SECRET ? Buffer.from(JWT_SECRET, 'base64') : 'development-secret';
        const decodedPayload = jwt.verify(xPayload, secretBuffer, { algorithms: ['HS256'] });
        console.log('Successfully decoded payload for redirected request');
        
        // Get the current hostname to avoid hardcoding the redirect URL
        const currentHost = req.headers.host || 'loyalty-form.vercel.app';
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        
        // Create a simple HTML page that redirects to the React app
        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Redirecting to Loyalty Form</title>
  <style>
    body { font-family: Arial, sans-serif; text-align: center; padding: 20px; max-width: 800px; margin: 0 auto; }
    .loader { border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; width: 50px; height: 50px; animation: spin 2s linear infinite; margin: 20px auto; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <h1>Redirecting to Loyalty Form</h1>
  <div class="loader"></div>
  <p>You'll be redirected to the form page in a moment...</p>
  
  <script>
    // Redirect immediately to the React app
    window.location.href = "${protocol}://${currentHost}/?payload=${encodeURIComponent(xPayload)}";
  </script>
</body>
</html>`;
        
        // Send the HTML response
        res.setHeader('Content-Type', 'text/html');
        res.statusCode = 200;
        res.end(html);
        return;
      } catch (error) {
        console.error('Error decoding JWT in redirected request:', error);
      }
    }
    
    // If this is a direct browser access without a payload, show a test page
    if (!xPayload) {
      console.log('No X-Payload header found - showing test page');
      
      // Create a test page with instructions
      const html = `<!DOCTYPE html>
<html>
<head>
  <title>Loyalty Form - Test Page</title>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
    .note { background: #fffde7; padding: 10px; border-left: 4px solid #ffd600; margin: 20px 0; }
  </style>
</head>
<body>
  <h1>Loyalty Form - Server is Running</h1>
  <p>This server is designed to receive requests from the vendor's backend with an X-Payload header containing a JWT token.</p>
  
  <div class="note">
    <p><strong>Note:</strong> You're seeing this page because you accessed the server directly in a browser without an X-Payload header.</p>
    <p>In normal operation, this server will receive requests from the vendor's backend, decode the JWT token, and redirect to the main application.</p>
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
    
    console.log('Received payload:', xPayload.substring(0, 30) + '...');
    
    try {
      // Decode the JWT token
      const secretBuffer = JWT_SECRET ? Buffer.from(JWT_SECRET, 'base64') : 'development-secret';
      const decodedPayload = jwt.verify(xPayload, secretBuffer, { algorithms: ['HS256'] });
      console.log('Successfully decoded payload:', JSON.stringify(decodedPayload));
      
      // Instead of redirecting, we'll embed the payload in a meta tag and serve the app directly
      const payloadString = JSON.stringify(decodedPayload).replace(/'/g, "\\'");
      
      // Extract User ID and EVSE ID from the payload if available
      const userId = decodedPayload.payload?.parameters?.userId || 'Not available';
      const evseId = decodedPayload.payload?.parameters?.evseId || 'Not available';
      const evseReference = decodedPayload.payload?.parameters?.evsePhysicalReference || 'Not available';
      
      // Get the current hostname to avoid hardcoding the redirect URL
      const currentHost = req.headers.host || 'loyalty-form.vercel.app';
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      
      // Create a simple HTML page that redirects to the React app
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Redirecting to Loyalty Form</title>
  <style>
    body { font-family: Arial, sans-serif; text-align: center; padding: 20px; max-width: 800px; margin: 0 auto; }
    .info { background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: left; }
    .loader { border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; width: 50px; height: 50px; animation: spin 2s linear infinite; margin: 20px auto; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <h1>Redirecting to Loyalty Form</h1>
  <div class="loader"></div>
  <p>Processing your request...</p>
  
  <div class="info">
    <h2>Request Information</h2>
    <p><strong>User ID:</strong> ${userId}</p>
    <p><strong>EVSE ID:</strong> ${evseId}</p>
    <p><strong>EVSE Reference:</strong> ${evseReference}</p>
  </div>
  
  <p>You'll be redirected to the form page in a moment...</p>
  
  <script>
    // Redirect to the form page with the payload as a URL parameter after a short delay
    setTimeout(function() {
      window.location.href = "${protocol}://${currentHost}/?payload=${encodeURIComponent(xPayload)}";
    }, 1000); // Reduced delay to 1 second
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
