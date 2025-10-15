#!/bin/bash

# Deployment Verification Script for Regimark Motors Control Center
# Run this script on PythonAnywhere after deploying or updating the application

# Set variables
USERNAME="Progress"
PROJECT_DIR="/home/$USERNAME/regimark_motors_control_center"
BACKEND_DIR="$PROJECT_DIR/backend"
DEPLOYMENT_URL="https://$USERNAME.pythonanywhere.com"
VENV_NAME="regimark_env"
CURRENT_DATE=$(date +"%Y-%m-%d %H:%M:%S")

echo "===== Regimark Motors Control Center - Deployment Verification ====="
echo "Date: $CURRENT_DATE"
echo ""

# Function to display status
function display_status() {
    if [ $1 -eq 0 ]; then
        echo "[✓] $2"
    else
        echo "[✗] $2 (ERROR)"
    fi
}

# Check if we're on PythonAnywhere
if [ ! -d "/home/$USERNAME" ]; then
    echo "ERROR: This script should be run on PythonAnywhere!"
    exit 1
fi

echo "1. Checking directory structure..."
if [ -d "$PROJECT_DIR" ] && [ -d "$BACKEND_DIR" ] && [ -d "$PROJECT_DIR/build" ]; then
    display_status 0 "Directory structure is correct"
else
    display_status 1 "Directory structure is incomplete"
    echo "   Expected directories:"
    echo "   - $PROJECT_DIR"
    echo "   - $BACKEND_DIR"
    echo "   - $PROJECT_DIR/build"
fi

echo ""
echo "2. Checking virtual environment..."
if [ -d "$HOME/.virtualenvs/$VENV_NAME" ]; then
    display_status 0 "Virtual environment exists"
    source "$HOME/.virtualenvs/$VENV_NAME/bin/activate"
    
    # Check Python version
    PYTHON_VERSION=$(python --version 2>&1)
    echo "   Python version: $PYTHON_VERSION"
    
    # Check Django version
    DJANGO_VERSION=$(python -c "import django; print(f'Django version: {django.get_version()}')" 2>&1)
    if [[ $DJANGO_VERSION == *"version"* ]]; then
        echo "   $DJANGO_VERSION"
    else
        echo "   Django version: Not found or error"
    fi
else
    display_status 1 "Virtual environment not found"
    echo "   Expected: $HOME/.virtualenvs/$VENV_NAME"
fi

echo ""
echo "3. Checking database configuration..."
cd "$BACKEND_DIR"
if [ -f ".env" ]; then
    display_status 0 "Environment file exists"
    # Don't print actual values for security reasons
    echo "   Database configuration present in .env file"
else
    display_status 1 "Environment file (.env) not found"
fi

echo ""
echo "4. Checking static files..."
if [ -d "$BACKEND_DIR/staticfiles" ]; then
    STATIC_COUNT=$(find "$BACKEND_DIR/staticfiles" -type f | wc -l)
    display_status 0 "Static files directory exists with approximately $STATIC_COUNT files"
else
    display_status 1 "Static files directory not found"
    echo "   Run: python manage.py collectstatic --noinput"
fi

echo ""
echo "5. Checking frontend build..."
if [ -f "$PROJECT_DIR/build/index.html" ]; then
    display_status 0 "Frontend build exists"
    ASSET_COUNT=$(find "$PROJECT_DIR/build/assets" -type f | wc -l)
    echo "   Found approximately $ASSET_COUNT frontend asset files"
else
    display_status 1 "Frontend build not found or incomplete"
    echo "   Expected: $PROJECT_DIR/build/index.html"
fi

echo ""
echo "6. Checking web app configuration..."
if [ -f "/var/www/$USERNAME.pythonanywhere.com_wsgi.py" ]; then
    display_status 0 "WSGI file exists"
    if grep -q "$BACKEND_DIR" "/var/www/$USERNAME.pythonanywhere.com_wsgi.py"; then
        echo "   WSGI file points to the correct path"
    else
        echo "   WSGI file might not be correctly configured"
    fi
else
    display_status 1 "WSGI file not found"
    echo "   Expected: /var/www/$USERNAME.pythonanywhere.com_wsgi.py"
    echo "   Check web app configuration in PythonAnywhere dashboard"
fi

echo ""
echo "7. Testing API accessibility..."
API_TEST=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL/api/health-check/" 2>/dev/null)
if [ "$API_TEST" == "200" ]; then
    display_status 0 "API endpoint is accessible"
else
    display_status 1 "API endpoint test failed (Status: $API_TEST)"
    echo "   Endpoint tested: $DEPLOYMENT_URL/api/health-check/"
    echo "   Make sure the Django server is running and health check endpoint exists"
fi

echo ""
echo "===== Verification Complete ====="
echo ""
echo "For manual verification:"
echo "1. Visit $DEPLOYMENT_URL to check frontend"
echo "2. Try logging in with test credentials"
echo "3. Check PythonAnywhere error logs if issues persist"
echo ""
echo "Next steps if problems found:"
echo "1. Check error logs: PythonAnywhere Web tab > Error log"
echo "2. Verify environment variables and settings"
echo "3. Reload the web app after making changes"
echo ""