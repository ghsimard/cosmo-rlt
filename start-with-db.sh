#!/bin/bash

# Kill any existing Node.js processes
pkill -f "node" || true

# Start the main server
echo "Starting main server..."
export DATABASE_URL="postgres://localhost:5432/COSMO_RLT"
export DOCENTES_TOKEN="cosmo-doc-o185zfu2c-5xotms"
export ACUDIENTES_TOKEN="cosmo-acu-js4n5cy8ar-f0uax8"
export ESTUDIANTES_TOKEN="cosmo-est-o7lmi20mfwb-o9f06j"
node server.js

# Wait for the server to start
sleep 5

echo "All services are running!"
echo "Access the applications at:"
echo "- Docentes Form: http://localhost:3000/docentes/cosmo-doc-o185zfu2c-5xotms"
echo "- Acudientes Form: http://localhost:3000/acudientes/cosmo-acu-js4n5cy8ar-f0uax8"
echo "- Estudiantes Form: http://localhost:3000/estudiantes/cosmo-est-o7lmi20mfwb-o9f06j" 