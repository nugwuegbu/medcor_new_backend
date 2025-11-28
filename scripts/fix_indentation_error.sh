#!/bin/bash
echo "🔧 Fixing Indentation Error in Knowledge Base Views"
echo "=================================================="

cd /var/www/html/medcor_backend2

# 1. Restore from backup
echo "📦 Restoring from backup..."
if [ -f "knowledgebase/views.py.backup.api_fix.$(date +%Y%m%d)*" ]; then
    LATEST_BACKUP=$(ls -t knowledgebase/views.py.backup.api_fix.* | head -n 1)
    cp "$LATEST_BACKUP" knowledgebase/views.py
    echo "✅ Restored from backup: $LATEST_BACKUP"
else
    echo "❌ No backup found, will create a new fix"
fi

# 2. Show the current indentation issue
echo "📋 Checking current indentation around line 97:"
sed -n '90,105p' knowledgebase/views.py

# 3. Fix the indentation issue using sed
echo "🔧 Fixing indentation..."
sed -i '97s/^    def by_hospital/    @action(detail=False, methods=['\''get'\''])\n    def by_hospital/' knowledgebase/views.py

# 4. Add proper error handling to the by_hospital method
echo "🔄 Adding error handling to by_hospital method..."
python3 -c "
import re

# Read the current views.py
with open('knowledgebase/views.py', 'r') as f:
    content = f.read()

# Find the by_hospital method in Ai_IdentityViewSet and add try-catch
pattern = r'(@action\(detail=False, methods=\[.*?\]\)\s*def by_hospital\(self, request\):.*?)(return Response\(list\(hospitals\.values\(\)\)\))'

def replace_method(match):
    decorator_and_def = match.group(1)
    return_statement = match.group(2)
    
    # Add try-catch around the method body
    new_method = decorator_and_def + '''
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
    
    return new_method

# Apply the replacement
new_content = re.sub(pattern, replace_method, content, flags=re.DOTALL)

# Write the updated content
with open('knowledgebase/views.py', 'w') as f:
    f.write(new_content)

print('✅ by_hospital method fixed with proper error handling')
"

# 5. Check syntax
echo "🧪 Checking Python syntax..."
python3 -m py_compile knowledgebase/views.py && echo "✅ Syntax is correct" || echo "❌ Syntax error found"

# 6. Test Django configuration
echo "🧪 Testing Django configuration..."
source venv/bin/activate
python3 manage.py check --deploy

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

# 10. Show recent logs
echo "📋 Recent gunicorn logs:"
sudo journalctl -u gunicorn --no-pager -n 10

echo "🎉 Indentation error fix completed!"