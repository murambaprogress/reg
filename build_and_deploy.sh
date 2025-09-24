#!/bin/bash

# Build and Deploy Script for Regimark Autoelectrics Control Center
# This script builds the frontend and prepares for deployment

echo "🚀 Starting build and deployment process..."

# Build the frontend
echo "📦 Building frontend..."
npm run build

# Check if build was successful
if [ ! -d "build" ]; then
    echo "❌ Frontend build failed! build directory not found."
    exit 1
fi

echo "✅ Frontend build completed successfully!"

# Navigate to backend directory
cd backend

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Collect static files
echo "📦 Collecting static files..."
python manage.py collectstatic --noinput

# Run migrations
echo "🗃️ Running database migrations..."
python manage.py makemigrations
python manage.py migrate

echo "✅ Build and deployment preparation completed!"
echo ""
echo "📋 Next steps for PythonAnywhere deployment:"
echo "1. Upload the entire project to PythonAnywhere"
echo "2. Set up the virtual environment"
echo "3. Configure the web app with the WSGI file"
echo "4. Set up the database"
echo "5. Configure environment variables"
echo ""
echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions"
