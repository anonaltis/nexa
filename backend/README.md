# Nexa Backend - CircuitSathi Reasoning Engine

CircuitSathi is the intelligent core of the Nexa platform. It provides specialized AI reasoning for circuit analysis, fault detection, and electronics education.

## 🚀 Technologies

- **FastAPI**: High-performance Python web framework for building APIs.
- **Pydantic**: Data validation and settings management using Python type annotations.
- **Uvicorn**: Lightning-fast ASGI server implementation.

## 🛠 Project Structure

```text
backend/
├── api/                  # FastAPI routes and server configuration
├── circuit_parser/       # Logic for parsing and modeling circuit data
├── fault_detection/      # Algorithms for identifying electrical faults
├── reasoning_engine/     # High-level logic that coordinates analysis and generates reports
└── requirements.txt      # Python dependencies
```

## 🧠 Core Modules

### 1. Circuit Parser (`circuit_parser/`)
Defines the schema for circuit descriptions. It uses Pydantic models to represent components, power supplies, and measured values.
- **Models**: `Component`, `Supply`, `CircuitData`.
- **Utilities**: Unit conversion and value parsing (e.g., "10k" to 10000).

### 2. Fault Detection (`fault_detection/`)
The rule-based analyzer that examines circuit topology and electrical parameters.
- **Topology Identification**: Detects circuit types (e.g., Inverting Amplifier).
- **Saturation Check**: Calculates theoretical output and compares it against power rails.
- **Measured vs. Expected**: Identifies discrepancies between simulation/measurement and theory.

### 3. Reasoning Engine (`reasoning_engine/`)
The orchestration layer that transforms raw analysis into human-readable educational reports.
- **Report Generation**: Combines faults, reasoning steps, and suggested fixes.
- **Learning Notes**: Injects pedagogical content to help students learn the underlying physics.
- **Markdown Formatting**: Provides a structured response ready for display in the frontend.

## 📡 API Reference

### POST `/analyze`
Analyze a circuit description and return a detailed report.

**Request Body (`CircuitData`):**
```json
{
  "circuit_id": "string",
  "components": [
    {
      "id": "R1",
      "type": "Resistor",
      "value": "10k",
      "nodes": ["node1", "node2"]
    },
    {
      "id": "U1",
      "type": "OpAmp",
      "nodes": {
        "inverting": "node1",
        "non_inverting": "GND",
        "output": "VOUT"
      }
    }
  ],
  "supplies": [
    { "id": "VCC_POS", "type": "DC", "value": "15V", "node": "VCC_POS" },
    { "id": "VIN", "type": "AC", "value": "2V", "node": "node1" }
  ]
}
```

**Response:**
- `structured_analysis`: JSON representation of findings.
- `markdown_response`: A pre-formatted markdown report for the UI.

## 📦 Getting Started

### Prerequisites
- Python 3.9+
- pip

### Installation
```bash
cd backend
pip install -r requirements.txt
```

### Running the Server
```bash
uvicorn api.main:app --reload
```
The API will be available at `http://localhost:8000`. You can view the interactive documentation at `http://localhost:8000/docs`.
