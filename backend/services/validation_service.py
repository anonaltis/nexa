"""
Physics Validation Service

This service validates circuit solutions against physics laws.
Ensures Gemini's suggestions are physically correct before presenting to users.

Key principle: Gemini proposes, FastAPI validates.
"""

from typing import Any
from dataclasses import dataclass
from enum import Enum
import math


class ValidationResult(str, Enum):
    VALID = "valid"
    WARNING = "warning"
    ERROR = "error"


@dataclass
class PhysicsCheck:
    """Result of a single physics validation check."""
    law: str
    formula: str
    expected: float | None
    actual: float
    tolerance: float
    passed: bool
    message: str


class ValidationService:
    """
    Physics validation service.

    Validates circuit calculations against fundamental laws:
    - Ohm's Law: V = IR
    - Kirchhoff's Current Law: Sum of currents at node = 0
    - Kirchhoff's Voltage Law: Sum of voltages in loop = 0
    - Power Law: P = VI = I²R = V²/R
    - Conservation of Energy
    """

    @classmethod
    def validate_ohms_law(
        cls,
        voltage: float,
        current: float,  # in Amps
        resistance: float,
        tolerance: float = 0.05  # 5% tolerance
    ) -> PhysicsCheck:
        """
        Validate that V = IR holds.

        Args:
            voltage: Voltage in Volts
            current: Current in Amps
            resistance: Resistance in Ohms
            tolerance: Acceptable error (default 5%)

        Returns:
            PhysicsCheck with validation result
        """
        expected_v = current * resistance
        error = abs(voltage - expected_v) / max(voltage, 0.001)

        passed = error <= tolerance

        return PhysicsCheck(
            law="Ohm's Law",
            formula="V = I × R",
            expected=expected_v,
            actual=voltage,
            tolerance=tolerance,
            passed=passed,
            message=f"V = {current}A × {resistance}Ω = {expected_v}V (given: {voltage}V, error: {error*100:.1f}%)"
        )

    @classmethod
    def validate_power_dissipation(
        cls,
        voltage: float,
        current: float,  # in Amps
        resistance: float,
        power_rating: float,  # in Watts
        derating_factor: float = 0.5  # Recommend 50% derating
    ) -> PhysicsCheck:
        """
        Validate power dissipation is within component rating.

        Args:
            voltage: Voltage across component
            current: Current through component
            resistance: Component resistance
            power_rating: Maximum rated power (Watts)
            derating_factor: Safety margin (0.5 = 50% of rating)

        Returns:
            PhysicsCheck with validation result
        """
        # Calculate power three ways for verification
        p_vi = voltage * current
        p_i2r = current ** 2 * resistance
        p_v2r = voltage ** 2 / resistance if resistance > 0 else 0

        # Use average for robustness
        actual_power = (p_vi + p_i2r + p_v2r) / 3 if resistance > 0 else p_vi

        safe_power = power_rating * derating_factor
        passed = actual_power <= safe_power

        if actual_power > power_rating:
            message = f"DANGER: {actual_power*1000:.0f}mW exceeds {power_rating*1000:.0f}mW rating!"
        elif actual_power > safe_power:
            message = f"WARNING: {actual_power*1000:.0f}mW exceeds recommended {safe_power*1000:.0f}mW (50% derating)"
        else:
            message = f"OK: {actual_power*1000:.0f}mW within {safe_power*1000:.0f}mW safe limit"

        return PhysicsCheck(
            law="Power Dissipation",
            formula="P = V × I = I²R = V²/R",
            expected=safe_power,
            actual=actual_power,
            tolerance=derating_factor,
            passed=passed,
            message=message
        )

    @classmethod
    def validate_led_circuit(
        cls,
        supply_voltage: float,
        led_forward_voltage: float,
        resistor_value: float,
        target_current_ma: float = 15.0,
        tolerance: float = 0.3  # 30% current tolerance for LEDs
    ) -> dict[str, Any]:
        """
        Comprehensive LED circuit validation.

        Checks:
        1. Voltage drop across resistor
        2. Calculated vs target current
        3. Power dissipation in resistor
        4. LED current within safe range
        """
        results = {
            "is_valid": True,
            "checks": [],
            "warnings": [],
            "errors": [],
            "calculations": {}
        }

        # Calculate actual current
        v_resistor = supply_voltage - led_forward_voltage
        if v_resistor <= 0:
            results["is_valid"] = False
            results["errors"].append(
                f"Supply voltage ({supply_voltage}V) must exceed LED forward voltage ({led_forward_voltage}V)"
            )
            return results

        actual_current_ma = (v_resistor / resistor_value) * 1000
        results["calculations"]["current_ma"] = actual_current_ma
        results["calculations"]["voltage_across_resistor"] = v_resistor

        # Check 1: Current within range of target
        current_error = abs(actual_current_ma - target_current_ma) / target_current_ma
        current_check = PhysicsCheck(
            law="Ohm's Law (LED Circuit)",
            formula="I = (Vs - Vf) / R",
            expected=target_current_ma,
            actual=actual_current_ma,
            tolerance=tolerance,
            passed=current_error <= tolerance,
            message=f"Current: {actual_current_ma:.1f}mA (target: {target_current_ma}mA, error: {current_error*100:.0f}%)"
        )
        results["checks"].append(current_check)

        # Check 2: LED current in safe range (5-25mA typical)
        if actual_current_ma < 5:
            results["warnings"].append(f"LED current ({actual_current_ma:.1f}mA) may be too low for visible brightness")
            results["is_valid"] = False
        elif actual_current_ma > 25:
            results["errors"].append(f"LED current ({actual_current_ma:.1f}mA) exceeds safe limit (20-25mA)")
            results["is_valid"] = False

        # Check 3: Resistor power dissipation
        power_resistor = (actual_current_ma / 1000) ** 2 * resistor_value
        results["calculations"]["power_resistor_mw"] = power_resistor * 1000

        if power_resistor > 0.25:  # Assuming 1/4W resistor
            results["warnings"].append(
                f"Resistor dissipates {power_resistor*1000:.0f}mW - use 1/2W resistor"
            )
        elif power_resistor > 0.5:
            results["errors"].append(
                f"Resistor dissipates {power_resistor*1000:.0f}mW - exceeds 1/2W rating"
            )
            results["is_valid"] = False

        # Suggest correct resistor value
        if not results["is_valid"] or results["warnings"]:
            correct_r = v_resistor / (target_current_ma / 1000)
            results["calculations"]["suggested_resistor"] = correct_r
            results["calculations"]["nearest_standard"] = cls._find_nearest_e24(correct_r)

        return results

    @classmethod
    def validate_voltage_divider(
        cls,
        input_voltage: float,
        r1: float,
        r2: float,
        expected_output: float | None = None,
        max_current_ma: float = 10.0  # Max acceptable quiescent current
    ) -> dict[str, Any]:
        """
        Validate voltage divider circuit.

        Checks:
        1. Output voltage calculation
        2. Quiescent current (power waste)
        3. Output impedance (for load considerations)
        """
        results = {
            "is_valid": True,
            "checks": [],
            "warnings": [],
            "errors": [],
            "calculations": {}
        }

        # Calculate output voltage
        output_voltage = input_voltage * (r2 / (r1 + r2))
        results["calculations"]["output_voltage"] = output_voltage
        results["calculations"]["division_ratio"] = r2 / (r1 + r2)

        # Check 1: Output voltage matches expected
        if expected_output:
            error = abs(output_voltage - expected_output) / expected_output
            voltage_check = PhysicsCheck(
                law="Voltage Divider",
                formula="Vout = Vin × R2/(R1+R2)",
                expected=expected_output,
                actual=output_voltage,
                tolerance=0.05,
                passed=error <= 0.05,
                message=f"Vout = {output_voltage:.3f}V (expected: {expected_output}V, error: {error*100:.1f}%)"
            )
            results["checks"].append(voltage_check)
            if not voltage_check.passed:
                results["warnings"].append(f"Output voltage {output_voltage:.2f}V differs from expected {expected_output}V")

        # Check 2: Quiescent current
        quiescent_current = input_voltage / (r1 + r2) * 1000
        results["calculations"]["quiescent_current_ma"] = quiescent_current

        if quiescent_current > max_current_ma:
            results["warnings"].append(
                f"Quiescent current {quiescent_current:.2f}mA exceeds recommended {max_current_ma}mA. "
                f"Consider using higher resistor values."
            )

        # Check 3: Output impedance
        output_impedance = (r1 * r2) / (r1 + r2)
        results["calculations"]["output_impedance"] = output_impedance

        if output_impedance > 10000:
            results["warnings"].append(
                f"High output impedance ({output_impedance/1000:.1f}kΩ) - output will drop significantly under load"
            )

        # Power dissipation
        power_r1 = (quiescent_current / 1000) ** 2 * r1
        power_r2 = (quiescent_current / 1000) ** 2 * r2
        results["calculations"]["power_r1_mw"] = power_r1 * 1000
        results["calculations"]["power_r2_mw"] = power_r2 * 1000

        return results

    @classmethod
    def validate_rc_filter(
        cls,
        resistance: float,
        capacitance: float,  # in Farads
        expected_cutoff: float | None = None
    ) -> dict[str, Any]:
        """
        Validate RC filter design.

        Checks:
        1. Cutoff frequency calculation
        2. Time constant
        3. Component value reasonableness
        """
        results = {
            "is_valid": True,
            "checks": [],
            "warnings": [],
            "calculations": {}
        }

        # Calculate cutoff frequency
        cutoff_freq = 1 / (2 * math.pi * resistance * capacitance)
        time_constant = resistance * capacitance

        results["calculations"]["cutoff_frequency_hz"] = cutoff_freq
        results["calculations"]["time_constant_ms"] = time_constant * 1000

        # Check against expected
        if expected_cutoff:
            error = abs(cutoff_freq - expected_cutoff) / expected_cutoff
            freq_check = PhysicsCheck(
                law="RC Filter",
                formula="fc = 1/(2πRC)",
                expected=expected_cutoff,
                actual=cutoff_freq,
                tolerance=0.1,
                passed=error <= 0.1,
                message=f"Cutoff: {cutoff_freq:.1f}Hz (target: {expected_cutoff}Hz, error: {error*100:.1f}%)"
            )
            results["checks"].append(freq_check)

        # Warn about extreme values
        if cutoff_freq < 0.1:
            results["warnings"].append(f"Very low cutoff ({cutoff_freq:.3f}Hz) - long settling time")
        elif cutoff_freq > 1e6:
            results["warnings"].append(f"Very high cutoff ({cutoff_freq/1e6:.1f}MHz) - verify capacitor ESL")

        return results

    @classmethod
    def validate_kvl(
        cls,
        voltage_sources: list[float],  # Positive for sources
        voltage_drops: list[float]      # Positive for drops
    ) -> PhysicsCheck:
        """
        Validate Kirchhoff's Voltage Law for a loop.

        Sum of voltage rises = Sum of voltage drops
        """
        total_sources = sum(voltage_sources)
        total_drops = sum(voltage_drops)
        difference = abs(total_sources - total_drops)
        tolerance = max(total_sources, total_drops) * 0.01  # 1% tolerance

        passed = difference <= tolerance

        return PhysicsCheck(
            law="Kirchhoff's Voltage Law",
            formula="ΣV_sources = ΣV_drops",
            expected=total_sources,
            actual=total_drops,
            tolerance=0.01,
            passed=passed,
            message=f"Sources: {total_sources}V, Drops: {total_drops}V, Difference: {difference}V"
        )

    @classmethod
    def validate_component_rating(
        cls,
        component_type: str,
        operating_value: float,
        rated_value: float,
        derating: float = 0.8  # Use 80% of rating
    ) -> PhysicsCheck:
        """
        Validate component is operating within its ratings.
        """
        safe_limit = rated_value * derating
        passed = operating_value <= safe_limit

        if operating_value > rated_value:
            message = f"DANGER: {operating_value} exceeds absolute maximum {rated_value}"
        elif operating_value > safe_limit:
            message = f"WARNING: {operating_value} exceeds recommended limit {safe_limit} (80% derating)"
        else:
            message = f"OK: {operating_value} within safe limit {safe_limit}"

        return PhysicsCheck(
            law="Component Rating",
            formula=f"{component_type} ≤ {derating*100:.0f}% × Rated",
            expected=safe_limit,
            actual=operating_value,
            tolerance=derating,
            passed=passed,
            message=message
        )

    @classmethod
    def _find_nearest_e24(cls, value: float) -> float:
        """Find nearest E24 standard resistor value."""
        e24 = [
            10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30,
            33, 36, 39, 43, 47, 51, 56, 62, 68, 75, 82, 91
        ]

        if value <= 0:
            return 10

        # Find the decade
        decade = 1
        while value >= 100:
            value /= 10
            decade *= 10
        while value < 10:
            value *= 10
            decade /= 10

        # Find nearest E24 value
        nearest = min(e24, key=lambda x: abs(x - value))
        return nearest * decade

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
        Main validation entry point for Gemini function calls.

        Performs comprehensive validation based on circuit type.
        """
        validation = {
            "is_valid": True,
            "validation_status": "valid",
            "physics_checks": [],
            "warnings": [],
            "errors": [],
            "verified_by": []
        }

        # Route to specific validator
        if "led" in circuit_type.lower():
            # Extract LED circuit parameters
            resistor = next((c for c in components if "resistor" in c.get("name", "").lower()), None)
            led = next((c for c in components if "led" in c.get("name", "").lower()), None)

            if resistor and led:
                result = cls.validate_led_circuit(
                    supply_voltage=supply_voltage,
                    led_forward_voltage=led.get("forward_voltage", 2.0),
                    resistor_value=resistor.get("value", 220),
                    target_current_ma=expected_current or 15
                )
                validation.update(result)
                validation["verified_by"].append("Ohm's Law")
                validation["verified_by"].append("Power Dissipation Check")

        elif "voltage_divider" in circuit_type.lower():
            resistors = [c for c in components if "resistor" in c.get("name", "").lower()]
            if len(resistors) >= 2:
                result = cls.validate_voltage_divider(
                    input_voltage=supply_voltage,
                    r1=resistors[0].get("value", 1000),
                    r2=resistors[1].get("value", 1000)
                )
                validation.update(result)
                validation["verified_by"].append("Voltage Divider Formula")

        elif "rc" in circuit_type.lower() or "filter" in circuit_type.lower():
            resistor = next((c for c in components if "resistor" in c.get("name", "").lower()), None)
            capacitor = next((c for c in components if "capacitor" in c.get("name", "").lower()), None)

            if resistor and capacitor:
                result = cls.validate_rc_filter(
                    resistance=resistor.get("value", 1000),
                    capacitance=capacitor.get("value", 1e-6)
                )
                validation.update(result)
                validation["verified_by"].append("RC Filter Equations")

        # Generic power check for all components
        for comp in components:
            if comp.get("value") and comp.get("rating"):
                check = cls.validate_component_rating(
                    component_type=comp.get("name", "Component"),
                    operating_value=comp.get("operating_value", 0),
                    rated_value=comp.get("rating", 100)
                )
                validation["physics_checks"].append({
                    "law": check.law,
                    "passed": check.passed,
                    "message": check.message
                })
                if not check.passed:
                    validation["is_valid"] = False

        # Set final status
        if validation["errors"]:
            validation["validation_status"] = "error"
        elif validation["warnings"]:
            validation["validation_status"] = "warning"
        else:
            validation["validation_status"] = "valid"

        return validation
