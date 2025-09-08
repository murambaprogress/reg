#!/bin/bash

# Deploy fix for TemplateDoesNotExist error
echo "Deploying template fix to PythonAnywhere..."

# Create templates directory if it doesn't exist
mkdir -p backend/templates

# Copy index.html to templates directory
cp backend/static/frontend/index.html backend/templates/index.html

# Update the index.html file to use correct static paths
sed -i 's|href="/favicon.ico"|href="/static/frontend/favicon.ico"|g' backend/templates/index.html
sed -i 's|href="/manifest.json"|href="/static/frontend/manifest.json"|g' backend/templates/index.html
sed -i 's|src="/assets/|src="/static/frontend/assets/|g' backend/templates/index.html
sed -i 's|href="/assets/|href="/static/frontend/assets/|g' backend/templates/index.html

echo "Template fix deployed successfully!"
echo ""
echo "Next steps for PythonAnywhere:"
echo "1. Upload the updated files to your PythonAnywhere account"
echo "2. Reload your web app from the Web tab"
echo "3. Test your application at https://progress.pythonanywhere.com/"
echo ""
echo "Files that were updated:"
echo "- backend/backend_project/settings.py (added templates directory)"
echo "- backend/backend_project/urls.py (removed conditional frontend serving)"
echo "- backend/templates/index.html (created with correct static paths)"
