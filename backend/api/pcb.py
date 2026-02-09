
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import asyncio
from datetime import datetime
from bson import ObjectId
import os

from auth_utils import get_current_user
from db import db
from services.pcb_generator import generate_pcb, generate_svg, generate_bom, get_component_library

router = APIRouter(prefix="/api/pcb", tags=["pcb"])

# Demo mode check
DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"


class PCBAskRequest(BaseModel):
    question: str


# Mock responses for troubleshooting - Matching Demo Circuit Designs
TROUBLESHOOT_RESPONSES = {
    "led": """## 🔍 LED CIRCUIT DIAGNOSTIC REPORT

### Circuit: Smart LED Controller (ESP32 + RGB LED)

**Issue Analysis:**
Based on your ESP32 RGB LED controller circuit schematic, I've identified the following potential issues:

**Detected Symptoms:**
- LED not lighting up or wrong color output
- Flickering at certain brightness levels
- One color channel not working

**Component Check - Your Circuit:**
| Component | Pin | Expected | Check |
|-----------|-----|----------|-------|
| ESP32 GPIO25 | RED | 3.3V PWM | Measure with scope |
| ESP32 GPIO26 | GREEN | 3.3V PWM | Measure with scope |
| ESP32 GPIO27 | BLUE | 3.3V PWM | Measure with scope |
| R1, R2, R3 | 220Ω | 17.7mA each | Check with multimeter |

**Fix Steps:**
1. **Verify Resistor Values** - 220Ω gives ~17.7mA per channel (safe for 3.3V rails)
2. **Check Common Cathode** - Ensure RGB LED cathode is grounded to ESP32 GND
3. **PWM Configuration** - Verify `ledcSetup(0, 5000, 8)` is called before `ledcAttachPin()`
4. **Measure GPIO Voltage** - Should see 0-3.3V PWM waveform on GPIO25/26/27

**Code Fix:**
```cpp
// Ensure proper initialization order
ledcSetup(0, 5000, 8); // Chan 0, 5kHz, 8-bit
ledcAttachPin(25, 0);   // THEN attach pin
ledcWrite(0, 128);      // 50% duty cycle test
```

**Need more help?** Switch to Code Studio to debug the firmware directly.
""",
    "temperature": """## 🌡️ TEMPERATURE MONITOR DIAGNOSTIC REPORT

### Circuit: IoT Temperature & Humidity Monitor (ESP32 + DHT22 + OLED)

**Issue Analysis:**
Based on your ESP32 Temperature Monitor circuit schematic, I've analyzed the potential failures:

**Common Issues with Your Circuit:**

| Problem | Cause | Solution |
|---------|-------|----------|
| DHT22 reads NaN | Missing pull-up | Add 10kΩ on GPIO4 to 3.3V |
| OLED shows nothing | Wrong I2C address | Try 0x3C or 0x3D |
| Random wrong values | Noise on data line | Shorten wires, add 100nF cap |
| "DHT checksum error" | Timing issue | Increase delay to 2500ms |

**Your Circuit Connections:**
```
ESP32 GPIO4  ──► DHT22 DATA (+ 10kΩ pull-up to 3.3V)
ESP32 GPIO21 ──► OLED SDA
ESP32 GPIO22 ──► OLED SCL
ESP32 3.3V   ──► DHT22 VCC + OLED VCC
ESP32 GND    ──► DHT22 GND + OLED GND
```

**Quick Diagnostic Code:**
```cpp
// I2C Scanner - Find OLED address
#include <Wire.h>
void setup() {
  Wire.begin(21, 22);  // SDA=21, SCL=22
  Serial.begin(115200);
}
void loop() {
  for(byte addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    if(Wire.endTransmission() == 0) {
      Serial.printf("Found I2C device at 0x%02X\\n", addr);
    }
  }
  delay(5000);
}
```

**DHT22 Debug Steps:**
1. Check VCC at DHT22 pin = 3.3V ± 5%
2. Verify 10kΩ pull-up between DATA and VCC
3. Wait 2 seconds between readings (DHT22 spec)

**Need firmware help?** Open in Code Studio to debug.
""",
    "sensor": """## 📡 SENSOR INTERFACE DIAGNOSTIC

### Circuit: DHT22 + SSD1306 OLED (I2C/1-Wire)

**I2C Bus Issues (OLED Display):**
| Symptom | Cause | Fix |
|---------|-------|-----|
| Display blank | Missing init | Call `display.begin(SSD1306_SWITCHCAPVCC, 0x3C)` |
| Garbled pixels | Wrong resolution | Use 128x64 for standard OLED |
| Freezes after time | SDA/SCL shorted | Check wiring, add 4.7kΩ pull-ups |

**1-Wire Issues (DHT22 Sensor):**
| Symptom | Cause | Fix |
|---------|-------|-----|
| Returns 0 | Wrong pin | Verify DHTPIN matches GPIO4 |
| NaN readings | No pull-up | Add 10kΩ from DATA to VCC |
| Checksum fail | Wire too long | Keep under 20cm, use shielded cable |

**Your Schematic Reference:**
```
                 ┌─────────────────┐
    VCC (3.3V)───┤ DHT22        ● ├─── GND
                 │               │
    GPIO4 ───────┤ DATA   ┌───┐  │
         │       └────────┤10k├──┘
         │                └───┘ Pull-up
         │
         └── To ESP32
```

**Test Procedure:**
1. Run I2C scanner → should find 0x3C (OLED)
2. Measure DHT22 DATA pin → should idle HIGH (3.3V)
3. Check timing → minimum 2000ms between DHT reads
""",
    "display": """## 📺 OLED DISPLAY DIAGNOSTIC

### Component: SSD1306 128x64 OLED (I2C)

**Your Circuit Setup:**
- SDA → ESP32 GPIO21
- SCL → ESP32 GPIO22
- VCC → 3.3V
- GND → GND

**Common Issues:**

| Problem | Diagnosis | Solution |
|---------|-----------|----------|
| Nothing displayed | Wrong address | Use I2C scanner, try 0x3C or 0x3D |
| Half screen works | Resolution mismatch | Change to `Adafruit_SSD1306(128, 64, &Wire)` |
| Flickering | Poor connection | Check solder joints, add 4.7kΩ pull-ups |
| Stuck on init | SDA/SCL swapped | Verify GPIO21=SDA, GPIO22=SCL |

**Initialization Code:**
```cpp
#include <Adafruit_SSD1306.h>

Adafruit_SSD1306 display(128, 64, &Wire, -1);

void setup() {
  Wire.begin(21, 22);  // SDA, SCL for ESP32
  
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("SSD1306 allocation failed");
    while(1);  // Halt if display not found
  }
  
  display.clearDisplay();
  display.setTextColor(WHITE);
  display.setCursor(0, 0);
  display.println("Hello NEXA!");
  display.display();
}
```

**Voltage Levels:**
- VCC at OLED: Should be 3.3V (or 5V if module has regulator)
- SDA/SCL idle: Should be HIGH (3.3V due to pull-ups)
""",
    "default": """## 🛠️ HARDWARE DIAGNOSTIC REPORT

### System: ESP32 IoT Circuit

Based on your circuit design, here's a general diagnostic:

**Power Supply Check:**
| Rail | Expected | Tolerance | Measure At |
|------|----------|-----------|------------|
| VIN/USB | 5.0V | ±5% | USB connector |
| 3V3 | 3.3V | ±3% | ESP32 3V3 pin |
| GND | 0V | -- | Common ground |

**ESP32 Pin Status:**
- GPIO4 (DHT22 DATA) → Check 10kΩ pull-up present
- GPIO21 (I2C SDA) → Check 4.7kΩ pull-up
- GPIO22 (I2C SCL) → Check 4.7kΩ pull-up
- GPIO25/26/27 (LED) → Check 220Ω current limiters

**Quick Health Check:**
```cpp
void setup() {
  Serial.begin(115200);
  Serial.println("ESP32 Boot OK!");
  
  // Check WiFi chip
  WiFi.mode(WIFI_STA);
  Serial.printf("MAC: %s\\n", WiFi.macAddress().c_str());
  
  // Check I2C
  Wire.begin(21, 22);
  Serial.println("I2C initialized");
}
```

**Common Fixes:**
1. **No power**: Check USB cable supports data+power
2. **Boot loop**: Hold BOOT button, press EN, release BOOT
3. **Upload fail**: Select correct COM port, 115200 baud
4. **Sensors not working**: Check VCC and GND connections

**Describe your specific issue for detailed help!**
"""
}


@router.post("/ask")
async def ask_pcb_question(request: PCBAskRequest):
    # Simulate processing delay
    await asyncio.sleep(2.5)
    """
    AI-powered PCB/Hardware troubleshooting endpoint.
    Returns intelligent diagnostic responses based on the question.
    """
    question = request.question.lower()
    
    # In demo mode, return intelligent mock responses
    if DEMO_MODE:
        if "voltage" in question or "power" in question or "regulator" in question:
            response = TROUBLESHOOT_RESPONSES["voltage"]
        elif "boot" in question or "startup" in question or "reset" in question:
            response = TROUBLESHOOT_RESPONSES["boot"]
        elif "sensor" in question or "i2c" in question or "spi" in question or "dht" in question:
            response = TROUBLESHOOT_RESPONSES["sensor"]
        else:
            response = TROUBLESHOOT_RESPONSES["default"]
        
        return {"ai_response": response, "mode": "demo"}
    
    # TODO: Real AI integration when not in demo mode
    try:
        from google import genai
        client = genai.Client()
        
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=f"You are an expert electronics engineer. Answer this hardware troubleshooting question: {request.question}"
        )
        
        return {"ai_response": response.text, "mode": "ai"}
    except Exception as e:
        # Fallback to demo response on error
        return {"ai_response": TROUBLESHOOT_RESPONSES["default"], "mode": "fallback", "error": str(e)}


class PCBGenerationRequest(BaseModel):
    components: List[str]
    connections: Optional[List[Dict[str, str]]] = None
    board_size: Optional[Dict[str, int]] = None
    project_description: Optional[str] = None
    project_id: Optional[str] = None


class PCBSaveRequest(BaseModel):
    pcb_data: Dict[str, Any]
    svg: str
    name: Optional[str] = "Untitled PCB"


class BOMItem(BaseModel):
    reference: str
    name: str
    package: str
    quantity: int


class PCBGenerationResponse(BaseModel):
    pcb_data: Dict[str, Any]
    svg: str
    bom: List[BOMItem]
    generated_at: datetime


@router.post("/generate", response_model=PCBGenerationResponse)
async def generate_pcb_layout(
    request: PCBGenerationRequest,
    current_user: str = Depends(get_current_user)
):
    """
    Generate a PCB layout from components and connections.
    """
    try:
        result = await generate_pcb(
            components=request.components,
            connections=request.connections,
            board_size=request.board_size,
            project_description=request.project_description
        )

        return {
            "pcb_data": result.get("pcb_data", {}),
            "svg": result.get("svg", ""),
            "bom": result.get("bom", []),
            "generated_at": datetime.utcnow()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PCB generation failed: {str(e)}")


@router.get("/{project_id}")
async def get_pcb(
    project_id: str,
    current_user: str = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get saved PCB for a project.
    """
    try:
        pcb = await db.db["pcb_designs"].find_one({
            "project_id": project_id,
            "user_id": current_user
        })
    except:
        raise HTTPException(status_code=400, detail="Invalid project ID")

    if not pcb:
        raise HTTPException(status_code=404, detail="PCB not found")

    pcb["_id"] = str(pcb["_id"])
    return pcb


@router.put("/{project_id}")
async def save_pcb(
    project_id: str,
    request: PCBSaveRequest,
    current_user: str = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Save or update PCB for a project.
    """
    pcb_data = {
        "project_id": project_id,
        "user_id": current_user,
        "pcb_data": request.pcb_data,
        "svg": request.svg,
        "name": request.name,
        "updated_at": datetime.utcnow()
    }

    # Upsert - update if exists, insert if not
    result = await db.db["pcb_designs"].update_one(
        {"project_id": project_id, "user_id": current_user},
        {"$set": pcb_data, "$setOnInsert": {"created_at": datetime.utcnow()}},
        upsert=True
    )

    # Get the updated/inserted document
    pcb = await db.db["pcb_designs"].find_one({
        "project_id": project_id,
        "user_id": current_user
    })

    if pcb:
        pcb["_id"] = str(pcb["_id"])

    return pcb


@router.post("/export/svg")
async def export_svg(
    pcb_data: Dict[str, Any],
    current_user: str = Depends(get_current_user)
) -> Response:
    """
    Export PCB as SVG.
    """
    try:
        svg_content = generate_svg(pcb_data)
        return Response(
            content=svg_content,
            media_type="image/svg+xml",
            headers={"Content-Disposition": "attachment; filename=pcb_design.svg"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SVG export failed: {str(e)}")


@router.post("/export/bom")
async def export_bom(
    pcb_data: Dict[str, Any],
    current_user: str = Depends(get_current_user)
) -> List[BOMItem]:
    """
    Export Bill of Materials.
    """
    try:
        bom = generate_bom(pcb_data)
        return bom
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"BOM export failed: {str(e)}")


@router.get("/components/library")
async def get_components_library(
    current_user: str = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get available component library for PCB design.
    """
    return get_component_library()
