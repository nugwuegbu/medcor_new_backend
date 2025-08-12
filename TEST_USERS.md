# Test Users for MedCor Platform

## Default Test Accounts

These test accounts are automatically created when the application starts:

### 1. Admin Account
- **Email:** admin@medcor.ai
- **Password:** admin123
- **Role:** Admin
- **Access:** Full system administration

### 2. Clinic Account
- **Email:** clinic@medcor.ai
- **Password:** clinic123
- **Role:** Clinic Admin
- **Access:** Clinic management dashboard

### 3. Doctor Account
- **Email:** doctor@medcor.ai
- **Password:** doctor123
- **Role:** Doctor
- **Access:** Doctor dashboard, patient management

### 4. Patient Account
- **Email:** patient@medcor.ai
- **Password:** patient123
- **Role:** Patient
- **Access:** Patient portal, appointments

## Additional Demo Accounts

### Doctor Demo
- **Email:** doctor@demo.com
- **Password:** demo123
- **First Name:** John
- **Last Name:** Doe
- **Role:** Doctor

### Patient Demo
- **Email:** patient@demo.com
- **Password:** demo123
- **First Name:** Jane
- **Last Name:** Smith
- **Role:** Patient

## Django Admin Superuser

For Django admin panel access:
- **Username:** admin
- **Password:** MedcorAdmin2025!
- **URL:** /admin/ or port 8001/admin/ on deployed server

## How to Use

1. **Local Development:**
   - Go to http://localhost:5000
   - Click "Login" 
   - Use any of the test accounts above

2. **Testing Different Roles:**
   - Admin: Full system access, user management
   - Clinic: Clinic-specific operations
   - Doctor: Patient appointments, treatments
   - Patient: View appointments, medical records

3. **Database Location:**
   - SQLite DB: `admin_db.sqlite3` (local testing)
   - PostgreSQL: Neon cloud database (production)

## Creating Additional Test Users

Run this command to create more test users:
```bash
node create-demo-accounts.js
```

Or use the API directly:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "role": "patient",
    "first_name": "Test",
    "last_name": "User"
  }'
```

## Notes
- All test passwords are set to simple values for easy testing
- These accounts are reset on each application restart
- For production, use strong passwords and proper authentication