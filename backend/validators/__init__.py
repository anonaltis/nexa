"""
Physics Validators Module

Provides validation functions for electronics calculations.
These ensure Gemini's suggestions comply with physics laws.
"""

from .ohms_law import OhmsLawValidator
from .power_limits import PowerLimitValidator
from .component_ratings import ComponentRatingValidator

__all__ = [
    "OhmsLawValidator",
    "PowerLimitValidator",
    "ComponentRatingValidator"
]
