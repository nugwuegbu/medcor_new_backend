#!/bin/bash
echo "🏥 Starting Django Admin Server for MedCor"
echo "=========================================="

cd "$(dirname "$0")"

echo "📋 Admin URL: https://14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000/admin/"
echo "🔑 Login: admin@localhost / admin123"
echo "=========================================="

python manage.py runserver 0.0.0.0:8000 --noreload