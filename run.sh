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
    echo -e "\n${RED}🛑 Stopping services and clearing ports...${NC}"
    # Kill all child processes of this script
    pkill -P $$ 2>/dev/null
    # Force kill processes on specific used ports to avoid "Address already in use"
    fuser -k 8000/tcp 5000/tcp 5173/tcp 8080/tcp 8081/tcp 8082/tcp 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Start Unified Backend (Python)
echo -e "${GREEN}📡 Starting Unified Backend (Python)...${NC}"
cd "$MAIN_BACKEND_DIR" || exit

if [ ! -d ".venv" ]; then
    echo -e "${YELLOW}⚙️ Setting up Python venv...${NC}"
    python3 -m venv .venv
    ./.venv/bin/pip install -r requirements.txt
fi

./.venv/bin/uvicorn api.main:app --reload --port 8000 &
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
