# Nexa/ElectroLab Implementation Roadmap

## Goal
Build a comprehensive AI-powered Electronics Lab that takes natural language descriptions and produces verified schematics, PCB layouts, and firmware code.

## 1. System Architecture
The system follows a 3-stage pipeline: **Input → Processing (AI Brain) → Output**.

### Stage 1: Input & Intent Engine
*   **Frontend**: Enhanced Chat Interface (React) that supports:
    *   Text Input ("Design a 3.3V LED driver with ESP32")
    *   Constraint Forms (Voltage, Board Size)
    *   File Uploads (PDF/Image parsing - Future)
*   **Backend Router**: Upgrade `chat_v3.py` to use a sophisticated Intent Classifier to route requests to:
    *   `Chat Agent` (General Q&A)
    *   `Design Agent` (Circuit Generation)
    *   `Code Agent` (Firmware)

### Stage 2: The AI Processing Core (Dual Agent)
*   **Standard Data Format**: Define `CircuitJSON` (a universal netlist format) to pass data between agents.
    ```json
    {
      "components": [{"id": "R1", "type": "Resistor", "value": "10k", "footprint": "0805"}],
      "connections": [{"from": "R1.2", "to": "LED1.A"}],
      "meta": {"voltage": "3.3V"}
    }
    ```
*   **Generator Agent**:
    *   Prompt: "Generate a valid netlist for [Project Description]"
    *   Tool: `component_library` (Vector Search over Digikey/Mouser DB).
*   **Validator Agent** (The Physicist):
    *   Analyzes `CircuitJSON` for:
        *   Voltage mismatches (3.3V vs 5V logic).
        *   Power ratings ($I^2R$).
        *   Missing safety (flyback diodes, bypass caps).
    *   Returns: `VerificationReport` (Pass/Fail + Criticisms).

### Stage 3: Output & Visualization
*   **Schematic Renderer**:
    *   **Frontend**: Use `React Flow` or `Konva` to render `CircuitJSON` as an interactive diagram.
    *   **Backend**: `schematic_service.py` for auto-layout algorithms.
*   **PCB Generator**:
    *   Enhance `pcb_generator.py` to map `CircuitJSON` to real footprints (KiCad standard compatible).
    *   Generate SVG/Gerber files.
*   **Firmware Generator**:
    *   Use `code_generator.py` to write code based on the *final verified pinout* from the `CircuitJSON`.

## 2. Implementation Steps

### Phase 1: Foundation (Current Status: In Progress)
- [x] Basic Chat Interface (`ChatInterface.tsx`)
- [x] Dual Agent Service (`dual_agent.py`)
- [x] Simple Code Generation (`code_generator.py`)
- [x] Chat Persistence (Memory)

### Phase 2: Core Electronics Engine (Next Up)
- [ ] Define `CircuitJSON` Schema in `backend/models.py`.
- [ ] Upgrade `dual_agent.py` to generate JSON netlists instead of just text.
- [ ] Implement `electronics_validator.py` with basic rule checks (Ohm's law, generic safety).

### Phase 3: Visualization
- [ ] Create `SchematicViewer` component in Frontend.
- [ ] Connect Backend `pcb_generator` to Frontend visualizer.

### Phase 4: Simulation (Advanced)
- [ ] Integrate `PySpice` (NGSPICE wrapper) in backend.
- [ ] Create `simulation_service.py` to run transient analysis on `CircuitJSON` netlists.

## 3. Technology Stack Recommendations
*   **Backend**: FastAPI, LangChain (for agent flows), PySpice.
*   **Frontend**: React, React Flow (Schematics), Fabric.js (PCB).
*   **AI**: Gemini 2.5 Flash (Generation), Gemini 2.5 Pro (Validation/Reasoning).
