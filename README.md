# Nexa - AI-Powered Electronics Engineering Platform

Nexa is an advanced platform designed for electrical and electronics engineering education. It combines a sophisticated project management interface (**ElectroLab**) with a specialized reasoning engine (**CircuitSathi**) to help students plan, design, and debug hardware projects.

## 🌟 Key Components

### 1. ElectroLab (Frontend)
A modern, high-tech React interface that allows users to:
- Plan projects using an AI-guided chat.
- Manage projects with a comprehensive dashboard.
- View and analyze PCB schematics.
- Edit and manage firmware code.

👉 **[Frontend Implementation Documentation](./frontend/README.md)**

### 2. CircuitSathi (Backend)
The intelligent reasoning engine that acts as an AI lab partner:
- **Topology Analysis**: Automatically identifies circuit configurations.
- **Fault Detection**: Pinpoints issues like saturation, clipping, and incorrect grounding.
- **Explainable AI**: Provides step-by-step reasoning for every detected fault.
- **Pedagogical Support**: Offers learning notes and suggested fixes.

👉 **[Backend Implementation Documentation](./backend/README.md)**

## 📂 Project Structure

- **`frontend/`**: React/Vite application (ElectroLab).
- **`backend/`**: FastAPI reasoning engine (CircuitSathi).
- **`demo/`**: Test cases and example circuit descriptions.
- **`docs/`**: General project planning and auxiliary documentation.

---

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Shadcn/UI, Vite.
- **Backend**: Python, FastAPI, Pydantic, Uvicorn.

For detailed developer instructions, please refer to the respective documentation links above.
