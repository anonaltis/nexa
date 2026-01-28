# Nexa Main Backend

This directory contains the primary web backend for the Nexa platform, built with **Node.js** and **TypeScript**.

## 🚀 Key Features

### 1. Authentication & Users
- Native JWT authentication.
- Password hashing with `bcryptjs`.
- Demo login support for instant exploration.

### 2. Project Management
- CRUD operations for electronics projects.
- Shared database integration via MongoDB/Mongoose.

### 3. AI Orchestration
- Acts as a gateway to the **AI Microservice** (FastAPI).
- Handles complex logic like code generation and pcb troubleshooting.

## 🛠 Project Structure

```text
backend/
├── src/
│   ├── controllers/    # Request handlers
│   ├── routes/         # API endpoint definitions
│   ├── models/         # Mongoose schemas
│   ├── middleware/     # Auth & Security
│   ├── services/       # External API (AI) communication
│   └── app.ts          # Express application setup
├── ai-engine/          # Python AI Microservice
└── .env                # Global configuration
```

## 📡 API Endpoints

### Auth
- `POST /auth/signup`
- `POST /auth/token` (Login)
- `POST /auth/demo`

### Projects (Protected)
- `GET /projects`
- `POST /projects`
- `GET /projects/:id`
- `PUT /projects/:id`
- `DELETE /projects/:id`

### AI Features (Protected)
- `POST /chat/message`: General project planning guidance.
- `POST /api/pcb/ask`: Direct troubleshooting questions.
- `POST /analyze-text`: Full circuit description analysis.
- `POST /generate-code`: Microcontroller firmware generation.

## 📦 Local Setup

```bash
cd backend
npm install
npm run dev
```

Remember to set up your `.env` file first based on the instructions in the root README.
