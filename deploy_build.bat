@echo off
REM ========================================
REM Regimark Motors Control Center Deployment Script for Windows
REM For PythonAnywhere deployment
REM ========================================

echo ===== Starting deployment process =====
echo Building application for production...

REM Build frontend
call npm run build

if %ERRORLEVEL% neq 0 (
    echo ERROR: Frontend build failed!
    exit /b 1
)

echo Frontend build successful.

REM Create a deployment package
echo Creating deployment package...
if not exist deploy_package mkdir deploy_package
xcopy /E /I build deploy_package\build
xcopy /E /I backend deploy_package\backend
copy PYTHONANYWHERE_DEPLOYMENT_GUIDE.md deploy_package\
copy deploy_pythonanywhere.sh deploy_package\

REM Create README for deployment
echo Regimark Motors Control Center Deployment Package > deploy_package\README.txt
echo ================================================ >> deploy_package\README.txt
echo. >> deploy_package\README.txt
echo This package contains the following: >> deploy_package\README.txt
echo 1. build/ - Frontend build files >> deploy_package\README.txt
echo 2. backend/ - Backend Django application >> deploy_package\README.txt
echo 3. PYTHONANYWHERE_DEPLOYMENT_GUIDE.md - Step-by-step deployment guide >> deploy_package\README.txt
echo 4. deploy_pythonanywhere.sh - Script for PythonAnywhere setup >> deploy_package\README.txt
echo. >> deploy_package\README.txt
echo Follow the instructions in PYTHONANYWHERE_DEPLOYMENT_GUIDE.md for complete setup. >> deploy_package\README.txt

REM Create the deployment archive (requires 7-Zip or similar)
echo Creating deployment archive...
powershell -Command "Compress-Archive -Path deploy_package\* -DestinationPath regimark_deploy.zip -Force"

REM Clean up
rmdir /S /Q deploy_package

echo ===== Deployment package created: regimark_deploy.zip =====
echo Upload this package to PythonAnywhere and follow the instructions in PYTHONANYWHERE_DEPLOYMENT_GUIDE.md