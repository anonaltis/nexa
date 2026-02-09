import { useState, useEffect, useCallback, useRef } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import { useProjectContext } from "@/contexts/ProjectContext";
import {
  Download,
  Layers,
  Eye,
  EyeOff,
  FileDown,
  Printer,
  Share2,
  Cpu,
  Info,
  Box,
  Plus,
  Save,
  Loader2,
  LayoutDashboard,
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
import InteractivePCBRenderer from "@/components/pcb/InteractivePCBRenderer";
import PCBEditorToolbar from "@/components/pcb/PCBEditorToolbar";
import PCBGenerationDialog from "@/components/pcb/PCBGenerationDialog";
import { usePCBEditor, PCBComponent, PCBTrace, PCBVia } from "@/hooks/usePCBEditor";
import { usePCBHistory } from "@/hooks/usePCBHistory";
import { toast } from "@/hooks/use-toast";

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

const libraryComponents = [
  { type: "chip", width: 80, height: 80, label: "MCU", sublabel: "ATMega328" },
  { type: "ic", width: 60, height: 30, label: "OPAMP", sublabel: "LM358" },
  { type: "resistor", width: 30, height: 10, label: "RES", sublabel: "10k" },
  { type: "capacitor", width: 15, height: 25, label: "CAP", sublabel: "10uF" },
  { type: "led", width: 10, height: 10, label: "LED", sublabel: "Red" },
  { type: "transistor", width: 12, height: 12, label: "Q", sublabel: "2N2222" },
  { type: "crystal", width: 25, height: 12, label: "XTAL", sublabel: "16MHz" },
  { type: "connector", width: 80, height: 50, label: "USB", sublabel: "Type-C" },
];

const PCBViewer = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const projectId = searchParams.get("project");
  const { getProject, updateProject, projects } = useProjectContext();
  const [zoom] = useState(100);
  const [isSaving, setIsSaving] = useState(false);
  const [, setGeneratedPCB] = useState<GeneratedPCB>(defaultPCB);
  const [showLayers, setShowLayers] = useState({
    top: true,
    bottom: true,
    silkscreen: true,
    traces: true,
  });
  const [focusedLayer, setFocusedLayer] = useState<string>("all");

  const {
    components,
    traces,
    vias,
    selectedComponent,
    selectedTrace,
    isEditMode,
    routingState,
    setIsEditMode,
    setSelectedComponent,
    setSelectedTrace,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    startRouting,
    addRoutingPoint,
    completeRouting,
    cancelRouting,
    deleteSelectedComponent,
    rotateSelectedComponent,
    addComponent,
    setComponents,
    setTraces,
    setVias,
  } = usePCBEditor([], [], []);

  const handleSaveDesign = async () => {
    if (!projectId) {
      toast({ title: "No Project Selected", description: "Design changes are only saved to specific projects.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      await updateProject(projectId, {
        status: "designing",
        pcbDiagram: {
          id: `pcb-${projectId}`,
          projectId,
          svgData: "",
          width: 450,
          height: 500,
          layers: [],
          components,
          connections: traces as any,
          vias,
        } as any
      });
      toast({ title: "Design Saved", description: "PCB layout has been persisted to the cloud." });
    } catch (error) {
      console.error("Save failed:", error);
      toast({ title: "Save Failed", description: "Could not save design to the cloud.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    // Priority 1: State from navigation (AI generated)
    if (location.state?.pcb_data) {
      const pcb = location.state.pcb_data;
      if (pcb.components) setComponents(pcb.components);
      if (pcb.traces) setTraces(pcb.traces);
      if (pcb.vias) setVias(pcb.vias);
      toast({ title: "Design Synced", description: "AI generated PCB layout loaded from memory." });
      return;
    }

    // Priority 2: Project data from context
    if (projectId) {
      const project = getProject(projectId);
      if (project && project.pcbDiagram) {
        const { components: pcbComps, connections: pcbTraces, vias: pcbVias } = project.pcbDiagram as any;
        if (pcbComps) setComponents(pcbComps);
        if (pcbTraces) setTraces(pcbTraces);
        if (pcbVias) setVias(pcbVias);
      } else {
        setComponents(defaultComponents);
        setTraces(defaultTraces);
        setVias(defaultVias);
      }
    } else {
      setComponents(defaultComponents);
      setTraces(defaultTraces);
      setVias(defaultVias);
    }
  }, [projectId, getProject, setComponents, setTraces, setVias, location.state]);

  const {
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = usePCBHistory({ components, traces, vias });

  const lastStateRef = useRef({ components, traces, vias });

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
      setVias(prevState.vias || []);
      toast({ title: "Undo", description: "Reverted to previous state" });
    }
  }, [undo, setComponents, setTraces, setVias]);

  const handleRedo = useCallback(() => {
    const nextState = redo();
    if (nextState) {
      setComponents(nextState.components);
      setTraces(nextState.traces);
      setVias(nextState.vias || []);
      toast({ title: "Redo", description: "Restored next state" });
    }
  }, [redo, setComponents, setTraces, setVias]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (routingState.isRouting) {
          cancelRouting();
        } else {
          setSelectedComponent(null);
          setSelectedTrace(null);
        }
      }
      if (e.key === "Delete" && (selectedComponent || selectedTrace)) {
        deleteSelectedComponent();
      }
      if (e.key === "r" && selectedComponent && isEditMode) {
        rotateSelectedComponent();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey && isEditMode) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "Z" || e.key === "y") && isEditMode) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [routingState.isRouting, selectedComponent, selectedTrace, isEditMode, cancelRouting, deleteSelectedComponent, rotateSelectedComponent, setSelectedComponent, setSelectedTrace, handleUndo, handleRedo]);

  const handlePCBGenerated = (pcb: GeneratedPCB) => {
    setGeneratedPCB(pcb);
    if (pcb.pcb_data?.components) {
      setComponents(pcb.pcb_data.components);
    }
  };

  const handleDownloadSVG = () => {
    const svgElement = document.querySelector('.pcb-container svg');
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pcb-diagram-${projectId || 'demo'}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handlePrint = () => {
    const svgElement = document.querySelector('.pcb-container svg');
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>PCB Design - Print</title></head>
            <body style="margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh;">
              ${svgData}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handlePinClick = useCallback((componentId: string, pinId: string, x: number, y: number) => {
    if (!routingState.isRouting) {
      startRouting(componentId, pinId, x, y);
    } else {
      completeRouting(componentId, pinId, x, y);
    }
  }, [routingState.isRouting, startRouting, completeRouting]);

  const handleCanvasClick = useCallback((x: number, y: number) => {
    if (routingState.isRouting) {
      addRoutingPoint(x, y);
    }
  }, [routingState.isRouting, addRoutingPoint]);

  const handleLibraryItemDragStart = (e: React.DragEvent, item: any) => {
    if (!isEditMode) {
      e.preventDefault();
      toast({ title: "Edit Mode Required", description: "Please enter edit mode to add components", variant: "destructive" });
      return;
    }
    e.dataTransfer.setData("application/json", JSON.stringify(item));
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDropOnCanvas = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!isEditMode) return;

    try {
      const data = e.dataTransfer.getData("application/json");
      if (!data) return;
      const item = JSON.parse(data);

      const svgContainer = e.currentTarget;
      const rect = svgContainer.getBoundingClientRect();

      const x = (e.clientX - rect.left) * (450 / rect.width);
      const y = (e.clientY - rect.top) * (500 / rect.height);

      const snappedX = Math.round(x / 10) * 10;
      const snappedY = Math.round(y / 10) * 10;

      addComponent({
        ...item,
        x: snappedX - item.width / 2,
        y: snappedY - item.height / 2,
        pins: [],
      });

      toast({ title: "Component Added", description: `Added ${item.label} to the PCB` });
    } catch (err) {
      console.error("Failed to drop component:", err);
    }
  }, [isEditMode, addComponent]);

  if (!user) {
    return (
      <Layout>
        <div className="py-20 text-center">
          <h1 className="text-2xl font-bold mb-4 uppercase tracking-tighter">Login Required</h1>
          <p className="text-muted-foreground mb-8">Please log in to view and edit PCB diagrams</p>
          <Button asChild>
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const currentProject = projectId ? getProject(projectId) : null;

  return (
    <Layout>
      <div className="py-6 space-y-6">
        {/* Header Module */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 blueprint-card border-primary/20 bg-primary/5">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <h1 className="text-3xl font-bold tracking-tighter uppercase">PCB Control Center</h1>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] ml-5">
              {currentProject ? `Active Session: ${currentProject.name}` : "System Initialized: AI Layout Engine"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end mr-4">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Global Status</span>
              <span className="text-xs font-bold text-primary uppercase">Connected / Online</span>
            </div>
            <Select
              value={projectId || "demo"}
              onValueChange={(val) => {
                if (val === "demo") {
                  setSearchParams({});
                } else {
                  setSearchParams({ project: val });
                }
              }}
            >
              <SelectTrigger className="w-56 bg-background/50 border-primary/30 font-bold text-[10px] uppercase tracking-widest h-10">
                <SelectValue placeholder="Project Selection" />
              </SelectTrigger>
              <SelectContent className="bg-card border-primary/30">
                <SelectItem value="demo" className="text-[10px] font-bold uppercase">Demo Module</SelectItem>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id} className="text-[10px] font-bold uppercase">{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <PCBGenerationDialog onPCBGenerated={handlePCBGenerated} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Workspace (9/12) */}
          <div className="lg:col-span-9 space-y-4">
            <div className="flex items-center justify-between px-2">
              <PCBEditorToolbar
                isEditMode={isEditMode}
                selectedComponent={selectedComponent || selectedTrace}
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
              <div className="hidden md:flex items-center gap-6 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Grid: 10mm
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  Snap: Enabled
                </div>
              </div>
            </div>

            <div className="relative group">
              {/* Corner Accents */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary z-10" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary z-10" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary z-10" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary z-10" />

              <div className="blueprint-card overflow-hidden bg-pcb-background ring-1 ring-primary/20 shadow-2xl">
                <div className="flex items-center justify-between p-4 border-b border-primary/20 bg-primary/5">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Board Dimensions</span>
                      <span className="text-xs font-bold text-primary uppercase">100.00MM × 80.00MM</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      className="bg-primary hover:bg-primary/90 text-[10px] font-bold uppercase tracking-widest h-8 px-4"
                      size="sm"
                      onClick={handleSaveDesign}
                      disabled={isSaving || !projectId}
                    >
                      {isSaving ? "Syncing..." : "Commit Design"}
                    </Button>
                    <div className="flex border border-primary/20 rounded-md overflow-hidden h-8">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-none border-r border-primary/20 text-[9px] font-bold uppercase tracking-widest hover:bg-primary/10"
                        onClick={handlePrint}
                      >
                        Print
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-none text-[9px] font-bold uppercase tracking-widest hover:bg-primary/10"
                        onClick={handleDownloadSVG}
                      >
                        Export SVG
                      </Button>
                    </div>
                  </div>
                </div>

                <div
                  className="pcb-container aspect-[16/10] flex items-center justify-center overflow-auto p-8 relative"
                  style={{ backgroundColor: "hsl(var(--pcb-background))" }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (isEditMode) e.dataTransfer.dropEffect = "copy";
                  }}
                  onDrop={handleDropOnCanvas}
                >
                  {/* Decorative Scanlines */}
                  <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

                  <div
                    style={{
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: 'center',
                      transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                    className="relative z-1"
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
                      selectedTrace={selectedTrace}
                      routingState={routingState}
                      onDragStart={handleDragStart}
                      onDragMove={handleDragMove}
                      onDragEnd={handleDragEnd}
                      onPinClick={handlePinClick}
                      onCanvasClick={handleCanvasClick}
                      onComponentSelect={setSelectedComponent}
                      onTraceSelect={setSelectedTrace}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Status Console */}
            <div className="p-4 blueprint-card border-primary/10 bg-black/40 flex flex-col md:flex-row items-center justify-between text-[10px] uppercase font-bold tracking-widest gap-4">
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-muted-foreground mb-0.5">Physical Metrics</span>
                  <span className="text-primary font-mono tabular-nums">100X80MM / 2-LAYER</span>
                </div>
                <div className="h-4 w-px bg-primary/20" />
                <div className="flex flex-col">
                  <span className="text-muted-foreground mb-0.5">Asset Count</span>
                  <span className="text-primary font-mono tabular-nums">COMP:{components.length} / TRACE:{traces.length}</span>
                </div>
                <div className="h-4 w-px bg-primary/20" />
                <div className="flex flex-col">
                  <span className="text-muted-foreground mb-0.5">System Load</span>
                  <span className="text-success font-mono tabular-nums">OPTIMAL (14ms)</span>
                </div>
              </div>
              <div className="text-primary/70 animate-pulse bg-primary/5 px-3 py-1.5 rounded border border-primary/20">
                SYSTEM: {isEditMode ? "WRITE ACCESS ENABLED" : "READY FOR ANALYSIS"}
              </div>
            </div>
          </div>

          {/* Sidebar Modules (3/12) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="blueprint-card p-0 overflow-hidden border-primary/20">
              <div className="bg-primary/10 px-4 py-2 border-b border-primary/20">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Component Library</h3>
              </div>
              <div className="p-4">
                <p className="text-[9px] text-muted-foreground mb-4 uppercase font-bold leading-tight">
                  {isEditMode ? "Drag modules onto physical surface" : "Access locked: enter edit mode"}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {libraryComponents.map((item, idx) => (
                    <div
                      key={idx}
                      draggable={isEditMode}
                      onDragStart={(e) => handleLibraryItemDragStart(e, item)}
                      className={`group flex flex-col items-center justify-center p-3 rounded border border-primary/10 transition-all duration-300 bg-primary/5 shadow-inner ${isEditMode
                        ? 'cursor-grab active:cursor-grabbing hover:border-primary/50 hover:bg-primary/10 hover:shadow-primary/5'
                        : 'opacity-50 cursor-not-allowed'
                        }`}
                    >
                      <div className="w-full text-center py-1.5 mb-2 bg-black/40 rounded text-[7px] font-bold uppercase tracking-widest text-primary group-hover:bg-primary/20 transition-colors">
                        {item.type}
                      </div>
                      <span className="text-[10px] font-bold tracking-tight text-foreground">{item.label}</span>
                      <span className="text-[8px] text-muted-foreground/70 uppercase font-bold">{item.sublabel}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="blueprint-card p-0 overflow-hidden border-primary/20">
              <div className="bg-primary/10 px-4 py-2 border-b border-primary/20">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Sensor Overlay</h3>
              </div>
              <div className="p-4 space-y-1">
                {Object.entries(showLayers).map(([layer, visible]) => (
                  <button
                    key={layer}
                    onClick={() =>
                      setShowLayers({ ...showLayers, [layer]: !visible })
                    }
                    className="w-full flex items-center justify-between p-2.5 rounded hover:bg-primary/10 transition-all duration-200 group"
                  >
                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground group-hover:text-primary">{layer}</span>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${visible ? 'text-primary border-primary/40 bg-primary/5' : 'text-muted-foreground/30 border-transparent'}`}>
                      {visible ? 'Active' : 'Muted'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="blueprint-card p-0 overflow-hidden border-primary/20">
              <div className="bg-primary/10 px-4 py-2 border-b border-primary/20">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Isolation Matrix</h3>
              </div>
              <div className="p-2 grid grid-cols-2 gap-1">
                {['all', 'top', 'bottom', 'silkscreen'].map((layer) => (
                  <Button
                    key={layer}
                    variant={focusedLayer === layer ? "default" : "ghost"}
                    size="sm"
                    className={`text-[9px] font-bold uppercase tracking-tighter h-8 rounded-sm ${focusedLayer === layer ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary hover:bg-primary/5"}`}
                    onClick={() => {
                      setFocusedLayer(layer);
                      if (layer === 'all') {
                        setShowLayers({ top: true, bottom: true, silkscreen: true, traces: true });
                      } else {
                        setShowLayers({
                          top: layer === 'top',
                          bottom: layer === 'bottom',
                          silkscreen: layer === 'silkscreen',
                          traces: layer !== 'silkscreen'
                        });
                      }
                    }}
                  >
                    {layer}
                  </Button>
                ))}
              </div>
            </div>

            <div className="blueprint-card p-0 overflow-hidden border-primary/20">
              <div className="bg-primary/10 px-4 py-2 border-b border-primary/20 flex items-center justify-between">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Asset Map</h3>
                <span className="text-[8px] font-bold text-primary/70">{components.length} Units</span>
              </div>
              <div className="p-2 space-y-1 max-h-56 overflow-y-auto custom-scrollbar">
                {components.map((comp) => (
                  <button
                    key={comp.id}
                    onClick={() => setSelectedComponent(comp.id)}
                    className={`w-full flex justify-between items-center p-2 rounded transition-all duration-200 cursor-pointer uppercase font-bold group ${selectedComponent === comp.id
                      ? 'bg-primary/20 border border-primary/40'
                      : 'hover:bg-primary/5'
                      }`}
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-[7px] text-muted-foreground/60 leading-none group-hover:text-primary/70">{comp.type}</span>
                      <span className="text-[10px] text-foreground tracking-tight">{comp.label}</span>
                    </div>
                    <span className="font-mono text-[9px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">ID:{comp.id.slice(-4)}</span>
                  </button>
                ))}
              </div>
            </div>

            {isEditMode && (
              <div className="p-4 rounded border border-primary/30 bg-primary/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-1 opacity-20">
                  <span className="text-[8px] font-bold uppercase tracking-tighter">Authorized</span>
                </div>
                <h4 className="text-[10px] font-bold text-primary mb-3 uppercase tracking-widest flex items-center gap-2">
                  <span className="h-1 w-1 bg-primary rounded-full animate-ping" />
                  Edit Protocol
                </h4>
                <div className="space-y-3">
                  {[
                    "Pull items from library to initialize",
                    "Translate modules via vector drag",
                    "Engage pin nodes for trace routing",
                    "R: Rotate Orientation",
                    "DEL: Purge Selected Asset",
                    "ESC: Nullify Current Action"
                  ].map((text, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="text-primary font-mono text-[8px] mt-0.5">{`0${i + 1}`}</span>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase leading-tight">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PCBViewer;
