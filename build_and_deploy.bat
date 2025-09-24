@echo off
REM Build and Deploy Script for Regimark Autoelectrics Control Center
REM This script builds the frontend and prepares for deployment

echo 🚀 Starting build and deployment process...

REM Build the frontend
echo 📦 Building frontend...
call npm run build

REM Check if build was successful
if not exist "build" (
    echo ❌ Frontend build failed! build directory not found.
    exit /b 1
)

echo ✅ Frontend build completed successfully!

REM Navigate to backend directory
cd backend

REM Install Python dependencies
echo 📦 Installing Python dependencies...
pip install -r requirements.txt

REM Collect static files
echo 📦 Collecting static files...
python manage.py collectstatic --noinput

REM Run migrations
echo 🗃️ Running database migrations...
python manage.py makemigrations
python manage.py migrate

echo ✅ Build and deployment preparation completed!
echo.
echo 📋 Next steps for PythonAnywhere deployment:
echo 1. Upload the entire project to PythonAnywhere
echo 2. Set up the virtual environment
echo 3. Configure the web app with the WSGI file
echo 4. Set up the database
echo 5. Configure environment variables
echo.
echo 📖 See DEPLOYMENT_GUIDE.md for detailed instructions

pause
