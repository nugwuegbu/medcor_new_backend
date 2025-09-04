#!/bin/bash

# One-liner to fix SSH access to GitHub
# Run this on your AWS server

cd /var/www/html/medcor_backend2 && \
mkdir -p ~/.ssh && \
ssh-keyscan -H github.com >> ~/.ssh/known_hosts && \
[ ! -f ~/.ssh/id_rsa ] && ssh-keygen -t rsa -b 4096 -C "medcor-deploy@$(hostname)" -f ~/.ssh/id_rsa -N "" && \
chmod 600 ~/.ssh/id_rsa && \
chmod 644 ~/.ssh/id_rsa.pub && \
echo "=== ADD THIS KEY TO GITHUB ===" && \
cat ~/.ssh/id_rsa.pub && \
echo "=== GO TO: https://github.com/nugwuegbu/medcor_new_backend/settings/keys ===" && \
echo "=== CLICK 'Add deploy key' AND PASTE THE KEY ABOVE ===" && \
git remote set-url origin git@github.com:nugwuegbu/medcor_new_backend.git && \
echo "=== AFTER ADDING KEY TO GITHUB, RUN: git pull origin main ==="