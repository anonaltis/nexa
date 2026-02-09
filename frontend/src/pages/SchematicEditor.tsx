import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import {
  CircuitBoard,
  Save,
  Download,
  Upload,
  MousePointer,
  Minus,
  Trash2,
  Play,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import ComponentPalette, { ComponentTemplate } from "@/components/schematic/ComponentPalette";
import PropertiesPanel from "@/components/schematic/PropertiesPanel";
import SchematicCanvas, { SchematicNode, SchematicWire } from "@/components/schematic/SchematicCanvas";
import AISynthesisPanel from "@/components/schematic/AISynthesisPanel";

const SchematicEditor = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const schematicId = searchParams.get("id");

  const [nodes, setNodes] = useState<SchematicNode[]>([]);
  const [wires, setWires] = useState<SchematicWire[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [schematicName, setSchematicName] = useState("Untitled Schematic");
  const [tool, setTool] = useState<"select" | "wire">("select");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // AI Synthesis State
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isExtractingVision, setIsExtractingVision] = useState(false);
  const [designRationale, setDesignRationale] = useState<string | undefined>();

  // Load schematic if ID provided
  useEffect(() => {
    if (schematicId && user) {
      loadSchematic(schematicId);
    }
  }, [schematicId, user]);

  const loadSchematic = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/schematics/${id}`);
      const data = response.data;
      setSchematicName(data.name);
      setNodes(data.nodes || []);
      setWires(data.wires || []);
    } catch (error) {
      console.error("Failed to load schematic:", error);
      toast.error("Failed to load schematic");
    } finally {
      setIsLoading(false);
    }
  };

  const saveSchematic = async () => {
    setIsSaving(true);
    try {
      if (schematicId) {
        // Update existing
        await api.put(`/api/schematics/${schematicId}`, {
          name: schematicName,
          nodes: nodes,
          wires: wires,
        });
        toast.success("Schematic saved");
      } else {
        // Create new
        const response = await api.post("/api/schematics/", {
          name: schematicName,
        });
        const newId = response.data._id;

        // Update with nodes and wires
        await api.put(`/api/schematics/${newId}`, {
          name: schematicName,
          nodes: nodes,
          wires: wires,
        });

        // Update URL
        window.history.replaceState({}, "", `/schematic?id=${newId}`);
        toast.success("Schematic created and saved");
      }
    } catch (error) {
      console.error("Failed to save schematic:", error);
      toast.error("Failed to save schematic");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragStart = (component: ComponentTemplate) => {
    // Can be used for drag feedback
  };

  const handleAddComponent = (component: ComponentTemplate) => {
    const newNode: SchematicNode = {
      id: `node-${Date.now()}`,
      component_id: component.id,
      x: 200 + Math.random() * 200,
      y: 200 + Math.random() * 200,
      rotation: 0,
      properties: {
        label: `${component.name}${nodes.filter((n) => n.properties.type === component.type).length + 1}`,
        type: component.type,
        package: "through-hole",
      },
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
  };

  const handleDropComponent = (componentType: string, x: number, y: number) => {
    const template = { id: componentType, name: componentType, type: componentType };
    const newNode: SchematicNode = {
      id: `node-${Date.now()}`,
      component_id: componentType,
      x,
      y,
      rotation: 0,
      properties: {
        label: `${componentType}${nodes.filter((n) => n.properties.type === componentType).length + 1}`,
        type: componentType,
        package: "through-hole",
      },
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
  };

  const handleUpdateNode = (id: string, updates: Partial<SchematicNode>) => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === id ? { ...node, ...updates } : node
      )
    );
  };

  const handleDeleteNode = (id: string) => {
    setNodes((prev) => prev.filter((node) => node.id !== id));
    setWires((prev) =>
      prev.filter((wire) => wire.from_node !== id && wire.to_node !== id)
    );
    setSelectedNodeId(null);
  };

  const handleRotateNode = (id: string) => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === id
          ? { ...node, rotation: (node.rotation + 90) % 360 }
          : node
      )
    );
  };

  const handleAddWire = (wire: SchematicWire) => {
    setWires((prev) => [...prev, wire]);
  };

  const handleAnalyze = async () => {
    if (!schematicId) {
      toast.error("Save the schematic first");
      return;
    }

    try {
      const response = await api.post(`/api/schematics/${schematicId}/analyze`);
      toast.success(`Analysis complete: ${response.data.component_count} components`);
    } catch (error) {
      console.error("Analysis failed:", error);
      toast.error("Analysis failed");
    }
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to clear the schematic?")) {
      setNodes([]);
      setWires([]);
      setSelectedNodeId(null);
      setDesignRationale(undefined);
    }
  };

  const handleGenerateDesign = async (prompt: string) => {
    setIsGeneratingAI(true);
    setDesignRationale(undefined);
    try {
      const response = await api.post("/api/design/generate", {
        query: prompt,
        use_cache: true
      });

      const data = response.data;
      setDesignRationale(data.metadata?.validator_comments?.join(". ") || "Design validated by Nexa Core.");

      // Update canvas with generated schematic data
      if (data.schematic_data) {
        setNodes(data.schematic_data.nodes || []);
        setWires(data.schematic_data.wires || []);
        toast.success("Circuit topology synced to canvas");
      } else {
        toast.success("Circuit logic synthesized successfully");
      }

    } catch (error) {
      console.error("AI Generation failed:", error);
      toast.error("Synthesis failed: Neural link timeout");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleVisionExtract = async (file: File) => {
    setIsExtractingVision(true);
    try {
      // Mocking vision extraction for demo to save tokens as requested
      await new Promise(r => setTimeout(r, 2000));

      // Add mock nodes representing an extracted LDO circuit
      const mockNodes: SchematicNode[] = [
        { id: `ext-${Date.now()}-1`, component_id: "resistor", x: 150, y: 150, rotation: 0, properties: { label: "R_DIV_1", type: "resistor" } },
        { id: `ext-${Date.now()}-2`, component_id: "resistor", x: 150, y: 250, rotation: 0, properties: { label: "R_DIV_2", type: "resistor" } },
        { id: `ext-${Date.now()}-3`, component_id: "ic", x: 300, y: 200, rotation: 0, properties: { label: "LM7805", type: "ic" } }
      ];

      setNodes(prev => [...prev, ...mockNodes]);
      setDesignRationale("Vision Agent detected an LDO Voltage Regulator topology from the uploaded image. Components extracted with 98.4% confidence.");
      toast.success("Vision extraction complete");
    } catch (error) {
      console.error("Vision extraction failed:", error);
      toast.error("Vision link failure");
    } finally {
      setIsExtractingVision(false);
    }
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  if (!user) {
    return (
      <Layout>
        <div className="py-20 text-center">
          <h1 className="text-2xl font-bold mb-4 uppercase tracking-tighter">Login Required</h1>
          <p className="text-muted-foreground mb-8">Please log in to access the schematic editor</p>
          <Button asChild>
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout hideFooter fullWidth>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)] uppercase font-bold text-xs tracking-widest text-muted-foreground">
          Loading...
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideFooter fullWidth>
      <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
        {/* Header Module - Mission Control Style */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-4 blueprint-card border-primary/20 bg-primary/5 mx-4 mt-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <h1 className="text-2xl font-bold tracking-tighter uppercase">Logic Schematic Terminal</h1>
            </div>
            <div className="flex items-center gap-4 ml-5">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                {schematicId ? `Active Buffer: ${schematicId.slice(0, 8)}` : "New Session Initialized"}
              </p>
              <div className="h-3 w-px bg-primary/20" />
              <Input
                value={schematicName}
                onChange={(e) => setSchematicName(e.target.value)}
                className="w-48 h-6 text-[9px] bg-background/50 border-primary/10 font-bold uppercase tracking-tight focus:border-primary/40 ring-0 focus-visible:ring-0"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex flex-col items-end mr-2">
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">System Integrity</span>
              <span className="text-[10px] font-bold text-success uppercase">Verifying Topology...</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-4 text-[10px] font-bold uppercase tracking-widest border-primary/20 hover:bg-primary/5 text-muted-foreground hover:text-primary"
              >
                Export Netlist
              </Button>
              <Button
                className="h-9 px-6 bg-primary hover:bg-primary/90 text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
                onClick={saveSchematic}
                disabled={isSaving}
              >
                {isSaving ? "Syncing Logic..." : "Commit Changes"}
              </Button>
            </div>
          </div>
        </div>

        {/* Workspace Toolbar */}
        <div className="px-4 mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 p-1 bg-black/20 backdrop-blur-md border border-primary/10 rounded overflow-hidden">
            <div className="flex bg-primary/5 rounded border border-primary/10 overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-4 text-[9px] font-bold uppercase tracking-widest rounded-none ${tool === "select" ? "bg-primary text-primary-foreground shadow-inner" : "text-muted-foreground hover:bg-primary/10"}`}
                onClick={() => setTool("select")}
              >
                Pointer
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-4 text-[9px] font-bold uppercase tracking-widest rounded-none ${tool === "wire" ? "bg-primary text-primary-foreground shadow-inner" : "text-muted-foreground hover:bg-primary/10"}`}
                onClick={() => setTool("wire")}
              >
                Buss_Wire
              </Button>
            </div>

            <div className="h-6 w-px bg-primary/10 mx-1" />

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-white"
              onClick={handleClear}
            >
              Purge_All
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-[9px] font-bold uppercase tracking-widest text-primary/80 hover:text-primary bg-primary/5"
              onClick={handleAnalyze}
              disabled={nodes.length === 0}
            >
              Analyze_Topology
            </Button>
          </div>

          <div className="hidden md:flex items-center gap-6 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground pr-2">
            <div className="flex items-center gap-2">
              <span className="h-1 w-1 bg-primary rounded-full" />
              Coordinate: Static
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1 w-1 bg-accent rounded-full" />
              DRC: Active
            </div>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex flex-1 overflow-hidden p-4 gap-4">
          {/* Module Palette */}
          <div className="w-56 flex flex-col gap-4">
            <ComponentPalette
              onDragStart={handleDragStart}
              onAddComponent={handleAddComponent}
            />

            {/* Quick Session Stats */}
            <div className="blueprint-card p-4 border-primary/10 bg-black/20">
              <h4 className="text-[9px] font-bold text-primary uppercase tracking-[0.2em] mb-4">Topology Status</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                  <span className="text-muted-foreground">Assets In Scene</span>
                  <span className="text-foreground">{nodes.length} Units</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                  <span className="text-muted-foreground">Trace Sequences</span>
                  <span className="text-foreground">{wires.length} Paths</span>
                </div>
                <div className="h-px bg-primary/10 w-full" />
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-bold text-muted-foreground uppercase">Memory Matrix</span>
                  <div className="w-full h-1 bg-primary/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary/40 w-[35%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Canvas Workspace */}
          <div className="flex-1 relative group bg-black/40 rounded-lg overflow-hidden border border-primary/10">
            {/* Corner Bracket Overlays */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/30 z-10 pointer-events-none" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/30 z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/30 z-10 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/30 z-10 pointer-events-none" />

            {/* HUD Overlay Text */}
            <div className="absolute top-4 right-4 z-10 pointer-events-none text-right">
              <div className="text-[9px] font-bold text-primary/40 uppercase tracking-[0.3em]">Canvas_Primary_V1.0</div>
              <div className="text-[8px] font-bold text-muted-foreground/30 uppercase mt-1">Authorized Access Only</div>
            </div>

            <div className="h-full blueprint-bg relative z-1 overflow-hidden">
              <SchematicCanvas
                nodes={nodes}
                wires={wires}
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
                onUpdateNode={handleUpdateNode}
                onAddWire={handleAddWire}
                onDropComponent={handleDropComponent}
                tool={tool}
              />
            </div>
          </div>

          {/* Parameter Control Panel */}
          <div className="w-72 flex flex-col gap-4 overflow-y-auto">
            <PropertiesPanel
              selectedNode={selectedNode}
              onUpdateNode={handleUpdateNode}
              onDeleteNode={handleDeleteNode}
              onRotateNode={handleRotateNode}
            />

            <AISynthesisPanel
              onGenerateDesign={handleGenerateDesign}
              onVisionExtract={handleVisionExtract}
              isGenerating={isGeneratingAI}
              isExtracting={isExtractingVision}
              designRationale={designRationale}
            />
          </div>
        </div>

        {/* Global Navigation Bar Replacement (Status) */}
        <div className="px-6 py-2 border-t border-primary/10 bg-black/60 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.2em]">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="h-1 w-1 bg-success animate-pulse" />
              <span className="text-success/80">Communication Established</span>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground/60">
              <span>Nodes: {nodes.length}</span>
              <span>Writers: {wires.length}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-primary/50">
            <span>ElectroLab Protocol v1.4</span>
            <div className="h-3 w-px bg-primary/20" />
            <span>{new Date().toISOString().split('T')[0]}</span>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SchematicEditor;
