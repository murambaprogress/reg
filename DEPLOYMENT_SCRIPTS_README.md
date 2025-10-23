# Regimark Motors Control Center - Deployment Scripts

This directory contains scripts and guides for deploying the Regimark Motors Control Center application to PythonAnywhere.

## Deployment Scripts

### Build and Package Scripts
- `deploy_build.sh` - Bash script for Linux/macOS to build and package the application
- `deploy_build.bat` - Batch script for Windows to build and package the application
- `update_deployment.ps1` - PowerShell script for updating an existing deployment

### PythonAnywhere Scripts
- `deploy_pythonanywhere.sh` - Script to run on PythonAnywhere for environment setup
- `verify_deployment.sh` - Script to verify a deployment on PythonAnywhere

### Testing Scripts
- `test_api_health.js` - Node.js script to test the API health check endpoint
- `test_api_health.sh` - Bash script to test the API health check endpoint
- `test_api_health.ps1` - PowerShell script to test the API health check endpoint

## Deployment Documentation

- `DEPLOYMENT_GUIDE.md` - Comprehensive guide for deploying the application
- `PYTHONANYWHERE_FRONTEND_DEPLOYMENT.md` - Specific instructions for frontend deployment
- `DEPLOYMENT_SUMMARY.md` - High-level summary of the deployment configuration

## Deployment Workflow

### Initial Deployment

1. **Build and Package**
   ```
   # On Windows
   .\deploy_build.bat
   
   # On Linux/macOS
   ./deploy_build.sh
   ```
   This creates a `regimark_deploy.zip` file.

2. **Upload to PythonAnywhere**
   - Upload the zip file to PythonAnywhere
   - Extract the files: `unzip regimark_deploy.zip`

3. **Setup Environment**
   ```
   cd ~/deploy_package
   chmod +x deploy_pythonanywhere.sh
   ./deploy_pythonanywhere.sh
   ```

4. **Configure Web App**
   - Follow the instructions in `DEPLOYMENT_GUIDE.md`
   - Set up static file mappings
   - Configure the WSGI file

5. **Verify Deployment**
   ```
   ./verify_deployment.sh
   ```

### Updating an Existing Deployment

1. **Build Update Package**
   ```
   # On Windows
   .\update_deployment.ps1
   ```
   This creates a timestamped deployment package.

2. **Upload and Extract**
   - Upload the new package to PythonAnywhere
   - Extract and replace files as needed

3. **Update Environment**
   ```
   cd ~/regimark_motors_control_center
   ./deploy_pythonanywhere.sh
   ```

4. **Reload Web App**
   - Go to the PythonAnywhere dashboard
   - Click the "Reload" button for your web app

5. **Test the API**
   ```
   # On PythonAnywhere
   ./test_api_health.sh https://http://localhost:3001/api
   
   # On local machine
   node test_api_health.js https://http://localhost:3001/api
   ```

## Environment Variables

Make sure the following environment variables are set on PythonAnywhere:

```
# Email Configuration
ENABLE_2FA=0
SYSTEM_EMAIL=murambaprogress@gmail.com
SYSTEM_EMAIL_PASS=your_gmail_app_password_here
DEFAULT_FROM_EMAIL=murambaprogress@gmail.com

# Database Configuration
DB_NAME=Progress$regimark_motors
DB_USER=Progress
DB_PASS=your_mysql_password_here
DB_HOST=Progress.mysql.pythonanywhere-services.com
DB_PORT=3306

# Security
DJANGO_SECRET_KEY=your_secure_secret_key_here
DEBUG=False
```

## Troubleshooting

- **API Not Responding**: Check the `test_api_health.js` script output for details
- **Static Files Missing**: Run `python manage.py collectstatic --noinput`
- **Database Errors**: Verify database connection settings in `.env`
- **Frontend Not Loading**: Check static file mappings in PythonAnywhere Web tab

For more detailed troubleshooting, see the `DEPLOYMENT_GUIDE.md` file.