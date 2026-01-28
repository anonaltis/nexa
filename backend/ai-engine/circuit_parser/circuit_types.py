
from typing import Dict, Any, List, Optional
from circuit_parser.models import CircuitData, Component
from circuit_parser.utils import parse_value
import math

# Circuit type identifiers
CIRCUIT_TYPES = {
    "opamp_inverting": "Inverting Amplifier",
    "opamp_non_inverting": "Non-Inverting Amplifier",
    "opamp_buffer": "Voltage Follower (Buffer)",
    "opamp_differential": "Differential Amplifier",
    "rc_lowpass": "RC Low-Pass Filter",
    "rc_highpass": "RC High-Pass Filter",
    "lc_filter": "LC Filter",
    "rlc_filter": "RLC Filter",
    "voltage_divider": "Voltage Divider",
    "led_circuit": "LED Circuit",
    "transistor_switch": "Transistor Switch",
    "transistor_amplifier": "Transistor Amplifier",
    "linear_regulator": "Linear Voltage Regulator",
    "buck_converter": "Buck Converter",
    "boost_converter": "Boost Converter",
    "logic_gate": "Logic Gate Circuit",
    "flip_flop": "Flip-Flop Circuit",
    "555_timer": "555 Timer Circuit",
    "unknown": "Unknown Circuit"
}


def detect_circuit_type(circuit_data: CircuitData) -> str:
    """Detect the type of circuit based on components."""
    components = circuit_data.components

    # Get component types
    opamps = [c for c in components if c.type == 'OpAmp']
    resistors = [c for c in components if c.type == 'Resistor']
    capacitors = [c for c in components if c.type == 'Capacitor']
    inductors = [c for c in components if c.type == 'Inductor']
    transistors = [c for c in components if c.type in ['BJT', 'MOSFET', 'Transistor']]
    diodes = [c for c in components if c.type == 'Diode']
    leds = [c for c in components if c.type == 'LED']
    regulators = [c for c in components if c.type in ['Regulator', 'VoltageRegulator']]
    timers = [c for c in components if '555' in str(c.id).upper()]
    logic_ics = [c for c in components if c.type in ['IC', 'LogicGate']]

    # Detection logic
    if opamps:
        return detect_opamp_type(opamps[0], resistors)
    elif regulators:
        return "linear_regulator"
    elif timers:
        return "555_timer"
    elif transistors and not capacitors:
        if leds or diodes:
            return "transistor_switch"
        return "transistor_amplifier"
    elif logic_ics:
        return "logic_gate"
    elif resistors and capacitors and not inductors:
        return detect_rc_filter_type(resistors, capacitors, circuit_data)
    elif inductors and capacitors:
        return "lc_filter"
    elif resistors and inductors and capacitors:
        return "rlc_filter"
    elif resistors and leds:
        return "led_circuit"
    elif len(resistors) == 2 and not capacitors and not inductors:
        return "voltage_divider"

    return "unknown"


def detect_opamp_type(opamp: Component, resistors: List[Component]) -> str:
    """Detect specific OpAmp configuration."""
    nodes = opamp.nodes if isinstance(opamp.nodes, dict) else {}
    non_inv = nodes.get("non_inverting", "")
    inv = nodes.get("inverting", "")
    output = nodes.get("output", "")

    # Check for buffer (output connected to inverting input)
    if output == inv or (non_inv and not inv):
        return "opamp_buffer"

    # Check for feedback path
    has_feedback = any(
        is_connected_between(r, inv, output)
        for r in resistors
    )

    if has_feedback:
        # Non-inverting grounded = inverting amplifier
        if non_inv == "GND" or non_inv == "0":
            return "opamp_inverting"
        else:
            return "opamp_non_inverting"

    return "opamp_non_inverting"


def detect_rc_filter_type(resistors: List[Component], capacitors: List[Component], circuit_data: CircuitData) -> str:
    """Detect if RC circuit is low-pass or high-pass."""
    # Simple heuristic based on component arrangement
    # In reality, this would need node analysis

    if resistors and capacitors:
        # Check if capacitor is connected to output (low-pass)
        # or in series with input (high-pass)
        # For now, default to low-pass as it's more common
        return "rc_lowpass"

    return "unknown"


def is_connected_between(component: Component, node1: str, node2: str) -> bool:
    """Check if component is connected between two nodes."""
    if isinstance(component.nodes, list):
        return node1 in component.nodes and node2 in component.nodes
    elif isinstance(component.nodes, dict):
        values = list(component.nodes.values())
        return node1 in values and node2 in values
    return False


def calculate_rc_filter(resistance: float, capacitance: float) -> Dict[str, Any]:
    """Calculate RC filter parameters."""
    # Cutoff frequency: fc = 1 / (2 * pi * R * C)
    fc = 1 / (2 * math.pi * resistance * capacitance)

    # Time constant: tau = R * C
    tau = resistance * capacitance

    # Generate Bode plot data
    bode_data = []
    for exp in range(-2, 5):
        for mult in [1, 2, 5]:
            f = mult * (10 ** exp)
            # Low-pass transfer function magnitude: 1 / sqrt(1 + (f/fc)^2)
            # In dB: -20 * log10(sqrt(1 + (f/fc)^2))
            magnitude_db = -10 * math.log10(1 + (f / fc) ** 2)
            # Phase: -arctan(f/fc)
            phase = -math.degrees(math.atan(f / fc))
            bode_data.append({
                "frequency": f,
                "magnitude_db": round(magnitude_db, 2),
                "phase_deg": round(phase, 2)
            })

    return {
        "cutoff_frequency": fc,
        "time_constant": tau,
        "bode_data": bode_data,
        "bandwidth": fc,
        "filter_type": "Low-Pass"
    }


def calculate_voltage_divider(r1: float, r2: float, vin: float) -> Dict[str, Any]:
    """Calculate voltage divider output."""
    vout = vin * (r2 / (r1 + r2))
    ratio = r2 / (r1 + r2)

    return {
        "output_voltage": vout,
        "division_ratio": ratio,
        "input_voltage": vin,
        "r1": r1,
        "r2": r2
    }


def calculate_led_circuit(vcc: float, vled: float, iled: float) -> Dict[str, Any]:
    """Calculate LED current limiting resistor."""
    # R = (Vcc - Vled) / Iled
    r_needed = (vcc - vled) / iled
    power = (vcc - vled) * iled

    return {
        "resistor_value": r_needed,
        "power_dissipation": power,
        "led_current": iled,
        "led_voltage": vled
    }


def generate_truth_table(gate_type: str, num_inputs: int = 2) -> Dict[str, Any]:
    """Generate truth table for logic gates."""
    if num_inputs < 1 or num_inputs > 4:
        num_inputs = 2

    inputs = []
    outputs = []

    for i in range(2 ** num_inputs):
        input_row = []
        for j in range(num_inputs):
            input_row.append((i >> (num_inputs - 1 - j)) & 1)
        inputs.append(input_row)

        # Calculate output based on gate type
        if gate_type.upper() == "AND":
            outputs.append(1 if all(input_row) else 0)
        elif gate_type.upper() == "OR":
            outputs.append(1 if any(input_row) else 0)
        elif gate_type.upper() == "NAND":
            outputs.append(0 if all(input_row) else 1)
        elif gate_type.upper() == "NOR":
            outputs.append(0 if any(input_row) else 1)
        elif gate_type.upper() == "XOR":
            outputs.append(sum(input_row) % 2)
        elif gate_type.upper() == "XNOR":
            outputs.append(1 - (sum(input_row) % 2))
        elif gate_type.upper() == "NOT" and num_inputs == 1:
            outputs.append(1 - input_row[0])
        else:
            outputs.append(0)

    return {
        "gate_type": gate_type,
        "num_inputs": num_inputs,
        "inputs": inputs,
        "outputs": outputs
    }


def calculate_power_supply(vin: float, vout: float, iout: float, regulator_type: str = "linear") -> Dict[str, Any]:
    """Calculate power supply parameters."""
    if regulator_type == "linear":
        # Linear regulator
        power_in = vin * iout
        power_out = vout * iout
        power_loss = power_in - power_out
        efficiency = (power_out / power_in) * 100 if power_in > 0 else 0

        # Thermal calculation (assuming Rth = 50°C/W for TO-220)
        rth = 50  # °C/W
        temp_rise = power_loss * rth
        junction_temp = 25 + temp_rise  # Assuming 25°C ambient

        return {
            "input_voltage": vin,
            "output_voltage": vout,
            "output_current": iout,
            "power_input": power_in,
            "power_output": power_out,
            "power_dissipation": power_loss,
            "efficiency": efficiency,
            "thermal_resistance": rth,
            "temperature_rise": temp_rise,
            "junction_temperature": junction_temp,
            "regulator_type": "Linear"
        }
    else:
        # Switching regulator (simplified)
        efficiency = 85  # Typical efficiency
        power_out = vout * iout
        power_in = power_out / (efficiency / 100)

        return {
            "input_voltage": vin,
            "output_voltage": vout,
            "output_current": iout,
            "power_input": power_in,
            "power_output": power_out,
            "power_dissipation": power_in - power_out,
            "efficiency": efficiency,
            "regulator_type": "Switching"
        }
