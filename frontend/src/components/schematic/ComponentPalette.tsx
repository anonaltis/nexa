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
  category: string;
}

const COMPONENT_TEMPLATES: ComponentTemplate[] = [
  // MCUs
  { id: "esp32", name: "ESP32", type: "mcu", category: "MCU" },
  { id: "arduino", name: "Arduino", type: "mcu", category: "MCU" },

  // Passive
  { id: "resistor", name: "Resistor", type: "resistor", category: "Passive" },
  { id: "capacitor", name: "Capacitor", type: "capacitor", category: "Passive" },
  { id: "inductor", name: "Inductor", type: "inductor", category: "Passive" },

  // Semiconductors
  { id: "led", name: "LED", type: "led", category: "Semiconductor" },
  { id: "diode", name: "Diode", type: "diode", category: "Semiconductor" },
  { id: "transistor", name: "Transistor", type: "transistor", category: "Semiconductor" },

  // ICs
  { id: "opamp", name: "Op-Amp", type: "opamp", category: "IC" },
  { id: "regulator", name: "Regulator", type: "regulator", category: "IC" },

  // Modules
  { id: "relay", name: "Relay", type: "relay", category: "Module" },
  { id: "sensor", name: "Sensor", type: "sensor", category: "Module" },
  { id: "wifi-module", name: "WiFi Module", type: "wifi", category: "Module" },

  // Power
  { id: "vcc", name: "VCC", type: "power", category: "Power" },
  { id: "gnd", name: "GND", type: "ground", category: "Power" },
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
    <div className="blueprint-card p-0 flex flex-col h-full border-primary/20 bg-background/50 overflow-hidden">
      <div className="bg-primary/10 px-4 py-2 border-b border-primary/20">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Asset Registry</h3>
      </div>

      <ScrollArea className="flex-1 custom-scrollbar">
        <div className="p-3 space-y-6">
          {Object.entries(categories).map(([category, components]) => (
            <div key={category} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-0.5 w-2 bg-primary/40" />
                <h4 className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  {category}
                </h4>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                {components.map((comp) => (
                  <button
                    key={comp.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("component", JSON.stringify(comp));
                      onDragStart(comp);
                    }}
                    onClick={() => onAddComponent(comp)}
                    className="w-full flex items-center group relative h-9 px-3 border border-primary/5 rounded bg-primary/5 hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
                  >
                    {/* Hover indicator dot */}
                    <div className="absolute left-1.5 w-1 h-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />

                    <span className="text-[10px] font-bold uppercase tracking-tight text-foreground transition-colors group-hover:text-primary ml-2 truncate">
                      {comp.name}
                    </span>

                    {/* Technical suffix */}
                    <span className="ml-auto text-[7px] font-mono text-muted-foreground/40 font-bold">
                      {comp.type.toUpperCase()}_MOD
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer Info Area */}
      <div className="p-3 border-t border-primary/10 bg-black/20">
        <p className="text-[8px] font-bold text-muted-foreground/50 uppercase tracking-tighter leading-tight">
          Select asset to initialize placement on canvas surface
        </p>
      </div>
    </div>
  );
};

export default ComponentPalette;
export type { ComponentTemplate };
