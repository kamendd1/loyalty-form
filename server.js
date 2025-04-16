// Minimal server for Vercel (ES Module version)
import express from 'express';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import path from 'path';

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Get JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || process.env.VITE_JWT_SECRET;

// Log startup information
console.log('Server starting with ES modules...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Has JWT Secret:', !!JWT_SECRET);

// Basic error HTML template
const errorHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Error</title>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body>
  <h1>Error loading application</h1>
  <p>The application could not be loaded. Please try again later.</p>
</body>
</html>`;

// Main route handler
app.get('/', (req, res) => {
  try {
    // Get the X-Payload header (case insensitive)
    const xPayload = req.headers['x-payload'] || 
                     req.headers['X-Payload'] || 
                     req.query.payload || 
                     req.query.token;
    
    console.log('Headers:', JSON.stringify(req.headers));
    
    if (xPayload) {
      console.log('Received payload:', xPayload.substring(0, 30) + '...');
      
      try {
        // Decode the JWT token
        const secretBuffer = JWT_SECRET ? Buffer.from(JWT_SECRET, 'base64') : 'development-secret';
        const decodedPayload = jwt.verify(xPayload, secretBuffer, { algorithms: ['HS256'] });
        console.log('Successfully decoded payload:', JSON.stringify(decodedPayload));
        
        // Create HTML with the payload embedded as a meta tag
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
        
        return res.send(html);
      } catch (jwtError) {
        console.error('Error decoding JWT:', jwtError);
        return res.status(500).send(errorHtml);
      }
    } else {
      console.log('No X-Payload header or payload parameter found');
      return res.status(400).send(errorHtml);
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).send(errorHtml);
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export the app for serverless use
export default app;
