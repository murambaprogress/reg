#!/bin/bash

# Frontend deployment script for PythonAnywhere
# This script builds the React application and prepares it for deployment to PythonAnywhere

echo "Starting frontend deployment process for PythonAnywhere..."

# 1. Install dependencies
echo "Installing dependencies..."
npm install

# 2. Build the project for production
echo "Building project for production..."
npm run build

# 3. Create or update .env.production file
echo "Setting up environment variables for production..."
cat > .env.production << EOL
VITE_API_BASE=https://http://localhost:3001
EOL

# 4. Create a deployment zip file
echo "Creating deployment archive..."
zip -r regimark_frontend_build.zip build/

echo "Deployment package created: regimark_frontend_build.zip"
echo "Upload this file to PythonAnywhere and extract it to your web app directory"
echo "Deployment preparation complete!"

# Instructions for manual steps
echo ""
echo "=== MANUAL STEPS ==="
echo "1. Log in to PythonAnywhere"
echo "2. Upload regimark_frontend_build.zip to your Files section"
echo "3. Open a Bash console and run:"
echo "   cd ~/mysite"
echo "   rm -rf static/*"  
echo "   unzip ~/regimark_frontend_build.zip -d ."
echo "   mv build/* static/"
echo "4. Ensure your PythonAnywhere WSGI file serves the static files correctly"