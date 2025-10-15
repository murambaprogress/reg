#!/bin/bash

# =============================================================
# PythonAnywhere Deployment Script for Regimark Motors Control Center
# This script should be run on PythonAnywhere after uploading files
# =============================================================

echo "===== Starting PythonAnywhere setup process ====="

# Set your PythonAnywhere username
USERNAME="Progress"
PROJECT_DIR="/home/$USERNAME/regimark_motors_control_center"
BACKEND_DIR="$PROJECT_DIR/backend"
VENV_NAME="regimark_env"

# Check if we're running on PythonAnywhere
if [ ! -d "/home/$USERNAME" ]; then
    echo "ERROR: This script should be run on PythonAnywhere!"
    echo "Username directory not found: /home/$USERNAME"
    exit 1
fi

echo "Setting up virtual environment..."
# Create virtual environment if it doesn't exist
if [ ! -d "$HOME/.virtualenvs/$VENV_NAME" ]; then
    echo "Creating virtual environment: $VENV_NAME"
    mkvirtualenv --python=python3.9 $VENV_NAME
else
    echo "Virtual environment already exists, activating it..."
fi

# Activate the virtual environment
source "$HOME/.virtualenvs/$VENV_NAME/bin/activate"

# Navigate to the backend directory
cd "$BACKEND_DIR"
echo "Current directory: $(pwd)"

# Install requirements
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Run migrations
echo "Running database migrations..."
python manage.py migrate

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Check if the web app is already configured
echo "Checking web app configuration..."
if grep -q "$BACKEND_DIR/backend_project/wsgi.py" "$HOME/webapps/$USERNAME.pythonanywhere.com_wsgi.py" 2>/dev/null; then
    echo "Web app already configured, you may need to reload it."
else
    echo "============================================="
    echo "IMPORTANT: Web app may not be fully configured."
    echo "Please verify the following settings in the PythonAnywhere Web tab:"
    echo ""
    echo "1. Source code directory: $BACKEND_DIR"
    echo "2. Working directory: $BACKEND_DIR"
    echo "3. WSGI configuration file points to: $BACKEND_DIR/wsgi_config.py"
    echo ""
    echo "4. Static file mappings:"
    echo "   /static/ -> $BACKEND_DIR/staticfiles/"
    echo "   /assets/ -> $PROJECT_DIR/build/assets/"
    echo "   /favicon.ico -> $PROJECT_DIR/build/favicon.ico"
    echo "   /manifest.json -> $PROJECT_DIR/build/manifest.json"
    echo "   /robots.txt -> $PROJECT_DIR/build/robots.txt"
    echo "============================================="
fi

# Suggest creating a superuser if needed
echo "Do you want to create a Django superuser? (y/n)"
read -r create_superuser
if [ "$create_superuser" = "y" ]; then
    python manage.py createsuperuser
fi

echo ""
echo "===== Setup process complete! ====="
echo ""
echo "Next steps:"
echo "1. Go to the PythonAnywhere dashboard and reload your web app"
echo "2. Visit https://$USERNAME.pythonanywhere.com to verify the deployment"
echo "3. Check for any errors in the PythonAnywhere Web tab error logs"
echo ""