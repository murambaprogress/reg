@echo off
REM Frontend deployment script for PythonAnywhere (Windows version)
REM This script builds the React application and prepares it for deployment to PythonAnywhere

echo Starting frontend deployment process for PythonAnywhere...

REM 1. Install dependencies
echo Installing dependencies...
call npm install

REM 2. Build the project for production
echo Building project for production...
call npm run build

REM 3. Create or update .env.production file
echo Setting up environment variables for production...
echo VITE_API_BASE=https://progress.pythonanywhere.com > .env.production

REM 4. Create a deployment zip file (requires 7-Zip or similar)
echo Creating deployment archive...
if exist "C:\Program Files\7-Zip\7z.exe" (
    "C:\Program Files\7-Zip\7z.exe" a -tzip regimark_frontend_build.zip ./build/*
) else (
    echo Warning: 7-Zip not found. Please zip the build folder manually.
    pause
)

echo Deployment package created: regimark_frontend_build.zip
echo Upload this file to PythonAnywhere and extract it to your web app directory
echo Deployment preparation complete!

REM Instructions for manual steps
echo.
echo === MANUAL STEPS ===
echo 1. Log in to PythonAnywhere
echo 2. Upload regimark_frontend_build.zip to your Files section
echo 3. Open a Bash console and run:
echo    cd ~/mysite
echo    rm -rf static/*  
echo    unzip ~/regimark_frontend_build.zip -d .
echo    mv build/* static/
echo 4. Ensure your PythonAnywhere WSGI file serves the static files correctly

pause