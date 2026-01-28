import { useState, useEffect, useCallback, useRef } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import {
  Download,
  Layers,
  Eye,
  EyeOff,
  FileDown,
  Printer,
  Share2,
  Cpu,
  List,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
<<<<<<< HEAD
import { ScrollArea } from "@/components/ui/scroll-area";
import PCBRenderer from "@/components/pcb/PCBRenderer";
import PCBGenerationDialog from "@/components/pcb/PCBGenerationDialog";

interface BOMItem {
  reference: string;
  name: string;
  package: string;
  quantity: number;
}

interface GeneratedPCB {
  pcb_data: any;
  svg: string;
  bom: BOMItem[];
}

// Default empty PCB
const defaultPCB: GeneratedPCB = {
  pcb_data: {},
  svg: "",
  bom: [],
};
=======
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import InteractivePCBRenderer from "@/components/pcb/InteractivePCBRenderer";
import PCBEditorToolbar from "@/components/pcb/PCBEditorToolbar";
import { usePCBEditor, PCBComponent, PCBTrace, PCBVia } from "@/hooks/usePCBEditor";
import { usePCBHistory } from "@/hooks/usePCBHistory";
import { toast } from "@/hooks/use-toast";

// Default demo circuit - Smart Sensor Hub
const defaultComponents: PCBComponent[] = [
  { id: "cpu", type: "chip", x: 200, y: 180, width: 80, height: 80, label: "CPU", sublabel: "M:0302011", pins: [] },
  { id: "chip1", type: "ic", x: 300, y: 40, width: 100, height: 35, label: "Chip A02", pins: [] },
  { id: "chip2", type: "ic", x: 300, y: 440, width: 100, height: 35, label: "Chip A02", pins: [] },
  { id: "ram1", type: "ic", x: 50, y: 60, width: 60, height: 25, label: "RAM", pins: [] },
  { id: "flash", type: "ic", x: 50, y: 380, width: 60, height: 25, label: "FLASH", pins: [] },
  { id: "conn1", type: "connector", x: 30, y: 120, width: 80, height: 50, label: "J1", pins: [] },
  { id: "conn2", type: "connector", x: 30, y: 280, width: 80, height: 50, label: "J2", pins: [] },
  { id: "conn3", type: "header", x: 380, y: 120, width: 25, height: 100, label: "P1", pins: [] },
  { id: "r1", type: "resistor", x: 150, y: 100, width: 30, height: 10, label: "R1", pins: [] },
  { id: "r2", type: "resistor", x: 150, y: 120, width: 30, height: 10, label: "R2", pins: [] },
  { id: "r3", type: "resistor", x: 150, y: 140, width: 30, height: 10, label: "R3", pins: [] },
  { id: "r4", type: "resistor", x: 290, y: 300, width: 30, height: 10, label: "R4", pins: [] },
  { id: "r5", type: "resistor", x: 290, y: 320, width: 30, height: 10, label: "R5", pins: [] },
  { id: "c1", type: "capacitor", x: 120, y: 200, width: 15, height: 25, label: "C1", pins: [] },
  { id: "c2", type: "capacitor", x: 120, y: 240, width: 15, height: 25, label: "C2", pins: [] },
  { id: "c3", type: "capacitor", x: 300, y: 200, width: 15, height: 25, label: "C3", pins: [] },
  { id: "c4", type: "capacitor", x: 300, y: 240, width: 15, height: 25, label: "C4", pins: [] },
  { id: "led1", type: "led", x: 350, y: 180, width: 10, height: 10, label: "D1", pins: [] },
  { id: "led2", type: "led", x: 350, y: 200, width: 10, height: 10, label: "D2", pins: [] },
  { id: "led3", type: "led", x: 350, y: 220, width: 10, height: 10, label: "D3", pins: [] },
  { id: "xtal", type: "crystal", x: 170, y: 280, width: 25, height: 12, label: "Y1", pins: [] },
  { id: "q1", type: "transistor", x: 250, y: 350, width: 12, height: 12, label: "Q1", pins: [] },
  { id: "q2", type: "transistor", x: 270, y: 350, width: 12, height: 12, label: "Q2", pins: [] },
];

const defaultTraces: PCBTrace[] = [
  { id: "t1", points: [{ x: 200, y: 220 }, { x: 150, y: 220 }, { x: 150, y: 300 }, { x: 100, y: 300 }], width: 2 },
  { id: "t2", points: [{ x: 280, y: 200 }, { x: 350, y: 200 }], width: 2 },
  { id: "t3", points: [{ x: 280, y: 220 }, { x: 310, y: 220 }, { x: 310, y: 180 }, { x: 350, y: 180 }], width: 2 },
  { id: "t4", points: [{ x: 240, y: 260 }, { x: 240, y: 350 }, { x: 250, y: 350 }], width: 2 },
  { id: "t5", points: [{ x: 30, y: 450 }, { x: 420, y: 450 }], width: 4, layer: "bottom" },
  { id: "t6", points: [{ x: 30, y: 470 }, { x: 420, y: 470 }], width: 4, layer: "bottom" },
  { id: "t7", points: [{ x: 110, y: 140 }, { x: 140, y: 140 }, { x: 140, y: 160 }, { x: 200, y: 160 }], width: 1 },
  { id: "t8", points: [{ x: 110, y: 300 }, { x: 170, y: 300 }, { x: 170, y: 280 }], width: 1 },
  { id: "t9", points: [{ x: 180, y: 100 }, { x: 200, y: 100 }, { x: 200, y: 180 }], width: 1 },
  { id: "t10", points: [{ x: 300, y: 75 }, { x: 300, y: 120 }, { x: 280, y: 120 }, { x: 280, y: 180 }], width: 2 },
  { id: "t11", points: [{ x: 50, y: 85 }, { x: 50, y: 100 }, { x: 100, y: 100 }, { x: 100, y: 140 }], width: 1 },
  { id: "t12", points: [{ x: 320, y: 300 }, { x: 350, y: 300 }, { x: 350, y: 260 }], width: 1 },
  { id: "t13", points: [{ x: 320, y: 320 }, { x: 380, y: 320 }, { x: 380, y: 220 }], width: 1 },
  { id: "t14", points: [{ x: 135, y: 200 }, { x: 160, y: 200 }, { x: 160, y: 180 }, { x: 200, y: 180 }], width: 1 },
  { id: "t15", points: [{ x: 135, y: 240 }, { x: 160, y: 240 }, { x: 160, y: 260 }, { x: 200, y: 260 }], width: 1 },
];

const defaultVias: PCBVia[] = [
  { x: 100, y: 100, size: "small" },
  { x: 150, y: 300, size: "medium" },
  { x: 350, y: 260, size: "small" },
  { x: 350, y: 300, size: "small" },
  { x: 170, y: 280, size: "medium" },
  { x: 240, y: 130, size: "small" },
  { x: 300, y: 380, size: "small" },
  { x: 160, y: 180, size: "small" },
  { x: 160, y: 260, size: "small" },
  { x: 310, y: 180, size: "small" },
];
>>>>>>> eb187e8 (Update UI components with functionality &  Changing the Backend from python to Typr Script and its Ai Modle still in the Python)

const PCBViewer = () => {
  const { user } = useAuth();
  const [generatedPCB, setGeneratedPCB] = useState<GeneratedPCB>(defaultPCB);
  const [showLayers, setShowLayers] = useState({
    top: true,
    bottom: true,
    silkscreen: true,
    traces: true,
  });

<<<<<<< HEAD
  const handlePCBGenerated = (pcb: GeneratedPCB) => {
    setGeneratedPCB(pcb);
  };

  const handleDownloadSVG = () => {
    if (!generatedPCB.svg) return;
    const blob = new Blob([generatedPCB.svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pcb_design.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadBOM = () => {
    if (!generatedPCB.bom.length) return;
    const csv = [
      "Reference,Name,Package,Quantity",
      ...generatedPCB.bom.map(
        (item) => `${item.reference},${item.name},${item.package},${item.quantity}`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bill_of_materials.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!generatedPCB.svg) return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>PCB Design - Print</title></head>
          <body style="margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh;">
            ${generatedPCB.svg}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
=======
  const {
    components,
    traces,
    vias,
    selectedComponent,
    isEditMode,
    routingState,
    setIsEditMode,
    setSelectedComponent,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    startRouting,
    addRoutingPoint,
    completeRouting,
    cancelRouting,
    deleteSelectedComponent,
    rotateSelectedComponent,
    setComponents,
    setTraces,
  } = usePCBEditor(defaultComponents, defaultTraces, defaultVias);

  // Undo/Redo history
  const {
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = usePCBHistory({ components: defaultComponents, traces: defaultTraces, vias: defaultVias });

  // Track last state for change detection
  const lastStateRef = useRef({ components, traces, vias });

  // Push state to history when components or traces change
  useEffect(() => {
    const hasChanged = 
      JSON.stringify(components) !== JSON.stringify(lastStateRef.current.components) ||
      JSON.stringify(traces) !== JSON.stringify(lastStateRef.current.traces);
    
    if (hasChanged && isEditMode) {
      lastStateRef.current = { components, traces, vias };
      pushState({ components, traces, vias });
    }
  }, [components, traces, vias, isEditMode, pushState]);

  const handleUndo = useCallback(() => {
    const prevState = undo();
    if (prevState) {
      setComponents(prevState.components);
      setTraces(prevState.traces);
      toast({ title: "Undo", description: "Reverted to previous state" });
    }
  }, [undo, setComponents, setTraces]);

  const handleRedo = useCallback(() => {
    const nextState = redo();
    if (nextState) {
      setComponents(nextState.components);
      setTraces(nextState.traces);
      toast({ title: "Redo", description: "Restored next state" });
    }
  }, [redo, setComponents, setTraces]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (routingState.isRouting) {
          cancelRouting();
        } else {
          setSelectedComponent(null);
        }
      }
      if (e.key === "Delete" && selectedComponent) {
        deleteSelectedComponent();
      }
      if (e.key === "r" && selectedComponent && isEditMode) {
        rotateSelectedComponent();
      }
      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey && isEditMode) {
        e.preventDefault();
        handleUndo();
      }
      // Redo: Ctrl+Shift+Z or Ctrl+Y
      if ((e.ctrlKey || e.metaKey) && (e.key === "Z" || e.key === "y") && isEditMode) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [routingState.isRouting, selectedComponent, isEditMode, cancelRouting, deleteSelectedComponent, rotateSelectedComponent, setSelectedComponent, handleUndo, handleRedo]);

  const handlePinClick = useCallback((componentId: string, pinId: string, x: number, y: number) => {
    if (!routingState.isRouting) {
      // Start routing
      startRouting(componentId, pinId, x, y);
    } else {
      // Complete routing
      completeRouting(componentId, pinId, x, y);
    }
  }, [routingState.isRouting, startRouting, completeRouting]);

  const handleCanvasClick = useCallback((x: number, y: number) => {
    if (routingState.isRouting) {
      addRoutingPoint(x, y);
    }
  }, [routingState.isRouting, addRoutingPoint]);

  const handleDownload = () => {
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
>>>>>>> eb187e8 (Update UI components with functionality &  Changing the Backend from python to Typr Script and its Ai Modle still in the Python)
    }
  };

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
            <p className="text-muted-foreground">
              AI-powered PCB layout generation
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select defaultValue="project-1">
              <SelectTrigger className="w-48 bg-input border-border">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="project-1">Current Project</SelectItem>
              </SelectContent>
            </Select>
            <PCBGenerationDialog onPCBGenerated={handlePCBGenerated} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* PCB Canvas */}
          <div className="lg:col-span-3">
            {/* Editor Toolbar */}
            <div className="mb-3">
              <PCBEditorToolbar
                isEditMode={isEditMode}
                selectedComponent={selectedComponent}
                isRouting={routingState.isRouting}
                canUndo={canUndo}
                canRedo={canRedo}
                onToggleEditMode={() => setIsEditMode(!isEditMode)}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onDelete={deleteSelectedComponent}
                onRotate={rotateSelectedComponent}
                onCancelRouting={cancelRouting}
              />
            </div>

            <div className="blueprint-card overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center justify-between p-3 border-b border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {generatedPCB.pcb_data?.board && (
                    <span>
                      Board: {generatedPCB.pcb_data.board.width}mm x{" "}
                      {generatedPCB.pcb_data.board.height}mm
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    disabled={!generatedPCB.svg}
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={handlePrint}
                    disabled={!generatedPCB.svg}
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </Button>
                  <Button
                    className="bg-primary hover:bg-primary/90 gap-2"
                    size="sm"
                    onClick={handleDownloadSVG}
                    disabled={!generatedPCB.svg}
                  >
                    <Download className="w-4 h-4" />
                    Download SVG
                  </Button>
                </div>
              </div>

              {/* PCB View */}
<<<<<<< HEAD
              <div className="aspect-[4/3] bg-[#0a1628]">
                <PCBRenderer svg={generatedPCB.svg} className="w-full h-full" />
=======
              <div 
                className="pcb-container aspect-[4/3] flex items-center justify-center overflow-auto p-4"
                style={{ backgroundColor: "hsl(var(--pcb-background))" }}
              >
                <div
                  style={{ 
                    transform: `scale(${zoom / 100})`, 
                    transformOrigin: 'center',
                    transition: 'transform 0.2s ease-out'
                  }}
                >
                  <InteractivePCBRenderer
                    components={components}
                    traces={traces}
                    vias={vias}
                    layers={showLayers}
                    showGrid={true}
                    showLabels={showLayers.silkscreen}
                    isEditMode={isEditMode}
                    selectedComponent={selectedComponent}
                    routingState={routingState}
                    onDragStart={handleDragStart}
                    onDragMove={handleDragMove}
                    onDragEnd={handleDragEnd}
                    onPinClick={handlePinClick}
                    onCanvasClick={handleCanvasClick}
                    onComponentSelect={setSelectedComponent}
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
                  <span className="font-mono ml-2">{components.length}</span>
                </div>
                <div className="w-px h-4 bg-border" />
                <div>
                  <span className="text-muted-foreground">Traces:</span>
                  <span className="font-mono ml-2">{traces.length}</span>
                </div>
              </div>
              <div className="text-muted-foreground text-xs">
                ElectroLab v1.0 • {isEditMode ? "Editing" : "Ready for manufacturing"}
>>>>>>> eb187e8 (Update UI components with functionality &  Changing the Backend from python to Typr Script and its Ai Modle still in the Python)
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
                    onClick={() =>
                      setShowLayers({ ...showLayers, [layer]: !visible })
                    }
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

            {/* Components List / BOM */}
            <div className="blueprint-card p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
<<<<<<< HEAD
                <List className="w-4 h-4 text-primary" />
                Components ({generatedPCB.bom.length})
              </h3>
              <ScrollArea className="h-[200px]">
                {generatedPCB.bom.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Generate a PCB to see components
                  </p>
                ) : (
                  <div className="space-y-2 text-sm">
                    {generatedPCB.bom.map((item, idx) => (
                      <div key={idx} className="flex justify-between p-2 rounded bg-muted/30">
                        <div>
                          <span className="text-muted-foreground">
                            {item.name}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({item.package})
                          </span>
                        </div>
                        <span className="font-mono text-primary">
                          {item.reference}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
=======
                <Cpu className="w-4 h-4 text-primary" />
                Components ({components.length})
              </h3>
              <div className="space-y-1 text-sm max-h-48 overflow-y-auto">
                {components.map((comp) => (
                  <button
                    key={comp.id}
                    onClick={() => setSelectedComponent(comp.id)}
                    className={`w-full flex justify-between items-center p-2 rounded-lg transition-colors cursor-pointer ${
                      selectedComponent === comp.id 
                        ? 'bg-primary/20 border border-primary/40' 
                        : 'hover:bg-muted/30'
                    }`}
                  >
                    <div>
                      <span className="text-muted-foreground">{comp.type}</span>
                    </div>
                    <span className="font-mono text-xs text-primary">{comp.label}</span>
                  </button>
                ))}
              </div>
>>>>>>> eb187e8 (Update UI components with functionality &  Changing the Backend from python to Typr Script and its Ai Modle still in the Python)
            </div>

            {/* Export Options */}
            <div className="blueprint-card p-4">
              <h3 className="text-sm font-semibold mb-3">Export Options</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  size="sm"
                  onClick={handleDownloadSVG}
                  disabled={!generatedPCB.svg}
                >
                  <FileDown className="w-4 h-4" />
                  SVG (Vector Image)
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  size="sm"
                  onClick={handleDownloadBOM}
                  disabled={!generatedPCB.bom.length}
                >
                  <FileDown className="w-4 h-4" />
                  Bill of Materials (CSV)
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  size="sm"
                  disabled={true}
                >
                  <FileDown className="w-4 h-4" />
                  Gerber Files (Coming Soon)
                </Button>
              </div>
            </div>
<<<<<<< HEAD
=======

            {/* Edit Mode Help */}
            {isEditMode && (
              <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                <h4 className="text-xs font-semibold text-primary mb-2">🎛️ Edit Mode Controls</h4>
                <ul className="text-xs text-muted-foreground leading-relaxed space-y-1">
                  <li>• <strong>Drag</strong> components to reposition</li>
                  <li>• <strong>Click pins</strong> to start routing traces</li>
                  <li>• <strong>Click canvas</strong> to add routing points</li>
                  <li>• Press <strong>R</strong> to rotate selected</li>
                  <li>• Press <strong>Delete</strong> to remove</li>
                  <li>• Press <strong>Esc</strong> to cancel/deselect</li>
                </ul>
              </div>
            )}

            {/* Manufacturing Info */}
            {!isEditMode && (
              <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                <h4 className="text-xs font-semibold text-primary mb-2">💡 Manufacturing Ready</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Export Gerber files and upload to PCB manufacturers like JLCPCB, PCBWay, or OSH Park for professional fabrication.
                </p>
              </div>
            )}
>>>>>>> eb187e8 (Update UI components with functionality &  Changing the Backend from python to Typr Script and its Ai Modle still in the Python)
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PCBViewer;
