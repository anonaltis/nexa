import asyncio
import os
from dotenv import load_dotenv
from services.dual_agent import get_dual_agent

# Load environment variables
load_dotenv()

async def test_dual_agent():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "MOCK":
        print("Skipping test: No real GEMINI_API_KEY available.")
        return

    print("--- Initializing Dual Agent Service ---")
    agent = get_dual_agent(api_key)
    
    # Test Case 1: Diagnosis Scenario
    query_1 = "My LED is burning out immediately when connected to a 9V battery."
    print(f"\n[Test 1] User: {query_1}")
    
    try:
        response_1 = await agent.generate_response(query_1)
        print("\n[Response Content]:")
        print(response_1["content"][:500] + "...") # Truncate for display
        print("\n[Metadata]:")
        print(response_1["metadata"])
    except Exception as e:
        print(f"Error in Test 1: {e}")

    # Test Case 2: Project Creation Scenario (Circuit Design)
    query_2 = "Design a simple night light circuit using an LDR and a transistor."
    print(f"\n[Test 2] User: {query_2}")
    
    try:
        response_2 = await agent.generate_response(query_2)
        print("\n[Response Content]:")
        print(response_2["content"][:500] + "...")
        print("\n[Metadata]:")
        print(response_2["metadata"])
    except Exception as e:
        print(f"Error in Test 2: {e}")

if __name__ == "__main__":
    asyncio.run(test_dual_agent())
