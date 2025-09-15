@echo off
echo Starting Regimark Motors Control Center - Local Development
echo.

echo Starting Django Backend Server...
start "Django Backend" cmd /k "cd backend && python manage.py runserver 8000"

echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak > nul

echo Starting React Frontend Server...
start "React Frontend" cmd /k "npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3001
echo.
echo Press any key to exit this script (servers will continue running)
pause > nul
