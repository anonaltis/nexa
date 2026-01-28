from typing import List, Dict, Any
from circuit_parser.models import CircuitData
from circuit_parser.utils import parse_value
from circuit_parser.circuit_types import (
    detect_circuit_type,
    calculate_rc_filter,
    calculate_voltage_divider,
    calculate_led_circuit,
    calculate_power_supply,
    generate_truth_table,
    CIRCUIT_TYPES
)
import math


class CircuitAnalyzer:
    def __init__(self, circuit_data: CircuitData):
        self.data = circuit_data
        self.faults = []
        self.warnings = []
        self.logs = []
        self.topology = "Unknown"
        self.analysis_results = {}

    def log(self, step: str):
        self.logs.append(step)

    def analyze(self) -> Dict[str, Any]:
        """
        Main analysis pipeline.
        """
        self.log("Step 1: Identifying Circuit Components and Topology.")

        # Detect circuit type
        circuit_type = detect_circuit_type(self.data)
        self.topology = CIRCUIT_TYPES.get(circuit_type, "Unknown Circuit")
        self.log(f"Detected circuit type: {self.topology}")

        # Get component lists
        opamps = [c for c in self.data.components if c.type == 'OpAmp']
        resistors = [c for c in self.data.components if c.type == 'Resistor']
        capacitors = [c for c in self.data.components if c.type == 'Capacitor']
        inductors = [c for c in self.data.components if c.type == 'Inductor']
        regulators = [c for c in self.data.components if c.type in ['Regulator', 'VoltageRegulator']]
        leds = [c for c in self.data.components if c.type == 'LED']

        # Run appropriate analysis based on circuit type
        if circuit_type.startswith("opamp"):
            if opamps:
                self._analyze_opamp_circuit(opamps[0], resistors)
        elif circuit_type in ["rc_lowpass", "rc_highpass"]:
            self._analyze_rc_filter(resistors, capacitors, circuit_type)
        elif circuit_type == "voltage_divider":
            self._analyze_voltage_divider(resistors)
        elif circuit_type == "led_circuit":
            self._analyze_led_circuit(resistors, leds)
        elif circuit_type == "linear_regulator":
            self._analyze_power_supply(regulators)
        elif circuit_type == "logic_gate":
            self._analyze_digital_circuit()
        elif circuit_type == "lc_filter":
            self._analyze_lc_filter(inductors, capacitors)
        else:
            self.log("Basic analysis - specific circuit type not fully implemented.")

        return {
            "topology": self.topology,
            "circuit_type": circuit_type,
            "faults": self.faults,
            "warnings": self.warnings,
            "reasoning_steps": self.logs,
            "analysis_results": self.analysis_results
        }

    def _analyze_opamp_circuit(self, opamp, resistors):
        """Analyze OpAmp circuits."""
        nodes = opamp.nodes
        inv_node = nodes.get("inverting")
        non_inv_node = nodes.get("non_inverting")
        output_node = nodes.get("output")

        # Check supply
        v_pos_val = self._get_supply_voltage("VCC_POS") or 15.0
        v_neg_val = self._get_supply_voltage("VCC_NEG") or -15.0

        self.log(f"Identified OpAmp power rails: +{v_pos_val}V and {v_neg_val}V.")

        # Get input voltage
        input_supply = next((s for s in self.data.supplies if "VCC" not in s.id), None)
        input_voltage = parse_value(input_supply.value) if input_supply else 0.0

        self.log(f"Analyzed Input Signal: {input_supply.id if input_supply else 'None'} = {input_voltage}V")

        # Find feedback and input resistors
        rf = next((r for r in resistors if self._is_connected(r, output_node) and self._is_connected(r, inv_node)), None)
        rin = next((r for r in resistors if self._is_connected(r, inv_node) and r != rf), None)

        if rf and rin:
            if non_inv_node == "GND":
                self.topology = "Inverting Amplifier"
                self.log("Topology Identified: Inverting Amplifier")

                rf_val = parse_value(rf.value)
                rin_val = parse_value(rin.value)

                # Gain Calculation
                gain = -1 * (rf_val / rin_val)
                self.log(f"Calculated Theoretical Gain: - (Rf / Rin) = - ({rf_val} / {rin_val}) = {gain:.2f}")

                expected_vout = gain * input_voltage
                self.log(f"Expected Output Voltage (Vout) = Gain * Vin = {gain:.2f} * {input_voltage}V = {expected_vout:.2f}V")

                # Store analysis results
                self.analysis_results["gain"] = gain
                self.analysis_results["input_voltage"] = input_voltage
                self.analysis_results["expected_output"] = expected_vout
                self.analysis_results["rf"] = rf_val
                self.analysis_results["rin"] = rin_val

                # Check Saturation
                if expected_vout > v_pos_val:
                    self.faults.append(f"Positive Saturation: Expected {expected_vout:.2f}V exceeds supply +{v_pos_val}V.")
                    self.log(f"FAULT DETECTED: The output is clipped at positive rail (+{v_pos_val}V).")
                elif expected_vout < v_neg_val:
                    self.faults.append(f"Negative Saturation: Expected {expected_vout:.2f}V drops below supply {v_neg_val}V.")
                    self.log(f"FAULT DETECTED: The output is clipped at negative rail ({v_neg_val}V).")
                else:
                    self.log("Operation is within linear range (No Saturation).")

                # Check measured vs expected
                measured_vout_str = self.data.measured_outputs.get("VOUT")
                if measured_vout_str:
                    measured_val = parse_value(measured_vout_str)
                    self.analysis_results["measured_output"] = measured_val

    def _analyze_rc_filter(self, resistors, capacitors, filter_type):
        """Analyze RC filter circuits."""
        if not resistors or not capacitors:
            self.log("Insufficient components for RC filter analysis.")
            return

        r = resistors[0]
        c = capacitors[0]

        r_val = parse_value(r.value)
        c_val = parse_value(c.value)

        self.log(f"Identified R = {r_val} ohms, C = {c_val} F")

        # Calculate filter parameters
        filter_data = calculate_rc_filter(r_val, c_val)

        self.analysis_results["filter"] = filter_data
        self.analysis_results["resistance"] = r_val
        self.analysis_results["capacitance"] = c_val

        fc = filter_data["cutoff_frequency"]
        tau = filter_data["time_constant"]

        self.log(f"Cutoff Frequency: fc = 1/(2*pi*R*C) = {fc:.2f} Hz")
        self.log(f"Time Constant: tau = R*C = {tau*1000:.4f} ms")

        # Check for common issues
        if fc < 1:
            self.warnings.append(f"Very low cutoff frequency ({fc:.4f} Hz). Consider smaller R or C values.")
        elif fc > 1e6:
            self.warnings.append(f"Very high cutoff frequency ({fc/1e6:.2f} MHz). May require careful PCB layout.")

        if filter_type == "rc_lowpass":
            self.topology = f"RC Low-Pass Filter (fc = {fc:.2f} Hz)"
        else:
            self.topology = f"RC High-Pass Filter (fc = {fc:.2f} Hz)"

    def _analyze_voltage_divider(self, resistors):
        """Analyze voltage divider circuits."""
        if len(resistors) < 2:
            self.log("Need at least 2 resistors for voltage divider analysis.")
            return

        r1 = resistors[0]
        r2 = resistors[1]

        r1_val = parse_value(r1.value)
        r2_val = parse_value(r2.value)

        # Get input voltage
        vin = self._get_supply_voltage("VCC") or self._get_supply_voltage("VIN") or 5.0

        divider_data = calculate_voltage_divider(r1_val, r2_val, vin)
        self.analysis_results["voltage_divider"] = divider_data

        vout = divider_data["output_voltage"]
        ratio = divider_data["division_ratio"]

        self.log(f"Voltage Divider Analysis:")
        self.log(f"  R1 = {r1_val} ohms, R2 = {r2_val} ohms")
        self.log(f"  Vin = {vin}V")
        self.log(f"  Vout = Vin * (R2 / (R1 + R2)) = {vout:.3f}V")
        self.log(f"  Division Ratio = {ratio:.3f}")

        self.topology = f"Voltage Divider ({vin}V -> {vout:.2f}V)"

    def _analyze_led_circuit(self, resistors, leds):
        """Analyze LED circuits."""
        if not resistors:
            self.faults.append("No current limiting resistor found for LED!")
            return

        r = resistors[0]
        r_val = parse_value(r.value)

        # Typical LED values
        vcc = self._get_supply_voltage("VCC") or 5.0
        vled = 2.0  # Typical red LED forward voltage
        iled = 0.020  # 20mA typical

        led_data = calculate_led_circuit(vcc, vled, iled)
        self.analysis_results["led"] = led_data

        # Calculate actual current with given resistor
        actual_current = (vcc - vled) / r_val
        self.analysis_results["actual_current"] = actual_current

        self.log(f"LED Circuit Analysis:")
        self.log(f"  Supply Voltage: {vcc}V")
        self.log(f"  LED Forward Voltage: {vled}V")
        self.log(f"  Current Limiting Resistor: {r_val} ohms")
        self.log(f"  Calculated Current: {actual_current*1000:.1f} mA")
        self.log(f"  Recommended Resistor (for 20mA): {led_data['resistor_value']:.0f} ohms")

        if actual_current > 0.025:
            self.warnings.append(f"LED current ({actual_current*1000:.1f}mA) may be too high. Consider larger resistor.")
        elif actual_current < 0.005:
            self.warnings.append(f"LED current ({actual_current*1000:.1f}mA) is very low. LED may appear dim.")

        self.topology = f"LED Circuit ({actual_current*1000:.1f}mA)"

    def _analyze_power_supply(self, regulators):
        """Analyze power supply circuits."""
        # Get supply voltages
        vin = self._get_supply_voltage("VIN") or 12.0
        vout = self._get_supply_voltage("VOUT") or 5.0
        iout = 0.5  # Assume 500mA load

        power_data = calculate_power_supply(vin, vout, iout, "linear")
        self.analysis_results["power_supply"] = power_data

        self.log(f"Power Supply Analysis:")
        self.log(f"  Input Voltage: {vin}V")
        self.log(f"  Output Voltage: {vout}V")
        self.log(f"  Output Current: {iout*1000:.0f}mA")
        self.log(f"  Efficiency: {power_data['efficiency']:.1f}%")
        self.log(f"  Power Dissipation: {power_data['power_dissipation']:.2f}W")
        self.log(f"  Junction Temperature: ~{power_data['junction_temperature']:.0f}°C")

        if power_data['efficiency'] < 50:
            self.warnings.append(f"Low efficiency ({power_data['efficiency']:.1f}%). Consider switching regulator.")

        if power_data['junction_temperature'] > 125:
            self.faults.append(f"Junction temperature ({power_data['junction_temperature']:.0f}°C) exceeds safe limit! Add heatsink.")
        elif power_data['junction_temperature'] > 85:
            self.warnings.append(f"Junction temperature ({power_data['junction_temperature']:.0f}°C) is high. Consider heatsink.")

        self.topology = f"Linear Regulator ({vin}V -> {vout}V)"

    def _analyze_digital_circuit(self):
        """Analyze digital logic circuits."""
        # Generate truth table for common gates
        gate_types = ["AND", "OR", "NAND", "NOR", "XOR"]

        self.log("Digital Circuit Analysis:")
        self.log("Generating truth tables for common logic gates...")

        truth_tables = {}
        for gate in gate_types:
            truth_tables[gate] = generate_truth_table(gate, 2)

        self.analysis_results["truth_tables"] = truth_tables
        self.topology = "Digital Logic Circuit"

    def _analyze_lc_filter(self, inductors, capacitors):
        """Analyze LC filter circuits."""
        if not inductors or not capacitors:
            self.log("Insufficient components for LC filter analysis.")
            return

        l_val = parse_value(inductors[0].value)
        c_val = parse_value(capacitors[0].value)

        # Resonant frequency: f0 = 1 / (2 * pi * sqrt(L * C))
        f0 = 1 / (2 * math.pi * math.sqrt(l_val * c_val))

        self.analysis_results["lc_filter"] = {
            "inductance": l_val,
            "capacitance": c_val,
            "resonant_frequency": f0
        }

        self.log(f"LC Filter Analysis:")
        self.log(f"  Inductance: {l_val*1000:.3f} mH")
        self.log(f"  Capacitance: {c_val*1e6:.3f} uF")
        self.log(f"  Resonant Frequency: {f0:.2f} Hz")

        self.topology = f"LC Filter (f0 = {f0:.2f} Hz)"

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
