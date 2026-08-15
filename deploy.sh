#!/bin/bash
git add .
git commit -m "Production: Update API URLs for Render"
git push origin main
echo "✅ Deployed! Render redeploy in 2-3 minutes"
