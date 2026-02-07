import json
from typing import List, Dict, Any, Optional

class FirmwareService:
    def __init__(self):
        pass

    def generate_firmware(self, 
                          requirements: str, 
                          circuit_data: Optional[Dict[str, Any]], 
                          board: str, 
                          gemini_client: Any) -> str:
        """
        Generates firmware code based on requirements and optional circuit data.
        """
        
        context = ""
        if circuit_data:
            context = f"\nCircuit Context:\n{json.dumps(circuit_data, indent=2)}\n"
            
        prompt = f"""
You are an expert Firmware Engineer.
Generate high-quality, production-ready C/C++ code for the {board} board.

Requirements:
{requirements}
{context}

Guidelines:
1. Use appropriate libraries for the specified board (e.g., Arduino.h, ESP32 specific HALs).
2. Follow best practices for embedded systems (non-blocking code, proper initialization).
3. If circuit data is provided, ensure pin assignments match the 'nodes' and 'pins' in the data.
4. Include helpful comments explaining the logic.
5. Return ONLY the code inside a markdown code block.
"""

        try:
            response = gemini_client.models.generate_content(
                model='gemini-2.0-flash-lite-preview-02-05',
                contents=prompt
            )
            
            # Extract code from markdown block if present
            content = response.text
            if "```" in content:
                parts = content.split("```")
                # Usually code is in the second part if it starts with ```
                # But it depends on whether there's intro text
                for part in parts:
                    if part.strip().startswith("c++") or part.strip().startswith("cpp") or part.strip().startswith("c") or part.strip().startswith("#include"):
                        # Attempt to clean up the language prefix
                        code = part.strip()
                        if code.startswith("c++"): code = code[3:].strip()
                        elif code.startswith("cpp"): code = code[3:].strip()
                        elif code.startswith("c\n"): code = code[2:].strip()
                        return code
                return parts[1].strip() # Fallback to first block
            
            return content.strip()
        except Exception as e:
            return f"// Error generating firmware: {str(e)}"

    def chat_with_agent(self, 
                        message: str, 
                        history: List[Dict[str, str]], 
                        current_code: str, 
                        board: str, 
                        gemini_client: Any) -> Dict[str, Any]:
        """
        Iterative chat with the Code Agent for code refinement.
        """
        
        system_prompt = f"""
You are the Nexa Code Agent, an AI designed to help engineers write firmware.
Current Board: {board}
Current Code:
```cpp
{current_code}
```

Help the user refine their code. You can suggest changes, explain logic, or rewrite sections.
If you provide new code, always enclose it in markdown blocks.
"""

        contents = [{"role": "user" if m["role"] == "user" else "model", "parts": [m["content"]]} for m in history]
        contents.append({"role": "user", "parts": [message]})

        try:
            response = gemini_client.models.generate_content(
                model='gemini-2.0-flash-lite-preview-02-05',
                contents=[{"role": "user", "parts": [system_prompt]}] + contents
            )
            
            return {
                "response": response.text,
                "suggested_code": self._extract_code(response.text)
            }
        except Exception as e:
            return {"response": f"Error interacting with agent: {str(e)}", "suggested_code": None}

    def _extract_code(self, text: str) -> Optional[str]:
        if "```" in text:
            parts = text.split("```")
            for part in parts:
                if "#include" in part or "void setup" in part:
                    code = part.strip()
                    if code.startswith("cpp"): code = code[3:].strip()
                    if code.startswith("c++"): code = code[3:].strip()
                    return code
        return None
