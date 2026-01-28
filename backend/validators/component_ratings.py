"""
Component Rating Validator

Validates operating conditions against component specifications.
"""

from dataclasses import dataclass
from typing import Any


@dataclass
class RatingCheckResult:
    """Result of a rating check."""
    parameter: str
    operating_value: float
    max_rating: float
    is_within_spec: bool
    margin_percent: float
    message: str


class ComponentRatingValidator:
    """Validates component operating conditions against specifications."""

    # Common component specifications
    COMPONENT_SPECS = {
        "esp32": {
            "vcc_min": 2.2,
            "vcc_max": 3.6,
            "gpio_current_max": 40,  # mA
            "gpio_voltage_max": 3.3,
            "operating_temp_min": -40,
            "operating_temp_max": 85
        },
        "arduino_nano": {
            "vcc_min": 5.0,
            "vcc_max": 5.0,
            "vin_min": 7,
            "vin_max": 12,
            "gpio_current_max": 40,  # mA
            "gpio_voltage_max": 5.0,
            "total_current_max": 200  # mA from VCC
        },
        "lm7805": {
            "vin_min": 7,
            "vin_max": 35,
            "vout": 5.0,
            "iout_max": 1500,  # mA
            "dropout": 2.0
        },
        "led_standard": {
            "vf_red": 1.8,
            "vf_green": 2.2,
            "vf_blue": 3.2,
            "if_max": 30,  # mA
            "if_typical": 15,  # mA
            "vr_max": 5  # Reverse voltage
        },
        "resistor_1_4w": {
            "power_max": 0.25
        },
        "capacitor_electrolytic": {
            "voltage_derating": 0.8  # Use 80% of rated voltage
        }
    }

    @classmethod
    def check_voltage_rating(
        cls,
        component_type: str,
        operating_voltage: float
    ) -> RatingCheckResult:
        """
        Check if operating voltage is within component spec.

        Args:
            component_type: Type of component (e.g., "esp32", "arduino_nano")
            operating_voltage: The voltage being applied

        Returns:
            RatingCheckResult with validation details
        """
        specs = cls.COMPONENT_SPECS.get(component_type.lower(), {})

        vcc_max = specs.get("vcc_max") or specs.get("vin_max") or specs.get("gpio_voltage_max", 5.0)
        vcc_min = specs.get("vcc_min") or specs.get("vin_min", 0)

        if operating_voltage > vcc_max:
            margin = ((operating_voltage - vcc_max) / vcc_max) * 100
            return RatingCheckResult(
                parameter="voltage",
                operating_value=operating_voltage,
                max_rating=vcc_max,
                is_within_spec=False,
                margin_percent=-margin,
                message=f"DANGER: {operating_voltage}V exceeds maximum {vcc_max}V by {margin:.1f}%"
            )
        elif operating_voltage < vcc_min:
            margin = ((vcc_min - operating_voltage) / vcc_min) * 100
            return RatingCheckResult(
                parameter="voltage",
                operating_value=operating_voltage,
                max_rating=vcc_max,
                is_within_spec=False,
                margin_percent=-margin,
                message=f"WARNING: {operating_voltage}V below minimum {vcc_min}V"
            )
        else:
            margin = ((vcc_max - operating_voltage) / vcc_max) * 100
            return RatingCheckResult(
                parameter="voltage",
                operating_value=operating_voltage,
                max_rating=vcc_max,
                is_within_spec=True,
                margin_percent=margin,
                message=f"OK: {operating_voltage}V within spec ({vcc_min}-{vcc_max}V), {margin:.1f}% margin"
            )

    @classmethod
    def check_current_rating(
        cls,
        component_type: str,
        operating_current_ma: float,
        is_gpio: bool = False
    ) -> RatingCheckResult:
        """
        Check if operating current is within component spec.

        Args:
            component_type: Type of component
            operating_current_ma: Current in milliamps
            is_gpio: Whether this is GPIO current (uses gpio_current_max)

        Returns:
            RatingCheckResult with validation details
        """
        specs = cls.COMPONENT_SPECS.get(component_type.lower(), {})

        if is_gpio:
            max_current = specs.get("gpio_current_max", 40)
        else:
            max_current = specs.get("iout_max") or specs.get("if_max", 40)

        if operating_current_ma > max_current:
            margin = ((operating_current_ma - max_current) / max_current) * 100
            return RatingCheckResult(
                parameter="current",
                operating_value=operating_current_ma,
                max_rating=max_current,
                is_within_spec=False,
                margin_percent=-margin,
                message=f"DANGER: {operating_current_ma}mA exceeds maximum {max_current}mA"
            )
        else:
            margin = ((max_current - operating_current_ma) / max_current) * 100
            return RatingCheckResult(
                parameter="current",
                operating_value=operating_current_ma,
                max_rating=max_current,
                is_within_spec=True,
                margin_percent=margin,
                message=f"OK: {operating_current_ma}mA within spec (max {max_current}mA), {margin:.1f}% margin"
            )

    @classmethod
    def check_led_current(
        cls,
        forward_current_ma: float,
        led_color: str = "red"
    ) -> RatingCheckResult:
        """
        Check LED forward current against typical/maximum ratings.

        Args:
            forward_current_ma: LED current in milliamps
            led_color: LED color for forward voltage reference

        Returns:
            RatingCheckResult with validation details
        """
        specs = cls.COMPONENT_SPECS["led_standard"]
        max_current = specs["if_max"]
        typical_current = specs["if_typical"]

        if forward_current_ma > max_current:
            return RatingCheckResult(
                parameter="led_current",
                operating_value=forward_current_ma,
                max_rating=max_current,
                is_within_spec=False,
                margin_percent=((forward_current_ma - max_current) / max_current) * -100,
                message=f"DANGER: {forward_current_ma}mA will damage LED (max {max_current}mA)"
            )
        elif forward_current_ma < 5:
            return RatingCheckResult(
                parameter="led_current",
                operating_value=forward_current_ma,
                max_rating=max_current,
                is_within_spec=True,
                margin_percent=100,
                message=f"WARNING: {forward_current_ma}mA may be too dim (typical {typical_current}mA)"
            )
        else:
            margin = ((max_current - forward_current_ma) / max_current) * 100
            return RatingCheckResult(
                parameter="led_current",
                operating_value=forward_current_ma,
                max_rating=max_current,
                is_within_spec=True,
                margin_percent=margin,
                message=f"OK: {forward_current_ma}mA is good for LED brightness"
            )

    @classmethod
    def validate_full_circuit(
        cls,
        components: list[dict[str, Any]],
        supply_voltage: float
    ) -> dict:
        """
        Validate all components in a circuit against their ratings.

        Args:
            components: List of components with type, value, and operating conditions
            supply_voltage: Circuit supply voltage

        Returns:
            Dictionary with all validation results
        """
        results = {
            "all_within_spec": True,
            "checks": [],
            "warnings": [],
            "errors": []
        }

        for comp in components:
            comp_type = comp.get("type", "unknown")
            comp_name = comp.get("name", comp_type)

            # Check voltage if applicable
            if "voltage" in comp or supply_voltage:
                voltage = comp.get("voltage", supply_voltage)
                check = cls.check_voltage_rating(comp_type, voltage)
                results["checks"].append({
                    "component": comp_name,
                    "check": check.parameter,
                    "result": check.is_within_spec,
                    "message": check.message
                })
                if not check.is_within_spec:
                    results["all_within_spec"] = False
                    results["errors"].append(check.message)

            # Check current if specified
            if "current" in comp:
                current = comp.get("current")
                is_gpio = comp.get("is_gpio", False)
                check = cls.check_current_rating(comp_type, current, is_gpio)
                results["checks"].append({
                    "component": comp_name,
                    "check": check.parameter,
                    "result": check.is_within_spec,
                    "message": check.message
                })
                if not check.is_within_spec:
                    results["all_within_spec"] = False
                    results["errors"].append(check.message)

        return results

    @classmethod
    def get_component_specs(cls, component_type: str) -> dict:
        """Get specifications for a component type."""
        return cls.COMPONENT_SPECS.get(component_type.lower(), {})
