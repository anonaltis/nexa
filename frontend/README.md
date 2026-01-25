# Nexa Frontend - ElectroLab

ElectroLab is the frontend interface for the Nexa platform, an AI-powered electronics project platform. It provides students and engineers with tools to plan, design, and debug hardware projects.

For the initial high-level vision, see the **[Project Plan](./docs/PROJECT_PLAN.md)**.

## 🚀 Technologies

- **React 18** with **TypeScript** for type-safe UI development.
- **Vite** for fast build tooling and HMR.
- **Tailwind CSS** for responsive and custom-themed styling (Blueprint theme).
- **Shadcn/ui** for high-quality, accessible UI components.
- **React Router** for seamless multi-page navigation.
- **Lucide React** for consistent and beautiful iconography.

## 🛠 Project Structure

```text
frontend/
├── src/
│   ├── components/       # Reusable UI components (shadcn + custom)
│   ├── contexts/         # React Contexts (Auth, Theme, etc.)
│   ├── hooks/            # Custom hooks for state and data management
│   ├── pages/            # Page-level components (Dashboard, Chat, PCB, Code)
│   ├── services/         # API and external service integrations
│   ├── types/            # TypeScript interfaces and types
│   └── utils/            # Helper functions and utilities
├── public/               # Static assets
└── docs/                 # Project documentation and plans
```

## ✨ Key Features

### 1. AI Chat Interface (`/chat`)
- **Conversational Planning**: Guided project planning through an AI-driven chat.
- **Requirements Gathering**: Integrated polling/Q&A system to refine project goals.
- **Auto-Documentation**: Generates project documentation based on user interactions.

### 2. Project Dashboard (`/dashboard`)
- **Project Management**: Track project status, organize by categories and tags.
- **Quick Actions**: Easy access to editing, viewing schematics, and managing code.

### 3. PCB Viewer (`/pcb`)
- **Schematic Visualization**: SVG-based viewer for circuit diagrams.
- **Layer Control**: Toggle visibility of different PCB layers.
- **Exporting**: Support for Gerber, PDF, and BOM exports.

### 4. Code Editor (`/code`)
- **Microcontroller Focus**: Specialized for ESP32 and Arduino code display.
- **Developer Tools**: Copy/download functionality and VS Code extension recommendations.

## 🔌 Backend Integration

The frontend is built to be a standalone PWA but is pre-configured for integration with backend services like Supabase:

- **Authentication**: `src/contexts/AuthContext.tsx` is ready to be connected to Supabase Auth.
- **Data Hooks**: `src/hooks/useProjects.ts` uses a pattern that allows easy swapping of local state for API calls.
- **AI Integration**: The chat interface is prepared for streaming AI responses from a backend gateway.

## 📦 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or bun

### Installation
```bash
cd frontend
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

## 🎨 Design System
The UI follows a **"Blueprint"** theme—a high-tech, dark mode aesthetic.
- **CSS Variables**: Core colors and themes are defined in `src/index.css`.
- **Custom Classes**: Use `.blueprint-card` and `.glow-*` for thematic consistency.
