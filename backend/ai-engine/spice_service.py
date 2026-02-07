import subprocess
import os
import re
import json
from typing import Dict, List, Any, Optional

class SpiceService:
    def __init__(self, ngspice_path: str = "ngspice"):
        self.ngspice_path = ngspice_path
        self.has_ngspice = self._check_ngspice()

    def _check_ngspice(self) -> bool:
        try:
            subprocess.run([self.ngspice_path, "--version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            return True
        except FileNotFoundError:
            return False

    def run_simulation(self, netlist: str) -> Dict[str, Any]:
        """
        Runs a SPICE simulation and returns the results.
        """
        if not self.has_ngspice:
            return {
                "success": False,
                "error": "ngspice not found on system. Please install it to run simulations.",
                "is_mock": True,
                "data": self._generate_mock_data(netlist)
            }

        # Save netlist to a temporary file
        temp_netlist = "temp_circuit.sp"
        with open(temp_netlist, "w") as f:
            f.write(netlist)

        try:
            # Run ngspice in batch mode
            # -b: batch mode
            # -r rawfile: save results to rawfile
            result = subprocess.run(
                [self.ngspice_path, "-b", temp_netlist],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

            if result.returncode != 0:
                return {
                    "success": False,
                    "error": result.stderr or result.stdout,
                    "raw_output": result.stdout
                }

            # Parse results (Simplified: we'll look for plotted data if any)
            # For now, let's just return the raw output and a success flag
            # In a real implementation, we'd parse the .raw file or use -p (pipes)
            
            return {
                "success": True,
                "raw_output": result.stdout,
                "message": "Simulation completed successfully."
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
        finally:
            if os.path.exists(temp_netlist):
                os.remove(temp_netlist)

    def _generate_mock_data(self, netlist: str) -> Dict[str, Any]:
        """
        Generates dummy data based on the netlist for UI testing when ngspice is missing.
        """
        # Basic parsing to see if it's transient or AC
        is_transient = ".tran" in netlist.lower()
        is_ac = ".ac" in netlist.lower()
        
        nodes = re.findall(r"V\w+\s+(\w+)\s+", netlist)
        if not nodes:
            nodes = ["out"]
        
        results = {}
        for node in nodes:
            if is_transient:
                results[node] = [
                    {"time": i * 0.1, "voltage": 5 * (1 - 2.7**(-i*0.1))} 
                    for i in range(100)
                ]
            elif is_ac:
                results[node] = [
                    {"frequency": 10**i, "magnitude_db": -20 * i if i > 2 else 0}
                    for i in range(6)
                ]
            else:
                 results[node] = [{"step": 0, "voltage": 5.0}]
        
        return results

    def generate_netlist_from_description(self, description: str, gemini_client: Any) -> str:
        """
        Uses Gemini to convert a natural language description into a SPICE netlist.
        """
        prompt = f"""
        Convert the following electronics circuit description into a standard SPICE netlist.
        Include simulation commands if mentioned (e.g., .tran 1m 10m).
        Ensure the netlist is valid for ngspice.
        
        Description: {description}
        
        Return ONLY the SPICE netlist text.
        """
        
        if not gemini_client:
             return "* Gemini client not available. Use manual netlist input."
             
        try:
            response = gemini_client.models.generate_content(
                model='gemini-2.0-flash-lite-preview-02-05', 
                contents=prompt
            )
            return response.text.strip()
        except Exception as e:
            return f"* Error generating netlist: {str(e)}"

    def analyze_results(self, raw_output: str, description: str, gemini_client: Any) -> str:
        """
        Uses Gemini to analyze SPICE output and provide technical insights.
        """
        prompt = f"""
        Analyze the following SPICE simulation results for the circuit described as: "{description}".
        Explain if the results match expectations, identify any issues (e.g., clipping, oscillation), 
        and suggest improvements.
        
        Raw SPICE Output:
        {raw_output}
        
        Provide a professional, technical analysis.
        """
        
        if not gemini_client:
            return "Gemini analysis unavailable."

        try:
            response = gemini_client.models.generate_content(
                model='gemini-2.0-flash-lite-preview-02-05', 
                contents=prompt
            )
            return response.text.strip()
        except Exception as e:
            return f"Error analyzing results: {str(e)}"
