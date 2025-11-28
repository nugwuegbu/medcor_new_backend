#!/bin/bash
echo "🚀 Deploying Doctors and Patients Fix to AWS Server"
echo "=================================================="

# 1. Copy the fixed views_simple.py to the server
echo "📦 Copying fixed views_simple.py to server..."
scp core/views_simple.py root@51.16.221.91:/var/www/html/medcor_backend2/core/views_simple.py

# 2. Copy the fixed script to the server
echo "📦 Copying fixed script to server..."
scp scripts/fix_doctors_patients_endpoints_fixed.sh root@51.16.221.91:/tmp/

# 3. Run the fix script on the server
echo "🔧 Running fix script on server..."
ssh root@51.16.221.91 "cd /var/www/html/medcor_backend2 && chmod +x /tmp/fix_doctors_patients_endpoints_fixed.sh && /tmp/fix_doctors_patients_endpoints_fixed.sh"

echo "🎉 Deployment completed!"
echo ""
echo "📋 What was deployed:"
echo "1. ✅ Fixed views_simple.py with correct role case sensitivity"
echo "2. ✅ Added hospital context filtering"
echo "3. ✅ Created sample data for testing"
echo "4. ✅ Restarted gunicorn service"
echo ""
echo "🔗 Test the endpoints:"
echo "- https://api.medcor.ai/api/ai/query/doctors/"
echo "- https://api.medcor.ai/api/ai/query/patients/"