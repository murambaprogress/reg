# Regimark Motors Control Center

A comprehensive automotive service management system built with Django REST Framework backend and React frontend.

## Project Structure

```
regimark_motors_control_center/
├── backend/                    # Django REST API
│   ├── api/                   # Core API app
│   ├── inventory/             # Inventory management
│   ├── customers/             # Customer management
│   ├── suppliers/             # Supplier management
│   ├── sales/                 # Sales management
│   ├── jobs/                  # Job management
│   ├── backend_project/       # Django project settings
│   ├── static/                # Static files
│   ├── staticfiles/           # Collected static files
│   ├── scripts/               # Utility scripts
│   ├── manage.py              # Django management script
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Environment variables
├── src/                       # React frontend source
├── public/                    # Public assets
├── dist/                      # Built frontend (will be uploaded separately)
└── tests/                     # Test files
```

## Features

### Backend (Django REST Framework)
- **User Authentication & Authorization** - JWT-based authentication with role-based access
- **Inventory Management** - Parts tracking, stock levels, alerts
- **Customer Management** - Customer profiles, vehicle history, billing
- **Supplier Management** - Supplier information, purchase orders
- **Sales Management** - Sales tracking, walk-in customers
- **Job Management** - Work orders, technician assignments, progress tracking
- **Admin Dashboard** - System overview, user management
- **Reports & Analytics** - Business intelligence and reporting

### Frontend (React)
- **Modern React Application** - Built with Vite for fast development
- **Responsive Design** - Tailwind CSS for mobile-first design
- **Component-based Architecture** - Reusable UI components
- **Context API** - State management across components
- **Error Boundaries** - Graceful error handling
- **Toast Notifications** - User feedback system

## Technology Stack

### Backend
- **Django 4.2+** - Web framework
- **Django REST Framework** - API development
- **MySQL** - Database (PythonAnywhere hosted)
- **JWT Authentication** - Secure token-based auth
- **CORS Headers** - Cross-origin resource sharing

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client

## Database Configuration

The application is configured to use MySQL database hosted on PythonAnywhere:

- **Host**: Progress.mysql.pythonanywhere-services.com
- **Database**: Progress$regimark_motors
- **User**: Progress

## Installation & Setup

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   - Update `backend/.env` with your actual database password
   - Set other environment variables as needed

4. **Run database migrations**
   ```bash
   python manage.py migrate
   ```

5. **Collect static files**
   ```bash
   python manage.py collectstatic --noinput
   ```

6. **Create superuser (optional)**
   ```bash
   python manage.py createsuperuser
   ```

7. **Start development server**
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. **Install Node.js dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Build for production**
   ```bash
   npm run build
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/register/` - User registration
- `POST /api/auth/refresh/` - Token refresh

### Core Resources
- `/api/inventory/` - Inventory management
- `/api/customers/` - Customer management
- `/api/suppliers/` - Supplier management
- `/api/sales/` - Sales management
- `/api/jobs/` - Job management

## Deployment

### PythonAnywhere Deployment

1. **Upload backend files** to PythonAnywhere
2. **Configure WSGI** using `backend/wsgi_config.py`
3. **Set environment variables** in PythonAnywhere console
4. **Run migrations** on the server
5. **Collect static files** on the server
6. **Upload frontend dist** as static files

### Environment Variables

Required environment variables in `backend/.env`:

```env
# Database Configuration
DB_NAME=Progress$regimark_motors
DB_USER=Progress
DB_PASS=your_database_password
DB_HOST=Progress.mysql.pythonanywhere-services.com
DB_PORT=3306

# Security
DJANGO_SECRET_KEY=your_secret_key
DEBUG=False

# Email Configuration
ENABLE_2FA=0
SYSTEM_EMAIL=your_email@gmail.com
SYSTEM_EMAIL_PASS=your_app_password
DEFAULT_FROM_EMAIL=your_email@gmail.com
```

## Development

### Code Structure

- **Backend Apps**: Each Django app handles a specific domain (inventory, customers, etc.)
- **API Serializers**: Data serialization for REST API responses
- **Models**: Database schema definitions
- **Views**: API endpoint logic
- **URLs**: Route configurations

### Frontend Components

- **Pages**: Main application views
- **Components**: Reusable UI components
- **Context**: State management
- **Styles**: Tailwind CSS configurations

## Testing

Run backend tests:
```bash
cd backend
python manage.py test
```

Run frontend tests:
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is proprietary software for Regimark Motors.

## Support

For support and questions, contact the development team.
