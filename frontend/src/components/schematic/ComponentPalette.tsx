import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Cpu,
  CircleDot,
  Zap,
  ToggleLeft,
  Lightbulb,
  Wifi,
  Radio,
  Battery,
} from "lucide-react";

interface ComponentTemplate {
  id: string;
  name: string;
  type: string;
  icon: React.ReactNode;
  category: string;
}

const COMPONENT_TEMPLATES: ComponentTemplate[] = [
  // MCUs
  { id: "esp32", name: "ESP32", type: "mcu", icon: <Cpu className="w-4 h-4" />, category: "MCU" },
  { id: "arduino", name: "Arduino", type: "mcu", icon: <Cpu className="w-4 h-4" />, category: "MCU" },

  // Passive
  { id: "resistor", name: "Resistor", type: "resistor", icon: <CircleDot className="w-4 h-4" />, category: "Passive" },
  { id: "capacitor", name: "Capacitor", type: "capacitor", icon: <CircleDot className="w-4 h-4" />, category: "Passive" },
  { id: "inductor", name: "Inductor", type: "inductor", icon: <CircleDot className="w-4 h-4" />, category: "Passive" },

  // Semiconductors
  { id: "led", name: "LED", type: "led", icon: <Lightbulb className="w-4 h-4" />, category: "Semiconductor" },
  { id: "diode", name: "Diode", type: "diode", icon: <Zap className="w-4 h-4" />, category: "Semiconductor" },
  { id: "transistor", name: "Transistor", type: "transistor", icon: <Zap className="w-4 h-4" />, category: "Semiconductor" },

  // ICs
  { id: "opamp", name: "Op-Amp", type: "opamp", icon: <CircleDot className="w-4 h-4" />, category: "IC" },
  { id: "regulator", name: "Regulator", type: "regulator", icon: <Battery className="w-4 h-4" />, category: "IC" },

  // Modules
  { id: "relay", name: "Relay", type: "relay", icon: <ToggleLeft className="w-4 h-4" />, category: "Module" },
  { id: "sensor", name: "Sensor", type: "sensor", icon: <Radio className="w-4 h-4" />, category: "Module" },
  { id: "wifi-module", name: "WiFi Module", type: "wifi", icon: <Wifi className="w-4 h-4" />, category: "Module" },

  // Power
  { id: "vcc", name: "VCC", type: "power", icon: <Zap className="w-4 h-4" />, category: "Power" },
  { id: "gnd", name: "GND", type: "ground", icon: <CircleDot className="w-4 h-4" />, category: "Power" },
];

interface ComponentPaletteProps {
  onDragStart: (component: ComponentTemplate) => void;
  onAddComponent: (component: ComponentTemplate) => void;
}

const ComponentPalette = ({ onDragStart, onAddComponent }: ComponentPaletteProps) => {
  // Group components by category
  const categories = COMPONENT_TEMPLATES.reduce((acc, comp) => {
    if (!acc[comp.category]) {
      acc[comp.category] = [];
    }
    acc[comp.category].push(comp);
    return acc;
  }, {} as Record<string, ComponentTemplate[]>);

  return (
    <div className="blueprint-card p-4 h-full">
      <h3 className="text-sm font-semibold mb-3">Components</h3>
      <ScrollArea className="h-[calc(100%-2rem)]">
        <div className="space-y-4">
          {Object.entries(categories).map(([category, components]) => (
            <div key={category}>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">
                {category}
              </h4>
              <div className="grid grid-cols-2 gap-1">
                {components.map((comp) => (
                  <Button
                    key={comp.id}
                    variant="ghost"
                    size="sm"
                    className="h-auto py-2 px-2 justify-start gap-2 text-xs"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("component", JSON.stringify(comp));
                      onDragStart(comp);
                    }}
                    onClick={() => onAddComponent(comp)}
                  >
                    {comp.icon}
                    <span className="truncate">{comp.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ComponentPalette;
export type { ComponentTemplate };
