#!/bin/bash
echo "🔧 Fixing Response Naming Conflict in Knowledge Base Views"
echo "========================================================="

cd /var/www/html/medcor_backend2

# 1. Backup current views
echo "📦 Creating backup of knowledgebase views..."
cp knowledgebase/views.py knowledgebase/views.py.backup.naming_fix.$(date +%Y%m%d_%H%M%S)

# 2. Show the current import section
echo "📋 Current imports:"
head -n 20 knowledgebase/views.py | grep -E "from.*Response|import.*Response"

# 3. Fix the naming conflict
echo "🔧 Fixing Response naming conflict..."
# Change the model import to use alias
sed -i 's/from \.models import Ai_Identity, Behavior, Response, Source/from .models import Ai_Identity, Behavior, Response as ResponseModel, Source/' knowledgebase/views.py

# Replace all Response. with ResponseModel.
sed -i 's/Response\./ResponseModel\./g' knowledgebase/views.py

# 4. Verify the changes
echo "📋 Updated imports:"
head -n 20 knowledgebase/views.py | grep -E "from.*Response|import.*Response"

echo "📋 Sample ResponseModel usage:"
grep -n "ResponseModel\." knowledgebase/views.py | head -n 5

# 5. Test Python syntax
echo "🧪 Testing Python syntax..."
python3 -c "
import ast
try:
    with open('knowledgebase/views.py', 'r') as f:
        content = f.read()
    ast.parse(content)
    print('✅ Python syntax is correct')
except SyntaxError as e:
    print(f'❌ Syntax error: {e}')
    print(f'Line {e.lineno}: {e.text}')
"

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

echo "🎉 Response naming conflict fix completed!"
echo "📝 The API should now return proper HTTP responses instead of model instances"