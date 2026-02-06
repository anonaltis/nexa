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
        
        if not api_key:
            logger.warning("No API key found for Simulation Agent")
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

    def _get_mock_response(self, circuit_type: str) -> Dict:
        """Return mock simulation data when API is unavailable."""
        if circuit_type == "digital":
            return {
                "simulation_type": "digital",
                "truth_table": {
                    "inputs": ["A", "B"],
                    "outputs": ["Y"],
                    "rows": [
                        {"A": 0, "B": 0, "Y": 0},
                        {"A": 0, "B": 1, "Y": 1},
                        {"A": 1, "B": 0, "Y": 1},
                        {"A": 1, "B": 1, "Y": 1}
                    ]
                },
                "analysis_notes": "Mock OR gate simulation"
            }
        elif circuit_type == "power":
            return {
                "simulation_type": "power",
                "power_analysis": {
                    "input_voltage": 12,
                    "output_voltage": 5,
                    "output_current": 0.5,
                    "efficiency_percent": 42,
                    "power_dissipation_w": 3.5,
                    "junction_temp_c": 85
                },
                "analysis_notes": "Mock LM7805 regulator simulation"
            }
        else:
            return {
                "simulation_type": "analog",
                "bode_plot": {
                    "frequencies": [1, 10, 100, 1000, 10000],
                    "magnitude_db": [0, -0.04, -3.01, -20, -40],
                    "phase_deg": [-0.57, -5.71, -45, -84.29, -89.43]
                },
                "cutoff_frequency": 100,
                "analysis_notes": "Mock RC low-pass filter simulation (fc = 100Hz)"
            }

    def _detect_circuit_type(self, description: str) -> str:
        """Detect circuit type from description."""
        lower = description.lower()
        if any(kw in lower for kw in ["gate", "logic", "digital", "and", "or", "nand", "nor", "xor", "flip-flop", "counter"]):
            return "digital"
        elif any(kw in lower for kw in ["regulator", "power supply", "lm7805", "buck", "boost", "smps"]):
            return "power"
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

        # Use mock if API unavailable
        if self.is_mock or not self.client:
            mock_data = self._get_mock_response(simulation_type)
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
