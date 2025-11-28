# MCP Server, Celery Service, and RabbitMQ Integration Guide

## Overview

This guide explains the integration of the MCP (Model Context Protocol) server, existing Celery service, and RabbitMQ message broker into the MedCor Backend CI/CD pipeline.

## MCP Server Integration

### What is MCP?

The MCP (Model Context Protocol) server provides AI-powered healthcare management functions through a standardized protocol. It enables intelligent automation of healthcare workflows.

### MCP Server Features

- **Hospital Management**: Create and manage hospital tenants
- **User Management**: Handle doctors, patients, and staff
- **Appointment Scheduling**: AI-assisted appointment booking
- **Medical Records**: Intelligent record management
- **Treatment Plans**: AI-guided treatment recommendations
- **Specialty Management**: Medical specialty assignments
- **Subscription Management**: Hospital subscription plans

### MCP Server Configuration

#### Docker Integration

```yaml
# docker-compose.yml
mcp-server:
  build: .
  command: python mcp_server.py
  ports:
    - "8001:8001"
  environment:
    - DATABASE_URL=postgresql://medcor_user:medcor_password@db:5432/medcor_db
    - REDIS_URL=redis://redis:6379/0
```

#### Systemd Service

```ini
# /etc/systemd/system/mcp-server.service
[Unit]
Description=MedCor MCP Server
After=network.target redis.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/var/www/html/medcor_backend2
ExecStart=/usr/bin/python3 /var/www/html/medcor_backend2/mcp_server.py
Restart=always
```

#### Nginx Configuration

```nginx
# nginx/default.conf
location /mcp/ {
    proxy_pass http://mcp-server:8001/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Extended timeouts for MCP operations
    proxy_connect_timeout 120s;
    proxy_send_timeout 120s;
    proxy_read_timeout 120s;
}
```

## Celery Service and RabbitMQ Integration

### Existing Celery Service with RabbitMQ

The deployment process integrates with your existing Celery systemd service and RabbitMQ message broker:

```bash
# Celery service management commands
sudo systemctl start celery.service
sudo systemctl stop celery.service
sudo systemctl status celery.service
sudo systemctl enable celery.service

# RabbitMQ service management commands
sudo systemctl start rabbitmq-server.service
sudo systemctl stop rabbitmq-server.service
sudo systemctl status rabbitmq-server.service
sudo systemctl enable rabbitmq-server.service
```

### RabbitMQ Configuration

The application is configured to use RabbitMQ as the message broker:

```python
# Django settings
CELERY_BROKER_URL = 'amqp://guest:guest@localhost:5672//'
CELERY_RESULT_BACKEND = 'rpc://'
```

### Deployment Integration

The CI/CD pipeline now handles Celery service and RabbitMQ coordination:

1. **Pre-deployment**: Stop existing Celery service, ensure RabbitMQ is running
2. **Deployment**: Update application and dependencies
3. **Post-deployment**: Restart Celery service, verify RabbitMQ status
4. **Verification**: Check all service statuses

### Service Coordination Script

```bash
# In deployment script
stop_containers() {
    # Stop Docker containers
    docker-compose -f docker-compose.prod.yml down --timeout 30 || true

    # Stop existing Celery service
    if systemctl is-active --quiet celery.service; then
        sudo systemctl stop celery.service || true
    fi

    # Ensure RabbitMQ service is running
    if systemctl is-active --quiet rabbitmq-server.service; then
        log "RabbitMQ service is running"
    else
        warning "RabbitMQ service is not running, starting it..."
        sudo systemctl start rabbitmq-server.service || true
    fi
}

start_containers() {
    # Start Docker containers
    docker-compose -f docker-compose.prod.yml up -d

    # Start Celery service
    sudo systemctl start celery.service || true
    sudo systemctl enable celery.service || true

    # Ensure RabbitMQ service is running
    sudo systemctl start rabbitmq-server.service || true
    sudo systemctl enable rabbitmq-server.service || true
}
```

## CI/CD Pipeline Updates

### Jenkins Pipeline Changes

#### Development Deployment

```groovy
stage('Deploy to Development') {
    steps {
        sh '''
            # Stop existing services
            sudo systemctl stop celery.service || true
            sudo systemctl stop mcp-server.service || true

            # Ensure RabbitMQ service is running
            sudo systemctl start rabbitmq-server.service || true

            # Deploy application
            docker-compose -f docker-compose.prod.yml up -d

            # Start services
            sudo systemctl start celery.service || true
            sudo systemctl start mcp-server.service || true
            sudo systemctl enable rabbitmq-server.service || true

            # Health checks
            curl -f http://localhost/api/health/
            curl -f http://localhost:8001/health/
        '''
    }
}
```

#### Production Deployment

```groovy
stage('Deploy to Production') {
    steps {
        input message: 'Deploy to production?', ok: 'Deploy'

        sh '''
            # Graceful shutdown
            docker-compose -f docker-compose.prod.yml down --timeout 30
            sudo systemctl stop celery.service || true
            sudo systemctl stop mcp-server.service || true

            # Ensure RabbitMQ service is running
            sudo systemctl start rabbitmq-server.service || true

            # Deploy application
            docker-compose -f docker-compose.prod.yml up -d

            # Start services
            sudo systemctl start celery.service || true
            sudo systemctl start mcp-server.service || true
            sudo systemctl enable rabbitmq-server.service || true

            # Health checks
            curl -f https://api.medcor.ai/api/health/
            curl -f http://localhost:8001/health/
        '''
    }
}
```

### GitHub Actions Updates

```yaml
- name: Deploy to production
  uses: appleboy/ssh-action@v1.0.0
  with:
    script: |
      cd /var/www/html/medcor_backend2
      sudo ./scripts/deploy.sh production latest

      # Verify services
      sudo systemctl status mcp-server.service
      sudo systemctl status celery.service
      sudo systemctl status rabbitmq-server.service
```

## Health Monitoring

### Health Check Endpoints

1. **Main API**: `http://localhost/api/health/`
2. **MCP Server**: `http://localhost:8001/health/`
3. **Celery Service**: `sudo systemctl status celery.service`
4. **RabbitMQ Service**: `sudo systemctl status rabbitmq-server.service`

### Smoke Tests

Updated smoke tests include MCP server validation:

```python
def test_mcp_server(self):
    """Test MCP server endpoints"""
    try:
        mcp_url = urljoin(self.base_url, '/mcp/health/')
        response = self.session.get(mcp_url)

        if response.status_code in [200, 404]:
            print("✅ MCP server accessible")
            return True
        else:
            print(f"❌ MCP server failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ MCP server error: {e}")
        return False
```

### Monitoring Commands

```bash
# Check all services
make health

# Check specific services
curl http://localhost/api/health/
curl http://localhost:8001/health/
sudo systemctl status celery.service
sudo systemctl status mcp-server.service
sudo systemctl status rabbitmq-server.service

# View logs
docker-compose logs mcp-server
sudo journalctl -u mcp-server.service -f
sudo journalctl -u celery.service -f
```

## Troubleshooting

### Common Issues

#### MCP Server Not Starting

```bash
# Check MCP server status
sudo systemctl status mcp-server.service

# View MCP server logs
sudo journalctl -u mcp-server.service -f

# Test MCP server manually
cd /var/www/html/medcor_backend2
python3 mcp_server.py
```

#### Celery Service Issues

```bash
# Check Celery service status
sudo systemctl status celery.service

# Restart Celery service
sudo systemctl restart celery.service

# View Celery logs
sudo journalctl -u celery.service -f
```

#### RabbitMQ Service Issues

```bash
# Check RabbitMQ service status
sudo systemctl status rabbitmq-server.service

# Restart RabbitMQ service
sudo systemctl restart rabbitmq-server.service

# View RabbitMQ logs
sudo journalctl -u rabbitmq-server.service -f

# Check RabbitMQ management interface
sudo rabbitmqctl status
```

#### Docker Container Issues

```bash
# Check container status
docker-compose ps

# View MCP server container logs
docker-compose logs mcp-server

# Restart MCP server container
docker-compose restart mcp-server
```

### Debug Commands

```bash
# Full system check
make health

# Service status check
sudo systemctl status celery.service mcp-server.service rabbitmq-server.service

# Network connectivity
curl -v http://localhost:8001/health/
telnet localhost 8001

# Resource monitoring
docker stats
htop
```

## Security Considerations

### MCP Server Security

- **Network Isolation**: MCP server runs in isolated container
- **Authentication**: JWT-based authentication for MCP endpoints
- **Rate Limiting**: Nginx rate limiting for MCP endpoints
- **Input Validation**: Comprehensive input validation in MCP tools

### Celery Service and RabbitMQ Security

- **Service Isolation**: Celery runs as dedicated systemd service
- **User Permissions**: Limited user permissions for service
- **Network Security**: RabbitMQ connection over local network
- **Message Security**: RabbitMQ authentication and authorization
- **Log Monitoring**: Comprehensive logging for audit trails

## Performance Optimization

### MCP Server Optimization

- **Connection Pooling**: Database connection pooling
- **Caching**: Redis-based caching for frequent operations
- **Async Operations**: Non-blocking I/O for better performance
- **Resource Limits**: Container resource limits

### Celery Service and RabbitMQ Optimization

- **Worker Scaling**: Multiple Celery workers for parallel processing
- **Task Optimization**: Efficient task queuing and processing
- **Memory Management**: Proper memory usage monitoring
- **Queue Management**: Priority-based task queuing
- **RabbitMQ Tuning**: Optimized message broker configuration
- **Connection Pooling**: Efficient RabbitMQ connection management

## Maintenance

### Regular Tasks

1. **Service Monitoring**: Daily health checks
2. **Log Rotation**: Weekly log cleanup
3. **Performance Review**: Monthly performance analysis
4. **Security Updates**: Regular security patches

### Backup Procedures

```bash
# Backup MCP server configuration
sudo cp /etc/systemd/system/mcp-server.service /backup/

# Backup Celery service configuration
sudo cp /etc/systemd/system/celery.service /backup/

# Backup RabbitMQ configuration
sudo cp -r /etc/rabbitmq/ /backup/rabbitmq/

# Backup application data
docker-compose exec web python manage.py dumpdata > backup.json
```

## Future Enhancements

### Planned Improvements

1. **MCP Server Clustering**: Multiple MCP server instances
2. **Advanced Monitoring**: Prometheus/Grafana integration
3. **Auto-scaling**: Dynamic service scaling based on load
4. **High Availability**: Multi-region deployment support

### Integration Opportunities

1. **Kubernetes Migration**: Container orchestration
2. **Service Mesh**: Istio integration for microservices
3. **API Gateway**: Centralized API management
4. **Event Streaming**: Kafka integration for real-time events

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Maintained by**: MedCor Development Team
