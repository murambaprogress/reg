Django backend scaffold for Regimark Motors Control Center

Setup (no virtualenv required):

1. Install Python packages globally or in your preferred environment:

```powershell
pip install -r requirements.txt
```

2. Configure environment variables (Windows PowerShell example):

```powershell
$env:DB_NAME = 'regimark_motors'
$env:DB_USER = 'root'
$env:DB_PASS = ''
$env:DB_HOST = '127.0.0.1'
$env:SYSTEM_EMAIL = 'pcjeche@gmail.com'
$env:SYSTEM_EMAIL_PASS = 'ntau nhyu kvue gsab'
$env:SUPERVISOR_EMAIL = 'murambaprogress@gmail.com'
$env:SUPERVISOR_USERNAME = 'supervisor'
$env:SUPERVISOR_PASSWORD = 'supervisor123'
```

3. Create the database in XAMPP's phpMyAdmin: `regimark_motors`.

4. Run migrations:

```powershell
python manage.py makemigrations
python manage.py migrate
```

5. Run the server:

```powershell
python manage.py runserver
```

API endpoints:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/verify-otp
- POST /api/auth/create-technician (admin only, Bearer token)

These endpoints accept and return JSON. Example register payload:

{
	"username": "admin1",
	"email": "admin1@example.com",
	"password": "securepass",
	"role": "admin"
}

Notes:
- Supervisor credentials are hardcoded and must verify via OTP to obtain a token.
- System email is used to send OTPs.
