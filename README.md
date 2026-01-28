# Nexa - AI-Powered Electronics Engineering Platform

Nexa is an advanced, full-stack platform designed for electrical and electronics engineering students and makers. It combines a sophisticated project management interface (**ElectroLab**) with a specialized AI reasoning engine (**CircuitSathi**) and **Gemini AI** to help you plan, design, and debug hardware projects.

---

## 🚀 Quick Start

The easiest way to get started is to use the provided execution script which runs both the frontend and multi-service backend concurrently.

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm
- MongoDB (running at localhost:27017)

### Running the Platform
```bash
# 1. Clone the repository
# 2. Add your GEMINI_API_KEY and MONGODB_URL to backend/.env
# 3. Run the startup script
chmod +x run.sh
./run.sh
```
The platform will be available at:
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Main Backend API**: [http://localhost:5000](http://localhost:5000)
- **AI Microservice**: [http://localhost:8000](http://localhost:8000) (Internal)

---

## 🌟 Architecture Overview

Nexa uses a robust triple-service architecture:

### 1. ElectroLab (Frontend)
A modern React interface on port **5173** that communicates strictly with the Main Backend.

### 2. Main Backend (Node.js/TypeScript)
The primary application server on port **5000**.
- **Auth & Projects**: Managed natively via Mongoose and JWT.
- **Orchestration**: Forwards complex hardware queries to the AI engine.
- **Security**: Centralized middleware and data validation.

### 3. AI Microservice (Python)
The specialized reasoning engine on port **8000**.
- **Logic**: Houses `CircuitSathi` physics engine and Google Gemini integrations.
- **Specialized**: Strictly for computation and AI generation.

👉 **[User Manual](./USER_MANUAL.md)** | **[Technical Docs](./backend/README.md)**

---

## 📂 Project Structure

```text
nexa/
├── backend/            # UNIFIED BACKEND
│   ├── src/            # Node.js Source (Auth, Projects, Routes)
│   ├── ai-engine/      # Python AI Microservice (CircuitSathi)
│   │   ├── main.py     # AI computation endpoints
│   │   └── reasoning_engine/ # Physics logic
│   └── .env            # Shared secrets & MONGODB config
├── frontend/           # React/Vite application (ElectroLab)
├── run.sh              # One-click startup script
└── README.md           # This file
```

---

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Shadcn/UI, Vite.
- **Main Backend**: Node.js, Express, Mongoose, JWT, TypeScript.
- **AI Service**: Python 3.12, FastAPI, Google Gemini GenAI.
- **Database**: MongoDB.

---

## ⚖️ License
This project is licensed under the MIT License.
