# Nexa

Nexa is an advanced platform for electrical and electronics engineering education. Its core component, **CircuitSathi**, acts as an AI lab partner to help students analyze circuits and debug faults.

## CircuitSathi

CircuitSathi analyzes structured circuit descriptions to perform reasoning-based debugging. It helps students understand:
- Circuit types
- Core electrical rules (Ohm's Law, KVL/KCL, etc.)
- Fault detection (Saturation, invalid grounds, etc.)
- Reasoning timelines for debugging

## Project Structure

- **frontend/**
  - `lovable-ui/`: User interface for interacting with Nexa/CircuitSathi.
- **backend/**
  - `circuit_parser/`: Parses circuit inputs.
  - `fault_detection/`: Identifies potential circuit faults.
  - `reasoning_engine/`: The core AI logic for CircuitSathi (prompts and inference).
  - `api/`: API endpoints.
- **demo/**: Test cases and example inputs.
