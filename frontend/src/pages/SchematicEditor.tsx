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
          <CircuitBoard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Login to Access Schematic Editor</h1>
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
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideFooter fullWidth>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-3 border-b border-border bg-card/50">
          <div className="flex items-center gap-4">
            <CircuitBoard className="w-5 h-5 text-primary" />
            <Input
              value={schematicName}
              onChange={(e) => setSchematicName(e.target.value)}
              className="w-48 h-8 text-sm bg-input"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Tool Selection */}
            <div className="flex items-center border border-border rounded-lg">
              <Button
                variant={tool === "select" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-r-none gap-2"
                onClick={() => setTool("select")}
              >
                <MousePointer className="w-4 h-4" />
                Select
              </Button>
              <Button
                variant={tool === "wire" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-l-none gap-2"
                onClick={() => setTool("wire")}
              >
                <Minus className="w-4 h-4" />
                Wire
              </Button>
            </div>

            <div className="w-px h-6 bg-border" />

            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={handleClear}
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={handleAnalyze}
              disabled={nodes.length === 0}
            >
              <Play className="w-4 h-4" />
              Analyze
            </Button>

            <div className="w-px h-6 bg-border" />

            <Button
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>

            <Button
              className="bg-primary hover:bg-primary/90 gap-2"
              size="sm"
              onClick={saveSchematic}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </Button>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Component Palette */}
          <div className="w-48 border-r border-border overflow-hidden">
            <ComponentPalette
              onDragStart={handleDragStart}
              onAddComponent={handleAddComponent}
            />
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-hidden">
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

          {/* Properties Panel */}
          <div className="w-56 border-l border-border overflow-hidden">
            <PropertiesPanel
              selectedNode={selectedNode}
              onUpdateNode={handleUpdateNode}
              onDeleteNode={handleDeleteNode}
              onRotateNode={handleRotateNode}
            />
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-card/50 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Components: {nodes.length}</span>
            <span>Wires: {wires.length}</span>
          </div>
          <div>
            {schematicId && <span>ID: {schematicId}</span>}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SchematicEditor;
