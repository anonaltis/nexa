"""
Power Limit Validator

Validates power dissipation against component ratings.
"""

from dataclasses import dataclass
from enum import Enum


class PowerStatus(str, Enum):
    SAFE = "safe"
    WARNING = "warning"
    DANGER = "danger"


@dataclass
class PowerValidationResult:
    """Result of power validation."""
    status: PowerStatus
    calculated_power: float
    max_rating: float
    safe_limit: float  # With derating
    message: str
    recommendation: str | None


class PowerLimitValidator:
    """Validates power dissipation against component ratings."""

    # Standard resistor power ratings
    STANDARD_RATINGS = {
        "1/8W": 0.125,
        "1/4W": 0.25,
        "1/2W": 0.5,
        "1W": 1.0,
        "2W": 2.0,
        "5W": 5.0
    }

    # Derating factor for reliable operation
    DERATING_FACTOR = 0.5  # Use only 50% of rated power

    @classmethod
    def validate_resistor_power(
        cls,
        current_amps: float,
        resistance: float,
        power_rating: float = 0.25  # Default 1/4W
    ) -> PowerValidationResult:
        """
        Validate resistor power dissipation: P = I²R

        Args:
            current_amps: Current through resistor in amps
            resistance: Resistance in ohms
            power_rating: Resistor power rating in watts

        Returns:
            PowerValidationResult with status and recommendation
        """
        calculated_power = current_amps ** 2 * resistance
        safe_limit = power_rating * cls.DERATING_FACTOR

        if calculated_power > power_rating:
            status = PowerStatus.DANGER
            message = f"DANGER: {calculated_power*1000:.1f}mW exceeds {power_rating*1000:.0f}mW rating!"
            recommendation = cls._recommend_higher_rating(calculated_power)
        elif calculated_power > safe_limit:
            status = PowerStatus.WARNING
            message = f"WARNING: {calculated_power*1000:.1f}mW exceeds 50% derating limit ({safe_limit*1000:.0f}mW)"
            recommendation = f"Consider using {cls._recommend_higher_rating(calculated_power)} for better reliability"
        else:
            status = PowerStatus.SAFE
            message = f"OK: {calculated_power*1000:.1f}mW is within safe limit ({safe_limit*1000:.0f}mW)"
            recommendation = None

        return PowerValidationResult(
            status=status,
            calculated_power=calculated_power,
            max_rating=power_rating,
            safe_limit=safe_limit,
            message=message,
            recommendation=recommendation
        )

    @classmethod
    def _recommend_higher_rating(cls, power_needed: float) -> str:
        """Recommend appropriate power rating for given dissipation."""
        for name, rating in cls.STANDARD_RATINGS.items():
            if rating * cls.DERATING_FACTOR > power_needed:
                return f"{name} resistor"
        return "high-power resistor or heatsink"

    @classmethod
    def validate_regulator_power(
        cls,
        input_voltage: float,
        output_voltage: float,
        load_current_amps: float,
        package_thermal_resistance: float = 65.0,  # °C/W for TO-92
        max_junction_temp: float = 125.0,
        ambient_temp: float = 25.0
    ) -> dict:
        """
        Validate linear regulator power dissipation.

        Args:
            input_voltage: Input voltage to regulator
            output_voltage: Regulated output voltage
            load_current_amps: Load current in amps
            package_thermal_resistance: θja in °C/W
            max_junction_temp: Maximum junction temperature
            ambient_temp: Ambient temperature

        Returns:
            Dictionary with thermal analysis
        """
        # Calculate power dissipation
        power_dissipation = (input_voltage - output_voltage) * load_current_amps

        # Calculate junction temperature
        junction_temp = ambient_temp + (power_dissipation * package_thermal_resistance)

        # Determine status
        if junction_temp > max_junction_temp:
            status = "DANGER"
            message = f"Junction temperature {junction_temp:.0f}°C exceeds maximum {max_junction_temp}°C"
        elif junction_temp > max_junction_temp - 20:
            status = "WARNING"
            message = f"Junction temperature {junction_temp:.0f}°C approaching limit"
        else:
            status = "OK"
            message = f"Junction temperature {junction_temp:.0f}°C is safe"

        # Calculate maximum safe current
        max_power = (max_junction_temp - ambient_temp) / package_thermal_resistance
        max_current = max_power / (input_voltage - output_voltage) if (input_voltage - output_voltage) > 0 else 0

        return {
            "power_dissipation_w": power_dissipation,
            "junction_temperature_c": junction_temp,
            "max_junction_temp_c": max_junction_temp,
            "status": status,
            "message": message,
            "max_safe_current_a": max_current,
            "needs_heatsink": power_dissipation > 1.0,
            "formula": "Tj = Ta + (Pd × θja)",
            "calculation": f"Tj = {ambient_temp}°C + ({power_dissipation:.2f}W × {package_thermal_resistance}°C/W) = {junction_temp:.0f}°C"
        }

    @classmethod
    def validate_led_power(
        cls,
        forward_voltage: float,
        forward_current_ma: float,
        max_power_mw: float = 100.0  # Typical LED max
    ) -> PowerValidationResult:
        """
        Validate LED power dissipation.

        Args:
            forward_voltage: LED forward voltage
            forward_current_ma: LED current in milliamps
            max_power_mw: Maximum LED power rating in milliwatts

        Returns:
            PowerValidationResult with status
        """
        forward_current_a = forward_current_ma / 1000
        calculated_power = forward_voltage * forward_current_a
        calculated_power_mw = calculated_power * 1000
        safe_limit_mw = max_power_mw * cls.DERATING_FACTOR

        if calculated_power_mw > max_power_mw:
            status = PowerStatus.DANGER
            message = f"DANGER: LED power {calculated_power_mw:.1f}mW exceeds {max_power_mw:.0f}mW rating!"
            recommendation = "Reduce current or use higher power LED"
        elif calculated_power_mw > safe_limit_mw:
            status = PowerStatus.WARNING
            message = f"WARNING: LED power {calculated_power_mw:.1f}mW exceeds recommended limit"
            recommendation = "Consider reducing current for longer LED life"
        else:
            status = PowerStatus.SAFE
            message = f"OK: LED power {calculated_power_mw:.1f}mW is within safe limit"
            recommendation = None

        return PowerValidationResult(
            status=status,
            calculated_power=calculated_power,
            max_rating=max_power_mw / 1000,
            safe_limit=safe_limit_mw / 1000,
            message=message,
            recommendation=recommendation
        )
