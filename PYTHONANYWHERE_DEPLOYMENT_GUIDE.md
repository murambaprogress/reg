# Deployment Guide for PythonAnywhere

This guide outlines the steps to deploy the Regimark Motors Control Center application to PythonAnywhere.

## Prerequisites

1. A PythonAnywhere account (create one at [www.pythonanywhere.com](https://www.pythonanywhere.com) if you don't have one)
2. Your GitHub repository access credentials

## Deployment Process

### 1. Backend Setup

1. **Log in to PythonAnywhere**
   - Go to [www.pythonanywhere.com](https://www.pythonanywhere.com) and log in

2. **Open a Bash Console**
   - From the Dashboard, click on "Bash" under "Consoles"

3. **Clone the Repository**
   ```bash
   git clone https://github.com/murambaprogress/reg.git
   cd reg
   ```

4. **Create a Virtual Environment**
   ```bash
   mkvirtualenv --python=/usr/bin/python3.8 regimark_env
   ```

5. **Install Backend Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

6. **Configure Environment Variables**
   - Create a `.env` file in the backend directory with your environment variables:
   ```bash
   touch .env
   nano .env
   ```
   - Add the following environment variables (replace with your actual values):
   ```
   SECRET_KEY=your_secret_key
   DEBUG=False
   ALLOWED_HOSTS=yourusername.pythonanywhere.com
   DATABASE_URL=sqlite:///db.sqlite3
   ```

7. **Set Up the Database**
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

### 2. WSGI Configuration

1. **Go to the Web Tab**
   - Click on "Web" in the top navigation menu

2. **Add a New Web App**
   - Click on "Add a new web app"
   - Choose "Manual configuration"
   - Select Python 3.8

3. **Configure the WSGI File**
   - Click on the WSGI configuration file link
   - Replace the content with:
   ```python
   import os
   import sys
   
   path = '/home/yourusername/reg/backend'
   if path not in sys.path:
       sys.path.append(path)
   
   os.environ['DJANGO_SETTINGS_MODULE'] = 'backend_project.settings'
   
   from django.core.wsgi import get_wsgi_application
   application = get_wsgi_application()
   ```
   - Replace `yourusername` with your PythonAnywhere username
   - Save the file

4. **Configure Static Files**
   - In the Web tab, go to the "Static files" section
   - Add:
     - URL: `/static/`
     - Directory: `/home/yourusername/reg/backend/static/`
   - Add another entry:
     - URL: `/media/`
     - Directory: `/home/yourusername/reg/backend/media/`

5. **Configure Virtual Environment**
   - In the Web tab, set the virtual environment path to:
   ```
   /home/yourusername/.virtualenvs/regimark_env
   ```

### 3. Frontend Deployment

1. **Build the Frontend**
   - On your local machine:
   ```bash
   npm run build
   ```

2. **Upload the Frontend Build**
   - Upload the contents of the `build` directory to PythonAnywhere using the Files tab or SFTP
   - Place it in `/home/yourusername/reg/build/`

3. **Configure Nginx to Serve the Frontend**
   - In the Web tab, add a new static files mapping:
     - URL: `/`
     - Directory: `/home/yourusername/reg/build/`

### 4. Final Steps

1. **Reload the Web App**
   - In the Web tab, click "Reload" to apply your changes

2. **Test the Deployment**
   - Visit `https://yourusername.pythonanywhere.com`
   - Check that both the frontend and API endpoints are working correctly

## Troubleshooting

1. **Check Error Logs**
   - Go to the Web tab
   - Click on "Error log" to see any error messages

2. **Check Access Logs**
   - Go to the Web tab
   - Click on "Access log" to see access records

3. **Common Issues**
   - **Static Files Not Loading**: Make sure the paths in the static files configuration are correct
   - **API Connection Issues**: Verify that the `VITE_API_BASE` is correctly set to point to the API endpoint
   - **Database Errors**: Check database configuration in the Django settings

## Maintenance

1. **Updating the Application**
   ```bash
   cd ~/reg
   git pull origin master
   
   # Update backend
   cd backend
   source ~/.virtualenvs/regimark_env/bin/activate
   pip install -r requirements.txt
   python manage.py migrate
   
   # Rebuild frontend (if needed)
   cd ..
   # Deploy new frontend build
   ```

2. **Reload After Updates**
   - Always reload the web app from the Web tab after updates