#!/bin/bash

# Test AWS RDS Connection
# Quick script to test connectivity to AWS RDS

echo "🧪 Testing AWS RDS Connection"
echo "============================="

# AWS RDS Configuration
RDS_HOST="medcore.czouassyu7f2.il-central-1.rds.amazonaws.com"
RDS_PORT="5432"
RDS_DB="medcor_db2"
RDS_USER="postgres"
RDS_PASS="3765R7vmFQwF6ddlNyWa"

echo "🌐 RDS Configuration:"
echo "   Host: $RDS_HOST"
echo "   Port: $RDS_PORT"
echo "   Database: $RDS_DB"
echo "   User: $RDS_USER"
echo

# Test 1: Basic connectivity
echo "1️⃣ Testing Basic Connectivity:"
echo "-------------------------------"
if ping -c 3 "$RDS_HOST" &>/dev/null; then
    echo "✅ Host is reachable"
else
    echo "❌ Host is not reachable"
    echo "   This might indicate network issues or security group restrictions"
fi
echo

# Test 2: Port connectivity
echo "2️⃣ Testing Port Connectivity:"
echo "-----------------------------"
if timeout 10 bash -c "</dev/tcp/$RDS_HOST/$RDS_PORT" 2>/dev/null; then
    echo "✅ Port $RDS_PORT is open"
else
    echo "❌ Port $RDS_PORT is not accessible"
    echo "   Check AWS RDS security groups"
fi
echo

# Test 3: PostgreSQL connection
echo "3️⃣ Testing PostgreSQL Connection:"
echo "---------------------------------"
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL client available"
    
    if PGPASSWORD="$RDS_PASS" psql -h "$RDS_HOST" -p "$RDS_PORT" -U "$RDS_USER" -d "$RDS_DB" -c "SELECT version();" 2>/dev/null; then
        echo "✅ PostgreSQL connection successful"
        echo "   Database version:"
        PGPASSWORD="$RDS_PASS" psql -h "$RDS_HOST" -p "$RDS_PORT" -U "$RDS_USER" -d "$RDS_DB" -c "SELECT version();" 2>/dev/null | head -3
    else
        echo "❌ PostgreSQL connection failed"
        echo "   Error details:"
        PGPASSWORD="$RDS_PASS" psql -h "$RDS_HOST" -p "$RDS_PORT" -U "$RDS_USER" -d "$RDS_DB" -c "SELECT 1;" 2>&1 | head -5
    fi
else
    echo "⚠️  PostgreSQL client not available"
    echo "   Installing postgresql-client..."
    sudo apt update
    sudo apt install -y postgresql-client
fi
echo

# Test 4: Django connection
echo "4️⃣ Testing Django Connection:"
echo "-----------------------------"
if [ -f "manage.py" ]; then
    source venv/bin/activate
    python manage.py check --database default 2>&1 | head -10
else
    echo "❌ Django project not found"
fi
echo

# Test 5: Server IP check
echo "5️⃣ Server Information:"
echo "----------------------"
echo "   Server Public IP: $(curl -s ifconfig.me 2>/dev/null || echo 'Unable to determine')"
echo "   Server Private IP: $(hostname -I | awk '{print $1}')"
echo "   Current User: $(whoami)"
echo "   Current Directory: $(pwd)"
echo

echo "🎯 RDS Connection Test Complete!"
echo "==============================="
echo "If connection fails, check:"
echo "1. AWS RDS security groups allow this server's IP"
echo "2. RDS instance is running and accessible"
echo "3. Database credentials are correct"
echo "4. Network connectivity between server and RDS"