"""
Vision Agent Service

AI-powered image analysis for PCB and schematic recognition.
Uses Gemini Vision API for:
- Component extraction from PCB photos
- Schematic-to-netlist conversion
- PCB defect detection
- Circuit recognition from hand-drawn sketches

Agent Design Pattern: Specialized Agent
- Single responsibility: Image analysis
- Integrates with Gemini Vision API (multimodal)
"""

import logging
import os
import base64
import json
from typing import Optional, Dict, Any, List
from enum import Enum
from dataclasses import dataclass
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)


class AnalysisType(str, Enum):
    """Types of image analysis."""
    COMPONENT_EXTRACTION = "component_extraction"
    SCHEMATIC_TO_NETLIST = "schematic_to_netlist"
    PCB_DEFECT_DETECTION = "pcb_defect_detection"
    CIRCUIT_RECOGNITION = "circuit_recognition"
    GENERAL = "general"


@dataclass
class VisionAnalysisResult:
    """Result from vision analysis."""
    analysis_type: AnalysisType
    components: List[Dict[str, Any]]
    connections: List[Dict[str, Any]]
    issues: List[Dict[str, Any]]
    description: str
    confidence: float
    raw_analysis: str
    metadata: Dict[str, Any]


class VisionAgentService:
    """
    Vision Agent for PCB/Schematic Image Analysis.
    
    Capabilities:
    1. Component Extraction: Identify components from PCB images
    2. Schematic-to-Netlist: Convert schematic images to connection data
    3. PCB Defect Detection: Find solder bridges, cold joints, etc.
    4. Circuit Recognition: Understand hand-drawn circuit sketches
    """
    
    ANALYSIS_PROMPTS = {
        AnalysisType.COMPONENT_EXTRACTION: """Analyze this PCB/circuit image and extract all visible components.

Return JSON:
{
    "components": [
        {"name": "R1", "type": "resistor", "value": "10K", "package": "0805", "location": "top-left"},
        {"name": "U1", "type": "IC", "value": "ATmega328P", "package": "DIP-28", "location": "center"}
    ],
    "board_info": {"size": "50x30mm", "layers": 2, "color": "green"},
    "confidence": 0.85,
    "notes": "Any observations"
}""",

        AnalysisType.SCHEMATIC_TO_NETLIST: """Analyze this schematic diagram and extract the netlist.

Return JSON:
{
    "components": [
        {"ref": "R1", "type": "resistor", "value": "10K", "pins": ["1", "2"]},
        {"ref": "C1", "type": "capacitor", "value": "100uF", "pins": ["+", "-"]}
    ],
    "connections": [
        {"net": "VCC", "nodes": ["U1.1", "R1.1", "C1.+"]},
        {"net": "GND", "nodes": ["U1.8", "C1.-"]}
    ],
    "power_rails": ["VCC", "GND"],
    "confidence": 0.8
}""",

        AnalysisType.PCB_DEFECT_DETECTION: """Analyze this PCB image for manufacturing or assembly defects.

Look for:
- Solder bridges (shorts between pads)
- Cold solder joints (dull, grainy appearance)
- Missing components
- Lifted pads
- Burnt components
- Tombstoning
- Wrong polarity

Return JSON:
{
    "defects": [
        {"type": "solder_bridge", "location": "U1 pins 3-4", "severity": "critical", "fix": "Remove excess solder"},
        {"type": "cold_joint", "location": "R3", "severity": "medium", "fix": "Reflow solder"}
    ],
    "overall_quality": "good|fair|poor",
    "confidence": 0.85,
    "recommendations": []
}""",

        AnalysisType.CIRCUIT_RECOGNITION: """Analyze this circuit image (photo, sketch, or diagram) and identify the circuit type and function.

Return JSON:
{
    "circuit_type": "voltage_regulator|amplifier|filter|oscillator|power_supply|led_driver|motor_driver|sensor_interface|other",
    "function": "Brief description of what this circuit does",
    "key_components": ["Component 1", "Component 2"],
    "estimated_values": {"Vout": "5V", "Current": "1A"},
    "similar_designs": ["LM7805 regulator circuit"],
    "confidence": 0.8
}""",

        AnalysisType.GENERAL: """Analyze this electronics-related image and describe what you see.
Identify any components, circuits, or PCBs visible.

Return JSON:
{
    "description": "Detailed description",
    "identified_items": [],
    "suggestions": [],
    "confidence": 0.8
}"""
    }

    def __init__(self):
        self._init_api()
    
    def _init_api(self):
        """Initialize Gemini Vision client."""
        self.api_key = (
            os.getenv("VISION_AGENT_API_KEY") or
            os.getenv("GEMINI_API_KEY") or
            os.getenv("GOOGLE_API_KEY")
        )
        
        if not self.api_key or self.api_key == "MOCK" or os.getenv("DEMO_MODE") == "true":
            logger.warning("Vision Agent: Demo mode enabled")
            self.is_mock = True
            return
        
        self.is_mock = False
        self._client = genai.Client(
            api_key=self.api_key,
            http_options=types.HttpOptions(api_version='v1')
        )
        self.client = self._client.aio
        self.model_name = "gemini-3-flash-preview"  # Vision capable
    
    async def analyze_image(
        self,
        image_data: bytes,
        analysis_type: AnalysisType = AnalysisType.GENERAL,
        mime_type: str = "image/jpeg",
        additional_context: str = None
    ) -> VisionAnalysisResult:
        """
        Analyze an image using Gemini Vision.
        
        Args:
            image_data: Raw image bytes
            analysis_type: Type of analysis to perform
            mime_type: Image MIME type (image/jpeg, image/png, etc.)
            additional_context: Optional user context
            
        Returns:
            VisionAnalysisResult with structured analysis
        """
        if self.is_mock:
            return self._mock_analysis(analysis_type)
        
        try:
            # Build prompt
            system_prompt = self.ANALYSIS_PROMPTS.get(
                analysis_type, 
                self.ANALYSIS_PROMPTS[AnalysisType.GENERAL]
            )
            
            user_prompt = "Analyze this image:"
            if additional_context:
                user_prompt += f"\nContext: {additional_context}"
            
            # Create image part from bytes
            image_part = types.Part.from_bytes(
                data=image_data,
                mime_type=mime_type
            )
            
            # Send to Gemini Vision
            response = await self.client.models.generate_content(
                model=self.model_name,
                contents=[image_part, user_prompt],
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    response_mime_type="application/json"
                )
            )
            
            # Parse response
            result = json.loads(response.text)
            
            return VisionAnalysisResult(
                analysis_type=analysis_type,
                components=result.get("components", []),
                connections=result.get("connections", []),
                issues=result.get("defects", []),
                description=result.get("description", result.get("function", "")),
                confidence=result.get("confidence", 0.8),
                raw_analysis=response.text,
                metadata={
                    "circuit_type": result.get("circuit_type"),
                    "board_info": result.get("board_info"),
                    "overall_quality": result.get("overall_quality"),
                    "recommendations": result.get("recommendations", [])
                }
            )
            
        except json.JSONDecodeError as e:
            logger.warning(f"JSON parse error, returning raw: {e}")
            return VisionAnalysisResult(
                analysis_type=analysis_type,
                components=[],
                connections=[],
                issues=[],
                description=response.text if 'response' in dir() else "Analysis failed",
                confidence=0.5,
                raw_analysis=response.text if 'response' in dir() else "",
                metadata={"parse_error": str(e)}
            )
            
        except Exception as e:
            logger.exception(f"Vision analysis error: {e}")
            return VisionAnalysisResult(
                analysis_type=analysis_type,
                components=[],
                connections=[],
                issues=[],
                description=f"Error: {str(e)}",
                confidence=0.0,
                raw_analysis="",
                metadata={"error": str(e)}
            )
    
    async def analyze_image_from_base64(
        self,
        base64_data: str,
        analysis_type: AnalysisType = AnalysisType.GENERAL,
        mime_type: str = "image/jpeg",
        additional_context: str = None
    ) -> VisionAnalysisResult:
        """Analyze image from base64 string."""
        # Remove data URL prefix if present
        if "," in base64_data:
            base64_data = base64_data.split(",")[1]
        
        image_bytes = base64.b64decode(base64_data)
        return await self.analyze_image(
            image_bytes, analysis_type, mime_type, additional_context
        )
    
    async def analyze_image_from_file(
        self,
        file_path: str,
        analysis_type: AnalysisType = AnalysisType.GENERAL,
        additional_context: str = None
    ) -> VisionAnalysisResult:
        """Analyze image from file path."""
        import mimetypes
        
        mime_type, _ = mimetypes.guess_type(file_path)
        if not mime_type:
            mime_type = "image/jpeg"
        
        with open(file_path, "rb") as f:
            image_bytes = f.read()
        
        return await self.analyze_image(
            image_bytes, analysis_type, mime_type, additional_context
        )
    
    async def extract_components(self, image_data: bytes, mime_type: str = "image/jpeg") -> Dict[str, Any]:
        """Convenience method for component extraction."""
        result = await self.analyze_image(
            image_data,
            AnalysisType.COMPONENT_EXTRACTION,
            mime_type
        )
        return {
            "components": result.components,
            "board_info": result.metadata.get("board_info"),
            "confidence": result.confidence
        }
    
    async def detect_pcb_issues(self, image_data: bytes, mime_type: str = "image/jpeg") -> Dict[str, Any]:
        """Convenience method for PCB defect detection."""
        result = await self.analyze_image(
            image_data,
            AnalysisType.PCB_DEFECT_DETECTION,
            mime_type
        )
        return {
            "defects": result.issues,
            "overall_quality": result.metadata.get("overall_quality", "unknown"),
            "recommendations": result.metadata.get("recommendations", []),
            "confidence": result.confidence
        }
    
    async def schematic_to_netlist(self, image_data: bytes, mime_type: str = "image/jpeg") -> Dict[str, Any]:
        """Convenience method for schematic conversion."""
        result = await self.analyze_image(
            image_data,
            AnalysisType.SCHEMATIC_TO_NETLIST,
            mime_type
        )
        return {
            "components": result.components,
            "connections": result.connections,
            "power_rails": result.metadata.get("power_rails", []),
            "confidence": result.confidence
        }
    
    def _mock_analysis(self, analysis_type: AnalysisType) -> VisionAnalysisResult:
        """Return intelligent analysis for hackathon demo."""
        
        if analysis_type == AnalysisType.COMPONENT_EXTRACTION:
            return VisionAnalysisResult(
                analysis_type=analysis_type,
                components=[
                    {"name": "U1", "type": "MCU", "value": "ESP32-WROOM-32", "package": "Module", "location": "center", "pins": 38},
                    {"name": "U2", "type": "Voltage Regulator", "value": "AMS1117-3.3", "package": "SOT-223", "location": "top-right"},
                    {"name": "R1", "type": "resistor", "value": "10KΩ", "package": "0603", "location": "near U1 EN pin"},
                    {"name": "R2", "type": "resistor", "value": "10KΩ", "package": "0603", "location": "near U1 IO0"},
                    {"name": "R3-R5", "type": "resistor", "value": "220Ω", "package": "0603", "location": "LED array"},
                    {"name": "C1", "type": "capacitor", "value": "10µF", "package": "0805", "location": "U2 output"},
                    {"name": "C2-C4", "type": "capacitor", "value": "100nF", "package": "0402", "location": "decoupling"},
                    {"name": "LED1", "type": "LED", "value": "Red", "package": "0805", "location": "power indicator"},
                    {"name": "LED2-LED4", "type": "LED", "value": "RGB", "package": "0805", "location": "status array"},
                    {"name": "J1", "type": "connector", "value": "USB-C", "package": "SMD", "location": "bottom edge"},
                    {"name": "SW1", "type": "switch", "value": "Reset", "package": "6x6mm", "location": "top-left"},
                    {"name": "SW2", "type": "switch", "value": "Boot", "package": "6x6mm", "location": "top-left"}
                ],
                connections=[
                    {"net": "3V3", "nodes": ["U2.OUT", "U1.3V3", "C1.+", "R1.1", "R2.1"]},
                    {"net": "GND", "nodes": ["U1.GND", "U2.GND", "C1.-", "C2-C4.-", "J1.GND"]},
                    {"net": "EN", "nodes": ["U1.EN", "R1.2", "SW1.1"]},
                    {"net": "IO0", "nodes": ["U1.IO0", "R2.2", "SW2.1"]}
                ],
                issues=[],
                description="""**PCB Component Analysis Complete**

Identified **12 distinct components** on a 2-layer ESP32 development board.

**Key Findings:**
- ESP32-WROOM-32 module as main MCU (WiFi + Bluetooth enabled)
- AMS1117-3.3V linear regulator for power management
- USB-C connector for power and programming
- Standard boot/reset button configuration
- RGB LED array for status indication

**Board Specifications:**
- Estimated Size: 55 × 28mm
- Layer Count: 2 (FR-4)
- Solder Mask: Green
- Silkscreen: White

**Component Density**: Medium (suitable for hand soldering)""",
                confidence=0.92,
                raw_analysis='{"status": "success", "components_found": 12}',
                metadata={
                    "board_info": {"size": "55x28mm", "layers": 2, "color": "green"},
                    "component_count": 12,
                    "overall_quality": "good"
                }
            )
        
        elif analysis_type == AnalysisType.PCB_DEFECT_DETECTION:
            return VisionAnalysisResult(
                analysis_type=analysis_type,
                components=[],
                connections=[],
                issues=[
                    {"type": "cold_joint", "location": "R3 pad 2", "severity": "medium", "fix": "Reflow with proper temperature profile (260°C peak)"},
                    {"type": "insufficient_solder", "location": "U1 pin 15", "severity": "low", "fix": "Add solder paste and reflow"},
                    {"type": "flux_residue", "location": "Near J1 connector", "severity": "cosmetic", "fix": "Clean with IPA and brush"}
                ],
                description="""**PCB Quality Inspection Report**

**Overall Quality: GOOD** ✓

**Issues Found: 3**

| # | Type | Location | Severity | Action Required |
|---|------|----------|----------|-----------------|
| 1 | Cold Solder Joint | R3 pad 2 | ⚠️ Medium | Reflow at 260°C |
| 2 | Insufficient Solder | U1 pin 15 | 🔵 Low | Add solder paste |
| 3 | Flux Residue | Near J1 | 🟢 Cosmetic | Clean with IPA |

**Positive Observations:**
- No solder bridges detected
- Component alignment is accurate
- Via fill appears adequate
- No tombstoning on passives

**Recommendation:** Address medium-severity issue before powering the board.""",
                confidence=0.88,
                raw_analysis='{"status": "success", "defects_found": 3}',
                metadata={
                    "overall_quality": "good",
                    "critical_issues": 0,
                    "medium_issues": 1,
                    "low_issues": 2,
                    "recommendations": [
                        "Reflow R3 before testing",
                        "Clean flux residue for professional appearance"
                    ]
                }
            )
        
        elif analysis_type == AnalysisType.SCHEMATIC_TO_NETLIST:
            return VisionAnalysisResult(
                analysis_type=analysis_type,
                components=[
                    {"ref": "U1", "type": "MCU", "value": "ESP32", "pins": ["3V3", "GND", "EN", "IO0", "TX", "RX"]},
                    {"ref": "R1", "type": "resistor", "value": "10KΩ", "pins": ["1", "2"]},
                    {"ref": "R2", "type": "resistor", "value": "10KΩ", "pins": ["1", "2"]},
                    {"ref": "C1", "type": "capacitor", "value": "10µF", "pins": ["+", "-"]},
                    {"ref": "LED1", "type": "LED", "value": "Red", "pins": ["A", "K"]},
                    {"ref": "R3", "type": "resistor", "value": "220Ω", "pins": ["1", "2"]}
                ],
                connections=[
                    {"net": "VCC", "nodes": ["U1.3V3", "R1.1", "R2.1", "C1.+"]},
                    {"net": "GND", "nodes": ["U1.GND", "C1.-", "LED1.K"]},
                    {"net": "EN", "nodes": ["U1.EN", "R1.2"]},
                    {"net": "IO0", "nodes": ["U1.IO0", "R2.2"]},
                    {"net": "LED_DRIVE", "nodes": ["U1.IO2", "R3.1"]},
                    {"net": "LED_ANODE", "nodes": ["R3.2", "LED1.A"]}
                ],
                issues=[],
                description="""**Schematic Netlist Extraction Complete**

**Components Identified: 6**
**Nets Generated: 6**

**Netlist Summary:**
```
VCC: 3.3V power rail
 ├── U1.3V3
 ├── R1.1 (EN pull-up)
 ├── R2.1 (IO0 pull-up)
 └── C1.+ (decoupling)

GND: Ground reference
 ├── U1.GND
 ├── C1.-
 └── LED1.K

LED_DRIVE: GPIO2 → R3 → LED1
```

**Circuit Function:** ESP32 basic blinky with proper boot configuration""",
                confidence=0.90,
                raw_analysis='{"status": "success", "nets": 6, "components": 6}',
                metadata={
                    "power_rails": ["VCC", "GND"],
                    "estimated_current": "25mA",
                    "complexity": "simple"
                }
            )
        
        else:  # GENERAL or CIRCUIT_RECOGNITION
            return VisionAnalysisResult(
                analysis_type=analysis_type,
                components=[
                    {"name": "U1", "type": "MCU", "value": "ESP32", "package": "Module"},
                    {"name": "Sensor", "type": "Temperature", "value": "DHT22", "package": "Through-hole"},
                    {"name": "Display", "type": "OLED", "value": "SSD1306", "package": "Module"}
                ],
                connections=[
                    {"net": "I2C_SDA", "nodes": ["U1.GPIO21", "Display.SDA"]},
                    {"net": "I2C_SCL", "nodes": ["U1.GPIO22", "Display.SCL"]},
                    {"net": "DHT_DATA", "nodes": ["U1.GPIO4", "Sensor.DATA"]}
                ],
                issues=[],
                description="""**Circuit Recognition Complete**

**Identified Circuit Type:** IoT Environmental Monitor

**Function:** Temperature and humidity monitoring with OLED display

**Key Components:**
1. **ESP32** — Main microcontroller with WiFi capability
2. **DHT22** — Digital temperature/humidity sensor (±0.5°C accuracy)
3. **SSD1306 OLED** — 128×64 pixel display via I2C

**Interface Analysis:**
- I2C bus at GPIO21 (SDA) and GPIO22 (SCL) for OLED
- Single-wire protocol on GPIO4 for DHT22
- Built-in pull-ups sufficient for I2C

**Similar Reference Designs:**
- Adafruit ESP32 Weather Station
- SparkFun Environmental Combo

**Suggested Improvements:**
- Add 10K pull-up on DHT22 data line
- Include 100nF decoupling on sensor VCC""",
                confidence=0.87,
                raw_analysis='{"status": "success", "circuit_type": "iot_sensor"}',
                metadata={
                    "circuit_type": "sensor_interface",
                    "complexity": "intermediate",
                    "estimated_power": "50mA average"
                }
            )


# Singleton instance
_vision_agent_instance: Optional[VisionAgentService] = None


def get_vision_agent() -> VisionAgentService:
    """Get or create Vision Agent instance."""
    global _vision_agent_instance
    if not _vision_agent_instance:
        _vision_agent_instance = VisionAgentService()
    return _vision_agent_instance
