import sys
import os
import json

# Add current directory to path so we can import backend
sys.path.append(os.getcwd())

from backend.circuit_parser.models import CircuitData
from backend.reasoning_engine.engine import ReasoningEngine

def run_test():
    with open('demo/input_example.json', 'r') as f:
        data = json.load(f)
    
    circuit_data = CircuitData(**data)
    engine = ReasoningEngine(circuit_data)
    report = engine.generate_report()
    md = engine.format_as_markdown(report)
    
    print("--- RAW DICT ---")
    print(json.dumps(report, indent=2))
    print("\n--- MARKDOWN ---")
    print(md)

if __name__ == "__main__":
    run_test()
