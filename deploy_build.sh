#!/bin/bash

# ========================================
# Regimark Motors Control Center Deployment Script
# For PythonAnywhere deployment
# ========================================

echo "===== Starting deployment process ====="
echo "Building application for production..."

# Build frontend
npm run build

if [ $? -ne 0 ]; then
    echo "ERROR: Frontend build failed!"
    exit 1
fi

echo "Frontend build successful."

# Create a deployment package
echo "Creating deployment package..."
mkdir -p deploy_package
cp -r build/ deploy_package/
cp -r backend/ deploy_package/
cp PYTHONANYWHERE_DEPLOYMENT_GUIDE.md deploy_package/
cp deploy_pythonanywhere.sh deploy_package/

# Create README for deployment
cat > deploy_package/README.txt << EOL
Regimark Motors Control Center Deployment Package
================================================

This package contains the following:
1. build/ - Frontend build files
2. backend/ - Backend Django application
3. PYTHONANYWHERE_DEPLOYMENT_GUIDE.md - Step-by-step deployment guide
4. deploy_pythonanywhere.sh - Script for PythonAnywhere setup

Follow the instructions in PYTHONANYWHERE_DEPLOYMENT_GUIDE.md for complete setup.
EOL

# Create the deployment archive
echo "Creating deployment archive..."
zip -r regimark_deploy.zip deploy_package/

# Clean up
rm -rf deploy_package/

echo "===== Deployment package created: regimark_deploy.zip ====="
echo "Upload this package to PythonAnywhere and follow the instructions in PYTHONANYWHERE_DEPLOYMENT_GUIDE.md"