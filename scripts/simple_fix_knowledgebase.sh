#!/bin/bash
echo "🔧 Simple Fix for Knowledge Base API"
echo "===================================="

cd /var/www/html/medcor_backend2

# 1. Check available backups
echo "📦 Checking available backups..."
ls -la knowledgebase/views.py.backup.* 2>/dev/null || echo "No backups found"

# 2. Restore from the most recent backup
echo "🔄 Restoring from backup..."
LATEST_BACKUP=$(ls -t knowledgebase/views.py.backup.* 2>/dev/null | head -n 1)
if [ -n "$LATEST_BACKUP" ]; then
    cp "$LATEST_BACKUP" knowledgebase/views.py
    echo "✅ Restored from $LATEST_BACKUP"
else
    echo "❌ No backup found, will create a manual fix"
fi

# 3. Create a simple targeted fix using sed
echo "🔧 Applying targeted fix to by_hospital method..."

# First, let's see the current by_hospital method
echo "📋 Current by_hospital method:"
grep -A 20 "def by_hospital(self, request):" knowledgebase/views.py | head -n 25

# Create a simple fix by replacing the method with proper error handling
cat > /tmp/by_hospital_fix.py << 'EOF'
import re

# Read the current views.py
with open('knowledgebase/views.py', 'r') as f:
    content = f.read()

# Find the by_hospital method in Ai_IdentityViewSet and replace it
pattern = r'(@action\(detail=False, methods=\[\'get\'\]\)\s*def by_hospital\(self, request\):.*?)(?=\n    @action|\n    def|\nclass|\Z)'

replacement = '''@action(detail=False, methods=['get'])
    def by_hospital(self, request):
        """Get AI identities grouped by hospital"""
        try:
            queryset = self.get_queryset()
            
            # Group by hospital
            hospitals = {}
            for ai_identity in queryset:
                hospital_name = ai_identity.hospital.name
                if hospital_name not in hospitals:
                    hospitals[hospital_name] = {
                        'hospital_id': str(ai_identity.hospital.id),
                        'hospital_name': hospital_name,
                        'ai_identities': []
                    }
                
                serializer = Ai_IdentityListSerializer(ai_identity, context={'request': request})
                hospitals[hospital_name]['ai_identities'].append(serializer.data)
            
            return Response(list(hospitals.values()))
        except Exception as e:
            return Response({
                'error': f'An error occurred while fetching AI identities by hospital: {str(e)}'
            }, status=500)'''

# Apply the replacement
new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

# Write the fixed content
with open('knowledgebase/views.py', 'w') as f:
    f.write(new_content)

print('✅ Fixed by_hospital method')
EOF

# 4. Run the fix
echo "🔄 Applying the fix..."
python3 /tmp/by_hospital_fix.py

# 5. Verify the fix
echo "📋 Verifying the fix..."
grep -A 25 "def by_hospital(self, request):" knowledgebase/views.py | head -n 30

# 6. Test Django configuration
echo "🧪 Testing Django configuration..."
source venv/bin/activate
python3 manage.py check --deploy

if [ $? -eq 0 ]; then
    echo "✅ Django configuration check passed"
    
    # 7. Restart gunicorn
    echo "🔄 Restarting gunicorn..."
    sudo systemctl restart gunicorn
    sleep 5
    
    # 8. Check status
    echo "📊 Checking gunicorn status..."
    sudo systemctl status gunicorn --no-pager
    
    # 9. Test the API endpoint
    echo "🧪 Testing the API endpoint..."
    curl -I "http://localhost:8000/api/knowledgebase/ai-identities/by_hospital/" || echo "❌ Local test failed"
    
    # 10. Test with actual data
    echo "🧪 Testing with actual API call..."
    curl -H "Accept: application/json" "http://localhost:8000/api/knowledgebase/ai-identities/by_hospital/" || echo "❌ API test failed"
    
else
    echo "❌ Django configuration check failed"
    echo "📋 Showing syntax errors:"
    python3 manage.py check --deploy 2>&1 | head -n 20
fi

# 11. Show recent logs
echo "📋 Recent gunicorn logs:"
sudo journalctl -u gunicorn --no-pager -n 10

echo "🎉 Simple fix completed!"