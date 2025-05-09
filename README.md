# COSMORLT

This project includes three forms:
- Docentes Form
- Acudientes Form
- Estudiantes Form

## Deployment on Render

1. Create a new Web Service on Render
2. Connect your GitHub repository (COSMORLT)
3. Use the following settings:
   - Environment: Node
   - Build Command: Will be taken from render.yaml
   - Start Command: Will be taken from render.yaml
   - Auto-Deploy: Yes

### Environment Variables (already set in render.yaml)
- `DATABASE_URL`: PostgreSQL connection string
- `DOCENTES_TOKEN`: Access token for docentes form
- `ACUDIENTES_TOKEN`: Access token for acudientes form
- `ESTUDIANTES_TOKEN`: Access token for estudiantes form
- `NODE_ENV`: Set to "production"

## Local Development

1. Install dependencies:
   ```bash
   npm install
   cd form-docentes && npm install
   cd ../form-acudientes && npm install
   cd ../form-estudiantes && npm install
   ```

2. Build applications:
   ```bash
   cd form-docentes && npm run build
   cd ../form-acudientes && npm run build
   cd ../form-estudiantes && npm run build
   ```

3. Start the server:
   ```bash
   npm start
   ```

## Access Forms

Once deployed, the forms will be available at:
- Docentes: `/docentes/cosmo-doc-o185zfu2c-5xotms`
- Acudientes: `/acudientes/cosmo-acu-js4n5cy8ar-f0uax8`
- Estudiantes: `/estudiantes/cosmo-est-o7lmi20mfwb-o9f06j`

## Overview

The COSMO Project is a comprehensive survey system for educational institutions. It consists of:

- **form-docentes**: Form for teachers
- **form-acudientes**: Form for guardians/parents
- **form-estudiantes**: Form for students

The system uses a proxy server with token-based authentication to secure access to each application.

## Access Tokens

- **form-docentes**: cosmo-doc-o185zfu2c-5xotms
- **form-acudientes**: cosmo-acu-js4n5cy8ar-f0uax8
- **form-estudiantes**: cosmo-est-o7lmi20mfwb-o9f06j

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

1. Start the server:
   ```bash
   ./start-with-db.sh
   ```

2. Access applications via:
   - http://localhost:3000/docentes/cosmo-doc-o185zfu2c-5xotms
   - http://localhost:3000/acudientes/cosmo-acu-js4n5cy8ar-f0uax8
   - http://localhost:3000/estudiantes/cosmo-est-o7lmi20mfwb-o9f06j

## Project Structure

- **server.js**: Main server handling routing and authentication
- **form-docentes/**: Teacher survey application
- **form-acudientes/**: Guardian/parent survey application
- **form-estudiantes/**: Student survey application

## Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- PostgreSQL (v14 or later)

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

   For development with automatic restart:
   ```bash
   npm run dev
   ```

## How It Works

- The server runs on port 3000
- It handles routing to all three applications
- Each application has a unique access token in the URL
- API requests are handled by the server
- A welcome page is available at http://localhost:3000 with links to all applications

## Configuration

You can modify the `server.js` file to:

- Change the access tokens
- Update application ports
- Add new applications
- Customize the welcome page

## Note for Production

For production deployment:

1. Update the `port` variable in `server.js` if needed
2. Set up HTTPS for secure communication
3. Consider implementing additional security measures like rate limiting
4. Use a process manager like PM2 to keep the server running:
   ```bash
   npm install -g pm2
   pm2 start server.js
   ``` 