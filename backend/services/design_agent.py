"""
Design Agent Service (Dual Agent Architecture)

This service handles circuit design and PCB generation using a dual-agent approach:
1. Generator: Electronics Engineer - creates designs
2. Validator: Senior Physicist - reviews for safety/correctness

Features:
- Separate API key support (DESIGN_AGENT_API_KEY)
- Response caching
- Rate limiting
- Graceful fallbacks
"""

import logging
import os
import hashlib
import json
import asyncio
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from dataclasses import dataclass
from dotenv import load_dotenv

# Note: Using deprecated library for now, migration to google.genai planned
import google.generativeai as genai

# Import electronics tools
from functions.electronics import (
    calculate_resistor_value,
    search_component_datasheet
)
from services.pcb_generator import generate_pcb

load_dotenv()
logger = logging.getLogger(__name__)


@dataclass
class DesignRequest:
    """Input structure for design requests."""
    project_description: str
    components: Optional[List[str]] = None
    constraints: Optional[str] = None
    board_size: Optional[Dict[str, int]] = None


@dataclass
class DesignResponse:
    """Output structure for design responses."""
    content: str
    validation_status: str
    pcb_data: Optional[Dict] = None
    pcb_svg: Optional[str] = None
    bom: Optional[List[Dict]] = None
    is_cached: bool = False
    error: Optional[str] = None


class DesignAgentService:
    """
    Design Agent with Dual-Agent Architecture.
    
    Uses separate API key from Chat Agent to avoid quota conflicts.
    """

    def __init__(self):
        self._init_api()
        self._init_models()
        self._init_cache()
        self._init_rate_limiter()

    def _init_api(self):
        """Initialize API with Design Agent specific key."""
        # Priority: DESIGN_AGENT_API_KEY > GEMINI_API_KEY > GOOGLE_API_KEY
        self.api_key = (
            os.getenv("DESIGN_AGENT_API_KEY") or
            os.getenv("GEMINI_API_KEY") or
            os.getenv("GOOGLE_API_KEY")
        )
        
        if not self.api_key or self.api_key == "MOCK":
            logger.warning("Design Agent: Running in MOCK mode (no API key)")
            self.is_mock = True
            return
        
        self.is_mock = False
        genai.configure(api_key=self.api_key)
        
        # Log which key is being used (masked)
        key_source = "DESIGN_AGENT_API_KEY" if os.getenv("DESIGN_AGENT_API_KEY") else "GEMINI_API_KEY"
        logger.info(f"Design Agent: Initialized with {key_source}")

    def _init_models(self):
        """Initialize Generator and Validator models."""
        if self.is_mock:
            self.generator_model = None
            self.validator_model = None
            return

        self.electronics_tools = [
            calculate_resistor_value,
            search_component_datasheet,
            generate_pcb
        ]

        # Generator: The Creative Electronics Engineer
        self.generator_model = genai.GenerativeModel(
            model_name="gemini-2.0-flash-lite",
            tools=self.electronics_tools,
            system_instruction="""You are an expert Electronics Engineer and Solution Architect.

Key Responsibilities:
1. Design circuits and provide component lists.
2. Troubleshoot diagnosis queries with step-by-step logic.
3. Use the provided tools (calculate_resistor_value, search_component_datasheet) extensively.
4. If user asks for PCB layout or physical board design, USE the 'generate_pcb' tool.
5. For circuit diagrams, provide Mermaid.js 'graph TD' or 'flowchart LR' blocks.

Tone: Helpful, technical but accessible, creative.
Language: Respond in the language the user initiated (Hindi/Urdu/English mix is acceptable)."""
        )

        # Validator: The Strict Senior Physicist
        self.validator_model = genai.GenerativeModel(
            model_name="gemini-2.0-flash-lite",
            system_instruction="""You are a Senior Systems Validation Engineer and Physicist.
Your role is to CRITIQUE the plans and solutions proposed by the Junior Engineer.

You must check for:
1. **Voltage Mismatches**: e.g., connecting 5V logic to 3.3V pins without level shifting.
2. **Missing Safety Components**: e.g., missing flyback diodes on relays/motors.
3. **Hallucinations**: Parts that don't exist or wrong pinouts.
4. **Logical Flaws**: Steps that won't work in the physical world.

Output Format:
If GOOD: Return JSON {"status": "PASS", "comment": "Optional suggestions"}
If FLAWED: Return JSON {"status": "FAIL", "issues": ["errors"], "corrections": ["fixes"]}"""
        )

    def _init_cache(self):
        """Initialize response cache."""
        self._cache: Dict[str, tuple] = {}  # hash -> (response, timestamp)
        self._cache_ttl = 600  # 10 minutes for design requests

    def _init_rate_limiter(self):
        """Initialize rate limiter."""
        self._request_times: List[datetime] = []
        self._rate_limit_window = 60  # seconds
        self._max_requests = 30  # Increased for better testing experience

    def _check_rate_limit(self) -> bool:
        """Check if we're within rate limits."""
        now = datetime.now()
        cutoff = now - timedelta(seconds=self._rate_limit_window)
        self._request_times = [t for t in self._request_times if t > cutoff]
        return len(self._request_times) < self._max_requests

    def _record_request(self):
        """Record a request for rate limiting."""
        self._request_times.append(datetime.now())

    def _get_cache_key(self, query: str) -> str:
        """Generate cache key for a design request."""
        return hashlib.md5(query.encode()).hexdigest()

    def _get_cached(self, key: str) -> Optional[Dict]:
        """Get cached response if valid."""
        if key in self._cache:
            response, timestamp = self._cache[key]
            if datetime.now() - timestamp < timedelta(seconds=self._cache_ttl):
                return response
            del self._cache[key]
        return None

    def _set_cached(self, key: str, response: Dict):
        """Cache a response."""
        self._cache[key] = (response, datetime.now())
        # Limit cache size
        if len(self._cache) > 50:
            oldest = min(self._cache.keys(), key=lambda k: self._cache[k][1])
            del self._cache[oldest]

    async def generate_design(
        self,
        user_query: str,
        use_cache: bool = True
    ) -> Dict[str, Any]:
        """
        Main entry point for design generation.
        
        Args:
            user_query: Natural language design request
            use_cache: Whether to use cached responses
            
        Returns:
            Dict with content, metadata, pcb_data, etc.
        """
        # Check cache first
        if use_cache:
            cache_key = self._get_cache_key(user_query)
            cached = self._get_cached(cache_key)
            if cached:
                cached["is_cached"] = True
                logger.info("Design Agent: Returning cached response")
                return cached

        # Check if mock mode
        if self.is_mock:
            return self._get_mock_response(user_query)

        # Check rate limits
        if not self._check_rate_limit():
            return {
                "content": "⚠️ **Design Agent Busy**\n\nToo many design requests. Please wait a minute.",
                "metadata": {"error": "rate_limited", "retry_after": 60},
                "is_cached": False
            }

        # Run the dual-agent flow
        try:
            result = await self._run_dual_agent_flow(user_query)
            
            # Cache successful response
            if use_cache and result.get("content"):
                self._set_cached(cache_key, result)
            
            return result

        except Exception as e:
            logger.exception("Design Agent: Error in generation")
            return {
                "content": f"Error generating design: {str(e)}",
                "metadata": {"error": str(e)},
                "is_cached": False
            }

    async def _run_dual_agent_flow(self, user_query: str) -> Dict[str, Any]:
        """Execute the Generator -> Validator -> Refinement loop."""
        
        # 1. GENERATION PHASE
        logger.info(f"Design Agent: Generating for: {user_query[:50]}...")
        self._record_request()

        chat = self.generator_model.start_chat(enable_automatic_function_calling=True)
        generator_prompt = f"User Request: {user_query}\n\nProvide a comprehensive solution."

        try:
            response_1 = await chat.send_message_async(generator_prompt)
        except Exception as e:
            if "429" in str(e) or "ResourceExhausted" in str(e):
                return {
                    "content": "⚠️ **API Rate Limit**\n\nDesign Agent quota exceeded. Please wait and try again.",
                    "metadata": {"error": "RateLimit", "details": str(e)},
                    "is_cached": False
                }
            raise

        # Extract PCB data from function calls
        pcb_data = self._extract_pcb_data(chat.history)
        initial_solution = response_1.text

        # 2. VALIDATION PHASE
        self._record_request()
        validation_result = await self._validate_solution(user_query, initial_solution)

        # Build metadata
        metadata = {
            "validation_status": validation_result.get("status", "UNKNOWN"),
            "validator_comments": validation_result.get("comment", "") or validation_result.get("issues", []),
            "pcb_data": pcb_data.get("pcb_data") if pcb_data else None,
            "pcb_svg": pcb_data.get("svg") if pcb_data else None,
            "bom": pcb_data.get("bom") if pcb_data else None
        }

        final_response = initial_solution

        # 3. REFINEMENT PHASE (if validation failed)
        if validation_result.get("status") == "FAIL":
            logger.info("Design Agent: Validation failed, refining...")
            self._record_request()
            
            refinement_prompt = f"""
Your previous solution had CRITICAL issues:
Issues: {validation_result.get('issues', [])}
Corrections: {validation_result.get('corrections', [])}

Please rewrite the solution fixing these errors.
"""
            response_2 = await chat.send_message_async(refinement_prompt)
            final_response = response_2.text
            metadata["refined"] = True
            metadata["refinement_reason"] = validation_result.get("issues", [])

        return {
            "content": final_response,
            "metadata": metadata,
            "is_cached": False
        }

    def _extract_pcb_data(self, history) -> Optional[Dict]:
        """Extract PCB data from chat history."""
        for message in history:
            for part in message.parts:
                if hasattr(part, 'function_response') and part.function_response:
                    if part.function_response.name == "generate_pcb":
                        try:
                            resp_dict = type(part.function_response.response).to_dict(
                                part.function_response.response
                            )
                            logger.info("Design Agent: Extracted PCB data")
                            return resp_dict
                        except Exception as e:
                            logger.warning(f"Failed to extract PCB data: {e}")
        return None

    async def _validate_solution(self, query: str, solution: str) -> Dict:
        """Run validation on a proposed solution."""
        validation_prompt = f"""
Analyze this solution for the request: "{query}"

Proposed Solution:
{solution}

Verify strictly for safety, physics correctness, and logic.
"""
        try:
            response = await self.validator_model.generate_content_async(validation_prompt)
            return self._parse_validator_json(response.text)
        except Exception as e:
            logger.warning(f"Design Agent: Validator failed: {e}")
            return {
                "status": "PASS (Unverified)",
                "comment": "Validation skipped due to system load. Please verify manually."
            }

    def _parse_validator_json(self, text: str) -> Dict:
        """Parse JSON from validator response."""
        try:
            clean = text.strip()
            if "```json" in clean:
                clean = clean.split("```json")[1].split("```")[0]
            elif "```" in clean:
                clean = clean.split("```")[1].split("```")[0]
            return json.loads(clean)
        except json.JSONDecodeError:
            logger.warning(f"Could not parse validator JSON: {text[:100]}")
            return {"status": "PASS", "comment": "Validator response was invalid."}

    def _get_mock_response(self, query: str) -> Dict[str, Any]:
        """Return mock response when no API key."""
        return {
            "content": f"""## Design Response (Demo Mode)

Your request: "{query[:100]}..."

This is a demo response. To get real designs:
1. Add your Gemini API key to `.env`
2. Set `DESIGN_AGENT_API_KEY=your_key`

**What Design Agent can do:**
- Generate circuit designs with component lists
- Create PCB layouts with SVG visualization
- Validate designs for safety issues
- Provide Bill of Materials (BOM)
""",
            "metadata": {
                "validation_status": "MOCK",
                "is_mock": True
            },
            "is_cached": False
        }


# Singleton instance
_design_agent_instance: Optional[DesignAgentService] = None


def get_design_agent() -> DesignAgentService:
    """Get or create the Design Agent singleton."""
    global _design_agent_instance
    if _design_agent_instance is None:
        _design_agent_instance = DesignAgentService()
    return _design_agent_instance
