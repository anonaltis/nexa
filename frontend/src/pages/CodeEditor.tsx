import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { 
  Code, 
  Play, 
  Download, 
  Copy, 
  Check,
  ExternalLink,
  FileCode,
  Terminal,
  Cpu,
  Usb
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock code - ready for AI code generation backend
const mockArduinoCode = `/*
 * Smart Temperature Monitor
 * ElectroLab Generated Code
 * 
 * Hardware:
 * - ESP32 DevKit v1
 * - DHT22 Sensor (GPIO4)
 * - OLED Display (I2C: GPIO21, GPIO22)
 */

#include <WiFi.h>
#include <DHT.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// Pin Definitions
#define DHTPIN 4
#define DHTTYPE DHT22

// WiFi Credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// OLED Display
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// DHT Sensor
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  
  // Initialize DHT sensor
  dht.begin();
  
  // Initialize OLED display
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("SSD1306 allocation failed"));
    for(;;);
  }
  
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println(F("ElectroLab"));
  display.println(F("Temperature Monitor"));
  display.display();
  delay(2000);
}

void loop() {
  // Read sensor data
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();
  
  // Check if read failed
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println(F("Failed to read from DHT sensor!"));
    return;
  }
  
  // Display readings
  display.clearDisplay();
  display.setCursor(0, 0);
  display.setTextSize(1);
  display.println(F("Temperature Monitor"));
  display.println();
  display.setTextSize(2);
  display.print(temperature, 1);
  display.println(F(" C"));
  display.print(humidity, 1);
  display.println(F(" %"));
  display.display();
  
  // Print to Serial
  Serial.print(F("Temperature: "));
  Serial.print(temperature);
  Serial.print(F(" C, Humidity: "));
  Serial.print(humidity);
  Serial.println(F(" %"));
  
  delay(2000);
}`;

const vsCodeExtensions = [
  {
    name: "PlatformIO IDE",
    id: "platformio.platformio-ide",
    description: "Professional embedded development platform",
    url: "https://marketplace.visualstudio.com/items?itemName=platformio.platformio-ide",
  },
  {
    name: "Arduino",
    id: "vsciot-vscode.vscode-arduino",
    description: "Official Arduino extension for VS Code",
    url: "https://marketplace.visualstudio.com/items?itemName=vsciot-vscode.vscode-arduino",
  },
  {
    name: "C/C++",
    id: "ms-vscode.cpptools",
    description: "IntelliSense, debugging, and code browsing",
    url: "https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools",
  },
];

const CodeEditor = () => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(mockArduinoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return (
      <Layout>
        <div className="py-20 text-center">
          <Code className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Login to Access Code Editor</h1>
          <Button asChild>
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Code Editor</h1>
            <p className="text-muted-foreground">ESP32 & Arduino code generation</p>
          </div>
          <div className="flex items-center gap-2">
            <Select defaultValue="esp32">
              <SelectTrigger className="w-40 bg-input border-border">
                <SelectValue placeholder="Select board" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="esp32">ESP32</SelectItem>
                <SelectItem value="esp8266">ESP8266</SelectItem>
                <SelectItem value="arduino-uno">Arduino Uno</SelectItem>
                <SelectItem value="arduino-nano">Arduino Nano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Code Panel */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="main" className="w-full">
              <div className="blueprint-card">
                <div className="flex items-center justify-between p-3 border-b border-border">
                  <TabsList className="bg-muted/50">
                    <TabsTrigger value="main" className="gap-2 data-[state=active]:bg-primary/20">
                      <FileCode className="w-4 h-4" />
                      main.ino
                    </TabsTrigger>
                    <TabsTrigger value="config" className="gap-2 data-[state=active]:bg-primary/20">
                      <FileCode className="w-4 h-4" />
                      config.h
                    </TabsTrigger>
                  </TabsList>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopy}
                      className="gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-success" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button className="bg-primary hover:bg-primary/90 gap-2" size="sm">
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                </div>

                <TabsContent value="main" className="m-0">
                  <pre className="code-block p-4 overflow-auto max-h-[500px] text-xs">
                    <code className="text-foreground">{mockArduinoCode}</code>
                  </pre>
                </TabsContent>

                <TabsContent value="config" className="m-0">
                  <pre className="code-block p-4 overflow-auto max-h-[500px] text-xs">
                    <code className="text-foreground">{`// Configuration file
#ifndef CONFIG_H
#define CONFIG_H

// WiFi Settings
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Pin Definitions
#define DHT_PIN 4
#define DHT_TYPE DHT22

// Display Settings
#define OLED_WIDTH 128
#define OLED_HEIGHT 64

#endif`}</code>
                  </pre>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Upload Instructions */}
            <div className="blueprint-card p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Usb className="w-4 h-4 text-primary" />
                Upload Instructions
              </h3>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary font-mono">1.</span>
                  <span>Install PlatformIO or Arduino IDE</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-mono">2.</span>
                  <span>Connect ESP32 via USB</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-mono">3.</span>
                  <span>Select the correct port</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-mono">4.</span>
                  <span>Click Upload</span>
                </li>
              </ol>
            </div>

            {/* VS Code Extensions */}
            <div className="blueprint-card p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary" />
                VS Code Extensions
              </h3>
              <div className="space-y-3">
                {vsCodeExtensions.map((ext) => (
                  <a
                    key={ext.id}
                    href={ext.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-medium">{ext.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {ext.description}
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Required Libraries */}
            <div className="blueprint-card p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-primary" />
                Required Libraries
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <span className="font-mono">DHT sensor library</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <span className="font-mono">Adafruit SSD1306</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <span className="font-mono">Adafruit GFX</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CodeEditor;
