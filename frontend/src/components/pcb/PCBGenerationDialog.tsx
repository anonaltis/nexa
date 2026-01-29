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
        <Button className="h-10 px-4 bg-primary hover:bg-primary/90 text-[10px] font-bold uppercase tracking-widest border border-primary/20">
          Initialize Generation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] border-primary/20 bg-card p-0 overflow-hidden">
        <DialogHeader className="p-6 bg-primary/5 border-b border-primary/10">
          <DialogTitle className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
            AI PCB Optimization Engine
          </DialogTitle>
          <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pt-1">
            Logic synthesis and component place-and-route
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {/* Project Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Functional Specification (Markdown/Text)
            </Label>
            <Textarea
              id="description"
              placeholder="DEFINE PROJECT SCOPE AND CONNECTIVITY PARAMETERS..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none bg-background/50 border-primary/20 font-bold text-xs uppercase placeholder:text-muted-foreground/30 focus:border-primary"
            />
          </div>

          {/* Board Size */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">X-Dimension (MM)</Label>
              <Input
                id="width"
                type="number"
                value={boardWidth}
                onChange={(e) => setBoardWidth(e.target.value)}
                className="bg-background/50 border-primary/20 font-bold text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Y-Dimension (MM)</Label>
              <Input
                id="height"
                type="number"
                value={boardHeight}
                onChange={(e) => setBoardHeight(e.target.value)}
                className="bg-background/50 border-primary/20 font-bold text-xs"
              />
            </div>
          </div>

          {/* Selected Components */}
          <div className="space-y-3">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active Component Stack ({selectedComponents.length})</Label>
            <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border border-primary/10 rounded-md bg-black/20 shadow-inner">
              {selectedComponents.length === 0 ? (
                <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest flex items-center h-full">
                  Waiting for component assignment...
                </span>
              ) : (
                selectedComponents.map((comp) => (
                  <Badge
                    key={comp}
                    variant="outline"
                    className="gap-2 px-3 py-1 text-[9px] font-bold uppercase tracking-tight border-primary/30 text-primary hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40 transition-all cursor-pointer group"
                    onClick={() => removeComponent(comp)}
                  >
                    {comp}
                    <span className="text-[7px] opacity-40 group-hover:opacity-100">PURGE</span>
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* Custom Component Input */}
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Manual Asset Entry</Label>
            <div className="flex gap-2">
              <Input
                placeholder="ENTER MODULE IDENTIFIER..."
                value={customComponent}
                onChange={(e) => setCustomComponent(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomComponent()}
                className="bg-background/50 border-primary/20 font-bold text-xs uppercase"
              />
              <Button
                variant="outline"
                onClick={addCustomComponent}
                disabled={!customComponent.trim()}
                className="px-4 text-[9px] font-bold uppercase tracking-widest border-primary/30 hover:bg-primary/10"
              >
                Inject
              </Button>
            </div>
          </div>

          {/* Common Components Registry */}
          <div className="space-y-3">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Standardized Assets Library</Label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_COMPONENTS.map((comp) => (
                <Badge
                  key={comp}
                  variant={selectedComponents.includes(comp) ? "default" : "outline"}
                  className={`cursor-pointer px-2 py-1 text-[8px] font-bold uppercase tracking-tight transition-all duration-200 ${selectedComponents.includes(comp)
                      ? "bg-primary border-transparent"
                      : "border-primary/10 hover:border-primary/50 bg-primary/5"
                    }`}
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
            <div className="text-[10px] font-bold uppercase tracking-widest text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded">
              SIGNAL FAULT: {error}
            </div>
          )}
        </div>

        <DialogFooter className="p-6 bg-primary/5 border-t border-primary/10 gap-3">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-white"
          >
            Abort Operation
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || selectedComponents.length === 0}
            className="h-10 px-8 bg-primary hover:bg-primary/90 text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
          >
            {isGenerating ? "OPTIMIZING GRID..." : "EXECUTE GENERATION"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PCBGenerationDialog;
