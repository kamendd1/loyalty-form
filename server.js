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
    const xPayload = req.headers['x-payload'] || req.headers['X-Payload'] || 
                     (req.url.includes('?') && new URLSearchParams(req.url.split('?')[1]).get('payload'));
    
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
      const html = `<!DOCTYPE html>
<html>
<head>
  <title>Loyalty Form</title>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="encrypted-context" content='${payloadString}' />
  <script>
    // Redirect to the main app with the payload as a URL parameter
    window.location.href = "https://loyalty-form.vercel.app/?payload=${encodeURIComponent(xPayload)}";
  </script>
</head>
<body>
  <p>Loading application...</p>
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
