# COSMO Project

This is the main application for the COSMO Project, which includes three forms:
- Docentes Form
- Acudientes Form
- Estudiantes Form

## Deployment on Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Use the following settings:
   - Environment: Node
   - Build Command: (as specified in render.yaml)
   - Start Command: node server.js
   - Environment Variables:
     - DATABASE_URL: Your PostgreSQL database URL
     - DOCENTES_TOKEN: cosmo-doc-o185zfu2c-5xotms
     - ACUDIENTES_TOKEN: cosmo-acu-js4n5cy8ar-f0uax8
     - ESTUDIANTES_TOKEN: cosmo-est-o7lmi20mfwb-o9f06j
     - NODE_ENV: production

## Local Development

1. Install dependencies:
   ```bash
   npm install
   cd form-docentes && npm install
   cd ../form-acudientes && npm install
   cd ../form-estudiantes && npm install
   cd ..
   ```

2. Build the applications:
   ```bash
   cd form-docentes && npm run build
   cd ../form-acudientes && npm run build
   cd ../form-estudiantes && npm run build
   cd ..
   ```

3. Start the server:
   ```bash
   npm start
   ```

## Accessing the Forms

Once deployed, you can access the forms at:
- Docentes Form: `/docentes/cosmo-doc-o185zfu2c-5xotms`
- Acudientes Form: `/acudientes/cosmo-acu-js4n5cy8ar-f0uax8`
- Estudiantes Form: `/estudiantes/cosmo-est-o7lmi20mfwb-o9f06j`

## Overview

The COSMO Project is a comprehensive survey and statistics system for educational institutions. It consists of:

- **form-docentes**: Form for teachers
- **form-acudientes**: Form for guardians/parents
- **form-estudiantes**: Form for students
- **Stats**: Dashboard for viewing and analyzing survey results

The system uses a proxy server with token-based authentication to secure access to each application.

## Access Tokens

- **form-docentes**: DocToken123
- **form-acudientes**: AcuToken456
- **form-estudiantes**: EstToken789
- **Stats**: StatsToken012

## Features

### Keyboard Navigation Enhancements

All forms feature enhanced keyboard navigation for improved accessibility:

#### School Name Dropdown
- Use **up/down arrow keys** to navigate through school suggestions
- Press **Enter** to select a suggestion
- Press **Escape** to close the dropdown

#### Form Controls
- Navigate between radio buttons and checkboxes with **Tab** key
- Use **arrow keys** to move between options in the same group

#### Frequency Matrices
- Use **left/right arrow keys** to navigate and select options
- Use **up/down arrow keys** to move between questions
- Smart **Tab/Shift+Tab** handling to move between rows
- Visual indicators show current focus

## Running the Project

1. Start all applications:
   ```
   ./start-all.sh
   ```

2. Stop all applications:
   ```
   ./stop-all.sh
   ```

3. Access applications via:
   - http://localhost/docentes/DocToken123
   - http://localhost/acudientes/AcuToken456
   - http://localhost/estudiantes/EstToken789
   - http://localhost/stats/StatsToken012

## Project Structure

- **proxy-server.js**: Main proxy server handling routing and authentication
- **form-docentes/**: Teacher survey application
- **form-acudientes/**: Guardian/parent survey application
- **form-estudiantes/**: Student survey application
- **Stats/**: Statistics and analysis dashboard

## Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- Running instances of all four applications on their respective ports

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the proxy server:
   ```bash
   npm start
   ```

   For development with automatic restart:
   ```bash
   npm run dev
   ```

## How It Works

- The proxy server runs on port 80 (requires admin privileges or port forwarding)
- It handles routing to all four applications
- Each application has a unique access token in the URL
- API requests are also proxied to the respective backend services
- A welcome page is available at http://localhost/ with links to all applications

## Configuration

You can modify the `proxy-server.js` file to:

- Change the access tokens
- Update application ports
- Add new applications
- Customize the welcome page

## Note for Production

For production deployment:

1. Update the `port` variable in `proxy-server.js` if needed
2. Set up HTTPS for secure communication
3. Consider implementing additional security measures like rate limiting
4. Use a process manager like PM2 to keep the server running:
   ```bash
   npm install -g pm2
   pm2 start proxy-server.js
   ``` 