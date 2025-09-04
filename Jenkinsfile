pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'your-docker-registry.com'
        IMAGE_NAME = 'medcor-backend'
        AWS_REGION = 'us-east-1'
        ECR_REPOSITORY = 'medcor-backend'
        ECR_REGISTRY = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        DEPLOYMENT_SERVER = 'api.medcor.ai'
        DEPLOYMENT_PATH = '/var/www/html/medcor_backend2'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: 'git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()
                    env.BUILD_TAG = "${env.BUILD_NUMBER}-${env.GIT_COMMIT_SHORT}"
                }
            }
        }
        
        stage('Environment Setup') {
            steps {
                script {
                    if (env.BRANCH_NAME == 'dev') {
                        env.ENVIRONMENT = 'development'
                        env.IMAGE_TAG = "dev-${env.BUILD_TAG}"
                    } else if (env.BRANCH_NAME == 'main') {
                        env.ENVIRONMENT = 'production'
                        env.IMAGE_TAG = "prod-${env.BUILD_TAG}"
                    } else {
                        env.ENVIRONMENT = 'feature'
                        env.IMAGE_TAG = "feature-${env.BUILD_TAG}"
                    }
                }
            }
        }
        
        stage('Code Quality & Security') {
            parallel {
                stage('Lint & Format Check') {
                    steps {
                        sh '''
                            # Install Python dependencies for linting
                            python3 -m venv venv
                            source venv/bin/activate
                            pip install flake8 black isort
                            
                            # Run linting
                            flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
                            flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics
                            
                            # Check code formatting
                            black --check .
                            isort --check-only .
                        '''
                    }
                }
                
                stage('Security Scan') {
                    steps {
                        sh '''
                            # Install security scanning tools
                            source venv/bin/activate
                            pip install bandit safety
                            
                            # Run security scans
                            bandit -r . -f json -o bandit-report.json || true
                            safety check --json --output safety-report.json || true
                        '''
                    }
                    post {
                        always {
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: '.',
                                reportFiles: 'bandit-report.json,safety-report.json',
                                reportName: 'Security Scan Report'
                            ])
                        }
                    }
                }
            }
        }
        
        stage('Unit Tests') {
            steps {
                sh '''
                    source venv/bin/activate
                    pip install -r requirements.txt
                    
                    # Run Django tests
                    python manage.py test --verbosity=2 --parallel
                    
                    # Generate coverage report
                    pip install coverage
                    coverage run --source='.' manage.py test
                    coverage report
                    coverage html
                '''
            }
            post {
                always {
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'htmlcov',
                        reportFiles: 'index.html',
                        reportName: 'Coverage Report'
                    ])
                    junit 'test-results.xml'
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    // Build Docker image
                    def image = docker.build("${IMAGE_NAME}:${env.IMAGE_TAG}")
                    
                    // Tag for different environments
                    if (env.BRANCH_NAME == 'dev') {
                        image.tag("${IMAGE_NAME}:dev-latest")
                    } else if (env.BRANCH_NAME == 'main') {
                        image.tag("${IMAGE_NAME}:latest")
                        image.tag("${IMAGE_NAME}:prod-latest")
                    }
                }
            }
        }
        
        stage('Push to Registry') {
            when {
                anyOf {
                    branch 'dev'
                    branch 'main'
                }
            }
            steps {
                script {
                    // Login to AWS ECR
                    sh '''
                        aws ecr get-login-password --region ${AWS_REGION} | \
                        docker login --username AWS --password-stdin ${ECR_REGISTRY}
                    '''
                    
                    // Tag and push images
                    sh '''
                        docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}
                        docker push ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}
                        
                        if [ "${BRANCH_NAME}" = "dev" ]; then
                            docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${ECR_REGISTRY}/${ECR_REPOSITORY}:dev-latest
                            docker push ${ECR_REGISTRY}/${ECR_REPOSITORY}:dev-latest
                        elif [ "${BRANCH_NAME}" = "main" ]; then
                            docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest
                            docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${ECR_REGISTRY}/${ECR_REPOSITORY}:prod-latest
                            docker push ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest
                            docker push ${ECR_REGISTRY}/${ECR_REPOSITORY}:prod-latest
                        fi
                    '''
                }
            }
        }
        
        stage('Integration Tests') {
            when {
                anyOf {
                    branch 'dev'
                    branch 'main'
                }
            }
            steps {
                sh '''
                    # Start services for integration testing
                    docker-compose -f docker-compose.test.yml up -d
                    
                    # Wait for services to be ready
                    sleep 30
                    
                    # Run integration tests
                    docker-compose -f docker-compose.test.yml exec -T web python manage.py test --settings=medcor_backend2.test_settings
                    
                    # Cleanup
                    docker-compose -f docker-compose.test.yml down
                '''
            }
        }
        
        stage('Deploy to Development') {
            when {
                branch 'dev'
            }
            steps {
                script {
                    // Deploy to development server
                    sh '''
                        # Create deployment script
                        cat > deploy-dev.sh << 'EOF'
                        #!/bin/bash
                        set -e
                        
                        # Pull latest image
                        aws ecr get-login-password --region ${AWS_REGION} | \
                        docker login --username AWS --password-stdin ${ECR_REGISTRY}
                        
                        docker pull ${ECR_REGISTRY}/${ECR_REPOSITORY}:dev-latest
                        
                        # Stop existing containers and services
                        docker-compose -f ${DEPLOYMENT_PATH}/docker-compose.prod.yml down || true
                        sudo systemctl stop celery.service || true
                        sudo systemctl stop mcp-server.service || true
                        
                        # Ensure RabbitMQ service is running
                        sudo systemctl start rabbitmq-server.service || true
                        
                        # Update environment file
                        cp ${DEPLOYMENT_PATH}/.env.dev ${DEPLOYMENT_PATH}/.env
                        
                        # Install MCP server service
                        sudo cp ${DEPLOYMENT_PATH}/scripts/mcp-server.service /etc/systemd/system/
                        sudo systemctl daemon-reload
                        
                        # Start new containers
                        cd ${DEPLOYMENT_PATH}
                        docker-compose -f docker-compose.prod.yml up -d
                        
                        # Run migrations
                        docker-compose -f docker-compose.prod.yml exec -T web python manage.py migrate
                        
                        # Collect static files
                        docker-compose -f docker-compose.prod.yml exec -T web python manage.py collectstatic --noinput
                        
                        # Start services
                        sudo systemctl start celery.service || true
                        sudo systemctl start mcp-server.service || true
                        sudo systemctl enable celery.service || true
                        sudo systemctl enable mcp-server.service || true
                        sudo systemctl enable rabbitmq-server.service || true
                        
                        # Health check
                        sleep 15
                        curl -f http://localhost/api/health/ || exit 1
                        curl -f http://localhost:8001/health/ || echo "MCP server health check failed"
                        
                        echo "Development deployment completed successfully"
                        EOF
                        
                        chmod +x deploy-dev.sh
                        
                        # Execute deployment
                        ssh -o StrictHostKeyChecking=no ubuntu@${DEPLOYMENT_SERVER} 'bash -s' < deploy-dev.sh
                    '''
                }
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                script {
                    // Manual approval for production deployment
                    input message: 'Deploy to production?', ok: 'Deploy'
                    
                    // Deploy to production server
                    sh '''
                        # Create deployment script
                        cat > deploy-prod.sh << 'EOF'
                        #!/bin/bash
                        set -e
                        
                        # Create backup
                        BACKUP_DIR="/var/backups/medcor-$(date +%Y%m%d-%H%M%S)"
                        mkdir -p $BACKUP_DIR
                        
                        if [ -d "${DEPLOYMENT_PATH}" ]; then
                            cp -r ${DEPLOYMENT_PATH} $BACKUP_DIR/
                            echo "Backup created at $BACKUP_DIR"
                        fi
                        
                        # Pull latest image
                        aws ecr get-login-password --region ${AWS_REGION} | \
                        docker login --username AWS --password-stdin ${ECR_REGISTRY}
                        
                        docker pull ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest
                        
                        # Graceful shutdown
                        docker-compose -f ${DEPLOYMENT_PATH}/docker-compose.prod.yml down --timeout 30 || true
                        sudo systemctl stop celery.service || true
                        sudo systemctl stop mcp-server.service || true
                        
                        # Ensure RabbitMQ service is running
                        sudo systemctl start rabbitmq-server.service || true
                        
                        # Update environment file
                        cp ${DEPLOYMENT_PATH}/.env.prod ${DEPLOYMENT_PATH}/.env
                        
                        # Install MCP server service
                        sudo cp ${DEPLOYMENT_PATH}/scripts/mcp-server.service /etc/systemd/system/
                        sudo systemctl daemon-reload
                        
                        # Start new containers
                        cd ${DEPLOYMENT_PATH}
                        docker-compose -f docker-compose.prod.yml up -d
                        
                        # Run migrations
                        docker-compose -f docker-compose.prod.yml exec -T web python manage.py migrate
                        
                        # Collect static files
                        docker-compose -f docker-compose.prod.yml exec -T web python manage.py collectstatic --noinput
                        
                        # Start services
                        sudo systemctl start celery.service || true
                        sudo systemctl start mcp-server.service || true
                        sudo systemctl enable celery.service || true
                        sudo systemctl enable mcp-server.service || true
                        sudo systemctl enable rabbitmq-server.service || true
                        
                        # Health check
                        sleep 15
                        curl -f https://${DEPLOYMENT_SERVER}/api/health/ || exit 1
                        curl -f http://localhost:8001/health/ || echo "MCP server health check failed"
                        
                        # Cleanup old images
                        docker image prune -f
                        
                        echo "Production deployment completed successfully"
                        EOF
                        
                        chmod +x deploy-prod.sh
                        
                        # Execute deployment
                        ssh -o StrictHostKeyChecking=no ubuntu@${DEPLOYMENT_SERVER} 'bash -s' < deploy-prod.sh
                    '''
                }
            }
        }
        
        stage('Post-Deployment Tests') {
            when {
                anyOf {
                    branch 'dev'
                    branch 'main'
                }
            }
            steps {
                sh '''
                    # Wait for deployment to stabilize
                    sleep 30
                    
                    # Run health checks
                    if [ "${BRANCH_NAME}" = "dev" ]; then
                        curl -f http://${DEPLOYMENT_SERVER}/api/health/
                    else
                        curl -f https://${DEPLOYMENT_SERVER}/api/health/
                    fi
                    
                    # Run smoke tests
                    python scripts/smoke_tests.py --environment=${ENVIRONMENT}
                '''
            }
        }
    }
    
    post {
        always {
            // Cleanup workspace
            cleanWs()
        }
        
        success {
            script {
                if (env.BRANCH_NAME == 'main') {
                    // Send success notification
                    sh '''
                        curl -X POST -H 'Content-type: application/json' \
                        --data '{"text":"✅ Production deployment successful for MedCor Backend"}' \
                        ${SLACK_WEBHOOK_URL}
                    '''
                }
            }
        }
        
        failure {
            script {
                // Send failure notification
                sh '''
                    curl -X POST -H 'Content-type: application/json' \
                    --data '{"text":"❌ Deployment failed for MedCor Backend on branch ${BRANCH_NAME}"}' \
                    ${SLACK_WEBHOOK_URL}
                '''
            }
        }
        
        unstable {
            script {
                // Send unstable notification
                sh '''
                    curl -X POST -H 'Content-type: application/json' \
                    --data '{"text":"⚠️ Deployment unstable for MedCor Backend on branch ${BRANCH_NAME}"}' \
                    ${SLACK_WEBHOOK_URL}
                '''
            }
        }
    }
}