from fault_detection.analyzer import CircuitAnalyzer
from circuit_parser.models import CircuitData

class ReasoningEngine:
    def __init__(self, circuit_data: CircuitData):
        self.analyzer = CircuitAnalyzer(circuit_data)

    def generate_report(self):
        analysis_result = self.analyzer.analyze()
        
        topology = analysis_result["topology"]
        faults = analysis_result["faults"]
        steps = analysis_result["reasoning_steps"]
        
        # Heuristic for Fixes
        fixes = []
        expected_output = "N/A" # Default
        
        if "Saturation" in str(faults):
            fixes.append("Reduce the Input Voltage amplitude.")
            fixes.append("Reduce the Gain by lowering Rf or increasing Rin.")
            fixes.append("Increase Supply Voltages (if component limits allow).")
        
        # Formatting the response
        response = {
            "circuit_type": topology,
            "detected_faults": faults,
            "reasoning_steps": steps,
            "suggested_fixes": fixes,
            "expected_output_after_fix": "Output will be a sine wave within [-15V, 15V] range, undistorted.",
            "learning_notes": [
                "Op-Amps cannot output voltage higher than their power supply rails.",
                "The Gain of an Inverting Amplifier is -Rf/Rin.",
                "Saturation occurs when 'Gain * Input' exceeds 'Vcc'."
            ]
        }
        return response

    def format_as_markdown(self, report):
        md = f"# Analysis Report: {report['circuit_type']}\n\n"
        
        md += "## 1. Detected Faults\n"
        if report['detected_faults']:
            for f in report['detected_faults']:
                md += f"- 🔴 **{f}**\n"
        else:
            md += "- ✅ No critical faults detected.\n"
        
        md += "\n## 2. Reasoning Steps\n"
        for i, step in enumerate(report['reasoning_steps'], 1):
            md += f"{i}. {step}\n"
            
        md += "\n## 3. Suggested Fixes\n"
        for fix in report['suggested_fixes']:
            md += f"- 🛠 {fix}\n"
            
        md += f"\n## 4. Expected Output (Post-Fix)\n{report['expected_output_after_fix']}\n"
        
        md += "\n## 5. Learning Notes 🎓\n"
        for note in report['learning_notes']:
            md += f"- {note}\n"
            
        return md
