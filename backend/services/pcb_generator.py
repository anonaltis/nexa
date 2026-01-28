
import os
import json
from typing import Optional, List, Dict, Any
from google import genai
from dotenv import load_dotenv

load_dotenv()

# Load system prompt
PROMPT_PATH = os.path.join(os.path.dirname(__file__), "..", "prompts", "pcb_generation.md")
try:
    with open(PROMPT_PATH, "r") as f:
        SYSTEM_PROMPT = f.read()
except:
    SYSTEM_PROMPT = "You are a PCB design expert. Generate PCB layouts in JSON format."

# Initialize Gemini client
GENAI_API_KEY = os.getenv("GEMINI_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
client = None

if GENAI_API_KEY and GENAI_API_KEY != "MOCK":
    try:
        client = genai.Client(api_key=GENAI_API_KEY, http_options={'api_version': 'v1'})
    except Exception as e:
        print(f"Failed to initialize Gemini client: {e}")
elif GOOGLE_API_KEY:
    try:
        client = genai.Client(api_key=GOOGLE_API_KEY, http_options={'api_version': 'v1'})
    except Exception as e:
        print(f"Failed to initialize Gemini client: {e}")

MODEL_NAME = "gemini-2.5-flash-lite"

# Component library for PCB generation
COMPONENT_LIBRARY = {
    "esp32": {
        "name": "ESP32 DevKit",
        "package": "ESP32-DEVKIT-V1",
        "width": 25.4,
        "height": 48.26,
        "pins": [
            {"name": "3V3", "x": 0, "y": 0},
            {"name": "GND", "x": 0, "y": 2.54},
            {"name": "GPIO4", "x": 0, "y": 7.62},
            {"name": "GPIO21", "x": 0, "y": 20.32},
            {"name": "GPIO22", "x": 0, "y": 22.86},
            {"name": "VIN", "x": 25.4, "y": 0},
        ]
    },
    "dht22": {
        "name": "DHT22 Sensor",
        "package": "DHT22",
        "width": 15.1,
        "height": 25,
        "pins": [
            {"name": "VCC", "x": 0, "y": 0},
            {"name": "DATA", "x": 2.54, "y": 0},
            {"name": "NC", "x": 5.08, "y": 0},
            {"name": "GND", "x": 7.62, "y": 0},
        ]
    },
    "oled_128x64": {
        "name": "OLED 128x64 I2C",
        "package": "OLED-0.96",
        "width": 27,
        "height": 27,
        "pins": [
            {"name": "GND", "x": 0, "y": 0},
            {"name": "VCC", "x": 2.54, "y": 0},
            {"name": "SCL", "x": 5.08, "y": 0},
            {"name": "SDA", "x": 7.62, "y": 0},
        ]
    },
    "resistor": {
        "name": "Resistor",
        "package": "R_AXIAL",
        "width": 10.16,
        "height": 2.5,
        "pins": [
            {"name": "1", "x": 0, "y": 0},
            {"name": "2", "x": 10.16, "y": 0},
        ]
    },
    "capacitor": {
        "name": "Capacitor",
        "package": "C_RADIAL",
        "width": 5,
        "height": 5,
        "pins": [
            {"name": "+", "x": 0, "y": 0},
            {"name": "-", "x": 2.5, "y": 0},
        ]
    },
    "led": {
        "name": "LED",
        "package": "LED_5MM",
        "width": 5,
        "height": 5,
        "pins": [
            {"name": "A", "x": 0, "y": 0},
            {"name": "K", "x": 2.54, "y": 0},
        ]
    },
    "relay": {
        "name": "Relay Module",
        "package": "RELAY_1CH",
        "width": 26,
        "height": 34,
        "pins": [
            {"name": "VCC", "x": 0, "y": 0},
            {"name": "GND", "x": 2.54, "y": 0},
            {"name": "IN", "x": 5.08, "y": 0},
            {"name": "COM", "x": 0, "y": 30},
            {"name": "NO", "x": 2.54, "y": 30},
            {"name": "NC", "x": 5.08, "y": 30},
        ]
    }
}

# Mock PCB for fallback
MOCK_PCB_DATA = {
    "board": {
        "width": 100,
        "height": 80,
        "layers": 2,
        "units": "mm"
    },
    "components": [
        {
            "id": "U1",
            "name": "ESP32 DevKit",
            "package": "ESP32-DEVKIT-V1",
            "x": 37.5,
            "y": 40,
            "rotation": 0,
            "layer": "top",
            "color": "#3b82f6"
        },
        {
            "id": "U2",
            "name": "DHT22 Sensor",
            "package": "DHT22",
            "x": 75,
            "y": 25,
            "rotation": 0,
            "layer": "top",
            "color": "#10b981"
        },
        {
            "id": "U3",
            "name": "OLED Display",
            "package": "OLED-0.96",
            "x": 75,
            "y": 55,
            "rotation": 0,
            "layer": "top",
            "color": "#f59e0b"
        },
        {
            "id": "R1",
            "name": "10K Resistor",
            "package": "R_AXIAL",
            "x": 60,
            "y": 40,
            "rotation": 90,
            "layer": "top",
            "color": "#8b5cf6"
        }
    ],
    "traces": [
        {
            "id": "T1",
            "net": "VCC",
            "width": 0.8,
            "layer": "top",
            "color": "#ef4444",
            "points": [
                {"x": 50, "y": 65},
                {"x": 75, "y": 65},
                {"x": 75, "y": 60}
            ]
        },
        {
            "id": "T2",
            "net": "GND",
            "width": 0.8,
            "layer": "top",
            "color": "#1e293b",
            "points": [
                {"x": 50, "y": 70},
                {"x": 90, "y": 70}
            ]
        },
        {
            "id": "T3",
            "net": "DATA",
            "width": 0.5,
            "layer": "top",
            "color": "#10b981",
            "points": [
                {"x": 50, "y": 50},
                {"x": 60, "y": 50},
                {"x": 60, "y": 35},
                {"x": 75, "y": 35},
                {"x": 75, "y": 30}
            ]
        },
        {
            "id": "T4",
            "net": "SDA",
            "width": 0.5,
            "layer": "top",
            "color": "#f59e0b",
            "points": [
                {"x": 50, "y": 45},
                {"x": 55, "y": 45},
                {"x": 55, "y": 50},
                {"x": 75, "y": 50}
            ]
        },
        {
            "id": "T5",
            "net": "SCL",
            "width": 0.5,
            "layer": "top",
            "color": "#f59e0b",
            "points": [
                {"x": 50, "y": 42},
                {"x": 52, "y": 42},
                {"x": 52, "y": 48},
                {"x": 72, "y": 48},
                {"x": 72, "y": 52}
            ]
        }
    ],
    "mounting_holes": [
        {"x": 5, "y": 5, "diameter": 3.2},
        {"x": 95, "y": 5, "diameter": 3.2},
        {"x": 5, "y": 75, "diameter": 3.2},
        {"x": 95, "y": 75, "diameter": 3.2}
    ],
    "silkscreen": [
        {"type": "text", "content": "ElectroLab PCB", "x": 50, "y": 8, "size": 2},
        {"type": "text", "content": "U1", "x": 30, "y": 35, "size": 1.2},
        {"type": "text", "content": "U2", "x": 82, "y": 20, "size": 1.2},
        {"type": "text", "content": "U3", "x": 82, "y": 50, "size": 1.2}
    ]
}


def generate_svg(pcb_data: Dict[str, Any]) -> str:
    """Generate SVG representation of the PCB."""

    board = pcb_data.get("board", {"width": 100, "height": 80})
    width = board.get("width", 100)
    height = board.get("height", 80)

    # Scale factor for SVG (mm to pixels)
    scale = 4

    svg_parts = [
        f'<svg viewBox="0 0 {width * scale} {height * scale}" xmlns="http://www.w3.org/2000/svg">',
        # Background
        f'<rect width="{width * scale}" height="{height * scale}" fill="#0a1628"/>',
        # Grid pattern
        '<defs>',
        f'<pattern id="grid" width="{10 * scale}" height="{10 * scale}" patternUnits="userSpaceOnUse">',
        f'<path d="M {10 * scale} 0 L 0 0 0 {10 * scale}" fill="none" stroke="#1e3a5f" stroke-width="0.5" opacity="0.5"/>',
        '</pattern>',
        '</defs>',
        f'<rect width="{width * scale}" height="{height * scale}" fill="url(#grid)"/>',
        # Board outline
        f'<rect x="{5 * scale}" y="{5 * scale}" width="{(width - 10) * scale}" height="{(height - 10) * scale}" rx="4" fill="none" stroke="#3b82f6" stroke-width="2"/>',
    ]

    # Draw traces
    for trace in pcb_data.get("traces", []):
        points = trace.get("points", [])
        if len(points) >= 2:
            path_d = f"M {points[0]['x'] * scale} {points[0]['y'] * scale}"
            for point in points[1:]:
                path_d += f" L {point['x'] * scale} {point['y'] * scale}"
            color = trace.get("color", "#3b82f6")
            width_px = trace.get("width", 0.5) * scale
            svg_parts.append(f'<path d="{path_d}" stroke="{color}" stroke-width="{width_px}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')

    # Draw components
    for comp in pcb_data.get("components", []):
        x = comp.get("x", 0) * scale
        y = comp.get("y", 0) * scale
        color = comp.get("color", "#3b82f6")

        # Draw component rectangle
        comp_width = 20 * scale
        comp_height = 12 * scale

        if "ESP32" in comp.get("name", ""):
            comp_width = 25 * scale
            comp_height = 48 * scale / 2
        elif "DHT" in comp.get("name", ""):
            comp_width = 15 * scale
            comp_height = 10 * scale
        elif "OLED" in comp.get("name", ""):
            comp_width = 20 * scale
            comp_height = 15 * scale
        elif "Resistor" in comp.get("name", ""):
            comp_width = 10 * scale
            comp_height = 3 * scale

        svg_parts.append(f'<rect x="{x - comp_width/2}" y="{y - comp_height/2}" width="{comp_width}" height="{comp_height}" rx="2" fill="{color}" fill-opacity="0.2" stroke="{color}" stroke-width="1.5"/>')
        svg_parts.append(f'<text x="{x}" y="{y + 4}" text-anchor="middle" fill="{color}" font-size="10" font-family="monospace">{comp.get("name", "")[:8]}</text>')

    # Draw mounting holes
    for hole in pcb_data.get("mounting_holes", []):
        x = hole.get("x", 0) * scale
        y = hole.get("y", 0) * scale
        r = hole.get("diameter", 3.2) * scale / 2
        svg_parts.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="none" stroke="#475569" stroke-width="1"/>')

    # Draw silkscreen text
    for silk in pcb_data.get("silkscreen", []):
        if silk.get("type") == "text":
            x = silk.get("x", 0) * scale
            y = silk.get("y", 0) * scale
            size = silk.get("size", 1.2) * scale
            svg_parts.append(f'<text x="{x}" y="{y}" text-anchor="middle" fill="#94a3b8" font-size="{size}" font-family="monospace">{silk.get("content", "")}</text>')

    svg_parts.append('</svg>')
    return '\n'.join(svg_parts)


def generate_bom(pcb_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generate Bill of Materials from PCB data."""
    bom = []
    for comp in pcb_data.get("components", []):
        bom.append({
            "reference": comp.get("id", ""),
            "name": comp.get("name", ""),
            "package": comp.get("package", ""),
            "quantity": 1
        })
    return bom


async def generate_pcb(
    components: List[str],
    connections: Optional[List[Dict[str, str]]] = None,
    board_size: Optional[Dict[str, int]] = None,
    project_description: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generate PCB layout from components and connections.

    Args:
        components: List of component names
        connections: List of connections [{from: "U1.PIN", to: "U2.PIN"}]
        board_size: Optional board dimensions {width: mm, height: mm}
        project_description: Optional project description for AI context

    Returns:
        Dictionary with PCB data, SVG, and BOM
    """

    if not client:
        # Return mock PCB if no API key
        pcb_data = MOCK_PCB_DATA.copy()
        return {
            "pcb_data": pcb_data,
            "svg": generate_svg(pcb_data),
            "bom": generate_bom(pcb_data)
        }

    # Build prompt for AI
    prompt = f"""
{SYSTEM_PROMPT}

## Project Requirements

**Components:** {', '.join(components)}

**Connections:** {json.dumps(connections) if connections else 'Auto-route based on component requirements'}

**Board Size:** {f"{board_size['width']}mm x {board_size['height']}mm" if board_size else 'Optimize for component count'}

**Project Description:** {project_description or 'General electronics project'}

Generate a complete PCB layout. Return ONLY the JSON object, no markdown formatting.
"""

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt
        )

        response_text = response.text.strip()

        # Remove markdown code blocks if present
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1])

        try:
            pcb_data = json.loads(response_text)
        except json.JSONDecodeError:
            pcb_data = MOCK_PCB_DATA.copy()

        return {
            "pcb_data": pcb_data,
            "svg": generate_svg(pcb_data),
            "bom": generate_bom(pcb_data)
        }

    except Exception as e:
        print(f"PCB generation error: {e}")
        pcb_data = MOCK_PCB_DATA.copy()
        return {
            "pcb_data": pcb_data,
            "svg": generate_svg(pcb_data),
            "bom": generate_bom(pcb_data),
            "error": str(e)
        }


def get_component_library() -> Dict[str, Any]:
    """Get available component library."""
    return COMPONENT_LIBRARY
