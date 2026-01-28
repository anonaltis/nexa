
from typing import List, Dict, Any, Optional
from datetime import datetime

# Seed data for component database
SEED_COMPONENTS = [
    # Microcontrollers
    {
        "name": "ESP32 DevKit V1",
        "category": "mcu",
        "description": "Dual-core 240MHz processor with WiFi and Bluetooth",
        "specs": {
            "name": "ESP32-WROOM-32",
            "value": None,
            "package": "ESP32-DEVKIT-V1",
            "manufacturer": "Espressif",
            "datasheet_url": "https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf",
            "price": 8.99
        },
        "pinout": {
            "3V3": "Power output 3.3V",
            "GND": "Ground",
            "EN": "Enable (active high)",
            "GPIO0": "Boot mode selection / General IO",
            "GPIO2": "General IO / Built-in LED",
            "GPIO4": "General IO",
            "GPIO5": "General IO / SPI CS",
            "GPIO12": "General IO / SPI MISO",
            "GPIO13": "General IO / SPI MOSI",
            "GPIO14": "General IO / SPI CLK",
            "GPIO15": "General IO",
            "GPIO16": "General IO / UART2 RX",
            "GPIO17": "General IO / UART2 TX",
            "GPIO18": "General IO / SPI CLK",
            "GPIO19": "General IO / SPI MISO",
            "GPIO21": "General IO / I2C SDA",
            "GPIO22": "General IO / I2C SCL",
            "GPIO23": "General IO / SPI MOSI",
            "GPIO25": "General IO / DAC1",
            "GPIO26": "General IO / DAC2",
            "GPIO27": "General IO",
            "GPIO32": "General IO / ADC1_CH4",
            "GPIO33": "General IO / ADC1_CH5",
            "GPIO34": "Input only / ADC1_CH6",
            "GPIO35": "Input only / ADC1_CH7",
            "GPIO36": "Input only / ADC1_CH0",
            "GPIO39": "Input only / ADC1_CH3",
            "VIN": "Power input 5V"
        },
        "footprint": "ESP32-DEVKIT-V1",
        "symbol": "ESP32",
        "tags": ["wifi", "bluetooth", "iot", "dual-core", "240mhz"]
    },
    {
        "name": "Arduino Nano",
        "category": "mcu",
        "description": "Compact ATmega328P board with USB",
        "specs": {
            "name": "ATmega328P",
            "value": None,
            "package": "ARDUINO-NANO",
            "manufacturer": "Arduino",
            "datasheet_url": "https://docs.arduino.cc/hardware/nano",
            "price": 4.99
        },
        "pinout": {
            "D0": "Digital IO / RX",
            "D1": "Digital IO / TX",
            "D2": "Digital IO / INT0",
            "D3": "Digital IO / INT1 / PWM",
            "D4": "Digital IO",
            "D5": "Digital IO / PWM",
            "D6": "Digital IO / PWM",
            "D7": "Digital IO",
            "D8": "Digital IO",
            "D9": "Digital IO / PWM",
            "D10": "Digital IO / PWM / SPI SS",
            "D11": "Digital IO / PWM / SPI MOSI",
            "D12": "Digital IO / SPI MISO",
            "D13": "Digital IO / SPI SCK / LED",
            "A0": "Analog Input / Digital IO",
            "A1": "Analog Input / Digital IO",
            "A2": "Analog Input / Digital IO",
            "A3": "Analog Input / Digital IO",
            "A4": "Analog Input / Digital IO / I2C SDA",
            "A5": "Analog Input / Digital IO / I2C SCL",
            "A6": "Analog Input",
            "A7": "Analog Input",
            "VIN": "Power input 7-12V",
            "5V": "Power output 5V",
            "3V3": "Power output 3.3V",
            "GND": "Ground",
            "RST": "Reset"
        },
        "footprint": "ARDUINO-NANO",
        "symbol": "ARDUINO",
        "tags": ["arduino", "atmega328", "beginner", "compact"]
    },
    # Sensors
    {
        "name": "DHT22",
        "category": "sensor",
        "description": "Digital temperature and humidity sensor",
        "specs": {
            "name": "DHT22/AM2302",
            "value": None,
            "package": "4-PIN",
            "manufacturer": "Aosong",
            "datasheet_url": "https://www.sparkfun.com/datasheets/Sensors/Temperature/DHT22.pdf",
            "price": 4.50
        },
        "pinout": {
            "VCC": "Power 3.3-6V",
            "DATA": "Digital data output",
            "NC": "Not connected",
            "GND": "Ground"
        },
        "footprint": "DHT22",
        "symbol": "DHT22",
        "tags": ["temperature", "humidity", "digital", "weather"]
    },
    {
        "name": "DHT11",
        "category": "sensor",
        "description": "Basic temperature and humidity sensor",
        "specs": {
            "name": "DHT11",
            "value": None,
            "package": "4-PIN",
            "manufacturer": "Aosong",
            "price": 2.00
        },
        "pinout": {
            "VCC": "Power 3.3-5V",
            "DATA": "Digital data output",
            "NC": "Not connected",
            "GND": "Ground"
        },
        "footprint": "DHT11",
        "symbol": "DHT11",
        "tags": ["temperature", "humidity", "digital", "beginner"]
    },
    {
        "name": "HC-SR04",
        "category": "sensor",
        "description": "Ultrasonic distance sensor",
        "specs": {
            "name": "HC-SR04",
            "value": "2-400cm range",
            "package": "4-PIN",
            "price": 2.50
        },
        "pinout": {
            "VCC": "Power 5V",
            "TRIG": "Trigger input",
            "ECHO": "Echo output",
            "GND": "Ground"
        },
        "footprint": "HC-SR04",
        "symbol": "ULTRASONIC",
        "tags": ["ultrasonic", "distance", "ranging", "robotics"]
    },
    {
        "name": "MPU6050",
        "category": "sensor",
        "description": "6-axis accelerometer and gyroscope",
        "specs": {
            "name": "MPU6050",
            "value": None,
            "package": "GY-521",
            "manufacturer": "InvenSense",
            "price": 3.00
        },
        "pinout": {
            "VCC": "Power 3.3-5V",
            "GND": "Ground",
            "SCL": "I2C Clock",
            "SDA": "I2C Data",
            "XDA": "Auxiliary I2C Data",
            "XCL": "Auxiliary I2C Clock",
            "AD0": "I2C Address select",
            "INT": "Interrupt output"
        },
        "footprint": "MPU6050",
        "symbol": "IMU",
        "tags": ["accelerometer", "gyroscope", "imu", "motion", "i2c"]
    },
    # Displays
    {
        "name": "OLED 0.96\" I2C",
        "category": "display",
        "description": "128x64 OLED display module with I2C interface",
        "specs": {
            "name": "SSD1306",
            "value": "128x64",
            "package": "0.96-OLED-I2C",
            "price": 5.00
        },
        "pinout": {
            "GND": "Ground",
            "VCC": "Power 3.3-5V",
            "SCL": "I2C Clock",
            "SDA": "I2C Data"
        },
        "footprint": "OLED-0.96",
        "symbol": "OLED",
        "tags": ["oled", "display", "i2c", "128x64", "ssd1306"]
    },
    {
        "name": "LCD 16x2 I2C",
        "category": "display",
        "description": "16x2 character LCD with I2C backpack",
        "specs": {
            "name": "HD44780 + PCF8574",
            "value": "16x2",
            "package": "LCD-1602-I2C",
            "price": 4.00
        },
        "pinout": {
            "GND": "Ground",
            "VCC": "Power 5V",
            "SDA": "I2C Data",
            "SCL": "I2C Clock"
        },
        "footprint": "LCD-1602",
        "symbol": "LCD",
        "tags": ["lcd", "display", "i2c", "16x2", "character"]
    },
    # Passive Components
    {
        "name": "Resistor 10K",
        "category": "resistor",
        "description": "10K Ohm resistor 1/4W",
        "specs": {
            "name": "Resistor",
            "value": "10K",
            "package": "0805",
            "price": 0.01
        },
        "pinout": {"1": "Terminal 1", "2": "Terminal 2"},
        "footprint": "R_0805",
        "symbol": "R",
        "tags": ["resistor", "10k", "pullup", "pulldown"]
    },
    {
        "name": "Resistor 1K",
        "category": "resistor",
        "description": "1K Ohm resistor 1/4W",
        "specs": {
            "name": "Resistor",
            "value": "1K",
            "package": "0805",
            "price": 0.01
        },
        "pinout": {"1": "Terminal 1", "2": "Terminal 2"},
        "footprint": "R_0805",
        "symbol": "R",
        "tags": ["resistor", "1k", "led", "current-limiting"]
    },
    {
        "name": "Resistor 220R",
        "category": "resistor",
        "description": "220 Ohm resistor 1/4W",
        "specs": {
            "name": "Resistor",
            "value": "220R",
            "package": "0805",
            "price": 0.01
        },
        "pinout": {"1": "Terminal 1", "2": "Terminal 2"},
        "footprint": "R_0805",
        "symbol": "R",
        "tags": ["resistor", "220", "led"]
    },
    {
        "name": "Capacitor 100uF",
        "category": "capacitor",
        "description": "100uF electrolytic capacitor 25V",
        "specs": {
            "name": "Capacitor",
            "value": "100uF",
            "package": "RADIAL-5mm",
            "price": 0.10
        },
        "pinout": {"+": "Positive", "-": "Negative"},
        "footprint": "C_RADIAL_5mm",
        "symbol": "C_POLAR",
        "tags": ["capacitor", "electrolytic", "decoupling", "100uf"]
    },
    {
        "name": "Capacitor 100nF",
        "category": "capacitor",
        "description": "100nF ceramic capacitor",
        "specs": {
            "name": "Capacitor",
            "value": "100nF",
            "package": "0805",
            "price": 0.02
        },
        "pinout": {"1": "Terminal 1", "2": "Terminal 2"},
        "footprint": "C_0805",
        "symbol": "C",
        "tags": ["capacitor", "ceramic", "decoupling", "bypass"]
    },
    # Actuators
    {
        "name": "Relay Module 1-Channel",
        "category": "actuator",
        "description": "1-channel relay module with optocoupler isolation",
        "specs": {
            "name": "Relay Module",
            "value": "5V/10A",
            "package": "RELAY-1CH",
            "price": 2.00
        },
        "pinout": {
            "VCC": "Power 5V",
            "GND": "Ground",
            "IN": "Control input (active low)",
            "COM": "Common contact",
            "NO": "Normally Open",
            "NC": "Normally Closed"
        },
        "footprint": "RELAY-1CH",
        "symbol": "RELAY",
        "tags": ["relay", "switch", "high-voltage", "actuator"]
    },
    {
        "name": "Servo SG90",
        "category": "actuator",
        "description": "Micro servo motor 180 degrees",
        "specs": {
            "name": "SG90",
            "value": "180°",
            "package": "SERVO-MICRO",
            "price": 2.50
        },
        "pinout": {
            "GND": "Ground (Brown)",
            "VCC": "Power 5V (Red)",
            "SIGNAL": "PWM Signal (Orange)"
        },
        "footprint": "SERVO-SG90",
        "symbol": "SERVO",
        "tags": ["servo", "motor", "pwm", "robotics"]
    },
    {
        "name": "LED 5mm",
        "category": "led",
        "description": "Standard 5mm LED",
        "specs": {
            "name": "LED",
            "value": "5mm",
            "package": "LED-5MM",
            "price": 0.05
        },
        "pinout": {
            "A": "Anode (+)",
            "K": "Cathode (-)"
        },
        "footprint": "LED_5MM",
        "symbol": "LED",
        "tags": ["led", "indicator", "5mm"]
    },
    # Communication Modules
    {
        "name": "nRF24L01",
        "category": "communication",
        "description": "2.4GHz wireless transceiver module",
        "specs": {
            "name": "nRF24L01",
            "value": "2.4GHz",
            "package": "NRF24L01-MODULE",
            "manufacturer": "Nordic",
            "price": 2.00
        },
        "pinout": {
            "GND": "Ground",
            "VCC": "Power 3.3V",
            "CE": "Chip Enable",
            "CSN": "SPI Chip Select",
            "SCK": "SPI Clock",
            "MOSI": "SPI Data In",
            "MISO": "SPI Data Out",
            "IRQ": "Interrupt"
        },
        "footprint": "NRF24L01",
        "symbol": "RF_MODULE",
        "tags": ["wireless", "2.4ghz", "spi", "transceiver", "rf"]
    },
    {
        "name": "HC-05 Bluetooth",
        "category": "communication",
        "description": "Bluetooth serial module",
        "specs": {
            "name": "HC-05",
            "value": "Bluetooth 2.0",
            "package": "HC-05-MODULE",
            "price": 5.00
        },
        "pinout": {
            "VCC": "Power 3.6-6V",
            "GND": "Ground",
            "TXD": "UART Transmit",
            "RXD": "UART Receive",
            "STATE": "Connection state",
            "EN": "Enable"
        },
        "footprint": "HC-05",
        "symbol": "BLUETOOTH",
        "tags": ["bluetooth", "serial", "uart", "wireless"]
    },
    # Power Components
    {
        "name": "AMS1117 3.3V",
        "category": "power",
        "description": "3.3V 1A linear voltage regulator",
        "specs": {
            "name": "AMS1117-3.3",
            "value": "3.3V",
            "package": "SOT-223",
            "price": 0.20
        },
        "pinout": {
            "GND": "Ground",
            "VOUT": "Output 3.3V",
            "VIN": "Input 4.5-12V"
        },
        "footprint": "SOT-223",
        "symbol": "VREG",
        "tags": ["regulator", "ldo", "3.3v", "power"]
    },
    {
        "name": "LM7805",
        "category": "power",
        "description": "5V 1.5A linear voltage regulator",
        "specs": {
            "name": "LM7805",
            "value": "5V",
            "package": "TO-220",
            "price": 0.30
        },
        "pinout": {
            "IN": "Input 7-35V",
            "GND": "Ground",
            "OUT": "Output 5V"
        },
        "footprint": "TO-220",
        "symbol": "VREG",
        "tags": ["regulator", "linear", "5v", "power"]
    }
]


async def seed_components(db):
    """Seed the database with initial components."""
    collection = db.db["components"]

    # Check if already seeded
    count = await collection.count_documents({})
    if count > 0:
        return {"message": f"Database already has {count} components"}

    # Insert seed data
    for comp in SEED_COMPONENTS:
        comp["created_at"] = datetime.utcnow()
        comp["updated_at"] = datetime.utcnow()

    result = await collection.insert_many(SEED_COMPONENTS)
    return {"message": f"Seeded {len(result.inserted_ids)} components"}


async def search_components(
    db,
    query: Optional[str] = None,
    category: Optional[str] = None,
    tags: Optional[List[str]] = None,
    skip: int = 0,
    limit: int = 20
) -> List[Dict[str, Any]]:
    """Search components with filters."""
    collection = db.db["components"]

    # Build filter
    filter_query = {}

    if query:
        filter_query["$or"] = [
            {"name": {"$regex": query, "$options": "i"}},
            {"description": {"$regex": query, "$options": "i"}},
            {"tags": {"$regex": query, "$options": "i"}}
        ]

    if category:
        filter_query["category"] = category

    if tags:
        filter_query["tags"] = {"$in": tags}

    cursor = collection.find(filter_query).skip(skip).limit(limit)
    components = await cursor.to_list(length=limit)

    # Convert ObjectId to string
    for comp in components:
        comp["_id"] = str(comp["_id"])

    return components


async def get_categories(db) -> List[Dict[str, Any]]:
    """Get all component categories with counts."""
    collection = db.db["components"]

    pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]

    result = await collection.aggregate(pipeline).to_list(length=100)
    return [{"name": r["_id"], "count": r["count"]} for r in result]


async def suggest_components(
    db,
    project_description: str,
    board: Optional[str] = None
) -> List[Dict[str, Any]]:
    """AI-powered component suggestions based on project description."""
    collection = db.db["components"]

    # Simple keyword-based suggestion
    keywords = project_description.lower().split()

    # Map common keywords to component tags
    keyword_map = {
        "temperature": ["temperature", "dht22", "dht11"],
        "humidity": ["humidity", "dht22", "dht11"],
        "weather": ["temperature", "humidity", "weather"],
        "display": ["display", "oled", "lcd"],
        "screen": ["display", "oled", "lcd"],
        "wifi": ["wifi", "esp32", "esp8266"],
        "bluetooth": ["bluetooth", "hc-05", "esp32"],
        "wireless": ["wireless", "rf", "nrf24l01", "bluetooth", "wifi"],
        "motor": ["motor", "servo", "actuator"],
        "robot": ["robotics", "motor", "servo", "ultrasonic"],
        "distance": ["ultrasonic", "distance", "ranging"],
        "led": ["led", "indicator"],
        "relay": ["relay", "switch", "actuator"],
        "motion": ["motion", "imu", "accelerometer", "gyroscope"],
        "iot": ["iot", "wifi", "esp32", "sensor"]
    }

    # Find matching tags
    matching_tags = set()
    for keyword in keywords:
        if keyword in keyword_map:
            matching_tags.update(keyword_map[keyword])

    if not matching_tags:
        # Return some default suggestions
        matching_tags = {"esp32", "sensor", "display"}

    # Query components
    components = await collection.find({
        "tags": {"$in": list(matching_tags)}
    }).limit(10).to_list(length=10)

    for comp in components:
        comp["_id"] = str(comp["_id"])

    return components
