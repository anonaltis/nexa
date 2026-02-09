
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
        # Explicitly pass the key to avoid SDK choosing an old GOOGLE_API_KEY from shell
        client = genai.Client(api_key=GENAI_API_KEY, http_options={'api_version': 'v1'})
    except Exception as e:
        print(f"Failed to initialize Gemini client: {e}")
elif GOOGLE_API_KEY:
    try:
        client = genai.Client(api_key=GOOGLE_API_KEY, http_options={'api_version': 'v1'})
    except Exception as e:
        print(f"Failed to initialize Gemini client: {e}")

MODEL_NAME = "gemini-1.5-flash"

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
    """Generate modern professional SVG representation of the PCB."""

    board = pcb_data.get("board", {"width": 100, "height": 80})
    width = board.get("width", 100)
    height = board.get("height", 80)

    # Scale factor for SVG (mm to pixels)
    scale = 5

    # Dark Blue Futuristic PCB Theme
    colors = {
        "solder_mask": "#0a1628",        # Dark navy substrate
        "solder_mask_dark": "#050d18",   # Deeper navy for depth
        "copper": "#7a9cbf",             # Silver/light blue traces
        "copper_bright": "#a8c5e8",      # Bright silver highlight
        "substrate": "#0f1d32",          # Dark blue-gray substrate
        "silkscreen": "#8fa8c4",         # Light blue-gray silkscreen
        "via_drill": "#030810",          # Very dark drill holes
        "pad_copper": "#c4d4e8",         # Silver pads
        "trace_vcc": "#ff6b6b",          # Power trace (red accent)
        "trace_gnd": "#5a8fd4",          # Ground trace (blue)
        "trace_signal": "#7a9cbf",       # Signal traces (silver-blue)
        "board_edge": "#1a3050",         # Dark blue edge
        "shadow": "rgba(0,0,0,0.5)",     # Drop shadow
        # Component accent colors
        "chip_body": "#1a2840",          # Dark blue chip body
        "chip_border": "#3a5070",        # Lighter chip border
        "led_green": "#39ff14",          # Bright green LED
        "led_yellow": "#ffff00",         # Yellow LED
        "capacitor": "#4a7ab8",          # Blue capacitor
        "connector_gold": "#c9a84c",     # Gold connectors
    }

    svg_parts = [
        f'<svg viewBox="0 0 {width * scale + 20} {height * scale + 20}" xmlns="http://www.w3.org/2000/svg">',
        
        # Definitions for gradients, filters, and patterns
        '<defs>',
        # Solder mask gradient
        f'''<linearGradient id="solderMaskGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:{colors['solder_mask']};stop-opacity:1" />
            <stop offset="50%" style="stop-color:{colors['substrate']};stop-opacity:1" />
            <stop offset="100%" style="stop-color:{colors['solder_mask_dark']};stop-opacity:1" />
        </linearGradient>''',
        
        # Copper shine gradient
        f'''<linearGradient id="copperGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:{colors['copper_bright']};stop-opacity:1" />
            <stop offset="50%" style="stop-color:{colors['copper']};stop-opacity:1" />
            <stop offset="100%" style="stop-color:#4a6a8a;stop-opacity:1" />
        </linearGradient>''',
        
        # Pad gradient for realistic look
        f'''<radialGradient id="padGradient" cx="30%" cy="30%">
            <stop offset="0%" style="stop-color:{colors['copper_bright']};stop-opacity:1" />
            <stop offset="100%" style="stop-color:{colors['copper']};stop-opacity:1" />
        </radialGradient>''',
        
        # Ground plane pattern (fine crosshatch)
        f'''<pattern id="groundPlane" width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="{colors['solder_mask']}"/>
            <path d="M0,0 L6,6 M6,0 L0,6" stroke="{colors['copper']}" stroke-width="0.2" opacity="0.12"/>
        </pattern>''',
        
        # Fine grid pattern for through-holes
        f'''<pattern id="grid" width="{2.54 * scale}" height="{2.54 * scale}" patternUnits="userSpaceOnUse">
            <circle cx="{1.27 * scale}" cy="{1.27 * scale}" r="0.6" fill="{colors['copper']}" opacity="0.06"/>
        </pattern>''',
        
        # Trace pattern for visual texture
        f'''<pattern id="traceTexture" width="4" height="4" patternUnits="userSpaceOnUse">
            <rect width="4" height="4" fill="transparent"/>
            <line x1="0" y1="0" x2="4" y2="0" stroke="white" stroke-width="0.3" opacity="0.08"/>
        </pattern>''',
        
        # Drop shadow filter
        '''<filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.5"/>
        </filter>''',
        
        # Glow effect for traces (subtle)
        '''<filter id="traceGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="0.8" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>''',
        
        # Inner shadow for components
        '''<filter id="innerShadow">
            <feOffset dx="0" dy="1"/>
            <feGaussianBlur stdDeviation="0.8" result="offset-blur"/>
            <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse"/>
            <feFlood flood-color="black" flood-opacity="0.4" result="color"/>
            <feComposite operator="in" in="color" in2="inverse" result="shadow"/>
            <feComposite operator="over" in="shadow" in2="SourceGraphic"/>
        </filter>''',
        
        # Component shadow filter
        '''<filter id="componentShadow" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="1" dy="2" stdDeviation="1.5" flood-color="#000" flood-opacity="0.5"/>
        </filter>''',
        
        '</defs>',
        
        # Background gradient
        f'''<rect width="100%" height="100%" fill="#0a0f1a"/>
        <rect width="100%" height="100%" fill="url(#groundPlane)" opacity="0.3"/>''',
        
        # PCB board with shadow
        f'<g transform="translate(10, 10)">',
        
        # Board shadow (larger, softer)
        f'<rect x="4" y="4" width="{width * scale}" height="{height * scale}" rx="6" fill="rgba(0,0,0,0.5)" filter="url(#dropShadow)"/>',
        
        # Main board with solder mask
        f'<rect x="0" y="0" width="{width * scale}" height="{height * scale}" rx="4" fill="url(#solderMaskGradient)"/>',
        
        # Solder mask texture overlay
        f'<rect x="0" y="0" width="{width * scale}" height="{height * scale}" rx="4" fill="url(#groundPlane)" opacity="0.5"/>',
        
        # Grid pattern (through-hole positions)
        f'<rect x="0" y="0" width="{width * scale}" height="{height * scale}" rx="4" fill="url(#grid)"/>',
        
        # Board edge (clean professional look)
        f'<rect x="0" y="0" width="{width * scale}" height="{height * scale}" rx="4" fill="none" stroke="{colors["board_edge"]}" stroke-width="2.5"/>',
        
        # Inner edge highlight
        f'<rect x="1.5" y="1.5" width="{width * scale - 3}" height="{height * scale - 3}" rx="3.5" fill="none" stroke="{colors["copper"]}" stroke-width="0.5" opacity="0.2"/>',
    ]

    # Draw ground plane regions (bottom area)
    svg_parts.append(f'''
        <rect x="{6 * scale}" y="{height * scale - 14 * scale}" width="{width * scale - 12 * scale}" height="{10 * scale}" 
              rx="3" fill="{colors['copper']}" opacity="0.08"/>
        <rect x="{6 * scale}" y="{height * scale - 14 * scale}" width="{width * scale - 12 * scale}" height="{10 * scale}" 
              rx="3" fill="url(#groundPlane)" opacity="0.3"/>
    ''')

    # Draw traces with rounded corners and glow
    for trace in pcb_data.get("traces", []):
        points = trace.get("points", [])
        if len(points) >= 2:
            # Determine trace color based on net name
            net = trace.get("net", "").upper()
            if "VCC" in net or "VDD" in net or "3V3" in net or "5V" in net:
                trace_color = colors['trace_vcc']
            elif "GND" in net or "VSS" in net:
                trace_color = colors['trace_gnd']
            else:
                trace_color = trace.get("color", colors['trace_signal'])
            
            width_px = trace.get("width", 0.5) * scale * 1.5
            
            # Create smooth path
            path_d = f"M {points[0]['x'] * scale} {points[0]['y'] * scale}"
            for point in points[1:]:
                path_d += f" L {point['x'] * scale} {point['y'] * scale}"
            
            # Trace shadow
            svg_parts.append(f'<path d="{path_d}" stroke="rgba(0,0,0,0.3)" stroke-width="{width_px + 2}" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(1,1)"/>')
            
            # Copper trace base
            svg_parts.append(f'<path d="{path_d}" stroke="{trace_color}" stroke-width="{width_px}" fill="none" stroke-linecap="round" stroke-linejoin="round" filter="url(#traceGlow)" opacity="0.9"/>')
            
            # Trace highlight
            svg_parts.append(f'<path d="{path_d}" stroke="white" stroke-width="{width_px * 0.3}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.15"/>')
            
            # Add vias at trace endpoints
            for i, point in enumerate(points):
                if i == 0 or i == len(points) - 1:
                    px, py = point['x'] * scale, point['y'] * scale
                    # Via annular ring
                    svg_parts.append(f'<circle cx="{px}" cy="{py}" r="{width_px * 0.8}" fill="url(#padGradient)"/>')
                    # Via drill hole
                    svg_parts.append(f'<circle cx="{px}" cy="{py}" r="{width_px * 0.3}" fill="{colors["via_drill"]}"/>')
                    # Via shine
                    svg_parts.append(f'<circle cx="{px - 1}" cy="{py - 1}" r="{width_px * 0.15}" fill="white" opacity="0.3"/>')

    # Draw components with modern styling
    for comp in pcb_data.get("components", []):
        x = comp.get("x", 0) * scale
        y = comp.get("y", 0) * scale
        comp_id = comp.get("id", "")
        comp_name = comp.get("name", "")

        # Determine component dimensions and styling
        comp_width = 20 * scale
        comp_height = 12 * scale
        num_pins = 4
        pin_spacing = 2.54 * scale
        comp_fill = colors["chip_body"]
        comp_stroke = colors["chip_border"]
        color = comp.get("color", colors["silkscreen"])

        if "ESP32" in comp_name or "CPU" in comp_name or "MCU" in comp_name:
            comp_width = 32 * scale
            comp_height = 32 * scale
            num_pins = 16
        elif "DHT" in comp_name:
            comp_width = 16 * scale
            comp_height = 22 * scale
            num_pins = 4
        elif "OLED" in comp_name or "Display" in comp_name:
            comp_width = 28 * scale
            comp_height = 28 * scale
            num_pins = 4
        elif "Resistor" in comp_name:
            comp_width = 10 * scale
            comp_height = 3 * scale
            num_pins = 2
            comp_fill = "#2a3a50"
        elif "Capacitor" in comp_name:
            comp_width = 8 * scale
            comp_height = 8 * scale
            num_pins = 2
            comp_fill = colors["capacitor"]
            comp_stroke = "#5a8ad0"
        elif "LED" in comp_name:
            comp_width = 6 * scale
            comp_height = 6 * scale
            num_pins = 2
        elif "Relay" in comp_name:
            comp_width = 28 * scale
            comp_height = 36 * scale
            num_pins = 6
        elif "Chip" in comp_name:
            comp_width = 24 * scale
            comp_height = 8 * scale
            num_pins = 8

        # Component shadow
        svg_parts.append(f'<rect x="{x - comp_width/2 + 2}" y="{y - comp_height/2 + 2}" width="{comp_width}" height="{comp_height}" rx="2" fill="rgba(0,0,0,0.5)"/>')

        # Component body - dark blue chip style
        svg_parts.append(f'<rect x="{x - comp_width/2}" y="{y - comp_height/2}" width="{comp_width}" height="{comp_height}" rx="2" fill="{comp_fill}" stroke="{comp_stroke}" stroke-width="1"/>')

        # Special rendering for different component types
        if "ESP32" in comp_name or "CPU" in comp_name or "MCU" in comp_name:
            # Large QFP IC chip with pins on all sides
            inner_margin = 6
            # Inner chip area
            svg_parts.append(f'<rect x="{x - comp_width/2 + inner_margin}" y="{y - comp_height/2 + inner_margin}" width="{comp_width - inner_margin*2}" height="{comp_height - inner_margin*2}" rx="1" fill="#0d1520" stroke="{colors["chip_border"]}" stroke-width="0.5"/>')
            # IC notch (pin 1 indicator) 
            svg_parts.append(f'<circle cx="{x - comp_width/2 + inner_margin + 6}" cy="{y - comp_height/2 + inner_margin + 6}" r="3" fill="{colors["chip_border"]}"/>')
            # Laser text
            svg_parts.append(f'<text x="{x}" y="{y - 8}" text-anchor="middle" fill="{colors["silkscreen"]}" font-size="7" font-family="monospace" font-weight="bold">ESP32</text>')
            svg_parts.append(f'<text x="{x}" y="{y + 2}" text-anchor="middle" fill="{colors["silkscreen"]}" font-size="5" font-family="monospace" opacity="0.7">WROOM-32</text>')
            svg_parts.append(f'<text x="{x}" y="{y + 10}" text-anchor="middle" fill="{colors["silkscreen"]}" font-size="4" font-family="monospace" opacity="0.5">2026-02</text>')
            # Pins on all 4 sides (QFP style)
            pins_per_side = 8
            pin_len = 4
            pin_w = 1.5
            pin_gap = (comp_width - inner_margin*2) / (pins_per_side + 1)
            for i in range(pins_per_side):
                offset = inner_margin + (i + 1) * pin_gap
                # Top pins
                svg_parts.append(f'<rect x="{x - comp_width/2 + offset - pin_w/2}" y="{y - comp_height/2 - pin_len}" width="{pin_w}" height="{pin_len}" fill="{colors["pad_copper"]}"/>')
                # Bottom pins
                svg_parts.append(f'<rect x="{x - comp_width/2 + offset - pin_w/2}" y="{y + comp_height/2}" width="{pin_w}" height="{pin_len}" fill="{colors["pad_copper"]}"/>')
                # Left pins
                svg_parts.append(f'<rect x="{x - comp_width/2 - pin_len}" y="{y - comp_height/2 + offset - pin_w/2}" width="{pin_len}" height="{pin_w}" fill="{colors["pad_copper"]}"/>')
                # Right pins
                svg_parts.append(f'<rect x="{x + comp_width/2}" y="{y - comp_height/2 + offset - pin_w/2}" width="{pin_len}" height="{pin_w}" fill="{colors["pad_copper"]}"/>')

        elif "DHT" in comp_name:
            # DHT22 Temperature/Humidity Sensor - blue rectangular package
            sensor_color = "#1a3050"
            # Main body with grid pattern
            svg_parts.append(f'<rect x="{x - comp_width/2}" y="{y - comp_height/2}" width="{comp_width}" height="{comp_height}" rx="2" fill="{sensor_color}" stroke="{colors["chip_border"]}" stroke-width="1"/>')
            # Front indicator window
            svg_parts.append(f'<rect x="{x - comp_width/2 + 3}" y="{y - comp_height/2 + 3}" width="{comp_width - 6}" height="{comp_height/2 - 2}" rx="1" fill="#0a1828" opacity="0.6"/>')
            # Grid/vent pattern
            for row in range(3):
                for col in range(4):
                    gx = x - comp_width/2 + 5 + col * 5
                    gy = y - comp_height/2 + 5 + row * 4
                    svg_parts.append(f'<rect x="{gx}" y="{gy}" width="3" height="1.5" fill="{colors["silkscreen"]}" opacity="0.15"/>')
            # Text labels
            svg_parts.append(f'<text x="{x}" y="{y + 3}" text-anchor="middle" fill="{colors["silkscreen"]}" font-size="5" font-family="monospace">DHT22</text>')
            svg_parts.append(f'<text x="{x}" y="{y + 9}" text-anchor="middle" fill="{colors["silkscreen"]}" font-size="4" font-family="monospace" opacity="0.6">TEMP/HUM</text>')
            # 4 bottom pins
            pin_positions = [-9, -3, 3, 9]
            for px_offset in pin_positions:
                svg_parts.append(f'<rect x="{x + px_offset - 1}" y="{y + comp_height/2}" width="2" height="5" fill="{colors["pad_copper"]}"/>')
        
        elif "OLED" in comp_name or "Display" in comp_name:
            # OLED Display - rectangular screen with bezel
            bezel_color = "#0a0a18"
            screen_color = "#050510"
            # Outer casing
            svg_parts.append(f'<rect x="{x - comp_width/2}" y="{y - comp_height/2}" width="{comp_width}" height="{comp_height}" rx="3" fill="{bezel_color}" stroke="{colors["chip_border"]}" stroke-width="1.5"/>')
            # Screen area (inner)
            screen_margin = 6
            svg_parts.append(f'<rect x="{x - comp_width/2 + screen_margin}" y="{y - comp_height/2 + screen_margin}" width="{comp_width - screen_margin*2}" height="{comp_height - screen_margin*2}" rx="2" fill="{screen_color}"/>')
            # Screen subtle glow
            svg_parts.append(f'<rect x="{x - comp_width/2 + screen_margin}" y="{y - comp_height/2 + screen_margin}" width="{comp_width - screen_margin*2}" height="{comp_height - screen_margin*2}" rx="2" fill="#3080d0" opacity="0.05"/>')
            # Simulated display content (simple pixel hint)
            for row in range(4):
                for col in range(5):
                    px = x - comp_width/2 + screen_margin + 5 + col * 10
                    py = y - comp_height/2 + screen_margin + 5 + row * 8
                    if row == 0 or (row == 2 and col < 3):
                        svg_parts.append(f'<rect x="{px}" y="{py}" width="6" height="3" fill="{colors["silkscreen"]}" opacity="0.25"/>')
            # Display label below screen
            svg_parts.append(f'<text x="{x}" y="{y + comp_height/2 - 3}" text-anchor="middle" fill="{colors["silkscreen"]}" font-size="5" font-family="monospace" opacity="0.5">0.96" OLED</text>')
            # 4 bottom pins for I2C
            i2c_pins = [-12, -4, 4, 12]
            for px_offset in i2c_pins:
                svg_parts.append(f'<rect x="{x + px_offset - 1.5}" y="{y + comp_height/2}" width="3" height="4" fill="{colors["pad_copper"]}"/>')
            
        elif "LED" in comp_name:
            # Glowing LED effect (but not OLED)
            led_color = colors["led_green"] if "green" in comp_name.lower() else colors["led_yellow"]
            # LED glow
            svg_parts.append(f'<circle cx="{x}" cy="{y}" r="{comp_width/2 + 4}" fill="{led_color}" opacity="0.3" filter="url(#traceGlow)"/>')
            # LED body
            svg_parts.append(f'<circle cx="{x}" cy="{y}" r="{comp_width/2}" fill="{led_color}" opacity="0.9"/>')
            # LED highlight
            svg_parts.append(f'<circle cx="{x - 2}" cy="{y - 2}" r="{comp_width/4}" fill="white" opacity="0.5"/>')
            
        elif "Capacitor" in comp_name:
            # Cylindrical capacitor style (blue)
            svg_parts.append(f'<ellipse cx="{x}" cy="{y}" rx="{comp_width/2}" ry="{comp_height/2}" fill="{colors["capacitor"]}" stroke="#6a9ae0" stroke-width="1"/>')
            # Top highlight
            svg_parts.append(f'<ellipse cx="{x}" cy="{y - comp_height/4}" rx="{comp_width/3}" ry="{comp_height/4}" fill="white" opacity="0.15"/>')
            
        elif "Chip" in comp_name or "RAM" in comp_name:
            # RAM/Memory chip with gold connectors
            # Gold pins on bottom
            pin_count = 8
            pin_width = (comp_width - 4) / pin_count
            for i in range(pin_count):
                px = x - comp_width/2 + 2 + i * pin_width + pin_width/2
                svg_parts.append(f'<rect x="{px - 1.5}" y="{y + comp_height/2 - 2}" width="3" height="4" fill="{colors["connector_gold"]}"/>')

        # Draw component pins/pads for non-special components
        if "LED" not in comp_name and "Capacitor" not in comp_name and "OLED" not in comp_name and "Display" not in comp_name and "ESP32" not in comp_name and "CPU" not in comp_name and "MCU" not in comp_name and "DHT" not in comp_name:
            if "Resistor" in comp_name:
                # SMD Resistor with better styling
                svg_parts.append(f'<rect x="{x - comp_width/2}" y="{y - comp_height/2}" width="{comp_width}" height="{comp_height}" rx="1" fill="#1a2a40" stroke="{colors["chip_border"]}" stroke-width="0.5"/>')
                # Termination bands (silver ends)
                svg_parts.append(f'<rect x="{x - comp_width/2}" y="{y - comp_height/2}" width="3" height="{comp_height}" rx="0.5" fill="{colors["pad_copper"]}"/>')
                svg_parts.append(f'<rect x="{x + comp_width/2 - 3}" y="{y - comp_height/2}" width="3" height="{comp_height}" rx="0.5" fill="{colors["pad_copper"]}"/>')
                # Value text on body
                svg_parts.append(f'<text x="{x}" y="{y + 1.5}" text-anchor="middle" fill="{colors["silkscreen"]}" font-size="5" font-family="monospace">10K</text>')
                # Pads
                for px in [x - comp_width/2 - 2, x + comp_width/2 + 2]:
                    svg_parts.append(f'<rect x="{px - 2}" y="{y - 2}" width="4" height="4" fill="{colors["pad_copper"]}"/>')
            elif "Chip" not in comp_name and "RAM" not in comp_name:
                # SMD-style pads on sides for ICs
                pad_count = min(num_pins // 2, 8)
                pad_h = 2
                pad_w = 4
                start_y = y - (pad_count - 1) * pin_spacing / 2
                
                for i in range(pad_count):
                    py = start_y + i * pin_spacing
                    # Left side pads
                    svg_parts.append(f'<rect x="{x - comp_width/2 - pad_w}" y="{py - pad_h/2}" width="{pad_w}" height="{pad_h}" fill="{colors["pad_copper"]}"/>')
                    # Right side pads
                    svg_parts.append(f'<rect x="{x + comp_width/2}" y="{py - pad_h/2}" width="{pad_w}" height="{pad_h}" fill="{colors["pad_copper"]}"/>')

        # Component designator (silkscreen) - skip for specially rendered components
        is_special = any(tag in comp_name for tag in ["ESP32", "CPU", "MCU", "DHT", "OLED", "Display", "Resistor"])
        if not is_special:
            svg_parts.append(f'<text x="{x}" y="{y - comp_height/2 - 5}" text-anchor="middle" fill="{colors["silkscreen"]}" font-size="10" font-family="Arial, sans-serif" font-weight="bold">{comp_id}</text>')
        
            # Component value/name inside (only for generic components)
            display_name = comp_name[:10] if len(comp_name) > 10 else comp_name
            svg_parts.append(f'<text x="{x}" y="{y + 3}" text-anchor="middle" fill="{color}" font-size="8" font-family="Arial, sans-serif" opacity="0.9">{display_name}</text>')

    # Draw mounting holes with realistic styling
    for hole in pcb_data.get("mounting_holes", []):
        hx = hole.get("x", 0) * scale
        hy = hole.get("y", 0) * scale
        r = hole.get("diameter", 3.2) * scale / 2
        
        # Copper ring around hole
        svg_parts.append(f'<circle cx="{hx}" cy="{hy}" r="{r + 4}" fill="url(#copperGradient)"/>')
        # Hole itself
        svg_parts.append(f'<circle cx="{hx}" cy="{hy}" r="{r}" fill="{colors["via_drill"]}"/>')
        # Hole inner shadow
        svg_parts.append(f'<circle cx="{hx}" cy="{hy}" r="{r - 1}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>')

    # Add fiducial markers (corner reference points)
    fiducial_positions = [(12, 12), (width - 12, 12), (12, height - 12), (width - 12, height - 12)]
    for fx, fy in fiducial_positions:
        svg_parts.append(f'<circle cx="{fx * scale}" cy="{fy * scale}" r="4" fill="{colors["copper"]}"/>')
        svg_parts.append(f'<circle cx="{fx * scale}" cy="{fy * scale}" r="2" fill="{colors["solder_mask"]}"/>')

    # Draw silkscreen text with improved styling
    for silk in pcb_data.get("silkscreen", []):
        if silk.get("type") == "text":
            sx = silk.get("x", 0) * scale
            sy = silk.get("y", 0) * scale
            size = silk.get("size", 1.2) * scale * 1.2
            content = silk.get("content", "")
            
            # Text shadow
            svg_parts.append(f'<text x="{sx + 0.5}" y="{sy + 0.5}" text-anchor="middle" fill="rgba(0,0,0,0.5)" font-size="{size}" font-family="Arial, sans-serif" font-weight="bold">{content}</text>')
            # Main text
            svg_parts.append(f'<text x="{sx}" y="{sy}" text-anchor="middle" fill="{colors["silkscreen"]}" font-size="{size}" font-family="Arial, sans-serif" font-weight="bold">{content}</text>')

    # Add version and date info
    svg_parts.append(f'<text x="{width * scale - 10}" y="{height * scale - 8}" text-anchor="end" fill="{colors["silkscreen"]}" font-size="6" font-family="monospace" opacity="0.7">REV 1.0</text>')
    svg_parts.append(f'<text x="10" y="{height * scale - 8}" text-anchor="start" fill="{colors["silkscreen"]}" font-size="6" font-family="monospace" opacity="0.7">NEXA PCB</text>')

    # Add polarity/orientation markers
    svg_parts.append(f'''
        <g transform="translate({width * scale - 25}, 15)">
            <text x="0" y="0" fill="{colors["silkscreen"]}" font-size="6" font-family="Arial">+X</text>
            <line x1="-5" y1="-3" x2="10" y2="-3" stroke="{colors["silkscreen"]}" stroke-width="1"/>
            <polygon points="10,-3 7,-5 7,-1" fill="{colors["silkscreen"]}"/>
        </g>
    ''')

    # Close the main group
    svg_parts.append('</g>')
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
