#!/bin/bash

# MedCor Backend CI/CD Setup Script
# This script sets up the CI/CD environment for the MedCor Backend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root"
        exit 1
    fi
}

# Check system requirements
check_requirements() {
    log "Checking system requirements..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if Git is installed
    if ! command -v git &> /dev/null; then
        error "Git is not installed. Please install Git first."
        exit 1
    fi
    
    # Check if Python is installed
    if ! command -v python3 &> /dev/null; then
        error "Python 3 is not installed. Please install Python 3 first."
        exit 1
    fi
    
    log "All requirements satisfied"
}

# Setup environment files
setup_environment() {
    log "Setting up environment files..."
    
    if [ ! -f ".env" ]; then
        if [ -f "env.example" ]; then
            cp env.example .env
            warning "Created .env file from env.example. Please edit it with your configuration."
        else
            error "env.example file not found"
            exit 1
        fi
    else
        info ".env file already exists"
    fi
}

# Build Docker images
build_images() {
    log "Building Docker images..."
    
    # Build main application image
    docker build -t medcor-backend:latest .
    
    # Test the image
    docker run --rm medcor-backend:latest python --version
    
    log "Docker images built successfully"
}

# Test Docker Compose setup
test_docker_compose() {
    log "Testing Docker Compose setup..."
    
    # Test development environment
    docker-compose config
    
    # Test production environment
    docker-compose -f docker-compose.prod.yml config
    
    # Test test environment
    docker-compose -f docker-compose.test.yml config
    
    log "Docker Compose configurations are valid"
}

# Run basic tests
run_tests() {
    log "Running basic tests..."
    
    # Start test environment
    docker-compose -f docker-compose.test.yml up -d
    
    # Wait for services to be ready
    sleep 30
    
    # Run tests
    docker-compose -f docker-compose.test.yml exec -T web python manage.py test --settings=medcor_backend2.test_settings || {
        error "Tests failed"
        docker-compose -f docker-compose.test.yml down
        exit 1
    }
    
    # Cleanup
    docker-compose -f docker-compose.test.yml down
    
    log "Basic tests passed"
}

# Setup development environment
setup_dev_environment() {
    log "Setting up development environment..."
    
    # Start development services
    docker-compose up -d db redis
    
    # Wait for services to be ready
    sleep 20
    
    # Run migrations
    docker-compose exec -T web python manage.py migrate || {
        warning "Migrations failed, this might be expected for a fresh setup"
    }
    
    # Create superuser (optional)
    read -p "Do you want to create a superuser? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose exec web python manage.py createsuperuser
    fi
    
    log "Development environment setup complete"
}

# Test health endpoints
test_health_endpoints() {
    log "Testing health endpoints..."
    
    # Start web service
    docker-compose up -d web
    
    # Wait for service to be ready
    sleep 30
    
    # Test health endpoint
    if curl -f http://localhost:8000/api/health/ > /dev/null 2>&1; then
        log "Health endpoint test passed"
    else
        error "Health endpoint test failed"
        docker-compose down
        exit 1
    fi
    
    # Test API docs
    if curl -f http://localhost:8000/api/schema/swagger-ui/ > /dev/null 2>&1; then
        log "API docs endpoint test passed"
    else
        warning "API docs endpoint test failed"
    fi
    
    log "Health endpoint tests completed"
}

# Setup AWS CLI (if credentials provided)
setup_aws_cli() {
    if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
        log "Setting up AWS CLI..."
        
        # Check if AWS CLI is installed
        if ! command -v aws &> /dev/null; then
            warning "AWS CLI is not installed. Please install it manually."
            return
        fi
        
        # Configure AWS CLI
        aws configure set aws_access_key_id "$AWS_ACCESS_KEY_ID"
        aws configure set aws_secret_access_key "$AWS_SECRET_ACCESS_KEY"
        aws configure set default.region us-east-1
        
        # Test AWS connection
        if aws sts get-caller-identity > /dev/null 2>&1; then
            log "AWS CLI configured successfully"
        else
            warning "AWS CLI configuration failed"
        fi
    else
        info "AWS credentials not provided, skipping AWS CLI setup"
    fi
}

# Display next steps
show_next_steps() {
    log "Setup completed successfully!"
    echo
    echo -e "${BLUE}Next Steps:${NC}"
    echo "1. Edit .env file with your configuration"
    echo "2. Configure AWS ECR repository"
    echo "3. Set up Jenkins or GitHub Actions"
    echo "4. Configure deployment server"
    echo "5. Test the complete pipeline"
    echo
    echo -e "${BLUE}Useful Commands:${NC}"
    echo "  make up          - Start development environment"
    echo "  make test        - Run tests"
    echo "  make logs        - View logs"
    echo "  make shell       - Open shell in container"
    echo "  make clean       - Clean up Docker resources"
    echo
    echo -e "${BLUE}Documentation:${NC}"
    echo "  CI_CD_DEPLOYMENT_GUIDE.md - Complete deployment guide"
    echo "  TESTING_VALIDATION_GUIDE.md - Testing procedures"
    echo
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "=========================================="
    echo "  MedCor Backend CI/CD Setup Script"
    echo "=========================================="
    echo -e "${NC}"
    
    check_root
    check_requirements
    setup_environment
    build_images
    test_docker_compose
    run_tests
    setup_dev_environment
    test_health_endpoints
    setup_aws_cli
    show_next_steps
}

# Handle script arguments
case "${1:-setup}" in
    "setup")
        main
        ;;
    "test")
        check_requirements
        run_tests
        ;;
    "build")
        check_requirements
        build_images
        ;;
    "dev")
        check_requirements
        setup_dev_environment
        ;;
    "health")
        test_health_endpoints
        ;;
    *)
        echo "Usage: $0 [setup|test|build|dev|health]"
        echo "  setup  - Complete setup (default)"
        echo "  test   - Run tests only"
        echo "  build  - Build images only"
        echo "  dev    - Setup development environment"
        echo "  health - Test health endpoints"
        exit 1
        ;;
esac