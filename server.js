import express from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Your JWT secret - load from environment variables
const JWT_SECRET = process.env.JWT_SECRET || process.env.VITE_JWT_SECRET;

// Log startup information
console.log('Server starting...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Has JWT Secret:', !!JWT_SECRET);

// Check if we're in development or production mode
const isDev = process.env.NODE_ENV === 'development';
const distPath = path.join(__dirname, 'dist');

// Function to read the index.html file
const readIndexHtml = () => {
  const indexPath = path.join(distPath, 'index.html');
  try {
    const html = fs.readFileSync(indexPath, 'utf8');
    console.log('Successfully loaded index.html');
    return html;
  } catch (error) {
    console.error('Error loading index.html:', error, 'Path:', indexPath);
    // Provide a fallback HTML if the file can't be read
    return `<!DOCTYPE html>
<html>
<head>
  <title>Error</title>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body>
  <h1>Error loading application</h1>
  <p>The application could not be loaded. Please try again later.</p>
  <p>Error details: ${error.message}</p>
  <p>Current directory: ${__dirname}</p>
  <p>Index path: ${indexPath}</p>
  <p>Files in dist: ${fs.existsSync(distPath) ? fs.readdirSync(distPath).join(', ') : 'dist directory not found'}</p>
</body>
</html>`;
  }
}

// Middleware to log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers));
  next();
});

app.get('/', (req, res) => {
  try {
    // Get the index.html content
    const indexHtml = readIndexHtml();
    
    // Get the X-Payload header (case insensitive)
    const xPayload = req.headers['x-payload'] || 
                    req.headers['X-Payload'] || 
                    req.query.payload || 
                    req.query.token;
    
    if (!xPayload) {
      console.error('No X-Payload header or payload parameter found');
      // Still return the HTML but log the error
      return res.send(indexHtml);
    }
    
    console.log('Received payload:', xPayload.substring(0, 30) + '...');
    
    // Decode the JWT token
    let decodedPayload;
    try {
      // Convert the base64-encoded secret to a Buffer if JWT_SECRET exists
      const secretBuffer = JWT_SECRET ? Buffer.from(JWT_SECRET, 'base64') : 'development-secret';
      decodedPayload = jwt.verify(xPayload, secretBuffer, { algorithms: ['HS256'] });
      console.log('Successfully decoded payload:', JSON.stringify(decodedPayload));
    } catch (jwtError) {
      console.error('Error decoding JWT:', jwtError);
      // Return the HTML without the payload if decoding fails
      return res.send(indexHtml);
    }
    
    // Convert payload to a JSON string and escape single quotes
    const payloadString = JSON.stringify(decodedPayload).replace(/'/g, "\\'");
    
    // Create a modified HTML with the payload embedded as a meta tag
    const modifiedHtml = indexHtml.replace(
      '</head>',
      `<meta name="encrypted-context" content='${payloadString}' /></head>`
    );
    
    // Send the modified HTML
    res.send(modifiedHtml);
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send('Error processing request');
  }
});

// Serve static files from the dist directory
app.use(express.static(distPath));

// Fallback route for SPA - serve index.html for any other routes
app.get('*', (req, res) => {
  // Skip API routes
  if (req.url.startsWith('/api/')) {
    return res.status(404).send('API endpoint not found');
  }
  
  const indexHtml = readIndexHtml();
  res.send(indexHtml);
});

// Handle 404s
app.use((req, res) => {
  console.log(`404: ${req.url}`);
  res.status(404).send('Not found');
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Server error');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
