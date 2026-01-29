import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, RotateCw } from "lucide-react";

interface SchematicNode {
  id: string;
  component_id: string;
  x: number;
  y: number;
  rotation: number;
  properties: {
    label: string;
    value?: string;
    type: string;
    package?: string;
  };
}

interface PropertiesPanelProps {
  selectedNode: SchematicNode | null;
  onUpdateNode: (id: string, updates: Partial<SchematicNode>) => void;
  onDeleteNode: (id: string) => void;
  onRotateNode: (id: string) => void;
}

const PropertiesPanel = ({
  selectedNode,
  onUpdateNode,
  onDeleteNode,
  onRotateNode,
}: PropertiesPanelProps) => {
  if (!selectedNode) {
    return (
      <div className="blueprint-card p-0 flex flex-col h-full border-primary/20 bg-background/50 overflow-hidden">
        <div className="bg-primary/10 px-4 py-2 border-b border-primary/20">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Parameter Control</h3>
        </div>
        <div className="p-6 flex flex-col items-center justify-center text-center h-full">
          <div className="w-12 h-12 border-2 border-dashed border-primary/20 rounded-full flex items-center justify-center mb-4">
            <span className="text-[10px] text-primary/20 font-bold">READY</span>
          </div>
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
            Awaiting module selection for parameter modification
          </p>
        </div>
      </div>
    );
  }

  const handlePropertyChange = (key: string, value: any) => {
    onUpdateNode(selectedNode.id, {
      properties: {
        ...selectedNode.properties,
        [key]: value,
      },
    });
  };

  return (
    <div className="blueprint-card p-0 flex flex-col h-full border-primary/20 bg-background/50 overflow-hidden">
      <div className="bg-primary/10 px-4 py-2 border-b border-primary/20 flex items-center justify-between">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Parameter Control</h3>
        <div className="flex gap-1.5">
          <button
            onClick={() => onRotateNode(selectedNode.id)}
            className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest bg-primary/20 text-primary border border-primary/30 rounded hover:bg-primary/30 transition-colors"
          >
            Rotate
          </button>
          <button
            onClick={() => onDeleteNode(selectedNode.id)}
            className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest bg-destructive/10 text-destructive border border-destructive/30 rounded hover:bg-destructive/20 transition-colors"
          >
            Purge
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1 custom-scrollbar">
        <div className="p-4 space-y-6">
          {/* Identity Block */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="h-0.5 w-2 bg-primary/40" />
              <h4 className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Identification</h4>
            </div>

            <div className="grid gap-3 p-3 bg-black/20 border border-primary/5 rounded">
              <div className="space-y-1">
                <Label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60">Class</Label>
                <div className="text-xs font-bold text-primary uppercase">
                  {selectedNode.properties.type}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="label" className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  Unit Call-Sign
                </Label>
                <Input
                  id="label"
                  value={selectedNode.properties.label}
                  onChange={(e) => handlePropertyChange("label", e.target.value)}
                  className="h-7 text-[10px] font-bold uppercase bg-background/50 border-primary/10 focus:border-primary/40 px-2"
                />
              </div>
            </div>
          </div>

          {/* Configuration Block */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="h-0.5 w-2 bg-primary/40" />
              <h4 className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Configuration</h4>
            </div>

            <div className="grid gap-4">
              {["resistor", "capacitor", "inductor"].includes(selectedNode.properties.type) && (
                <div className="space-y-1">
                  <Label htmlFor="value" className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60">
                    Electrical Value
                  </Label>
                  <Input
                    id="value"
                    value={selectedNode.properties.value || ""}
                    onChange={(e) => handlePropertyChange("value", e.target.value)}
                    placeholder="E.G., 10K, 100UF"
                    className="h-7 text-[10px] font-bold uppercase bg-background/50 border-primary/10 focus:border-primary/40 px-2 placeholder:opacity-30"
                  />
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="package" className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  Form Factor
                </Label>
                <Select
                  value={selectedNode.properties.package || "through-hole"}
                  onValueChange={(value) => handlePropertyChange("package", value)}
                >
                  <SelectTrigger className="h-7 text-[9px] font-bold uppercase tracking-widest bg-background/50 border-primary/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-primary/20 font-bold text-[9px] uppercase tracking-widest">
                    <SelectItem value="through-hole">Through-Hole</SelectItem>
                    <SelectItem value="smd-0805">SMD 0805</SelectItem>
                    <SelectItem value="smd-0603">SMD 0603</SelectItem>
                    <SelectItem value="dip">DIP</SelectItem>
                    <SelectItem value="soic">SOIC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Spatial Coordinates Block */}
          <div className="space-y-4 border-t border-primary/5 pt-4">
            <div className="flex items-center gap-2">
              <span className="h-0.5 w-2 bg-primary/40" />
              <h4 className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Spatial Metrics</h4>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60">Loc_X</Label>
                <div className="h-7 px-2 flex items-center bg-black/20 border border-primary/5 rounded font-mono text-[10px] text-primary">
                  {Math.round(selectedNode.x)}PX
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60">Loc_Y</Label>
                <div className="h-7 px-2 flex items-center bg-black/20 border border-primary/5 rounded font-mono text-[10px] text-primary">
                  {Math.round(selectedNode.y)}PX
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60">Rotation</Label>
              <div className="h-7 px-2 flex items-center bg-black/20 border border-primary/5 rounded font-mono text-[10px] text-primary">
                {selectedNode.rotation}° DEG
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Verification Badge */}
      <div className="p-3 border-t border-primary/10 bg-primary/5">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-success" />
          <span className="text-[8px] font-bold text-success/70 uppercase tracking-widest">Parameter Sync Verified</span>
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;
