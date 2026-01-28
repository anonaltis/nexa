import asyncio
import json
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

# from api.chat_v3 import router # Removed to avoid relative import issues
from services.gemini_function_calling import GeminiFunctionService
from services.function_executor import FunctionExecutor
from services.validation_service import ValidationService

async def test_ohms_law():
    """Test verification of Ohm's Law calculation."""
    print("\n--- Testing Ohm's Law Validation ---")
    executor = FunctionExecutor()
    
    # Simulate a call to calculate_component_value
    params = {
        "calculation_type": "resistor",
        "inputs": {
            "voltage": 5.0,
            "current_ma": 20.0,
            "target_voltage": 2.0  # LED Vf
        }
    }
    
    result = await executor.execute_function("calculate_component_value", params)
    print(f"Result: {json.dumps(result, indent=2)}")
    
    # Validation check
    assert result["result"]["resistance_ohms"] == 150.0
    print("✅ Logic Correct (R = (5-2) / 0.02 = 150)")

async def test_datasheet_lookup():
    """Test datasheet retrieval."""
    print("\n--- Testing Datasheet Lookup ---")
    executor = FunctionExecutor()
    
    params = {"component_name": "ESP32"}
    result = await executor.execute_function("fetch_datasheet", params)
    
    print(f"Result snippet: {json.dumps(result, indent=2)[:200]}...")
    assert "Espressif" in str(result)
    print("✅ Datasheet Retrieved")

if __name__ == "__main__":
    asyncio.run(test_ohms_law())
    asyncio.run(test_datasheet_lookup())
