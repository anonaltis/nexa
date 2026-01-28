# Nexa User Manual 📘

Welcome to **Nexa**, your AI-powered electronics engineering companion. This manual will guide you through the features of the Nexa platform, specifically the **ElectroLab** interface and the **CircuitSathi** reasoning engine.

---

## 📑 Table of Contents
1. [Getting Started](#-getting-started)
2. [Project Planning (AI Assistant)](#-project-planning-ai-assistant)
3. [Circuit Analysis & Debugging](#-circuit-analysis--debugging)
4. [PCB Layout & Visualization](#-pcb-layout--visualization)
5. [Firmware Code Generation](#-firmware-code-generation)
6. [Dashboard & Project Management](#-dashboard--project-management)
7. [Troubleshooting](#-troubleshooting)

---

## 🚀 Getting Started

### Accessing the Platform
Nexa is a web-based application. Once the server is running (usually at `localhost:5173`), you can access it via any modern browser (Chrome or Edge recommended for hardware features).

### Login & Demo Account
- **Standard Login**: Use your registered email and password.
- **Demo Mode**: Click the **"Login with Demo Account"** button on the sign-in page for instant access with pre-loaded projects and example data.

---

## 💬 Project Planning (AI Assistant)

The AI Assistant is designed to take your vague ideas and turn them into actionable project plans.

1. **Start a Conversation**: Navigate to the **AI Assistant** tab.
2. **Interactive Scoping**: The AI will ask you questions about your project type (IoT, Robotics, Power, etc.) and your experience level.
3. **Requirement Gathering**: Select specific features you need (e.g., WiFi, OLED Display, Temperature Sensors).
4. **Generated Plan**: Once finished, Nexa generates a structured document containing:
   - Recommended Components.
   - Estimated Material Costs.
   - Initial Connection Logic.
   - Documentation of your project scope.

---

## ⚡ Circuit Analysis & Debugging

The **Circuit Analyzer** is a specialized tool that finds electrical faults in your circuit descriptions.

### How to use:
1. **Enter Description**: Describe your circuit configuration using text.
   - *Example*: "I have an LM358 inverting amplifier. R1=1k, Rf=100k. My input is 1V. Power supply is +/-15V."
2. **Run Analysis**: Click **"Analyze Circuit"**.
3. **Review Results**:
   - **Reasoning Steps**: See how the AI "thinks" about your circuit (e.g., Identifying topology, calculating gain).
   - **Fault Detection**: Red alerts will appear if the AI detects issues like **Output Saturation** or **Component Overheating**.
   - **Fixes**: The AI provides specific hardware changes to fix the detected bugs.
   - **Learning Notes**: Educational snippets that explain *why* the fault occurred (e.g., explaining the Gain formula).

---

## 🛠 PCB Layout & Visualization

Once your plan is finalized, visualization is key.

- **Viewing**: Access the **PCB Viewer** from the dashboard.
- **Layer Control**: Use the side panel to toggle **Top**, **Bottom**, and **Silkscreen** layers to inspect routing.
- **Zoom & Rotate**: Use the toolbar to inspect fine details in the high-resolution SVG render.
- **Exports**: Download the design in **SVG** format or export raw **Gerber** files for manufacturing.

---

## 💻 Firmware Code Generation

Nexa provides production-ready code for your microcontrollers based on your project goals.

1. **Select Platform**: Choose between **ESP32**, **Arduino Uno**, or **Arduino Nano**.
2. **Review Code**: The AI generates full C++ code with comments, pin definitions, and logic.
3. **Developer Tools**:
   - **Copy Code**: One-click copy for your local IDE.
   - **Download**: Download as a `.ino` file.
   - **Instructions**: Detailed guides on which VS Code extensions and libraries (libraries like `Adafruit_GFX`, `DHT`) are required.

---

## 📊 Dashboard & Project Management

All your work is saved in the central **Dashboard**.

- **Project Status**: Track if you are in the **Planning**, **Designing**, **Coding**, or **Testing** phase.
- **Categorization**: Projects are automatically tagged (e.g., #ESP32, #Robotics).
- **History**: The dashboard keeps a record of all your circuit analyses so you can always go back and review previous debugging sessions.

---

## ❓ Troubleshooting

### 1. "AI Server Unreachable"
Ensure the backend FastAPI server is running (`uvicorn api.main:app`) and that the `VITE_API_URL` environment variable matches the backend server address (usually `http://localhost:8000`).

### 2. "Missing API Key"
The advanced reasoning features require a **Gemini API Key**. Add it to your `backend/.env` file:
`GEMINI_API_KEY=your_key_here`

### 3. "Component Not Found"
When using the Circuit Analyzer, be specific with component names (e.g., "LM358", "BC547") to get the most accurate analysis.
---
*© 2026 Nexa Platform — Engineering Intelligence for Everyone*
