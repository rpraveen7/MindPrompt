#!/bin/bash

# Get the absolute path of the project
PROJECT_DIR=$(pwd)

echo "🚀 Launching MindPrompt Development Environment..."

# Open Backend Tab
osascript -e "tell application \"Terminal\" to do script \"cd '$PROJECT_DIR/server' && ./venv/bin/uvicorn main:app --reload --port 8000\""

# Open Frontend Tab
osascript -e "tell application \"Terminal\" to do script \"cd '$PROJECT_DIR/client' && npm run dev\""

echo "✅ Commands sent to new Terminal tabs."
echo "🌍 Once ready, open: http://localhost:3000"