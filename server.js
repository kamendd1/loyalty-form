// Simple Express server for handling JWT tokens in headers
import express from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Get JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || process.env.VITE_JWT_SECRET;

// Log startup information
console.log('Server starting...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Has JWT Secret:', !!JWT_SECRET);
console.log('Current directory:', __dirname);

// Path to the dist directory
const distPath = path.join(__dirname, 'dist');
console.log('Dist path:', distPath);
console.log('Dist exists:', fs.existsSync(distPath));

if (fs.existsSync(distPath)) {
  console.log('Files in dist:', fs.readdirSync(distPath).join(', '));
}

// Middleware to log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers));
  next();
});

// Serve static files from dist directory
app.use(express.static(distPath));

// Main route handler
app.get('/', (req, res) => {
  try {
    // Try to read the index.html file
    let indexHtml;
    try {
      const indexPath = path.join(distPath, 'index.html');
      indexHtml = fs.readFileSync(indexPath, 'utf8');
      console.log('Successfully loaded index.html');
    } catch (readError) {
      console.error('Error reading index.html:', readError);
      return res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Error</title>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body>
          <h1>Error loading application</h1>
          <p>The application could not be loaded. Please try again later.</p>
          <p>Error: ${readError.message}</p>
          <p>Current directory: ${__dirname}</p>
          <p>Dist path: ${distPath}</p>
          <p>Dist exists: ${fs.existsSync(distPath)}</p>
          ${fs.existsSync(distPath) ? `<p>Files in dist: ${fs.readdirSync(distPath).join(', ')}</p>` : ''}
        </body>
        </html>
      `);
    }
    
    // Get the X-Payload header (case insensitive)
    const xPayload = req.headers['x-payload'] || 
                     req.headers['X-Payload'] || 
                     req.query.payload || 
                     req.query.token;
    
    if (!xPayload) {
      console.log('No X-Payload header or payload parameter found');
      return res.send(indexHtml);
    }
    
    console.log('Received payload:', xPayload.substring(0, 30) + '...');
    
    // Decode the JWT token
    try {
      // Use the JWT secret to verify the token
      const secretBuffer = JWT_SECRET ? Buffer.from(JWT_SECRET, 'base64') : 'development-secret';
      const decodedPayload = jwt.verify(xPayload, secretBuffer, { algorithms: ['HS256'] });
      console.log('Successfully decoded payload:', JSON.stringify(decodedPayload));
      
      // Inject the payload into the HTML as a meta tag
      const payloadString = JSON.stringify(decodedPayload).replace(/'/g, "\\'");
      const modifiedHtml = indexHtml.replace(
        '</head>',
        `<meta name="encrypted-context" content='${payloadString}' /></head>`
      );
      
      return res.send(modifiedHtml);
    } catch (jwtError) {
      console.error('Error decoding JWT:', jwtError);
      return res.send(indexHtml);
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).send('Server error: ' + error.message);
  }
});

// Catch-all route for SPA
app.get('*', (req, res) => {
  try {
    const indexPath = path.join(distPath, 'index.html');
    const indexHtml = fs.readFileSync(indexPath, 'utf8');
    res.send(indexHtml);
  } catch (error) {
    console.error('Error serving index.html:', error);
    res.status(500).send('Error loading application');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
