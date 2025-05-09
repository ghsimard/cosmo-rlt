#!/bin/bash

# Build docentes app
echo "Building docentes app..."
cd form-docentes
npm install
npm run build
cd ..

# Build acudientes app
echo "Building acudientes app..."
cd form-acudientes
npm install
npm run build
cd ..

# Build estudiantes app
echo "Building estudiantes app..."
cd form-estudiantes
npm install
npm run build
cd ..

echo "All apps built successfully!" 