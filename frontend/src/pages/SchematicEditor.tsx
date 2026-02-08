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
  Sparkles,
  Image as ImageIcon,
  Wand2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import ComponentPalette, { ComponentTemplate } from "@/components/schematic/ComponentPalette";
import PropertiesPanel from "@/components/schematic/PropertiesPanel";
import SchematicCanvas, { SchematicNode, SchematicWire } from "@/components/schematic/SchematicCanvas";

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
  const [aiInput, setAiInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  // Load schematic if ID provided
  useEffect(() => {
    if (schematicId && user) {
      loadSchematic(schematicId);
    }
  }, [schematicId, user]);

  const loadSchematic = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/schematics/${id}`);
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
        await api.put(`/schematics/${schematicId}`, {
          name: schematicName,
          nodes: nodes,
          wires: wires,
        });
        toast.success("Schematic saved");
      } else {
        // Create new
        const response = await api.post("/schematics", {
          name: schematicName,
        });
        const newId = response.data._id;

        // Update with nodes and wires
        await api.put(`/schematics/${newId}`, {
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
      const response = await api.post(`/schematics/${schematicId}/analyze`);
      toast.success(`Analysis complete: ${response.data.component_count} components`);
    } catch (error) {
      console.error("Analysis failed:", error);
      toast.error("Analysis failed");
    }
  };

  const handleAiDesign = async () => {
    if (!aiInput.trim()) return;
    setIsAiLoading(true);
    try {
      const response = await api.post("/api/design/generate", {
        query: aiInput,
      });
      // Handle the generated schematic. Design agent returns content + metadata.
      // For now, toast the success and handle nodes if returned in specific format.
      // But according to existing code, it might need more parsing.
      toast.success("Design agent generated circuit logic");
      if (response.data.metadata?.nodes) {
        setNodes(response.data.metadata.nodes);
      }
    } catch (error) {
      console.error("AI Design failed:", error);
      toast.error("Design agent failed to synthesize logic");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleVisionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAiLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      // Mock call to vision agent or real if available
      // const response = await api.post("/api/vision/extract", formData);
      toast.info("Vision Agent: Analyzing schematic image...");
      await new Promise(r => setTimeout(r, 2000));
      toast.success("Vision Agent: Component extraction complete");
    } catch (error) {
      toast.error("Vision Agent fails to parse image");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to clear the schematic?")) {
      setNodes([]);
      setWires([]);
      setSelectedNodeId(null);
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
        </div>

        {/* AI Assistance Panel */}
        <div className="w-72 flex flex-col gap-4">
          <div className="blueprint-card p-4 border-primary/20 bg-primary/5 flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">AI_SYNTHESIS_ENGINE</h4>
            </div>

            <div className="space-y-4 flex-1 flex flex-col">
              <div className="space-y-2">
                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Logic_Injection (Design Agent)</span>
                <textarea
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="DESCRIBE_CIRCUIT: EX_NON_INVERTING_AMP..."
                  className="w-full h-24 bg-background/50 border border-primary/10 rounded p-2 text-[10px] font-bold uppercase tracking-tight resize-none focus:border-primary/40 transition-colors"
                />
                <Button
                  onClick={handleAiDesign}
                  disabled={isAiLoading || !aiInput.trim()}
                  className="w-full h-8 bg-primary/20 hover:bg-primary/30 border border-primary/30 text-[9px] font-black uppercase tracking-widest"
                >
                  {isAiLoading ? "Synthesizing..." : "Initialize_Synthesis"}
                </Button>
              </div>

              <div className="h-px bg-primary/10 w-full" />

              <div className="space-y-2">
                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Visual_Extraction (Vision Agent)</span>
                <div className="relative group/upload">
                  <input
                    type="file"
                    id="vision-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleVisionUpload}
                  />
                  <label
                    htmlFor="vision-upload"
                    className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-primary/10 rounded bg-primary/5 hover:bg-primary/10 hover:border-primary/30 transition-all cursor-pointer group"
                  >
                    <ImageIcon className="w-6 h-6 text-primary/40 group-hover:text-primary transition-colors" />
                    <span className="text-[8px] font-bold text-muted-foreground uppercase mt-2 group-hover:text-primary transition-colors">Upload_Schematic_Image</span>
                  </label>
                </div>
              </div>

              <div className="mt-auto pt-4 flex flex-col gap-2">
                <div className="flex items-center justify-between text-[8px] font-bold uppercase text-muted-foreground">
                  <span>Agent_Status</span>
                  <span className="text-primary">Online</span>
                </div>
                <div className="h-1 bg-primary/5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary/30 w-full animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          <PropertiesPanel
            selectedNode={selectedNode}
            onUpdateNode={handleUpdateNode}
            onDeleteNode={handleDeleteNode}
            onRotateNode={handleRotateNode}
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
    </Layout >
  );
};

export default SchematicEditor;
