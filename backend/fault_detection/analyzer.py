from typing import List, Dict, Any
from ..circuit_parser.models import CircuitData
from ..circuit_parser.utils import parse_value

class CircuitAnalyzer:
    def __init__(self, circuit_data: CircuitData):
        self.data = circuit_data
        self.faults = []
        self.warnings = []
        self.logs = []
        self.topology = "Unknown"

    def log(self, step: str):
        self.logs.append(step)

    def analyze(self) -> Dict[str, Any]:
        """
        Main analysis pipeline.
        """
        self.log("Step 1: Identifying Circuit Components and Topology.")
        
        # 1. Identify Topology
        opamps = [c for c in self.data.components if c.type == 'OpAmp']
        resistors = [c for c in self.data.components if c.type == 'Resistor']
        
        if opamps:
            self._analyze_opamp_circuit(opamps[0], resistors)
        else:
            self.log("No OpAmp found. Basic passive circuit analysis not fully implemented.")

        return {
            "topology": self.topology,
            "faults": self.faults,
            "reasoning_steps": self.logs
        }

    def _analyze_opamp_circuit(self, opamp, resistors):
        # Flatten node dict
        nodes = opamp.nodes
        inv_node = nodes.get("inverting")
        non_inv_node = nodes.get("non_inverting")
        output_node = nodes.get("output")
        
        # Check supply
        v_pos_val = self._get_supply_voltage("VCC_POS") or 15.0 # Default fallback
        v_neg_val = self._get_supply_voltage("VCC_NEG") or -15.0
        
        self.log(f"Identified OpAmp power rails: +{v_pos_val}V and {v_neg_val}V.")
        
        # Identify configuration
        # Basic Heuristic: 
        # If Input Source is on Inverting Node -> Inverting Amp
        # If Input Source is on Non-Inverting Node -> Non-Inverting Amp
        
        input_supply = next((s for s in self.data.supplies if "VCC" not in s.id), None)
        input_voltage = parse_value(input_supply.value) if input_supply else 0.0
        
        self.log(f"Analyzed Input Signal: {input_supply.id if input_supply else 'None'} = {input_voltage}V")

        # Find feedback resistor (between output and inverting input)
        rf = next((r for r in resistors if self._is_connected(r, output_node) and self._is_connected(r, inv_node)), None)
        
        # Find input resistor (between input source and inverting input)
        # Assuming input source node is known or we trace from inv_node
        rin = next((r for r in resistors if self._is_connected(r, inv_node) and r != rf), None)

        if rf and rin:
            if non_inv_node == "GND":
                self.topology = "Inverting Amplifier"
                self.log("Topology Identified: Inverting Amplifier (Input applied to Inverting terminal, Non-inverting grounded).")
                
                rf_val = parse_value(rf.value)
                rin_val = parse_value(rin.value)
                
                # Gain Calculation
                gain = -1 * (rf_val / rin_val)
                self.log(f"Calculated Theoretical Gain: - (Rf / Rin) = - ({rf_val} / {rin_val}) = {gain:.2f}")
                
                expected_vout = gain * input_voltage
                self.log(f"Expected Output Voltage (Vout) = Gain * Vin = {gain:.2f} * {input_voltage}V = {expected_vout:.2f}V")
                
                # Check Saturation
                if expected_vout > v_pos_val:
                    self.faults.append(f"Positive Saturation: Expected {expected_vout:.2f}V exceeds supply +{v_pos_val}V.")
                    self.log(f"FAULT DETECTED: The output is clipped at positive rail (+{v_pos_val}V).")
                elif expected_vout < v_neg_val:
                    self.faults.append(f"Negative Saturation: Expected {expected_vout:.2f}V drops below supply {v_neg_val}V.")
                    self.log(f"FAULT DETECTED: The output is clipped at negative rail ({v_neg_val}V).")
                else:
                    self.log("Operation is within linear range (No Saturation).")
                    
                # Check Measured vs Expected
                measured_vout_str = self.data.measured_outputs.get("VOUT")
                if measured_vout_str:
                    measured_val = parse_value(measured_vout_str)
                    diff = abs(measured_val - expected_vout)
                    if diff > 1.0 and (measured_val >= v_pos_val - 1 or measured_val <= v_neg_val + 1):
                         # If we haven't already flagged it...
                         pass 

    def _get_supply_voltage(self, node_or_id):
        for s in self.data.supplies:
            if s.node == node_or_id or s.id == node_or_id:
                return parse_value(s.value)
        return None

    def _is_connected(self, component, node):
        if isinstance(component.nodes, list):
            return node in component.nodes
        elif isinstance(component.nodes, dict):
            return node in component.nodes.values()
        return False
