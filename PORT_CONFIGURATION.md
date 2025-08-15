# Port Configuration Guide - MedCor Platform

## IMPORTANT: Port Assignments

This document defines the **STRICT** port assignments for all services in the MedCor platform.
**These ports must never be changed to avoid conflicts.**

## Service Port Mapping

| Service | Port | Description | Status |
|---------|------|-------------|--------|
| **medcor_backend** | 8000 | Original Django backend | Active |
| **medcor_backend2** | 8002 | New multi-tenant Django backend | Active |
| **Frontend (Vite)** | 5000 | React frontend application | Active |
| **FastMCP Server** | 8080 | Voice interaction server | Optional |

## Running Services

### 1. Frontend (Port 5000)
```bash
npm run dev
```

### 2. Original Backend (Port 8000)
Located in: `medcor_backend/`
```bash
cd medcor_backend
python manage.py runserver 0.0.0.0:8000
```

### 3. New Multi-Tenant Backend (Port 8002)
Located in: `medcor_backend2/`
```bash
cd medcor_backend2
python manage.py runserver 0.0.0.0:8002
# OR
python start_server.py
```

### 4. FastMCP Server (Port 8080)
```bash
cd medcor_backend2
python mcp_server.py
```

## API Endpoints

### Original Backend (Port 8000)
- Admin: http://localhost:8000/admin/
- API: http://localhost:8000/api/

### New Multi-Tenant Backend (Port 8002)
- Admin: http://localhost:8002/admin/
- API Docs: http://localhost:8002/api/docs/
- API: http://localhost:8002/api/

### Frontend (Port 5000)
- Main App: http://localhost:5000/

## Environment Variables

Make sure your `.env` files reflect the correct ports:

### medcor_backend2/.env
```env
# Server runs on port 8002
ALLOWED_HOSTS=localhost,127.0.0.1,*:8002
CORS_ALLOWED_ORIGINS=http://localhost:5000,http://localhost:8002
```

### Frontend Configuration
The frontend should connect to the appropriate backend based on the feature:
- Legacy features → Port 8000
- New multi-tenant features → Port 8002

## Troubleshooting

### Port Already in Use
If you get "Address already in use" error:

1. Check what's using the port:
```bash
lsof -i :8000  # Check port 8000
lsof -i :8002  # Check port 8002
```

2. Kill the process if needed:
```bash
kill -9 <PID>
```

### CORS Issues
Ensure the backend allows the frontend origin:
- medcor_backend should allow http://localhost:5000
- medcor_backend2 should allow http://localhost:5000

## Development Workflow

1. **Always start services in this order:**
   - PostgreSQL database (if local)
   - medcor_backend (port 8000)
   - medcor_backend2 (port 8002)
   - Frontend (port 5000)

2. **Never change the port assignments**
   - This will break integrations
   - Other developers expect these ports
   - CI/CD pipelines use these ports

## Production Deployment

In production, use a reverse proxy (Nginx) to route:
- `/api/v1/*` → Port 8000 (legacy)
- `/api/v2/*` → Port 8002 (new multi-tenant)
- `/` → Port 5000 (frontend)

## Notes

- **medcor_backend** (port 8000): Original backend, being phased out
- **medcor_backend2** (port 8002): New multi-tenant backend, primary focus
- Keep both running during transition period
- Document any API migrations from 8000 → 8002

---

**Last Updated:** January 16, 2025
**Maintained By:** MedCor Development Team