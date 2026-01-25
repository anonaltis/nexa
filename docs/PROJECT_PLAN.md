# ElectroLab - Project Documentation

## Overview
ElectroLab is an AI-powered electronics project platform that helps users plan, design, and build hardware projects. The platform provides intelligent guidance from concept to completion.

## Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** with custom blueprint theme
- **Shadcn/ui** component library
- **React Router** for navigation

### Key Features (Frontend-Ready)

1. **AI Chat Interface** (`/chat`)
   - Conversational project planning
   - Poll-based Q&A for requirements gathering
   - Auto-generated project documentation

2. **Project Dashboard** (`/dashboard`)
   - Project listing with status tracking
   - Category and tag organization
   - Quick actions for each project

3. **PCB Viewer** (`/pcb`)
   - SVG-based schematic display
   - Layer visibility controls
   - Export options (Gerber, PDF, BOM)

4. **Code Editor** (`/code`)
   - ESP32/Arduino code display
   - Copy and download functionality
   - VS Code extension recommendations

## Backend Integration Points

### Ready for Supabase/Backend
All components are designed for easy backend integration:

1. **Authentication** (`src/contexts/AuthContext.tsx`)
   - Replace mock login/signup with Supabase Auth
   - Session management ready

2. **Projects** (`src/hooks/useProjects.ts`)
   - Replace localStorage with database calls
   - CRUD operations defined

3. **AI Chat** (`src/components/chat/ChatInterface.tsx`)
   - Ready for Lovable AI Gateway integration
   - Streaming support can be added

4. **File Storage**
   - PCB exports → Supabase Storage
   - Code files → Database or Storage

## Data Types
All TypeScript interfaces are defined in `src/types/project.ts`:
- `Project`, `PlanningDocument`, `PCBDiagram`
- `CodeFile`, `ChatMessage`, `User`

## Design System
Blueprint-themed dark UI with:
- CSS variables in `src/index.css`
- Tailwind config in `tailwind.config.ts`
- Custom classes: `.blueprint-card`, `.blueprint-bg`, `.glow-*`

## Next Steps for Backend
1. Enable Lovable Cloud
2. Create database tables for projects
3. Implement Lovable AI for chat
4. Add file storage for exports
