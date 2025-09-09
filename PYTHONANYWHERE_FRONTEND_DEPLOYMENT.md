# Frontend Deployment to PythonAnywhere - Step by Step Guide

## Overview
This guide shows you how to upload and serve your React frontend build files on PythonAnywhere alongside your Django backend.

## Prerequisites
- Your frontend has been built successfully (you have a `build/` folder)
- PythonAnywhere account (username: Progress)
- Django backend already deployed on PythonAnywhere

## Step 1: Prepare Your Frontend Build

### 1.1 Build Your Frontend Locally
```bash
# In your project root directory
npm run build
```

This creates a `build/` folder containing:
- `index.html` - Main HTML file
- `assets/` - CSS and JavaScript bundles
- `manifest.json`, `robots.txt`, `favicon.ico` - Static assets

### 1.2 Verify Build Contents
Your `build/` folder should contain:
```
build/
├── index.html
├── manifest.json
├── robots.txt
├── favicon.ico
└── assets/
    ├── index-DvqP1e_1.css
    ├── index-Bwus8XIP.js
    ├── html2canvas.esm-CBrSDip1.js
    └── other JS/CSS files...
```

## Step 2: Upload Frontend Files to PythonAnywhere

### 2.1 Upload Methods
You can upload your frontend files using any of these methods:

**Option A: File Manager (Web Interface)**
1. Go to PythonAnywhere Dashboard > Files
2. Navigate to `/home/Progress/regimark_motors_control_center/`
3. Upload the entire `build/` folder
4. Ensure the path is: `/home/Progress/regimark_motors_control_center/build/`

**Option B: Git (Recommended)**
1. Commit your build files to your repository
2. Pull the latest changes on PythonAnywhere:
```bash
cd /home/Progress/regimark_motors_control_center/
git pull origin main
```

**Option C: SCP/SFTP**
Use an FTP client to upload the `build/` folder to PythonAnywhere.

## Step 3: Configure Django to Serve Frontend

### 3.1 Update Django Settings
Your Django backend is already configured to serve the frontend. Verify these settings in `backend/backend_project/settings.py`:

```python
# Static files configuration
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Additional static files directories
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, '..', 'build', 'assets'),  # Frontend assets
]

# Templates configuration
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, '..', 'build')],  # Frontend templates
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]
```

### 3.2 Verify URL Configuration
Check that `backend/backend_project/urls.py` includes the frontend view:

```python
from django.contrib import admin
from django.urls import path, include
from api.frontend_views import serve_frontend

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    # Frontend serving - this should catch all non-API routes
    path('', serve_frontend, name='frontend'),
    path('<path:path>', serve_frontend, name='frontend_catchall'),
]
```

## Step 4: Collect Static Files

### 4.1 Run collectstatic Command
On PythonAnywhere, run the following commands:

```bash
cd /home/Progress/regimark_motors_control_center/backend
source venv/bin/activate
python manage.py collectstatic --noinput
```

This will:
- Copy your frontend assets to the `staticfiles/` directory
- Make them available at the `/static/` URL

### 4.2 Verify Static Files
Check that these directories exist:
- `/home/Progress/regimark_motors_control_center/backend/staticfiles/`
- `/home/Progress/regimark_motors_control_center/build/`

## Step 5: Configure PythonAnywhere Web App

### 5.1 Static Files Mapping
In your PythonAnywhere Web tab, ensure you have these static file mappings:

| URL | Directory |
|-----|-----------|
| `/static/` | `/home/Progress/regimark_motors_control_center/backend/staticfiles/` |
| `/assets/` | `/home/Progress/regimark_motors_control_center/build/assets/` |
| `/favicon.ico` | `/home/Progress/regimark_motors_control_center/build/favicon.ico` |
| `/manifest.json` | `/home/Progress/regimark_motors_control_center/build/manifest.json` |
| `/robots.txt` | `/home/Progress/regimark_motors_control_center/build/robots.txt` |

### 5.2 WSGI Configuration
Ensure your WSGI file points to: `/home/Progress/regimark_motors_control_center/backend/wsgi_config.py`

## Step 6: Test Your Deployment

### 6.1 Test Frontend Loading
1. Visit: `https://progress.pythonanywhere.com`
2. You should see your React application loading
3. Check browser developer tools for any 404 errors on assets

### 6.2 Test API Integration
1. Try logging in to verify frontend-backend communication
2. Test various features to ensure API calls work
3. Check that routing works (refresh on different pages)

### 6.3 Test Static Assets
Verify these URLs work:
- `https://progress.pythonanywhere.com/assets/index-DvqP1e_1.css`
- `https://progress.pythonanywhere.com/assets/index-Bwus8XIP.js`
- `https://progress.pythonanywhere.com/favicon.ico`

## Step 7: Updating Your Frontend

### 7.1 For Future Updates
When you make changes to your frontend:

1. **Build locally:**
```bash
npm run build
```

2. **Upload new build files** to PythonAnywhere (replace the old `build/` folder)

3. **Collect static files:**
```bash
cd /home/Progress/regimark_motors_control_center/backend
source venv/bin/activate
python manage.py collectstatic --noinput
```

4. **Reload your web app** in the PythonAnywhere Web tab

## Troubleshooting

### Common Issues

**1. Frontend not loading (blank page)**
- Check that `build/index.html` exists
- Verify Django templates configuration
- Check browser console for errors

**2. CSS/JS files not loading (404 errors)**
- Run `python manage.py collectstatic --noinput`
- Check static files mapping in PythonAnywhere Web tab
- Verify `build/assets/` folder exists

**3. API calls failing**
- Check that your frontend `.env` has correct API URL
- Verify CORS settings in Django
- Check Django logs for API errors

**4. Routing issues (404 on page refresh)**
- Ensure Django catch-all URL pattern is configured
- Check that `serve_frontend` view handles all non-API routes

### Debug Steps
1. Check PythonAnywhere error logs
2. Use browser developer tools to inspect network requests
3. Verify file permissions on uploaded files
4. Test API endpoints directly

## File Structure on PythonAnywhere
Your final structure should look like:
```
/home/Progress/regimark_motors_control_center/
├── build/                          # Frontend build files
│   ├── index.html
│   ├── assets/
│   ├── manifest.json
│   ├── robots.txt
│   └── favicon.ico
├── backend/                        # Django backend
│   ├── manage.py
│   ├── backend_project/
│   ├── api/
│   ├── staticfiles/               # Collected static files
│   └── venv/                      # Virtual environment
└── src/                           # Frontend source (optional)
```

## Success Indicators
✅ Frontend loads at `https://progress.pythonanywhere.com`
✅ All CSS and JS assets load without 404 errors
✅ Login functionality works
✅ Page routing works (can refresh on any page)
✅ API calls to backend work correctly
✅ Static assets (favicon, manifest) load properly

Your React frontend is now successfully deployed and served by your Django backend on PythonAnywhere!
