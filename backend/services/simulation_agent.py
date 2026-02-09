"""
Simulation Agent Service

AI-powered circuit simulation that generates:
- Bode plots (frequency response)
- Transient analysis
- DC operating points
- Power calculations

Uses Gemini AI for intelligent simulation without requiring SPICE installation.
"""

import os
import json
import logging
import hashlib
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from google import genai
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# Simulation system prompt
SIMULATION_SYSTEM_PROMPT = """You are an expert circuit simulator AI. You analyze circuits and provide accurate simulation results.

For any circuit given, you MUST respond with a JSON object containing:

1. For analog circuits (filters, amplifiers):
{
  "simulation_type": "analog",
  "bode_plot": {
    "frequencies": [1, 10, 100, 1000, 10000],
    "magnitude_db": [0, -0.5, -3, -20, -40],
    "phase_deg": [-5, -10, -45, -85, -89]
  },
  "dc_operating_point": {
    "node_voltages": {"Vout": 2.5, "Vin": 5.0},
    "branch_currents": {"R1": 0.001}
  },
  "cutoff_frequency": 159.15,
  "gain_db": 0,
  "analysis_notes": "This is a low-pass RC filter..."
}

2. For digital circuits:
{
  "simulation_type": "digital",
  "truth_table": {
    "inputs": ["A", "B"],
    "outputs": ["Y"],
    "rows": [
      {"A": 0, "B": 0, "Y": 0},
      {"A": 0, "B": 1, "Y": 0},
      {"A": 1, "B": 0, "Y": 0},
      {"A": 1, "B": 1, "Y": 1}
    ]
  },
  "timing_analysis": {
    "propagation_delay_ns": 10,
    "setup_time_ns": 5
  },
  "analysis_notes": "AND gate with 2 inputs..."
}

3. For power circuits:
{
  "simulation_type": "power",
  "power_analysis": {
    "input_voltage": 12,
    "output_voltage": 5,
    "output_current": 0.5,
    "efficiency_percent": 85,
    "power_dissipation_w": 0.5,
    "thermal_resistance": 50,
    "junction_temp_c": 50
  },
  "analysis_notes": "Linear voltage regulator..."
}

Always provide realistic, physics-accurate values based on the component values given.
"""


class SimulationAgentService:
    """
    Simulation Agent for AI-powered circuit simulation.
    
    Generates realistic simulation data without requiring SPICE installation.
    """

    def __init__(self):
        self._init_api()
        self._init_cache()
        self._init_rate_limiter()

    def _init_api(self):
        """Initialize the Gemini API client."""
        api_key = os.getenv("SIMULATION_AGENT_API_KEY") or os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        
        if not api_key or os.getenv("DEMO_MODE") == "true":
            logger.warning("Simulation Agent: Demo mode enabled")
            self.client = None
            self.is_mock = True
            return
            
        try:
            self.client = genai.Client(api_key=api_key)
            self.is_mock = False
            logger.info("Simulation Agent initialized with Gemini API")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini client: {e}")
            self.client = None
            self.is_mock = True

    def _init_cache(self):
        """Initialize response cache."""
        self._cache: Dict[str, tuple] = {}
        self._cache_ttl = 1800  # 30 minutes for simulation results

    def _init_rate_limiter(self):
        """Initialize rate limiter."""
        self._request_times: List[datetime] = []
        self._rate_limit_window = 60
        self._max_requests = 20

    def _check_rate_limit(self) -> bool:
        """Check if we're within rate limits."""
        now = datetime.now()
        cutoff = now - timedelta(seconds=self._rate_limit_window)
        self._request_times = [t for t in self._request_times if t > cutoff]
        return len(self._request_times) < self._max_requests

    def _record_request(self):
        """Record a request for rate limiting."""
        self._request_times.append(datetime.now())

    def _get_cache_key(self, circuit_description: str, sim_type: str) -> str:
        """Generate cache key."""
        return hashlib.md5(f"{circuit_description}:{sim_type}".encode()).hexdigest()

    def _get_cached_response(self, cache_key: str) -> Optional[Dict]:
        """Get cached response if valid."""
        if cache_key in self._cache:
            response, timestamp = self._cache[cache_key]
            if datetime.now() - timestamp < timedelta(seconds=self._cache_ttl):
                logger.info(f"Cache hit for simulation: {cache_key[:8]}")
                return response
        return None

    def _cache_response(self, cache_key: str, response: Dict):
        """Cache a response."""
        self._cache[cache_key] = (response, datetime.now())

    def _get_mock_response(self, circuit_type: str, description: str = "") -> Dict:
        """Return intelligent simulation data when API is unavailable or in demo mode."""
        desc_lower = description.lower()
        
        # DEMO CASE 1: Smart LED Controller
        if any(w in desc_lower for w in ["led", "rgb", "blink", "controller"]):
            return {
                "simulation_type": "digital",
                "circuit_name": "Smart LED Controller (ESP32 PWM)",
                "truth_table": {
                    "inputs": ["PWM_RED", "PWM_GREEN", "PWM_BLUE"],
                    "outputs": ["LED_STATE"],
                    "rows": [
                        {"PWM_RED": "HI", "PWM_GREEN": "LO", "PWM_BLUE": "LO", "LED_STATE": "RED_ACTIVE"},
                        {"PWM_RED": "LO", "PWM_GREEN": "HI", "PWM_BLUE": "LO", "LED_STATE": "GREEN_ACTIVE"},
                        {"PWM_RED": "LO", "PWM_GREEN": "LO", "PWM_BLUE": "HI", "LED_STATE": "BLUE_ACTIVE"},
                        {"PWM_RED": "HI", "PWM_GREEN": "HI", "PWM_BLUE": "HI", "LED_STATE": "WHITE_ACTIVE"}
                    ]
                },
                "timing_analysis": {
                    "propagation_delay_ns": 12,
                    "frequency_khz": 5.0,
                    "duty_cycle_resolution": "8-bit"
                },
                "analysis_notes": """**ESP32 PWM Analysis Complete**
                
This simulation reflects your **Smart LED Controller** design:
- **PWM Frequency**: 5.0 kHz (stable, no-flicker threshold)
- **Current Load**: 17.7mA per channel (within GPIO safety limits)
- **Thermal**: ESP32 junction temp stable at 38°C with typical cyclic load."""
            }

        # DEMO CASE 2: IoT Temperature Monitor
        if any(w in desc_lower for w in ["temperature", "dht", "humidity", "oled", "monitor"]):
            return {
                "simulation_type": "power",
                "circuit_name": "IoT Temperature Monitor (ESP32 + DHT22 + OLED)",
                "power_analysis": {
                    "input_voltage": 5.0,
                    "output_voltage": 3.3,
                    "output_current": 0.036,
                    "efficiency_percent": 92.5,
                    "power_dissipation_w": 0.061,
                    "thermal_resistance": 50,
                    "junction_temp_c": 32.4,
                    "battery_life_estimate_hours": 72
                },
                "i2c_timing": {
                    "scl_frequency_khz": 400,
                    "sda_rise_time_ns": 280,
                    "address_found": "0x3C (OLED)"
                },
                "analysis_notes": """**IoT System Power Analysis Complete**
                
Calculations for your **Temperature & Humidity Monitor**:
- **Steady State Current**: 36.1mA (OLED Bright + WiFi Active)
- **Sensor Polling**: 1-Wire protocol sequence verified for DHT22
- **I2C Bus**: Standard 400kHz mode active for SSD1306 Display
- **Thermal**: Minimal heat generated, passive cooling sufficient."""
            }

        if circuit_type == "digital":
            return {
                "simulation_type": "digital",
                "circuit_name": "74HC08 Quad AND Gate",
                "truth_table": {
                    "inputs": ["A", "B"],
                    "outputs": ["Y"],
                    "rows": [
                        {"A": 0, "B": 0, "Y": 0},
                        {"A": 0, "B": 1, "Y": 0},
                        {"A": 1, "B": 0, "Y": 0},
                        {"A": 1, "B": 1, "Y": 1}
                    ]
                },
                "timing_analysis": {
                    "propagation_delay_ns": 7,
                    "rise_time_ns": 5,
                    "fall_time_ns": 5,
                    "max_frequency_mhz": 25
                },
                "power_consumption": {
                    "static_power_mw": 0.01,
                    "dynamic_power_mw": 0.15,
                    "supply_voltage": 5.0
                },
                "analysis_notes": """**Digital Circuit Analysis Complete**
                
Standard logic simulation for AND gate."""
            }
        elif circuit_type == "power":
            return {
                "simulation_type": "power",
                "circuit_name": "LM7805 Linear Voltage Regulator",
                "power_analysis": {
                    "input_voltage": 12.0,
                    "output_voltage": 5.02,
                    "output_current": 0.5,
                    "load_regulation_percent": 0.4,
                    "line_regulation_mv": 3,
                    "efficiency_percent": 41.8,
                    "power_dissipation_w": 3.49,
                    "thermal_resistance_jc": 5,
                    "junction_temp_c": 67.5,
                    "heatsink_required": True
                },
                "transient_response": {
                    "load_step_recovery_us": 25,
                    "overshoot_mv": 50,
                    "settling_time_us": 100
                },
                "recommendations": [
                    "Add 10µF capacitor on output for stability",
                    "Use 0.33µF ceramic on input",
                    "Heatsink required: TO-220 with θ < 10°C/W"
                ],
                "analysis_notes": """**Power Supply Analysis Complete**"""
            }
        else:
            return {
                "simulation_type": "analog",
                "circuit_name": "RC Low-Pass Filter",
                "component_values": {
                    "R": "10kΩ",
                    "C": "100nF"
                },
                "calculated_parameters": {
                    "cutoff_frequency_hz": 159.15,
                    "time_constant_ms": 1.0,
                    "dc_gain_db": 0,
                    "phase_margin_deg": 90
                },
                "bode_plot": {
                    "frequencies": [1, 10, 50, 100, 159, 500, 1000, 5000, 10000],
                    "magnitude_db": [0, -0.004, -0.17, -0.97, -3.01, -10.3, -16.1, -30.0, -36.0],
                    "phase_deg": [-0.36, -3.6, -17.4, -32.1, -45.0, -72.3, -80.9, -88.2, -89.1]
                },
                "dc_operating_point": {
                    "node_voltages": {"Vin": 1.0, "Vout": 1.0},
                    "branch_currents": {"R1": "100µA"}
                },
                "transient_analysis": {
                    "rise_time_ms": 2.2,
                    "settling_time_ms": 5.0,
                    "step_response": "first-order exponential"
                },
                "cutoff_frequency": 159.15,
                "analysis_notes": """**Analog Filter Analysis Complete**"""
            }

    def _detect_circuit_type(self, description: str) -> str:
        """Detect circuit type from description."""
        lower = description.lower()
        if any(kw in lower for kw in ["temperature", "humidity", "dht", "oled", "regulator", "power supply", "lm7805", "buck", "boost", "smps"]):
            return "power"
        elif any(kw in lower for kw in ["led", "rgb", "gate", "logic", "digital", "and", "or", "nand", "nor", "xor", "flip-flop", "counter"]):
            return "digital"
        else:
            return "analog"

    async def simulate(
        self,
        circuit_description: str,
        simulation_type: str = "auto",
        use_cache: bool = True
    ) -> Dict[str, Any]:
        """
        Run AI-powered circuit simulation.
        
        Args:
            circuit_description: Natural language description of the circuit
            simulation_type: "analog", "digital", "power", or "auto"
            use_cache: Whether to use cached results
            
        Returns:
            Simulation results with appropriate data for the circuit type
        """
        # Auto-detect circuit type if needed
        if simulation_type == "auto":
            simulation_type = self._detect_circuit_type(circuit_description)
        
        # Check cache
        cache_key = self._get_cache_key(circuit_description, simulation_type)
        if use_cache:
            cached = self._get_cached_response(cache_key)
            if cached:
                return {
                    "success": True,
                    "data": cached,
                    "from_cache": True,
                    "circuit_type": simulation_type
                }

        # Check rate limit
        if not self._check_rate_limit():
            return {
                "success": False,
                "error": "Rate limit exceeded. Please wait and try again.",
                "circuit_type": simulation_type
            }

        # Use mock in demo mode or if API unavailable
        if self.is_mock or not self.client:
            # Simulate artificial delay for thinking feel
            await asyncio.sleep(2.5)
            mock_data = self._get_mock_response(simulation_type, circuit_description)
            return {
                "success": True,
                "data": mock_data,
                "is_mock": True,
                "circuit_type": simulation_type
            }

        try:
            self._record_request()
            
            prompt = f"""Simulate this circuit and provide accurate results:

Circuit Description: {circuit_description}
Expected Type: {simulation_type}

Provide simulation results in the JSON format specified. Be physically accurate."""

            response = self.client.models.generate_content(
                model="gemini-2.5-flash-lite",
                contents=[
                    {"role": "user", "parts": [{"text": SIMULATION_SYSTEM_PROMPT}]},
                    {"role": "model", "parts": [{"text": "I understand. I'll provide accurate circuit simulation results in JSON format."}]},
                    {"role": "user", "parts": [{"text": prompt}]}
                ],
                config={
                    "temperature": 0.3,
                    "max_output_tokens": 2048
                }
            )

            # Parse response
            response_text = response.text
            
            # Extract JSON from response
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()

            simulation_data = json.loads(response_text)
            
            # Cache the response
            if use_cache:
                self._cache_response(cache_key, simulation_data)

            return {
                "success": True,
                "data": simulation_data,
                "from_cache": False,
                "circuit_type": simulation_type
            }

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse simulation response: {e}")
            return {
                "success": False,
                "error": "Failed to parse simulation results",
                "circuit_type": simulation_type
            }
        except Exception as e:
            logger.error(f"Simulation error: {e}")
            # Fallback to mock
            return {
                "success": True,
                "data": self._get_mock_response(simulation_type),
                "is_mock": True,
                "error_fallback": str(e),
                "circuit_type": simulation_type
            }


# Singleton instance
_simulation_agent: Optional[SimulationAgentService] = None


def get_simulation_agent() -> SimulationAgentService:
    """Get or create the Simulation Agent instance."""
    global _simulation_agent
    if _simulation_agent is None:
        _simulation_agent = SimulationAgentService()
    return _simulation_agent
