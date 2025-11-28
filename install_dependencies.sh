#!/bin/bash

# Install dependencies for the AI Query Endpoint
echo "🔧 Installing dependencies for AI Query Endpoint..."

# Install optional dependencies
echo "📦 Installing optional dependencies..."
pip3 install boto3==1.34.0
pip3 install python-weather==1.0.6
pip3 install azure-cognitiveservices-vision-face==2.0.0
pip3 install msrest==0.7.1
pip3 install elevenlabs==0.2.26
pip3 install geopy==2.4.1

# Install other requirements
echo "📦 Installing other requirements..."
pip3 install -r requirements.txt

echo "✅ Dependencies installed successfully!"
echo ""
echo "🚀 You can now start the Django server:"
echo "   python3 manage.py runserver 8002"
echo ""
echo "🧪 To test the AI Query endpoint:"
echo "   1. Get a hospital ID: python3 get_hospital_id.py"
echo "   2. Run tests: python3 test_ai_query_endpoint.py"
echo ""
echo "📚 For more information, see AI_QUERY_ENDPOINT_DOCUMENTATION.md"