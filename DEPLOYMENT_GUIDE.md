# Regimark Motors Control Center - PythonAnywhere Deployment Guide

## Overview
This guide will help you deploy the Regimark Motors Control Center to PythonAnywhere with the corrected email configuration and proper URL setup.

## Prerequisites
- PythonAnywhere account (username: Progress)
- Gmail account: murambaprogress@gmail.com with app password
- MySQL database on PythonAnywhere

## Backend Deployment Steps

### 1. Upload Files to PythonAnywhere
1. Upload the entire project to `/home/Progress/regimark_motors_control_center/`
2. Ensure all backend files are in `/home/Progress/regimark_motors_control_center/backend/`

### 2. Set up Virtual Environment
```bash
cd /home/Progress/regimark_motors_control_center/backend
python3.10 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Update `/home/Progress/regimark_motors_control_center/backend/.env`:
```env
# Email Configuration
ENABLE_2FA=0
SYSTEM_EMAIL=murambaprogress@gmail.com
SYSTEM_EMAIL_PASS=your_gmail_app_password_here
DEFAULT_FROM_EMAIL=murambaprogress@gmail.com

# Database Configuration for PythonAnywhere
DB_NAME=Progress$regimark_motors
DB_USER=Progress
DB_PASS=your_mysql_password_here
DB_HOST=Progress.mysql.pythonanywhere-services.com
DB_PORT=3306

# Security
DJANGO_SECRET_KEY=your_secure_secret_key_here
DEBUG=False
```

### 4. Set up MySQL Database
1. Go to PythonAnywhere Dashboard > Databases
2. Create a new MySQL database named `Progress$regimark_motors`
3. Note down the database password

### 5. Configure Web App
1. Go to PythonAnywhere Dashboard > Web
2. Create a new web app with domain: `progress.pythonanywhere.com`
3. Choose "Manual configuration" with Python 3.10
4. Set the source code directory to: `/home/Progress/regimark_motors_control_center/backend`
5. Set the WSGI configuration file to: `/home/Progress/regimark_motors_control_center/backend/wsgi_config.py`

### 6. Configure Static Files
In the Web tab, add static files mapping:
- URL: `/static/`
- Directory: `/home/Progress/regimark_motors_control_center/backend/staticfiles/`

### 7. Run Database Migrations
```bash
cd /home/Progress/regimark_motors_control_center/backend
source venv/bin/activate
python manage.py makemigrations
python manage.py migrate
python manage.py collectstatic --noinput
```

### 8. Create Superuser (Optional)
```bash
python manage.py createsuperuser
```

## Frontend Configuration

### 1. Update API Base URL
The frontend `.env` file has been updated to point to:
```env
VITE_API_BASE=https://progress.pythonanywhere.com/api/auth
```

### 2. Build Frontend
Build the React application:
```bash
npm run build
```

This creates a `dist` folder with the built frontend files.

### 3. Frontend Serving
The Django backend is configured to serve the frontend automatically:
- Static assets are served from `/assets/` URL
- All non-API routes are handled by React Router
- The `index.html` file is served for all frontend routes

## Email Configuration

### 1. Gmail App Password Setup
1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Generate an App Password for "Mail"
4. Use this app password in the `SYSTEM_EMAIL_PASS` environment variable

### 2. Email Settings
- **From Email**: murambaprogress@gmail.com
- **Admin Email**: murambaprogress@gmail.com
- **Supervisor Email**: murambaprogress@gmail.com

## Login Credentials

### Default Accounts
- **Admin**: username: `admin`, password: `admin123`
- **Supervisor**: username: `supervisor`, password: `supervisor123`

Both accounts will require OTP verification sent to: murambaprogress@gmail.com

## Testing the Deployment

### 1. Backend API Test
Visit: `https://progress.pythonanywhere.com/api/auth/login`

### 2. Login Flow Test
1. Try logging in with admin/supervisor credentials
2. Check that OTP is sent to murambaprogress@gmail.com
3. Verify OTP functionality

### 3. Database Connection Test
Ensure all API endpoints work correctly with the MySQL database.

## Troubleshooting

### Common Issues
1. **Database Connection Error**: Check database credentials in `.env`
2. **Email Not Sending**: Verify Gmail app password and SMTP settings
3. **CORS Issues**: Ensure PythonAnywhere domain is in CORS_ALLOWED_ORIGINS
4. **Static Files Not Loading**: Run `python manage.py collectstatic`

### Debug Mode
For debugging, temporarily set `DEBUG=True` in `.env`, but remember to set it back to `False` for production.

## Security Notes
1. Keep your secret key secure
2. Use strong database passwords
3. Regularly update dependencies
4. Monitor access logs
5. Set `DEBUG=False` in production

## Support
For issues with deployment, check:
1. PythonAnywhere error logs
2. Django logs
3. Email delivery logs
4. Database connection logs
