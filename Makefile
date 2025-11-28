# MedCor Backend Makefile
# Provides easy commands for requirements management and deployment

.PHONY: help install install-dev install-prod update check-outdated clean deploy

# Default target
help:
	@echo "MedCor Backend - Requirements Management"
	@echo "========================================"
	@echo ""
	@echo "Available commands:"
	@echo "  install          - Install full development requirements"
	@echo "  install-dev      - Install development tools only"
	@echo "  install-prod     - Install production requirements only"
	@echo "  update           - Update all requirements files"
	@echo "  check-outdated   - Check for outdated packages"
	@echo "  clean            - Clean pip cache and temporary files"
	@echo "  deploy           - Deploy requirements to remote server"
	@echo "  help             - Show this help message"
	@echo ""

# Install full development requirements
install:
	@echo "📦 Installing full development requirements..."
	pip install -r requirements.txt
	pip install -r requirements-dev.txt
	@echo "✅ Installation completed!"

# Install development tools only
install-dev:
	@echo "🛠️ Installing development tools..."
	pip install -r requirements-dev.txt
	@echo "✅ Development tools installed!"

# Install production requirements only
install-prod:
	@echo "🚀 Installing production requirements..."
	pip install -r requirements-prod.txt
	@echo "✅ Production requirements installed!"

# Update all requirements files
update:
	@echo "🔄 Updating all requirements files..."
	python3 scripts/manage_requirements.py update-all
	@echo "✅ Requirements files updated!"

# Check for outdated packages
check-outdated:
	@echo "🔍 Checking for outdated packages..."
	python3 scripts/manage_requirements.py check-outdated

# Clean pip cache and temporary files
clean:
	@echo "🧹 Cleaning pip cache and temporary files..."
	pip cache purge
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@echo "✅ Cleanup completed!"

# Deploy to remote server
deploy:
	@echo "🚀 Deploying to remote server..."
	@if [ -z "$$REMOTE_HOST" ]; then \
		echo "❌ Error: REMOTE_HOST environment variable not set"; \
		echo "   Example: export REMOTE_HOST=your-server.com"; \
		exit 1; \
	fi
	./scripts/deploy_requirements.sh

# Quick development setup
setup-dev:
	@echo "⚙️ Setting up development environment..."
	python3 -m venv venv
	@echo "📦 Activating virtual environment..."
	@echo "   Run: source venv/bin/activate"
	@echo "   Then run: make install"

# Quick production setup
setup-prod:
	@echo "⚙️ Setting up production environment..."
	python3 -m venv venv
	@echo "📦 Activating virtual environment..."
	@echo "   Run: source venv/bin/activate"
	@echo "   Then run: make install-prod"

# Security check
security-check:
	@echo "🔒 Running security checks..."
	pip install safety bandit
	safety check
	bandit -r . -f json -o security-report.json || true
	@echo "✅ Security check completed!"

# Generate requirements from current environment
generate:
	@echo "📋 Generating requirements from current environment..."
	python3 scripts/manage_requirements.py generate
	@echo "✅ Requirements generated!"

# Show current package versions
show-versions:
	@echo "📊 Current package versions:"
	pip list | grep -E "(Django|djangorestframework|openai|langchain|celery|redis|psycopg2)"

# Install specific package and update requirements
add-package:
	@if [ -z "$$PACKAGE" ]; then \
		echo "❌ Error: PACKAGE environment variable not set"; \
		echo "   Example: PACKAGE=package-name make add-package"; \
		exit 1; \
	fi
	@echo "📦 Installing package: $$PACKAGE"
	pip install $$PACKAGE
	python3 scripts/manage_requirements.py update-all
	@echo "✅ Package $$PACKAGE added and requirements updated!"

# Remove package and update requirements
remove-package:
	@if [ -z "$$PACKAGE" ]; then \
		echo "❌ Error: PACKAGE environment variable not set"; \
		echo "   Example: PACKAGE=package-name make remove-package"; \
		exit 1; \
	fi
	@echo "🗑️ Removing package: $$PACKAGE"
	pip uninstall -y $$PACKAGE
	python3 scripts/manage_requirements.py update-all
	@echo "✅ Package $$PACKAGE removed and requirements updated!"