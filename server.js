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
    // Get the X-Payload header (case insensitive)
    const xPayload = req.headers['x-payload'] || req.headers['X-Payload'];
    
    if (xPayload) {
      console.log('Received X-Payload header:', xPayload.substring(0, 30) + '...');
      
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
        res.end('Error decoding JWT token');
      }
    } else {
      console.log('No X-Payload header found');
      res.statusCode = 400;
      res.end('Missing X-Payload header');
    }
  } else {
    // For all other request methods, return 405 Method Not Allowed
    res.statusCode = 405;
    res.end('Method Not Allowed');
  }
}
