#!/bin/bash

# Configuration
PROJECT_ROOT=$(pwd)
AI_ENGINE_DIR="$PROJECT_ROOT/backend/ai-engine"
MAIN_BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting Nexa Platform (Relocated Backend)...${NC}"

# Function to handle cleanup on exit
cleanup() {
    echo -e "\n${RED}🛑 Stopping services...${NC}"
    kill $AI_ENGINE_PID $MAIN_BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Start AI Microservice (Python)
echo -e "${GREEN}📡 Starting AI Microservice (Python)...${NC}"
cd "$AI_ENGINE_DIR" || exit

if [ ! -d "venv" ]; then
    echo -e "${YELLOW}⚙️ Setting up Python venv...${NC}"
    python3 -m venv venv
    ./venv/bin/pip install -r requirements.txt
fi

./venv/bin/uvicorn main:app --reload --port 8000 &
AI_ENGINE_PID=$!

# Start Main Backend (Node.js)
echo -e "${GREEN}📦 Starting Main Backend (Node.js/TypeScript)...${NC}"
cd "$MAIN_BACKEND_DIR" || exit
npm run dev &
MAIN_BACKEND_PID=$!

# Start Frontend
echo -e "${GREEN}💻 Starting Frontend (Vite)...${NC}"
cd "$FRONTEND_DIR" || exit
npm run dev &
FRONTEND_PID=$!

echo -e "${BLUE}✨ All services are starting up!${NC}"
echo -e "${BLUE}🔗 AI Service (Internal): http://localhost:8000${NC}"
echo -e "${BLUE}🔗 Main Backend:          http://localhost:5000${NC}"
echo -e "${BLUE}🔗 Frontend:              http://localhost:5173${NC}"
echo -e "${BLUE}Press Ctrl+C to stop all services.${NC}"

# Wait for all processes
wait $AI_ENGINE_PID $MAIN_BACKEND_PID $FRONTEND_PID
