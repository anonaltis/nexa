"""
Ohm's Law Validator

Validates calculations against V = IR.
"""

from dataclasses import dataclass


@dataclass
class OhmsLawResult:
    """Result of Ohm's Law validation."""
    is_valid: bool
    expected_value: float
    actual_value: float
    error_percentage: float
    message: str


class OhmsLawValidator:
    """Validates circuit calculations against Ohm's Law."""

    TOLERANCE = 0.05  # 5% tolerance

    @classmethod
    def validate_current(
        cls,
        voltage: float,
        resistance: float,
        claimed_current: float
    ) -> OhmsLawResult:
        """
        Validate current calculation: I = V / R

        Args:
            voltage: Voltage in volts
            resistance: Resistance in ohms
            claimed_current: The current value to validate (amps)

        Returns:
            OhmsLawResult with validation details
        """
        if resistance <= 0:
            return OhmsLawResult(
                is_valid=False,
                expected_value=float('inf'),
                actual_value=claimed_current,
                error_percentage=100,
                message="Invalid resistance (must be > 0)"
            )

        expected = voltage / resistance
        error = abs(claimed_current - expected) / max(expected, 1e-9)

        return OhmsLawResult(
            is_valid=error <= cls.TOLERANCE,
            expected_value=expected,
            actual_value=claimed_current,
            error_percentage=error * 100,
            message=f"I = {voltage}V / {resistance}Ω = {expected:.4f}A (claimed: {claimed_current}A)"
        )

    @classmethod
    def validate_voltage(
        cls,
        current: float,
        resistance: float,
        claimed_voltage: float
    ) -> OhmsLawResult:
        """
        Validate voltage calculation: V = I × R

        Args:
            current: Current in amps
            resistance: Resistance in ohms
            claimed_voltage: The voltage value to validate

        Returns:
            OhmsLawResult with validation details
        """
        expected = current * resistance
        error = abs(claimed_voltage - expected) / max(expected, 1e-9)

        return OhmsLawResult(
            is_valid=error <= cls.TOLERANCE,
            expected_value=expected,
            actual_value=claimed_voltage,
            error_percentage=error * 100,
            message=f"V = {current}A × {resistance}Ω = {expected:.4f}V (claimed: {claimed_voltage}V)"
        )

    @classmethod
    def validate_resistance(
        cls,
        voltage: float,
        current: float,
        claimed_resistance: float
    ) -> OhmsLawResult:
        """
        Validate resistance calculation: R = V / I

        Args:
            voltage: Voltage in volts
            current: Current in amps
            claimed_resistance: The resistance value to validate

        Returns:
            OhmsLawResult with validation details
        """
        if current <= 0:
            return OhmsLawResult(
                is_valid=False,
                expected_value=float('inf'),
                actual_value=claimed_resistance,
                error_percentage=100,
                message="Invalid current (must be > 0)"
            )

        expected = voltage / current
        error = abs(claimed_resistance - expected) / max(expected, 1e-9)

        return OhmsLawResult(
            is_valid=error <= cls.TOLERANCE,
            expected_value=expected,
            actual_value=claimed_resistance,
            error_percentage=error * 100,
            message=f"R = {voltage}V / {current}A = {expected:.4f}Ω (claimed: {claimed_resistance}Ω)"
        )

    @classmethod
    def calculate_led_resistor(
        cls,
        supply_voltage: float,
        led_forward_voltage: float,
        desired_current_ma: float
    ) -> dict:
        """
        Calculate LED current limiting resistor.

        Args:
            supply_voltage: Supply voltage (Vs)
            led_forward_voltage: LED forward voltage (Vf)
            desired_current_ma: Desired LED current in milliamps

        Returns:
            Dictionary with calculated values and validation
        """
        if supply_voltage <= led_forward_voltage:
            return {
                "valid": False,
                "error": "Supply voltage must exceed LED forward voltage",
                "formula": "R = (Vs - Vf) / I"
            }

        voltage_across_resistor = supply_voltage - led_forward_voltage
        current_amps = desired_current_ma / 1000
        resistance = voltage_across_resistor / current_amps

        # Find nearest standard value
        e24 = [10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39, 43, 47, 51, 56, 62, 68, 75, 82, 91]
        multipliers = [1, 10, 100, 1000, 10000]

        standard_values = [v * m for v in e24 for m in multipliers]
        nearest_standard = min(standard_values, key=lambda x: abs(x - resistance))

        # Calculate actual current with standard resistor
        actual_current = (voltage_across_resistor / nearest_standard) * 1000

        return {
            "valid": True,
            "formula": "R = (Vs - Vf) / I",
            "calculation": f"R = ({supply_voltage}V - {led_forward_voltage}V) / {desired_current_ma}mA",
            "calculated_resistance": resistance,
            "nearest_standard": nearest_standard,
            "actual_current_ma": actual_current,
            "power_dissipation_mw": (actual_current / 1000) ** 2 * nearest_standard * 1000,
            "verification": {
                "law": "Ohm's Law",
                "status": "VERIFIED"
            }
        }
