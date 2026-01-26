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
  Cpu,
  Info
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import PCBRenderer from "@/components/pcb/PCBRenderer";

const PCBViewer = () => {
  const { user } = useAuth();
  const [zoom, setZoom] = useState(100);
  const [selectedProject, setSelectedProject] = useState("project-1");
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

  const handleDownload = () => {
    // Create SVG download
    const svgElement = document.querySelector('.pcb-container svg');
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pcb-diagram-${selectedProject}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Layout>
      <div className="py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Cpu className="w-6 h-6 text-primary" />
              PCB Viewer
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              View, customize, and download your circuit board designs
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
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
              <div className="flex items-center justify-between p-3 border-b border-border bg-card/50">
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setZoom(Math.max(50, zoom - 25))}
                        className="h-8 w-8"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Zoom Out</TooltipContent>
                  </Tooltip>
                  
                  <span className="text-sm font-mono w-14 text-center bg-background/50 px-2 py-1 rounded">
                    {zoom}%
                  </span>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setZoom(Math.min(200, zoom + 25))}
                        className="h-8 w-8"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Zoom In</TooltipContent>
                  </Tooltip>
                  
                  <div className="w-px h-6 bg-border mx-2" />
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <RotateCw className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Rotate View</TooltipContent>
                  </Tooltip>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="gap-2 text-xs">
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2 text-xs">
                    <Printer className="w-3.5 h-3.5" />
                    Print
                  </Button>
                  <Button 
                    onClick={handleDownload}
                    className="bg-primary hover:bg-primary/90 gap-2 text-xs" 
                    size="sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download SVG
                  </Button>
                </div>
              </div>

              {/* PCB View */}
              <div 
                className="pcb-container aspect-[4/3] flex items-center justify-center overflow-auto p-4"
                style={{ 
                  backgroundColor: "hsl(var(--pcb-background))",
                }}
              >
                <div
                  style={{ 
                    transform: `scale(${zoom / 100})`, 
                    transformOrigin: 'center',
                    transition: 'transform 0.2s ease-out'
                  }}
                >
                  <PCBRenderer
                    layers={showLayers}
                    showGrid={true}
                    showLabels={showLayers.silkscreen}
                  />
                </div>
              </div>
            </div>

            {/* PCB Info Bar */}
            <div className="mt-4 p-4 blueprint-card flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Board Size:</span>
                  <span className="font-mono">100mm × 80mm</span>
                </div>
                <div className="w-px h-4 bg-border" />
                <div>
                  <span className="text-muted-foreground">Layers:</span>
                  <span className="font-mono ml-2">2-layer</span>
                </div>
                <div className="w-px h-4 bg-border" />
                <div>
                  <span className="text-muted-foreground">Components:</span>
                  <span className="font-mono ml-2">18</span>
                </div>
              </div>
              <div className="text-muted-foreground text-xs">
                ElectroLab v1.0 • Ready for manufacturing
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
              <div className="space-y-1">
                {Object.entries(showLayers).map(([layer, visible]) => (
                  <button
                    key={layer}
                    onClick={() => setShowLayers({ ...showLayers, [layer]: !visible })}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-sm" 
                        style={{ 
                          backgroundColor: layer === 'top' ? 'hsl(var(--pcb-trace))' 
                            : layer === 'bottom' ? 'hsl(var(--pcb-trace-bottom))'
                            : layer === 'silkscreen' ? 'hsl(var(--pcb-silkscreen))'
                            : 'hsl(var(--pcb-pad))'
                        }}
                      />
                      <span className="text-sm capitalize">{layer}</span>
                    </div>
                    {visible ? (
                      <Eye className="w-4 h-4 text-primary" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Components List */}
            <div className="blueprint-card p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-primary" />
                Components
              </h3>
              <div className="space-y-2 text-sm max-h-48 overflow-y-auto">
                {[
                  { name: "ESP32", ref: "U1", type: "chip" },
                  { name: "DHT22", ref: "U2", type: "sensor" },
                  { name: "OLED 0.96\"", ref: "U3", type: "display" },
                  { name: "10kΩ Resistor", ref: "R1-R4", type: "passive" },
                  { name: "100µF Cap", ref: "C1-C4", type: "passive" },
                  { name: "LED Green", ref: "D1-D3", type: "led" },
                  { name: "Crystal 8MHz", ref: "Y1", type: "passive" },
                ].map((comp) => (
                  <div 
                    key={comp.ref}
                    className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div>
                      <span className="text-muted-foreground">{comp.name}</span>
                    </div>
                    <span className="font-mono text-xs text-primary">{comp.ref}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Export Options */}
            <div className="blueprint-card p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FileDown className="w-4 h-4 text-primary" />
                Export Options
              </h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2 text-xs h-9" size="sm">
                  <FileDown className="w-3.5 h-3.5" />
                  Gerber Files (Manufacturing)
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 text-xs h-9" size="sm">
                  <FileDown className="w-3.5 h-3.5" />
                  PDF Schematic
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 text-xs h-9" size="sm">
                  <FileDown className="w-3.5 h-3.5" />
                  Bill of Materials (CSV)
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 text-xs h-9" size="sm">
                  <FileDown className="w-3.5 h-3.5" />
                  KiCad Project
                </Button>
              </div>
            </div>

            {/* Manufacturing Info */}
            <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
              <h4 className="text-xs font-semibold text-primary mb-2">💡 Manufacturing Ready</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Export Gerber files and upload to PCB manufacturers like JLCPCB, PCBWay, or OSH Park for professional fabrication.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PCBViewer;
