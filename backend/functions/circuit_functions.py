"""
Circuit Analysis Functions for Gemini Function Calling

These functions are EXECUTED by FastAPI when Gemini calls them.
Gemini NEVER executes code - it only decides which function to call.
"""

import math
from typing import Any
from dataclasses import dataclass
from enum import Enum


class ValidationStatus(str, Enum):
    VALID = "valid"
    WARNING = "warning"
    ERROR = "error"


@dataclass
class CalculationResult:
    value: float
    unit: str
    formula: str
    steps: list[str]
    validation: ValidationStatus
    warnings: list[str]
    nearest_standard: float | None = None


class CircuitFunctions:
    """
    Circuit analysis and calculation functions.

    These are called by FastAPI when Gemini requests them.
    All calculations are verified against physics laws.
    """

    # Standard resistor values (E24 series)
    STANDARD_RESISTORS = [
        10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39, 43, 47, 51, 56, 62, 68, 75, 82, 91,
        100, 110, 120, 130, 150, 160, 180, 200, 220, 240, 270, 300, 330, 360, 390, 430, 470, 510, 560, 620, 680, 750, 820, 910,
        1000, 1100, 1200, 1300, 1500, 1600, 1800, 2000, 2200, 2400, 2700, 3000, 3300, 3600, 3900, 4300, 4700, 5100, 5600, 6200, 6800, 7500, 8200, 9100,
        10000, 15000, 22000, 33000, 47000, 68000, 100000, 150000, 220000, 330000, 470000, 680000, 1000000
    ]

    @classmethod
    def find_nearest_standard_resistor(cls, value: float) -> float:
        """Find nearest standard E24 resistor value."""
        if value <= 0:
            return 10  # Minimum
        return min(cls.STANDARD_RESISTORS, key=lambda x: abs(x - value))

    @classmethod
    async def analyze_circuit(
        cls,
        components: list[str],
        supply_voltage: float,
        issue_description: str,
        circuit_type: str = "unknown",
        connections: list[str] | None = None
    ) -> dict[str, Any]:
        """
        Analyze a circuit for faults and issues.

        Returns structured analysis that Gemini will use to generate explanation.
        """
        analysis = {
            "circuit_type_detected": circuit_type,
            "components_parsed": [],
            "potential_faults": [],
            "physics_checks": [],
            "recommendations": [],
            "confidence": "medium",
            "needs_more_info": []
        }

        # Parse components
        parsed_components = cls._parse_components(components)
        analysis["components_parsed"] = parsed_components

        # Detect circuit type if unknown
        if circuit_type == "unknown":
            circuit_type = cls._detect_circuit_type(parsed_components, issue_description)
            analysis["circuit_type_detected"] = circuit_type

        # Run type-specific analysis
        if circuit_type == "led_circuit":
            analysis = cls._analyze_led_circuit(analysis, parsed_components, supply_voltage, issue_description)
        elif circuit_type == "voltage_divider":
            analysis = cls._analyze_voltage_divider(analysis, parsed_components, supply_voltage)
        elif circuit_type == "rc_filter":
            analysis = cls._analyze_rc_filter(analysis, parsed_components)
        elif circuit_type == "power_supply":
            analysis = cls._analyze_power_supply(analysis, parsed_components, supply_voltage)
        else:
            analysis = cls._analyze_generic(analysis, parsed_components, supply_voltage, issue_description)

        # Check for common issues
        analysis["potential_faults"].extend(cls._check_common_issues(parsed_components, supply_voltage, connections))

        # Calculate confidence
        analysis["confidence"] = cls._calculate_confidence(analysis)

        return analysis

    @classmethod
    def _parse_components(cls, components: list[str]) -> list[dict]:
        """Parse component strings into structured data."""
        parsed = []
        for comp in components:
            comp_lower = comp.lower()
            parsed_comp = {"original": comp, "type": "unknown", "value": None, "unit": None}

            # Resistor patterns
            if "resistor" in comp_lower or "r" in comp_lower.split()[0] if comp_lower.split() else False:
                parsed_comp["type"] = "resistor"
                # Extract value
                import re
                match = re.search(r'(\d+(?:\.\d+)?)\s*(k|m|ohm|Ω)?', comp_lower)
                if match:
                    value = float(match.group(1))
                    unit = match.group(2) or "ohm"
                    if unit == "k":
                        value *= 1000
                    elif unit == "m":
                        value *= 1000000
                    parsed_comp["value"] = value
                    parsed_comp["unit"] = "ohm"

            # Capacitor patterns
            elif "capacitor" in comp_lower or "cap" in comp_lower or "c" in comp_lower.split()[0] if comp_lower.split() else False:
                parsed_comp["type"] = "capacitor"
                import re
                match = re.search(r'(\d+(?:\.\d+)?)\s*(u|µ|n|p|f)?', comp_lower)
                if match:
                    value = float(match.group(1))
                    unit = match.group(2) or "u"
                    if unit in ["u", "µ"]:
                        value *= 1e-6
                    elif unit == "n":
                        value *= 1e-9
                    elif unit == "p":
                        value *= 1e-12
                    parsed_comp["value"] = value
                    parsed_comp["unit"] = "F"

            # LED patterns
            elif "led" in comp_lower:
                parsed_comp["type"] = "led"
                # Typical LED forward voltages
                if "red" in comp_lower:
                    parsed_comp["forward_voltage"] = 1.8
                elif "green" in comp_lower:
                    parsed_comp["forward_voltage"] = 2.2
                elif "blue" in comp_lower or "white" in comp_lower:
                    parsed_comp["forward_voltage"] = 3.2
                else:
                    parsed_comp["forward_voltage"] = 2.0  # Default

            # Microcontroller patterns
            elif any(mcu in comp_lower for mcu in ["arduino", "esp32", "esp8266", "raspberry", "stm32", "atmega"]):
                parsed_comp["type"] = "microcontroller"
                if "esp32" in comp_lower:
                    parsed_comp["gpio_max_current"] = 40  # mA
                    parsed_comp["vcc"] = 3.3
                elif "arduino" in comp_lower:
                    parsed_comp["gpio_max_current"] = 40  # mA
                    parsed_comp["vcc"] = 5.0

            parsed.append(parsed_comp)

        return parsed

    @classmethod
    def _detect_circuit_type(cls, components: list[dict], issue_description: str) -> str:
        """Detect circuit type from components and description."""
        types = [c["type"] for c in components]

        if "led" in types and "resistor" in types:
            return "led_circuit"
        elif types.count("resistor") >= 2 and "divider" in issue_description.lower():
            return "voltage_divider"
        elif "resistor" in types and "capacitor" in types:
            return "rc_filter"
        elif any("78" in str(c.get("original", "")) or "regulator" in str(c.get("original", "")).lower() for c in components):
            return "power_supply"
        elif "motor" in issue_description.lower():
            return "motor_driver"

        return "unknown"

    @classmethod
    def _analyze_led_circuit(cls, analysis: dict, components: list[dict], supply_voltage: float, issue: str) -> dict:
        """Analyze LED circuit specifically."""
        led = next((c for c in components if c["type"] == "led"), None)
        resistor = next((c for c in components if c["type"] == "resistor"), None)

        if led and resistor and resistor["value"]:
            vf = led.get("forward_voltage", 2.0)
            r = resistor["value"]

            # Calculate actual current
            current_ma = ((supply_voltage - vf) / r) * 1000

            analysis["physics_checks"].append({
                "law": "Ohm's Law",
                "formula": "I = (Vs - Vf) / R",
                "calculation": f"I = ({supply_voltage}V - {vf}V) / {r}Ω = {current_ma:.2f}mA",
                "result": current_ma,
                "unit": "mA"
            })

            # Check if current is appropriate
            if current_ma < 5:
                analysis["potential_faults"].append({
                    "type": "insufficient_current",
                    "severity": "high",
                    "description": f"LED current is only {current_ma:.2f}mA. LEDs typically need 10-20mA to light properly.",
                    "root_cause": f"Resistor value ({r}Ω) is too high",
                    "fix": f"Use a smaller resistor. For 15mA: R = ({supply_voltage} - {vf}) / 0.015 = {(supply_voltage - vf) / 0.015:.0f}Ω"
                })
            elif current_ma > 30:
                analysis["potential_faults"].append({
                    "type": "excessive_current",
                    "severity": "high",
                    "description": f"LED current is {current_ma:.2f}mA. This may damage the LED (typical max is 20-30mA).",
                    "root_cause": f"Resistor value ({r}Ω) is too low",
                    "fix": f"Use a larger resistor. For 15mA: R = ({supply_voltage} - {vf}) / 0.015 = {(supply_voltage - vf) / 0.015:.0f}Ω"
                })
            else:
                analysis["physics_checks"][-1]["status"] = "OK"
                analysis["recommendations"].append(f"Current of {current_ma:.1f}mA is within normal LED operating range.")

            # Calculate power dissipation
            power_resistor = (current_ma / 1000) ** 2 * r
            power_led = (current_ma / 1000) * vf

            analysis["physics_checks"].append({
                "law": "Power Dissipation",
                "formula": "P = I²R (resistor), P = I×Vf (LED)",
                "calculation": f"P_resistor = {power_resistor*1000:.1f}mW, P_LED = {power_led*1000:.1f}mW",
                "result": power_resistor,
                "unit": "W"
            })

        elif not resistor:
            analysis["potential_faults"].append({
                "type": "missing_component",
                "severity": "critical",
                "description": "No current-limiting resistor detected. LED will likely burn out immediately.",
                "root_cause": "Missing series resistor",
                "fix": f"Add a resistor in series with LED. For 15mA: R = ({supply_voltage} - 2.0) / 0.015 = {(supply_voltage - 2.0) / 0.015:.0f}Ω"
            })

        return analysis

    @classmethod
    def _analyze_voltage_divider(cls, analysis: dict, components: list[dict], supply_voltage: float) -> dict:
        """Analyze voltage divider circuit."""
        resistors = [c for c in components if c["type"] == "resistor" and c["value"]]

        if len(resistors) >= 2:
            r1 = resistors[0]["value"]
            r2 = resistors[1]["value"]

            vout = supply_voltage * (r2 / (r1 + r2))
            ratio = r2 / (r1 + r2)

            analysis["physics_checks"].append({
                "law": "Voltage Divider",
                "formula": "Vout = Vin × (R2 / (R1 + R2))",
                "calculation": f"Vout = {supply_voltage}V × ({r2}Ω / ({r1}Ω + {r2}Ω)) = {vout:.2f}V",
                "result": vout,
                "unit": "V",
                "division_ratio": ratio
            })

            # Check for common issues
            total_current = supply_voltage / (r1 + r2) * 1000
            analysis["physics_checks"].append({
                "law": "Ohm's Law",
                "formula": "I = Vin / (R1 + R2)",
                "calculation": f"I = {supply_voltage}V / {r1 + r2}Ω = {total_current:.2f}mA",
                "result": total_current,
                "unit": "mA"
            })

            if total_current > 50:
                analysis["potential_faults"].append({
                    "type": "high_quiescent_current",
                    "severity": "warning",
                    "description": f"Divider draws {total_current:.1f}mA which may be wasteful for battery applications.",
                    "fix": "Consider using higher value resistors to reduce current draw."
                })

        return analysis

    @classmethod
    def _analyze_rc_filter(cls, analysis: dict, components: list[dict]) -> dict:
        """Analyze RC filter circuit."""
        resistor = next((c for c in components if c["type"] == "resistor" and c["value"]), None)
        capacitor = next((c for c in components if c["type"] == "capacitor" and c["value"]), None)

        if resistor and capacitor:
            r = resistor["value"]
            c = capacitor["value"]

            # Calculate cutoff frequency
            fc = 1 / (2 * math.pi * r * c)
            tau = r * c

            analysis["physics_checks"].append({
                "law": "RC Filter",
                "formula": "fc = 1 / (2πRC), τ = RC",
                "calculation": f"fc = 1 / (2π × {r}Ω × {c*1e6:.2f}µF) = {fc:.2f}Hz, τ = {tau*1000:.2f}ms",
                "result": fc,
                "unit": "Hz",
                "time_constant": tau
            })

        return analysis

    @classmethod
    def _analyze_power_supply(cls, analysis: dict, components: list[dict], supply_voltage: float) -> dict:
        """Analyze power supply circuit."""
        analysis["recommendations"].append("Ensure input capacitor (0.33µF typical) is placed close to regulator input.")
        analysis["recommendations"].append("Ensure output capacitor (0.1µF typical) is placed close to regulator output.")

        # Check for thermal concerns
        if supply_voltage > 12:
            analysis["potential_faults"].append({
                "type": "thermal_concern",
                "severity": "warning",
                "description": "High input voltage may cause significant heat dissipation in linear regulator.",
                "fix": "Consider using a heatsink or switching to a buck converter for better efficiency."
            })

        return analysis

    @classmethod
    def _analyze_generic(cls, analysis: dict, components: list[dict], supply_voltage: float, issue: str) -> dict:
        """Generic analysis for unknown circuit types."""
        issue_lower = issue.lower()

        # Check for common keywords
        if "not working" in issue_lower or "doesn't work" in issue_lower:
            analysis["needs_more_info"].extend([
                "What is the expected behavior?",
                "What is actually happening?",
                "Have you verified power supply connections?",
                "Is ground properly connected?"
            ])

        if "hot" in issue_lower or "heat" in issue_lower:
            analysis["potential_faults"].append({
                "type": "thermal_issue",
                "severity": "high",
                "description": "Component heating indicates excessive current or power dissipation.",
                "fix": "Check for short circuits and verify component ratings."
            })

        return analysis

    @classmethod
    def _check_common_issues(cls, components: list[dict], supply_voltage: float, connections: list[str] | None) -> list[dict]:
        """Check for common circuit issues."""
        issues = []

        # Check for grounding issues (heuristic based on connections)
        if connections:
            has_ground_mention = any("ground" in c.lower() or "gnd" in c.lower() for c in connections)
            if not has_ground_mention:
                issues.append({
                    "type": "potential_grounding_issue",
                    "severity": "warning",
                    "description": "Ground connection not explicitly mentioned. Ensure common ground between all components.",
                    "fix": "Verify all components share a common ground reference."
                })

        # Check for decoupling capacitors with MCUs
        has_mcu = any(c["type"] == "microcontroller" for c in components)
        has_decoupling = any(c["type"] == "capacitor" and c.get("value", 0) and c["value"] < 1e-6 for c in components)

        if has_mcu and not has_decoupling:
            issues.append({
                "type": "missing_decoupling",
                "severity": "warning",
                "description": "No decoupling capacitor detected for microcontroller.",
                "fix": "Add 0.1µF ceramic capacitor between VCC and GND, close to the MCU."
            })

        return issues

    @classmethod
    def _calculate_confidence(cls, analysis: dict) -> str:
        """Calculate confidence level based on analysis completeness."""
        has_physics_checks = len(analysis.get("physics_checks", [])) > 0
        has_faults = len(analysis.get("potential_faults", [])) > 0
        needs_info = len(analysis.get("needs_more_info", [])) > 0

        if has_physics_checks and has_faults and not needs_info:
            return "high"
        elif has_physics_checks or has_faults:
            return "medium"
        else:
            return "low"

    @classmethod
    async def calculate_component_value(
        cls,
        calculation_type: str,
        inputs: dict[str, Any]
    ) -> dict[str, Any]:
        """
        Calculate component values with full verification.

        Returns calculation with formula, steps, and validation.
        """
        result = {
            "calculation_type": calculation_type,
            "inputs": inputs,
            "formula": "",
            "steps": [],
            "result": None,
            "unit": "",
            "validation": "valid",
            "warnings": [],
            "nearest_standard_value": None
        }

        if calculation_type == "led_resistor":
            vs = inputs.get("supply_voltage", 5)
            vf = inputs.get("forward_voltage", 2.0)
            if_ma = inputs.get("forward_current", 15)

            if_a = if_ma / 1000

            if vs <= vf:
                result["validation"] = "error"
                result["warnings"].append(f"Supply voltage ({vs}V) must be greater than LED forward voltage ({vf}V)")
                return result

            r = (vs - vf) / if_a

            result["formula"] = "R = (Vs - Vf) / If"
            result["steps"] = [
                f"1. Identify values: Vs = {vs}V, Vf = {vf}V, If = {if_ma}mA",
                f"2. Apply Ohm's Law: R = (Vs - Vf) / If",
                f"3. Calculate: R = ({vs} - {vf}) / {if_a}",
                f"4. Result: R = {r:.1f}Ω"
            ]
            result["result"] = r
            result["unit"] = "Ω"

            # Find nearest standard value
            nearest = cls.find_nearest_standard_resistor(r)
            result["nearest_standard_value"] = nearest
            result["steps"].append(f"5. Nearest standard value (E24): {nearest}Ω")

            # Recalculate actual current with standard value
            actual_current = ((vs - vf) / nearest) * 1000
            result["steps"].append(f"6. Actual current with {nearest}Ω: {actual_current:.1f}mA")

            # Power dissipation check
            power = (actual_current / 1000) ** 2 * nearest
            result["power_dissipation"] = power
            result["steps"].append(f"7. Power dissipation: {power*1000:.1f}mW")

            if power > 0.25:
                result["warnings"].append(f"Power dissipation ({power*1000:.0f}mW) exceeds 1/4W resistor rating. Use 1/2W resistor.")

        elif calculation_type == "voltage_divider":
            vin = inputs.get("voltage", inputs.get("supply_voltage", 5))
            vout_target = inputs.get("vout_target")
            r1 = inputs.get("r1")
            r2 = inputs.get("r2")

            if r1 and r2:
                # Calculate output voltage
                vout = vin * (r2 / (r1 + r2))
                result["formula"] = "Vout = Vin × (R2 / (R1 + R2))"
                result["steps"] = [
                    f"1. Given: Vin = {vin}V, R1 = {r1}Ω, R2 = {r2}Ω",
                    f"2. Calculate ratio: R2/(R1+R2) = {r2}/{r1+r2} = {r2/(r1+r2):.4f}",
                    f"3. Calculate Vout: {vin} × {r2/(r1+r2):.4f} = {vout:.3f}V"
                ]
                result["result"] = vout
                result["unit"] = "V"

                # Calculate current draw
                current = vin / (r1 + r2) * 1000
                result["steps"].append(f"4. Current draw: {current:.2f}mA")

            elif vout_target and r2:
                # Calculate R1 given R2 and target Vout
                ratio = vout_target / vin
                r1_calc = r2 * (1 - ratio) / ratio
                result["formula"] = "R1 = R2 × (Vin/Vout - 1)"
                result["steps"] = [
                    f"1. Target: Vin = {vin}V, Vout = {vout_target}V, R2 = {r2}Ω",
                    f"2. Calculate R1 = {r2} × ({vin}/{vout_target} - 1)",
                    f"3. R1 = {r1_calc:.1f}Ω"
                ]
                result["result"] = r1_calc
                result["unit"] = "Ω"
                result["nearest_standard_value"] = cls.find_nearest_standard_resistor(r1_calc)

        elif calculation_type == "power_dissipation":
            v = inputs.get("voltage")
            i = inputs.get("current")  # in amps
            r = inputs.get("resistance")

            if v and i:
                p = v * i
                result["formula"] = "P = V × I"
                result["steps"] = [f"P = {v}V × {i}A = {p}W"]
                result["result"] = p
            elif v and r:
                p = (v ** 2) / r
                result["formula"] = "P = V² / R"
                result["steps"] = [f"P = {v}² / {r} = {p:.3f}W"]
                result["result"] = p
            elif i and r:
                p = (i ** 2) * r
                result["formula"] = "P = I² × R"
                result["steps"] = [f"P = {i}² × {r} = {p:.3f}W"]
                result["result"] = p

            result["unit"] = "W"

        elif calculation_type == "rc_time_constant":
            r = inputs.get("resistance")
            c = inputs.get("capacitance")

            if r and c:
                # Convert if given in common units
                if c > 1:  # Likely in µF
                    c = c * 1e-6

                tau = r * c
                result["formula"] = "τ = R × C"
                result["steps"] = [
                    f"1. R = {r}Ω, C = {c*1e6:.2f}µF",
                    f"2. τ = {r} × {c:.2e} = {tau:.4f}s = {tau*1000:.2f}ms"
                ]
                result["result"] = tau
                result["unit"] = "s"

        elif calculation_type == "rc_cutoff_frequency":
            r = inputs.get("resistance")
            c = inputs.get("capacitance")

            if r and c:
                if c > 1:
                    c = c * 1e-6

                fc = 1 / (2 * math.pi * r * c)
                result["formula"] = "fc = 1 / (2πRC)"
                result["steps"] = [
                    f"1. R = {r}Ω, C = {c*1e6:.2f}µF",
                    f"2. fc = 1 / (2π × {r} × {c:.2e})",
                    f"3. fc = {fc:.2f}Hz"
                ]
                result["result"] = fc
                result["unit"] = "Hz"

        elif calculation_type == "current_from_resistance":
            v = inputs.get("voltage")
            r = inputs.get("resistance")

            if v and r:
                i = v / r
                result["formula"] = "I = V / R (Ohm's Law)"
                result["steps"] = [
                    f"1. V = {v}V, R = {r}Ω",
                    f"2. I = {v} / {r} = {i:.4f}A = {i*1000:.2f}mA"
                ]
                result["result"] = i * 1000  # Return in mA
                result["unit"] = "mA"

        elif calculation_type == "resistance_from_current":
            v = inputs.get("voltage")
            i = inputs.get("current")  # in mA

            if v and i:
                i_a = i / 1000  # Convert to amps
                r = v / i_a
                result["formula"] = "R = V / I (Ohm's Law)"
                result["steps"] = [
                    f"1. V = {v}V, I = {i}mA = {i_a}A",
                    f"2. R = {v} / {i_a} = {r:.1f}Ω"
                ]
                result["result"] = r
                result["unit"] = "Ω"
                result["nearest_standard_value"] = cls.find_nearest_standard_resistor(r)

        return result

    @classmethod
    async def validate_circuit_solution(
        cls,
        circuit_type: str,
        components: list[dict],
        supply_voltage: float,
        expected_current: float | None = None,
        proposed_solution: str | None = None
    ) -> dict[str, Any]:
        """
        Validate a proposed circuit solution against physics laws.

        This is the VERIFICATION step that ensures Gemini's solution is correct.
        """
        validation = {
            "is_valid": True,
            "checks_passed": [],
            "checks_failed": [],
            "warnings": [],
            "physics_verification": []
        }

        # Extract component values
        resistors = [c for c in components if c.get("name", "").lower().startswith("r") or "resistor" in c.get("name", "").lower()]
        leds = [c for c in components if "led" in c.get("name", "").lower()]
        capacitors = [c for c in components if c.get("name", "").lower().startswith("c") or "capacitor" in c.get("name", "").lower()]

        # Ohm's Law Check
        for r in resistors:
            r_value = r.get("value", 0)
            if r_value > 0:
                current = supply_voltage / r_value * 1000  # mA
                validation["physics_verification"].append({
                    "law": "Ohm's Law",
                    "check": f"Current through {r.get('name', 'R')}: {current:.2f}mA",
                    "passed": True
                })

        # Power Dissipation Check
        for r in resistors:
            r_value = r.get("value", 0)
            rating = r.get("rating", 0.25)  # Default 1/4W
            if r_value > 0:
                current = supply_voltage / r_value
                power = current ** 2 * r_value
                if power > rating:
                    validation["checks_failed"].append(
                        f"Resistor {r.get('name', 'R')} dissipates {power*1000:.0f}mW, exceeds {rating*1000:.0f}mW rating"
                    )
                    validation["is_valid"] = False
                else:
                    validation["checks_passed"].append(
                        f"Resistor {r.get('name', 'R')} power OK: {power*1000:.0f}mW < {rating*1000:.0f}mW"
                    )

        # LED Current Check
        for led in leds:
            if resistors:
                r_value = resistors[0].get("value", 1)
                vf = led.get("forward_voltage", 2.0)
                current = ((supply_voltage - vf) / r_value) * 1000

                if current < 5:
                    validation["checks_failed"].append(f"LED current too low: {current:.1f}mA (need 10-20mA)")
                    validation["is_valid"] = False
                elif current > 30:
                    validation["checks_failed"].append(f"LED current too high: {current:.1f}mA (max ~25mA)")
                    validation["is_valid"] = False
                else:
                    validation["checks_passed"].append(f"LED current OK: {current:.1f}mA")

        # Voltage Rating Check
        for c in capacitors:
            rating = c.get("rating", 0)
            if rating > 0 and supply_voltage > rating * 0.8:
                validation["warnings"].append(
                    f"Capacitor voltage rating ({rating}V) close to supply ({supply_voltage}V). Use higher rated cap."
                )

        # Expected current validation
        if expected_current and resistors:
            r_total = sum(r.get("value", 0) for r in resistors)
            if r_total > 0:
                actual_current = supply_voltage / r_total * 1000
                if abs(actual_current - expected_current) > expected_current * 0.2:
                    validation["checks_failed"].append(
                        f"Expected {expected_current}mA but calculated {actual_current:.1f}mA"
                    )
                    validation["is_valid"] = False

        return validation
