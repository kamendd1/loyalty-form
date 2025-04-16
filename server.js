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
    
    // Check if this is a redirected request (has payload in URL and no X-Payload header)
    const isRedirectedRequest = urlParams.has('payload') && !req.headers['x-payload'] && !req.headers['X-Payload'];
    
    console.log('Is redirected request:', isRedirectedRequest);
    
    // If this is a redirected request (has payload in URL), serve the app directly without redirecting again
    if (isRedirectedRequest) {
      console.log('This is a redirected request with payload in URL - serving app directly');
      
      try {
        // Decode the JWT token to embed as meta tag
        const secretBuffer = JWT_SECRET ? Buffer.from(JWT_SECRET, 'base64') : 'development-secret';
        const decodedPayload = jwt.verify(xPayload, secretBuffer, { algorithms: ['HS256'] });
        console.log('Successfully decoded payload for redirected request');
        
        // Create HTML with the payload embedded as a meta tag but NO redirect
        const payloadString = JSON.stringify(decodedPayload).replace(/'/g, "\\'");
        
        // Extract User ID and EVSE ID from the payload if available
        const userId = decodedPayload.payload?.parameters?.userId || 'Not available';
        const evseId = decodedPayload.payload?.parameters?.evseId || 'Not available';
        const evseReference = decodedPayload.payload?.parameters?.evsePhysicalReference || 'Not available';
        
        const html = `<!DOCTYPE html>
<html>
<head>
  <title>Loyalty Form</title>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="encrypted-context" content='${payloadString}' />
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; text-align: center; }
    .info-card { background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; }
    .user-info { margin-bottom: 20px; }
    .payload { background: #eef; padding: 10px; border-radius: 5px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>Loyalty Form</h1>
  
  <div class="info-card user-info">
    <h2>User Information</h2>
    <p><strong>User ID:</strong> ${userId}</p>
    <p><strong>EVSE ID:</strong> ${evseId}</p>
    <p><strong>EVSE Reference:</strong> ${evseReference}</p>
  </div>
  
  <div class="info-card">
    <h2>Full Payload Data</h2>
    <div class="payload">
      <pre>${JSON.stringify(decodedPayload, null, 2)}</pre>
    </div>
  </div>
  
  <div id="root"></div>
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
      
      // Create a simple HTML page with the payload as a meta tag
      const payloadString = JSON.stringify(decodedPayload).replace(/'/g, "\\'");
      
      // Get the current hostname to avoid hardcoding the redirect URL
      const currentHost = req.headers.host || 'loyalty-form.vercel.app';
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      
      // Create the redirect URL using the current hostname
      const redirectUrl = `${protocol}://${currentHost}/app?payload=${encodeURIComponent(xPayload)}`;
      console.log('Redirecting to:', redirectUrl);
      
      // Extract User ID and EVSE ID from the payload if available
const userId = decodedPayload.payload?.parameters?.userId || 'Not available';
const evseId = decodedPayload.payload?.parameters?.evseId || 'Not available';
const evseReference = decodedPayload.payload?.parameters?.evsePhysicalReference || 'Not available';

const html = `<!DOCTYPE html>
<html>
<head>
  <title>Loyalty Form</title>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="encrypted-context" content='${payloadString}' />
  <style>
    body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
    .info { background: #f5f5f5; padding: 20px; border-radius: 5px; display: inline-block; margin: 20px; text-align: left; }
    .loader { border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; width: 50px; height: 50px; animation: spin 2s linear infinite; margin: 20px auto; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style>
  <script>
    // Redirect to the main app with the payload as a URL parameter after a short delay
    setTimeout(function() {
      window.location.href = "${redirectUrl}";
    }, 2000); // 2 second delay to show the information
  </script>
</head>
<body>
  <h1>Loyalty Form</h1>
  <div class="loader"></div>
  <p>Loading application...</p>
  <div class="info">
    <p><strong>User ID:</strong> ${userId}</p>
    <p><strong>EVSE ID:</strong> ${evseId}</p>
    <p><strong>EVSE Reference:</strong> ${evseReference}</p>
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
