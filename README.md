# Loyalty Form App

A server-rendered loyalty card submission form for embedded and standalone use. Built with Node.js, Express-style serverless functions, and vanilla JavaScript. No React, Vite, or SPA dependencies.

## Features

- Fully server-rendered HTML form (no React, no SPA)
- Mobile-friendly and embeddable in webviews or iframes
- User-friendly validation and error handling
- Success message with automatic redirect/close URL trigger for mobile apps
- Custom branding and logo support
- Secure: API token and endpoints managed via environment variables

## How It Works

- The backend decodes a JWT payload and serves a complete HTML form with user information.
- On form submission, only the user ID is sent to the backend API.
- After successful submission, a success message is shown, then the page redirects to `/close` (for mobile app integration).
- No debug messages or developer artefacts are shown to users.

## Technologies Used

- Node.js (serverless/Express-style handler in `api/server.js`)
- Vanilla JavaScript for form logic (`docs/loyalty-form.js`)
- Environment variables via `.env`
- Deployed via Vercel (API) and GitHub Pages (static assets)

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/kamendd1/loyalty-form.git
   cd loyalty-form
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env` (see `.env.example` if present):
   - `API_BASE_URL` - The base URL for the backend API
   - `API_TOKEN` - The API authentication token
   - `JWT_SECRET` - Secret for verifying JWT payloads
4. Start the local server:
   ```bash
   npm run start
   # or for Vercel: vercel dev
   ```
5. Access the form via the server's URL (e.g., `http://localhost:3000/api/server.js?...`)

## Deployment

- **Backend/API:** Deploy `api/server.js` to Vercel for serverless operation.
- **Frontend:** Host static assets (e.g., `docs/loyalty-form.js`) on GitHub Pages or other static hosting.

## Project Structure

```
api/
  server.js           # Main serverless handler (serves form, handles POST)
docs/
  loyalty-form.js     # Client-side JS for form validation and submission
public/               # Additional static assets (if needed)
.env                  # Environment variables (not committed)
vercel.json           # Vercel routing configuration
```

## Usage Notes

- The form is designed for embedding in mobile apps/webviews and triggers a `/close` URL after success.
- All user-facing debug/dev messages have been removed for clean UX.
- For new forms, follow this server-rendered, non-SPA approach for best compatibility and reliability in embedded scenarios.
