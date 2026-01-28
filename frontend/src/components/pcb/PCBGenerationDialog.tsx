import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Cpu, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

interface PCBGenerationDialogProps {
  onPCBGenerated: (pcb: GeneratedPCB) => void;
}

const COMMON_COMPONENTS = [
  "ESP32",
  "ESP8266",
  "Arduino Nano",
  "DHT22",
  "DHT11",
  "OLED Display",
  "LCD 16x2",
  "Relay Module",
  "LED",
  "Resistor 10K",
  "Capacitor 100uF",
  "Voltage Regulator",
  "Push Button",
  "Buzzer",
];

const PCBGenerationDialog = ({ onPCBGenerated }: PCBGenerationDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [description, setDescription] = useState("");
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [customComponent, setCustomComponent] = useState("");
  const [boardWidth, setBoardWidth] = useState("100");
  const [boardHeight, setBoardHeight] = useState("80");
  const [error, setError] = useState<string | null>(null);

  const addComponent = (component: string) => {
    if (!selectedComponents.includes(component)) {
      setSelectedComponents((prev) => [...prev, component]);
    }
  };

  const removeComponent = (component: string) => {
    setSelectedComponents((prev) => prev.filter((c) => c !== component));
  };

  const addCustomComponent = () => {
    if (customComponent.trim() && !selectedComponents.includes(customComponent.trim())) {
      setSelectedComponents((prev) => [...prev, customComponent.trim()]);
      setCustomComponent("");
    }
  };

  const handleGenerate = async () => {
    if (selectedComponents.length === 0) {
      setError("Please add at least one component");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await api.post("/pcb/generate", {
        components: selectedComponents,
        board_size: {
          width: parseInt(boardWidth) || 100,
          height: parseInt(boardHeight) || 80,
        },
        project_description: description.trim() || undefined,
      });

      onPCBGenerated(response.data);
      setOpen(false);

      // Reset form
      setDescription("");
      setSelectedComponents([]);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to generate PCB");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-primary hover:bg-primary/90">
          <Cpu className="w-4 h-4" />
          Generate PCB
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" />
            AI PCB Generator
          </DialogTitle>
          <DialogDescription>
            Select components and let AI generate an optimized PCB layout.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {/* Project Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Project Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="E.g., Temperature monitoring system with WiFi connectivity..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Board Size */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">Board Width (mm)</Label>
              <Input
                id="width"
                type="number"
                value={boardWidth}
                onChange={(e) => setBoardWidth(e.target.value)}
                min="20"
                max="300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Board Height (mm)</Label>
              <Input
                id="height"
                type="number"
                value={boardHeight}
                onChange={(e) => setBoardHeight(e.target.value)}
                min="20"
                max="300"
              />
            </div>
          </div>

          {/* Selected Components */}
          <div className="space-y-2">
            <Label>Selected Components ({selectedComponents.length})</Label>
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border border-border rounded-lg bg-muted/30">
              {selectedComponents.length === 0 ? (
                <span className="text-sm text-muted-foreground">
                  Click components below to add them
                </span>
              ) : (
                selectedComponents.map((comp) => (
                  <Badge
                    key={comp}
                    variant="secondary"
                    className="gap-1 cursor-pointer hover:bg-destructive/20"
                    onClick={() => removeComponent(comp)}
                  >
                    {comp}
                    <X className="w-3 h-3" />
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* Custom Component */}
          <div className="flex gap-2">
            <Input
              placeholder="Add custom component..."
              value={customComponent}
              onChange={(e) => setCustomComponent(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomComponent()}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={addCustomComponent}
              disabled={!customComponent.trim()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Common Components */}
          <div className="space-y-2">
            <Label>Common Components</Label>
            <div className="flex flex-wrap gap-2">
              {COMMON_COMPONENTS.map((comp) => (
                <Badge
                  key={comp}
                  variant={selectedComponents.includes(comp) ? "default" : "outline"}
                  className="cursor-pointer transition-colors"
                  onClick={() =>
                    selectedComponents.includes(comp)
                      ? removeComponent(comp)
                      : addComponent(comp)
                  }
                >
                  {comp}
                </Badge>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || selectedComponents.length === 0}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Cpu className="w-4 h-4" />
                Generate PCB
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PCBGenerationDialog;
