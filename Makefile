# MedCor Backend Makefile
# Usage: make [target]

.PHONY: help build up down logs shell test clean deploy

# Default target
help:
	@echo "MedCor Backend - Available Commands:"
	@echo ""
	@echo "Development:"
	@echo "  build          Build Docker images"
	@echo "  up             Start development environment"
	@echo "  down           Stop development environment"
	@echo "  logs           View application logs"
	@echo "  shell          Open shell in web container"
	@echo "  migrate        Run database migrations"
	@echo "  createsuperuser Create Django superuser"
	@echo ""
	@echo "Testing:"
	@echo "  test           Run unit tests"
	@echo "  test-coverage  Run tests with coverage"
	@echo "  lint           Run code linting"
	@echo "  format         Format code with black and isort"
	@echo ""
	@echo "Deployment:"
	@echo "  deploy-dev     Deploy to development"
	@echo "  deploy-prod    Deploy to production"
	@echo "  health         Check application health"
	@echo ""
	@echo "Maintenance:"
	@echo "  clean          Clean up Docker resources"
	@echo "  backup         Create database backup"
	@echo "  restore        Restore database from backup"

# Development commands
build:
	docker-compose build

up:
	docker-compose up -d
	@echo "Application started. Access at http://localhost"
	@echo "MCP Server available at http://localhost:8001"

down:
	docker-compose down

logs:
	docker-compose logs -f

logs-mcp:
	docker-compose logs -f mcp-server

shell:
	docker-compose exec web bash

shell-mcp:
	docker-compose exec mcp-server bash

migrate:
	docker-compose exec web python manage.py migrate

createsuperuser:
	docker-compose exec web python manage.py createsuperuser

# Testing commands
test:
	docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit
	docker-compose -f docker-compose.test.yml down

test-coverage:
	docker-compose exec web coverage run --source='.' manage.py test
	docker-compose exec web coverage report
	docker-compose exec web coverage html

lint:
	docker-compose exec web flake8 .
	docker-compose exec web black --check .
	docker-compose exec web isort --check-only .

format:
	docker-compose exec web black .
	docker-compose exec web isort .

# Deployment commands
deploy-dev:
	@echo "Deploying to development environment..."
	ssh ubuntu@api.medcor.ai 'cd /var/www/html/medcor_backend2 && sudo ./scripts/deploy.sh development'

deploy-prod:
	@echo "Deploying to production environment..."
	ssh ubuntu@api.medcor.ai 'cd /var/www/html/medcor_backend2 && sudo ./scripts/deploy.sh production'

health:
	@echo "Checking application health..."
	curl -f http://localhost/api/health/ || echo "Main API health check failed"
	curl -f http://localhost:8001/health/ || echo "MCP server health check failed"
	@echo "Checking services..."
	sudo systemctl is-active --quiet rabbitmq-server.service && echo "✅ RabbitMQ service is running" || echo "❌ RabbitMQ service is not running"

# Maintenance commands
clean:
	docker-compose down -v
	docker system prune -f
	docker volume prune -f

backup:
	@echo "Creating database backup..."
	docker-compose exec db pg_dump -U medcor_user medcor_db > backup_$(shell date +%Y%m%d_%H%M%S).sql

restore:
	@echo "Restoring database from backup..."
	@read -p "Enter backup filename: " backup_file; \
	docker-compose exec -T db psql -U medcor_user medcor_db < $$backup_file

# Production commands
prod-build:
	docker-compose -f docker-compose.prod.yml build

prod-up:
	docker-compose -f docker-compose.prod.yml up -d

prod-down:
	docker-compose -f docker-compose.prod.yml down

prod-logs:
	docker-compose -f docker-compose.prod.yml logs -f

# Security commands
security-scan:
	docker-compose exec web bandit -r .
	docker-compose exec web safety check

# Database commands
db-shell:
	docker-compose exec db psql -U medcor_user medcor_db

db-reset:
	docker-compose down -v
	docker-compose up -d db
	sleep 10
	docker-compose exec web python manage.py migrate
	docker-compose exec web python manage.py createsuperuser

# Monitoring commands
stats:
	docker stats

ps:
	docker-compose ps

# Quick setup for new developers
setup:
	@echo "Setting up development environment..."
	cp env.example .env
	@echo "Please edit .env file with your configuration"
	make build
	make up
	sleep 30
	make migrate
	@echo "Setup complete! Run 'make createsuperuser' to create an admin user"