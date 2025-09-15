# Local Development Setup Guide

This guide will help you set up the Regimark Motors Control Center project to run locally on your machine.

## Prerequisites

Before starting, make sure you have the following installed:

1. **Node.js** (version 16 or higher)
2. **Python** (version 3.8 or higher)
3. **MySQL** (version 8.0 or higher)
4. **Git**

## Project Structure

```
regimark_motors_control_center/
├── src/                    # React frontend source code
├── backend/               # Django backend
├── public/               # Static assets
├── package.json          # Frontend dependencies
├── vite.config.mjs      # Vite configuration
├── .env                 # Frontend environment variables
└── backend/
    ├── manage.py        # Django management script
    ├── requirements.txt # Backend dependencies
    └── .env            # Backend environment variables
```

## Setup Instructions

### 1. Clone and Navigate to Project

```bash
git clone https://github.com/murambaprogress/reg.git
cd regimark_motors_control_center
```

### 2. Database Setup

1. **Install MySQL** if not already installed
2. **Create a database** named `regimark`:
   ```sql
   CREATE DATABASE regimark;
   ```
3. **Update database credentials** in `backend/.env` if needed:
   ```
   DB_NAME=regimark
   DB_USER=root
   DB_PASS=your_mysql_password
   DB_HOST=localhost
   DB_PORT=3306
   ```

### 3. Backend Setup (Django)

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment**:
   - Windows:
     ```bash
     venv\Scripts\activate
     ```
   - macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Run database migrations**:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

6. **Create a superuser** (optional):
   ```bash
   python manage.py createsuperuser
   ```

7. **Start the Django development server**:
   ```bash
   python manage.py runserver 8000
   ```

   The backend will be available at: `http://localhost:8000`

### 4. Frontend Setup (React + Vite)

1. **Open a new terminal** and navigate to the project root:
   ```bash
   cd regimark_motors_control_center
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

   The frontend will be available at: `http://localhost:3001`

## Running the Application

### Method 1: Manual Start (Recommended for Development)

1. **Terminal 1 - Backend**:
   ```bash
   cd backend
   # Activate virtual environment first
   python manage.py runserver 8000
   ```

2. **Terminal 2 - Frontend**:
   ```bash
   npm run dev
   ```

### Method 2: Using Package Scripts

You can also use the following npm scripts:

- `npm run dev` - Start frontend development server
- `npm run build` - Build frontend for production
- `npm run serve` - Preview production build

## Configuration Details

### Frontend Configuration (.env)
- `VITE_API_BASE=http://localhost:8000/api/auth` - Points to local Django backend

### Backend Configuration (backend/.env)
- `DEBUG=True` - Enables Django debug mode
- `DB_NAME=regimark` - Local MySQL database name
- `ENABLE_2FA=1` - Uses console email backend for development

### Vite Configuration (vite.config.mjs)
- Proxy setup for API calls to Django backend
- Development server runs on port 3001
- API calls are proxied to `http://localhost:8000`

## Default Login Credentials

The system comes with pre-configured admin accounts:

- **Admin**: username: `admin`, password: `admin123`
- **Supervisor**: username: `supervisor`, password: `supervisor123`

## Troubleshooting

### Common Issues

1. **Port already in use**:
   - Frontend (3001): Change port in `vite.config.mjs`
   - Backend (8000): Use `python manage.py runserver 8001`

2. **Database connection errors**:
   - Ensure MySQL is running
   - Check database credentials in `backend/.env`
   - Verify database `regimark` exists

3. **Module not found errors**:
   - Frontend: Run `npm install`
   - Backend: Ensure virtual environment is activated and run `pip install -r requirements.txt`

4. **CORS errors**:
   - The Django settings are configured to allow localhost origins
   - Ensure both servers are running on correct ports

### Database Reset

If you need to reset the database:

```bash
cd backend
python manage.py flush
python manage.py migrate
```

## Development Workflow

1. **Start both servers** (backend on 8000, frontend on 3001)
2. **Access the application** at `http://localhost:3001`
3. **API calls** are automatically proxied to the Django backend
4. **Hot reload** is enabled for both frontend and backend changes

## Production Build

To create a production build:

```bash
npm run build
```

This creates a `build/` directory with optimized production files.

## Additional Notes

- The project uses JWT authentication
- CORS is configured for local development
- Email backend uses console output in development mode
- Static files are served by Django in development
