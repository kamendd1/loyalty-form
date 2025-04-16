// Ultra-minimal server for Vercel
import http from 'http';
import jwt from 'jsonwebtoken';

// Get JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || process.env.VITE_JWT_SECRET;

// Log startup information
console.log('Starting ultra-minimal server...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Has JWT Secret:', !!JWT_SECRET);

// Create a simple HTTP server
const server = http.createServer((req, res) => {
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
  
  // Only handle GET requests to the root path
  if (req.method === 'GET' && req.url === '/') {
    // Get the X-Payload header
    const xPayload = req.headers['x-payload'];
    
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
    window.location.href = "https://loyalty-form-app.vercel.app/?payload=${encodeURIComponent(xPayload)}";
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
    // For all other requests, return 404
    res.statusCode = 404;
    res.end('Not found');
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export the server for serverless use
export default server;
