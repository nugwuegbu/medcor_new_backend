#!/bin/bash

# Multi-Tenant API Request Examples for MedCor Healthcare Platform
# This script demonstrates how to make API requests to different tenants

BASE_URL="https://14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000"

echo "🏥 MedCor Multi-Tenant API Examples"
echo "═══════════════════════════════════════════════════════════════"
echo

# Function to make login request and extract token
login_to_tenant() {
    local tenant_host=$1
    local email=$2
    local password=$3
    local tenant_name=$4
    
    echo "🔐 Logging into $tenant_name..."
    
    local response=$(curl -s -X POST "$BASE_URL/api/auth/login/" \
        -H "Host: $tenant_host" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}")
    
    local token=$(echo $response | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    
    if [ ! -z "$token" ]; then
        echo "   ✅ Login successful!"
        echo "   🎫 Token: ${token:0:30}..."
        echo "$token"
    else
        echo "   ❌ Login failed!"
        echo "   📄 Response: $response"
        echo ""
    fi
}

# Function to make authenticated API request
make_api_request() {
    local tenant_host=$1
    local token=$2
    local endpoint=$3
    local tenant_name=$4
    
    echo "📊 $tenant_name - GET $endpoint"
    
    local response=$(curl -s -X GET "$BASE_URL$endpoint" \
        -H "Host: $tenant_host" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json")
    
    local status=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL$endpoint" \
        -H "Host: $tenant_host" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json")
    
    if [ "$status" = "200" ]; then
        echo "   ✅ Status: $status OK"
        echo "   📄 Response: ${response:0:100}..."
    else
        echo "   ❌ Status: $status"
        echo "   📄 Response: $response"
    fi
    echo
}

# Tenant configurations
PUBLIC_HOST="14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev"
HOSPITAL_HOST="medcorhospital.14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev"
CLINIC_HOST="medcorclinic.14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev"

echo "🔑 Authentication Phase"
echo "─────────────────────────────────────────────────────────────"

# Login to each tenant
PUBLIC_TOKEN=$(login_to_tenant "$PUBLIC_HOST" "admin@localhost" "admin123" "Public Tenant")
echo

HOSPITAL_TOKEN=$(login_to_tenant "$HOSPITAL_HOST" "hospital@localhost" "hospital123" "Hospital Tenant")
echo

CLINIC_TOKEN=$(login_to_tenant "$CLINIC_HOST" "clinic@localhost" "clinic123" "Clinic Tenant")
echo

echo "📊 Multi-Tenant API Requests"
echo "─────────────────────────────────────────────────────────────"

# Test API endpoints for each tenant
if [ ! -z "$PUBLIC_TOKEN" ]; then
    echo "🏢 Public Tenant API Requests:"
    make_api_request "$PUBLIC_HOST" "$PUBLIC_TOKEN" "/api/" "Public"
    make_api_request "$PUBLIC_HOST" "$PUBLIC_TOKEN" "/api/tenants/" "Public"
    make_api_request "$PUBLIC_HOST" "$PUBLIC_TOKEN" "/api/appointments/" "Public"
fi

if [ ! -z "$HOSPITAL_TOKEN" ]; then
    echo "🏥 Hospital Tenant API Requests:"
    make_api_request "$HOSPITAL_HOST" "$HOSPITAL_TOKEN" "/api/" "Hospital"
    make_api_request "$HOSPITAL_HOST" "$HOSPITAL_TOKEN" "/api/tenants/" "Hospital"
    make_api_request "$HOSPITAL_HOST" "$HOSPITAL_TOKEN" "/api/appointments/" "Hospital"
fi

if [ ! -z "$CLINIC_TOKEN" ]; then
    echo "🏥 Clinic Tenant API Requests:"
    make_api_request "$CLINIC_HOST" "$CLINIC_TOKEN" "/api/" "Clinic"
    make_api_request "$CLINIC_HOST" "$CLINIC_TOKEN" "/api/tenants/" "Clinic"
    make_api_request "$CLINIC_HOST" "$CLINIC_TOKEN" "/api/appointments/" "Clinic"
fi

echo "💡 Manual cURL Examples:"
echo "─────────────────────────────────────────────────────────────"
echo

if [ ! -z "$PUBLIC_TOKEN" ]; then
    echo "# Public Tenant Request:"
    echo "curl -H \"Host: $PUBLIC_HOST\" \\"
    echo "     -H \"Authorization: Bearer $PUBLIC_TOKEN\" \\"
    echo "     -H \"Content-Type: application/json\" \\"
    echo "     \"$BASE_URL/api/tenants/\""
    echo
fi

if [ ! -z "$HOSPITAL_TOKEN" ]; then
    echo "# Hospital Tenant Request:"
    echo "curl -H \"Host: $HOSPITAL_HOST\" \\"
    echo "     -H \"Authorization: Bearer $HOSPITAL_TOKEN\" \\"
    echo "     -H \"Content-Type: application/json\" \\"
    echo "     \"$BASE_URL/api/appointments/\""
    echo
fi

if [ ! -z "$CLINIC_TOKEN" ]; then
    echo "# Clinic Tenant Request:"
    echo "curl -H \"Host: $CLINIC_HOST\" \\"
    echo "     -H \"Authorization: Bearer $CLINIC_TOKEN\" \\"
    echo "     -H \"Content-Type: application/json\" \\"
    echo "     \"$BASE_URL/api/appointments/\""
    echo
fi

echo "✅ Multi-Tenant API Examples Complete!"
echo
echo "🎯 Key Points:"
echo "• Use Host header to specify tenant domain"
echo "• Each tenant has isolated authentication and data"
echo "• JWT tokens are tenant-specific"
echo "• Same API endpoints work across all tenants"
echo "• Data is completely isolated between tenants"