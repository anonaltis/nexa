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
      <div className="blueprint-card p-4 h-full">
        <h3 className="text-sm font-semibold mb-3">Properties</h3>
        <p className="text-xs text-muted-foreground">
          Select a component to view its properties
        </p>
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
    <div className="blueprint-card p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Properties</h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onRotateNode(selectedNode.id)}
            title="Rotate 90°"
          >
            <RotateCw className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => onDeleteNode(selectedNode.id)}
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Component Type */}
        <div className="space-y-1">
          <Label className="text-xs">Type</Label>
          <div className="text-sm font-mono text-muted-foreground">
            {selectedNode.properties.type}
          </div>
        </div>

        {/* Label */}
        <div className="space-y-1">
          <Label htmlFor="label" className="text-xs">
            Label
          </Label>
          <Input
            id="label"
            value={selectedNode.properties.label}
            onChange={(e) => handlePropertyChange("label", e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        {/* Value */}
        {["resistor", "capacitor", "inductor"].includes(selectedNode.properties.type) && (
          <div className="space-y-1">
            <Label htmlFor="value" className="text-xs">
              Value
            </Label>
            <Input
              id="value"
              value={selectedNode.properties.value || ""}
              onChange={(e) => handlePropertyChange("value", e.target.value)}
              placeholder="e.g., 10K, 100uF"
              className="h-8 text-sm"
            />
          </div>
        )}

        {/* Package */}
        <div className="space-y-1">
          <Label htmlFor="package" className="text-xs">
            Package
          </Label>
          <Select
            value={selectedNode.properties.package || "through-hole"}
            onValueChange={(value) => handlePropertyChange("package", value)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="through-hole">Through-Hole</SelectItem>
              <SelectItem value="smd-0805">SMD 0805</SelectItem>
              <SelectItem value="smd-0603">SMD 0603</SelectItem>
              <SelectItem value="dip">DIP</SelectItem>
              <SelectItem value="soic">SOIC</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Position */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">X</Label>
            <Input
              type="number"
              value={Math.round(selectedNode.x)}
              onChange={(e) =>
                onUpdateNode(selectedNode.id, { x: parseInt(e.target.value) || 0 })
              }
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Y</Label>
            <Input
              type="number"
              value={Math.round(selectedNode.y)}
              onChange={(e) =>
                onUpdateNode(selectedNode.id, { y: parseInt(e.target.value) || 0 })
              }
              className="h-8 text-sm"
            />
          </div>
        </div>

        {/* Rotation */}
        <div className="space-y-1">
          <Label className="text-xs">Rotation</Label>
          <div className="text-sm font-mono">{selectedNode.rotation}°</div>
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;
