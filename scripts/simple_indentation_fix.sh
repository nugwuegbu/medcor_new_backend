#!/bin/bash
echo "🔧 Simple Indentation Fix for Knowledge Base Views"
echo "================================================="

cd /var/www/html/medcor_backend2

# 1. Restore from backup first
echo "📦 Restoring from backup..."
LATEST_BACKUP=$(ls -t knowledgebase/views.py.backup.* 2>/dev/null | head -n 1)
if [ -n "$LATEST_BACKUP" ]; then
    cp "$LATEST_BACKUP" knowledgebase/views.py
    echo "✅ Restored from backup: $LATEST_BACKUP"
else
    echo "⚠️ No backup found, proceeding with current file"
fi

# 2. Show the problematic area
echo "📋 Current content around line 97:"
sed -n '90,105p' knowledgebase/views.py

# 3. Fix the specific indentation issue
echo "🔧 Fixing the indentation issue..."
# Find the line with the indentation error and fix it
sed -i '97s/^    def by_hospital/    @action(detail=False, methods=['\''get'\''])\n    def by_hospital/' knowledgebase/views.py

# 4. Verify the fix
echo "📋 Fixed content around line 97:"
sed -n '90,105p' knowledgebase/views.py

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

echo "🎉 Simple indentation fix completed!"