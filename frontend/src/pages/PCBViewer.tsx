import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Layers, 
  Eye, 
  EyeOff,
  FileDown,
  Printer,
  Share2,
  Cpu
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock PCB SVG - ready for real PCB generation backend
const MockPCBDiagram = () => (
  <svg viewBox="0 0 400 300" className="w-full h-full">
    {/* Background */}
    <rect width="400" height="300" fill="hsl(220 25% 8%)" />
    
    {/* Grid */}
    <defs>
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(210 50% 20%)" strokeWidth="0.5" opacity="0.5" />
      </pattern>
    </defs>
    <rect width="400" height="300" fill="url(#grid)" />
    
    {/* PCB Board Outline */}
    <rect x="50" y="30" width="300" height="240" rx="4" fill="none" stroke="hsl(210 100% 55%)" strokeWidth="2" />
    
    {/* ESP32 Module */}
    <rect x="80" y="60" width="100" height="50" rx="2" fill="hsl(210 100% 55%)" fillOpacity="0.2" stroke="hsl(210 100% 55%)" strokeWidth="1.5" />
    <text x="130" y="90" textAnchor="middle" fill="hsl(210 100% 55%)" fontSize="10" fontFamily="monospace">ESP32</text>
    
    {/* DHT22 Sensor */}
    <rect x="220" y="60" width="60" height="40" rx="2" fill="hsl(180 70% 50%)" fillOpacity="0.2" stroke="hsl(180 70% 50%)" strokeWidth="1.5" />
    <text x="250" y="85" textAnchor="middle" fill="hsl(180 70% 50%)" fontSize="8" fontFamily="monospace">DHT22</text>
    
    {/* OLED Display */}
    <rect x="220" y="130" width="80" height="50" rx="2" fill="hsl(45 90% 50%)" fillOpacity="0.2" stroke="hsl(45 90% 50%)" strokeWidth="1.5" />
    <text x="260" y="160" textAnchor="middle" fill="hsl(45 90% 50%)" fontSize="8" fontFamily="monospace">OLED</text>
    
    {/* Traces */}
    <path d="M 180 80 L 220 80" stroke="hsl(180 70% 50%)" strokeWidth="2" className="animate-trace" />
    <path d="M 180 90 L 200 90 L 200 150 L 220 150" stroke="hsl(45 90% 50%)" strokeWidth="2" className="animate-trace" />
    <path d="M 180 100 L 195 100 L 195 160 L 220 160" stroke="hsl(45 90% 50%)" strokeWidth="2" className="animate-trace" />
    
    {/* Power Rails */}
    <line x1="70" y1="250" x2="330" y2="250" stroke="hsl(0 70% 50%)" strokeWidth="3" />
    <text x="340" y="254" fill="hsl(0 70% 50%)" fontSize="8" fontFamily="monospace">VCC</text>
    <line x1="70" y1="260" x2="330" y2="260" stroke="hsl(210 20% 40%)" strokeWidth="3" />
    <text x="340" y="264" fill="hsl(210 20% 40%)" fontSize="8" fontFamily="monospace">GND</text>
    
    {/* Mounting Holes */}
    <circle cx="70" cy="50" r="5" fill="none" stroke="hsl(210 30% 40%)" strokeWidth="1" />
    <circle cx="330" cy="50" r="5" fill="none" stroke="hsl(210 30% 40%)" strokeWidth="1" />
    <circle cx="70" cy="250" r="5" fill="none" stroke="hsl(210 30% 40%)" strokeWidth="1" />
    <circle cx="330" cy="250" r="5" fill="none" stroke="hsl(210 30% 40%)" strokeWidth="1" />
  </svg>
);

const PCBViewer = () => {
  const { user } = useAuth();
  const [zoom, setZoom] = useState(100);
  const [showLayers, setShowLayers] = useState({
    top: true,
    bottom: true,
    silkscreen: true,
    traces: true,
  });

  if (!user) {
    return (
      <Layout>
        <div className="py-20 text-center">
          <Cpu className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Login to View PCB Diagrams</h1>
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
            <h1 className="text-2xl font-bold">PCB Viewer</h1>
            <p className="text-muted-foreground">View and download your circuit diagrams</p>
          </div>
          <div className="flex items-center gap-2">
            <Select defaultValue="project-1">
              <SelectTrigger className="w-48 bg-input border-border">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="project-1">Smart Sensor Hub</SelectItem>
                <SelectItem value="project-2">Motor Driver Board</SelectItem>
                <SelectItem value="project-3">Audio Amplifier</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* PCB Canvas */}
          <div className="lg:col-span-3">
            <div className="blueprint-card overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center justify-between p-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setZoom(Math.max(50, zoom - 25))}
                    className="h-8 w-8"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-mono w-16 text-center">{zoom}%</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setZoom(Math.min(200, zoom + 25))}
                    className="h-8 w-8"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <div className="w-px h-6 bg-border mx-2" />
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <RotateCw className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Printer className="w-4 h-4" />
                    Print
                  </Button>
                  <Button className="bg-primary hover:bg-primary/90 gap-2" size="sm">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              </div>

              {/* PCB View */}
              <div 
                className="aspect-[4/3] p-8 flex items-center justify-center overflow-auto"
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}
              >
                <MockPCBDiagram />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Layers Panel */}
            <div className="blueprint-card p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Layers
              </h3>
              <div className="space-y-2">
                {Object.entries(showLayers).map(([layer, visible]) => (
                  <button
                    key={layer}
                    onClick={() => setShowLayers({ ...showLayers, [layer]: !visible })}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm capitalize">{layer}</span>
                    {visible ? (
                      <Eye className="w-4 h-4 text-primary" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Components List */}
            <div className="blueprint-card p-4">
              <h3 className="text-sm font-semibold mb-3">Components</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ESP32</span>
                  <span className="font-mono">U1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">DHT22</span>
                  <span className="font-mono">U2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">OLED 0.96"</span>
                  <span className="font-mono">U3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">10kΩ Resistor</span>
                  <span className="font-mono">R1</span>
                </div>
              </div>
            </div>

            {/* Export Options */}
            <div className="blueprint-card p-4">
              <h3 className="text-sm font-semibold mb-3">Export Options</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                  <FileDown className="w-4 h-4" />
                  Gerber Files (PCB Manufacturing)
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                  <FileDown className="w-4 h-4" />
                  PDF Schematic
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                  <FileDown className="w-4 h-4" />
                  Bill of Materials (CSV)
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PCBViewer;
