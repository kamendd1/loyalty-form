# Loyalty Form App

A React application for collecting and validating loyalty card numbers. Built with React, TypeScript, and Vite.

## Features

- Clean, modern UI with Lidl branding
- Form validation for loyalty card numbers
- Success and redirect pages
- Mobile-friendly design
- Gradient buttons and error states

## Validation Rules

- Only accepts numeric values
- Exactly 7 digits required
- Real-time validation feedback
- Error states with custom styling

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

3. Start the development server:
```bash
npm run dev
```

## Building for Production

To create a production build:
```bash
npm run build
```

The built files will be in the `dist` directory.

## Technologies Used

- React 18
- TypeScript
- Vite
- React Router DOM
- CSS Variables for theming

## Project Structure

```
src/
├── pages/
│   ├── FormPage.tsx     # Main form with validation
│   ├── SuccessPage.tsx  # Success confirmation
│   └── RedirectPage.tsx # Return to app handler
├── App.tsx             # Main app with routing
└── App.css            # Styles including brand colors
```
