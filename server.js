// Minimal server for Vercel (ES Module version)
import express from 'express';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Get JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || process.env.VITE_JWT_SECRET;

// Path to the dist directory
const distPath = path.join(__dirname, 'dist');

// Function to find the main JS file (with hash in filename)
function findMainJsFile() {
  try {
    if (!fs.existsSync(path.join(distPath, 'assets'))) {
      console.error('Assets directory not found');
      return 'index.js'; // Fallback
    }
    
    const files = fs.readdirSync(path.join(distPath, 'assets'));
    const mainJsFile = files.find(file => file.startsWith('index-') && file.endsWith('.js'));
    return mainJsFile || 'index.js';
  } catch (error) {
    console.error('Error finding main JS file:', error);
    return 'index.js'; // Fallback
  }
}

// Find the main CSS file
function findMainCssFile() {
  try {
    if (!fs.existsSync(path.join(distPath, 'assets'))) {
      console.error('Assets directory not found');
      return 'index.css'; // Fallback
    }
    
    const files = fs.readdirSync(path.join(distPath, 'assets'));
    const mainCssFile = files.find(file => file.endsWith('.css'));
    return mainCssFile || 'index.css';
  } catch (error) {
    console.error('Error finding main CSS file:', error);
    return 'index.css'; // Fallback
  }
}

// Get the main JS and CSS files
const mainJsFile = findMainJsFile();
const mainCssFile = findMainCssFile();

// Log startup information
console.log('Server starting with ES modules...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Has JWT Secret:', !!JWT_SECRET);
console.log('Main JS file:', mainJsFile);
console.log('Main CSS file:', mainCssFile);

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
    // Check if this is a request from the vendor backend or from our redirect
    const isRedirectedRequest = req.query.payload || req.query.token;
    const isVendorRequest = req.headers['x-payload'] || req.headers['X-Payload'];
    
    console.log('Headers:', JSON.stringify(req.headers));
    console.log('Query params:', JSON.stringify(req.query));
    console.log('Is redirected request:', !!isRedirectedRequest);
    console.log('Is vendor request:', !!isVendorRequest);
    
    // If this is already a redirected request with the payload in the URL, serve the static app
    if (isRedirectedRequest) {
      console.log('This is a redirected request with payload in URL, serving static app');
      // Return a simple HTML that loads your static app
      const html = `<!DOCTYPE html>
<html>
<head>
  <title>Loyalty Form</title>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="/assets/${mainCssFile}">
  <script>
    // This is a static placeholder. Your app will load and read the payload from the URL.
    console.log('Loading application with payload in URL');
  </script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/assets/${mainJsFile}"></script>
</body>
</html>`;
      return res.send(html);
    }
    
    // Get the X-Payload header (case insensitive)
    const xPayload = req.headers['x-payload'] || req.headers['X-Payload'];
    
    if (xPayload) {
      console.log('Received payload from vendor:', xPayload.substring(0, 30) + '...');
      
      try {
        // Decode the JWT token
        const secretBuffer = JWT_SECRET ? Buffer.from(JWT_SECRET, 'base64') : 'development-secret';
        const decodedPayload = jwt.verify(xPayload, secretBuffer, { algorithms: ['HS256'] });
        console.log('Successfully decoded payload:', JSON.stringify(decodedPayload));
        
        // Create HTML with the payload embedded as a meta tag and a different domain for redirect
        // Use a different domain to avoid infinite loops
        const payloadString = JSON.stringify(decodedPayload).replace(/'/g, "\\'");
        const html = `<!DOCTYPE html>
<html>
<head>
  <title>Loyalty Form</title>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="encrypted-context" content='${payloadString}' />
  <link rel="stylesheet" href="/assets/${mainCssFile}">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/assets/${mainJsFile}"></script>
</body>
</html>`;
        
        return res.send(html);
      } catch (jwtError) {
        console.error('Error decoding JWT:', jwtError);
        return res.status(500).send(errorHtml);
      }
    } else {
      console.log('No X-Payload header found in vendor request');
      // For vendor requests without a payload, return an error
      return res.status(400).send(errorHtml);
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).send(errorHtml);
  }
});

// Serve static files from the dist directory
app.use(express.static(distPath));

// Catch-all route for SPA navigation
app.get('*', (req, res) => {
  // Skip API routes
  if (req.url.startsWith('/api/')) {
    return res.status(404).send('API endpoint not found');
  }
  
  // For all other routes, serve the index.html with the correct JS/CSS references
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Loyalty Form</title>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="/assets/${mainCssFile}">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/assets/${mainJsFile}"></script>
</body>
</html>`;
  
  res.send(html);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server is serving static files from: ${distPath}`);
  console.log(`Main JS file: /assets/${mainJsFile}`);
  console.log(`Main CSS file: /assets/${mainCssFile}`);
});

// Export the app for serverless use
export default app;
