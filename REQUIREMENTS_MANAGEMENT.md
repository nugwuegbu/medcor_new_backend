# Requirements Management for MedCor Backend

This document explains how to manage and update Python dependencies for the MedCor Backend project across different environments.

## 📁 Requirements Files

### 1. **requirements.txt** (Full Development)

- Contains all packages needed for local development
- Includes testing, linting, and development tools
- Used for complete development environment setup

### 2. **requirements-prod.txt** (Production)

- Contains only essential packages for production deployment
- Optimized for server performance and security
- Excludes development and testing dependencies

### 3. **requirements-dev.txt** (Development Tools)

- Contains development-specific packages
- Testing frameworks, linting tools, documentation generators
- Installed separately for development workflow

## 🛠️ Management Scripts

### 1. **scripts/manage_requirements.py**

Python script for comprehensive requirements management.

```bash
# Update all requirements files
python3 scripts/manage_requirements.py update-all

# Update specific environment
python3 scripts/manage_requirements.py update prod

# Install requirements for environment
python3 scripts/manage_requirements.py install prod

# Check for outdated packages
python3 scripts/manage_requirements.py check-outdated

# Generate requirements from current environment
python3 scripts/manage_requirements.py generate
```

### 2. **scripts/update_requirements.sh**

Bash script for quick requirements updates.

```bash
# Make executable and run
chmod +x scripts/update_requirements.sh
./scripts/update_requirements.sh
```

### 3. **scripts/deploy_requirements.sh**

Deployment script for remote server updates.

```bash
# Set environment variables
export REMOTE_HOST=your-server.com
export REMOTE_USER=ubuntu
export REMOTE_PATH=/var/www/html/medcor_backend2

# Deploy to remote server
./scripts/deploy_requirements.sh
```

## 🚀 Quick Start

### Local Development Setup

```bash
# 1. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 2. Install full requirements
pip install -r requirements.txt

# 3. Install development tools
pip install -r requirements-dev.txt
```

### Production Deployment

```bash
# 1. Install production requirements only
pip install -r requirements-prod.txt

# 2. Or use the management script
python3 scripts/manage_requirements.py install prod
```

## 📦 Package Categories

### Core Dependencies

- **Django & REST Framework**: Web framework and API
- **Database**: PostgreSQL driver (psycopg2-binary)
- **Authentication**: JWT and security packages
- **API Documentation**: drf-spectacular for OpenAPI

### AI & Machine Learning

- **OpenAI**: GPT integration
- **LangChain**: AI workflow management
- **MCP Server**: Model Context Protocol

### Web & HTTP

- **Gunicorn**: WSGI server
- **Uvicorn**: ASGI server
- **HTTP Libraries**: requests, httpx, aiohttp

### Data Processing

- **Pydantic**: Data validation
- **NumPy**: Numerical computing
- **JSON Libraries**: orjson, jsonschema

### Development Tools

- **Testing**: pytest, coverage
- **Code Quality**: black, flake8, isort
- **Security**: bandit, safety
- **Documentation**: sphinx

## 🔄 Update Workflow

### 1. Regular Updates

```bash
# Check for outdated packages
python3 scripts/manage_requirements.py check-outdated

# Update all requirements files
python3 scripts/manage_requirements.py update-all

# Test the updates
python3 scripts/manage_requirements.py install prod
```

### 2. Adding New Dependencies

```bash
# Install new package
pip install new-package

# Update requirements files
python3 scripts/manage_requirements.py update-all

# Commit changes
git add requirements*.txt
git commit -m "Add new-package dependency"
```

### 3. Remote Server Updates

```bash
# Deploy to remote server
./scripts/deploy_requirements.sh

# Or manually update
scp requirements-prod.txt user@server:/path/to/project/
ssh user@server "cd /path/to/project && pip install -r requirements-prod.txt"
```

## 🔧 Configuration

### Environment Variables

```bash
# Remote deployment configuration
export REMOTE_HOST=your-server.com
export REMOTE_USER=ubuntu
export REMOTE_PATH=/var/www/html/medcor_backend2
export SSH_KEY=~/.ssh/id_rsa
```

### Virtual Environment

```bash
# Create virtual environment
python3 -m venv venv

# Activate (Linux/Mac)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate

# Deactivate
deactivate
```

## 📊 Monitoring

### Check Package Versions

```bash
# List installed packages
pip list

# Check specific package
pip show package-name

# Check outdated packages
pip list --outdated
```

### Security Scanning

```bash
# Check for security vulnerabilities
pip install safety
safety check

# Check for known security issues
pip install bandit
bandit -r .
```

## 🚨 Troubleshooting

### Common Issues

1. **Version Conflicts**

   ```bash
   # Check for conflicts
   pip check

   # Resolve conflicts
   pip install --upgrade conflicting-package
   ```

2. **Missing Dependencies**

   ```bash
   # Install missing packages
   pip install -r requirements-prod.txt --force-reinstall
   ```

3. **Virtual Environment Issues**
   ```bash
   # Recreate virtual environment
   rm -rf venv
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements-prod.txt
   ```

### Performance Optimization

1. **Use Production Requirements**

   - Only install essential packages in production
   - Use `requirements-prod.txt` for server deployment

2. **Pin Versions**

   - All packages have specific versions pinned
   - Prevents unexpected updates breaking the application

3. **Regular Updates**
   - Check for updates monthly
   - Test updates in development before production

## 📝 Best Practices

1. **Always use virtual environments**
2. **Pin all package versions**
3. **Separate development and production dependencies**
4. **Regular security scanning**
5. **Test updates before deployment**
6. **Document any manual changes**
7. **Use the management scripts for consistency**

## 🔗 Related Files

- `requirements.txt` - Full development requirements
- `requirements-prod.txt` - Production requirements
- `requirements-dev.txt` - Development tools
- `scripts/manage_requirements.py` - Management script
- `scripts/update_requirements.sh` - Update script
- `scripts/deploy_requirements.sh` - Deployment script
- `pyproject.toml` - Project configuration

## 📞 Support

For issues with requirements management:

1. Check this documentation
2. Run `python3 scripts/manage_requirements.py check-outdated`
3. Check the troubleshooting section
4. Review package documentation
5. Contact the development team

---

**Last Updated**: January 2025
**Version**: 2.0.0
