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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Wand2, Cpu, Wifi, Bluetooth, Battery } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CodeFile {
  filename: string;
  language: string;
  content: string;
}

interface LibraryInfo {
  name: string;
  version?: string;
  manager?: string;
}

interface WiringInfo {
  component: string;
  pin: string;
  board_pin: string;
}

interface GeneratedCode {
  files: CodeFile[];
  libraries: LibraryInfo[];
  wiring: WiringInfo[];
  notes?: string;
}

interface CodeGenerationDialogProps {
  onCodeGenerated: (code: GeneratedCode) => void;
}

const BOARDS = [
  { id: "esp32", name: "ESP32", icon: Cpu },
  { id: "esp8266", name: "ESP8266", icon: Wifi },
  { id: "arduino-uno", name: "Arduino Uno", icon: Cpu },
  { id: "arduino-nano", name: "Arduino Nano", icon: Cpu },
  { id: "raspberry-pi-pico", name: "Raspberry Pi Pico", icon: Cpu },
];

const FEATURES = [
  { id: "wifi", name: "WiFi", icon: Wifi },
  { id: "bluetooth", name: "Bluetooth", icon: Bluetooth },
  { id: "battery", name: "Battery Powered", icon: Battery },
  { id: "display", name: "Display", icon: Cpu },
  { id: "sensors", name: "Sensors", icon: Cpu },
];

const CodeGenerationDialog = ({ onCodeGenerated }: CodeGenerationDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [description, setDescription] = useState("");
  const [board, setBoard] = useState("esp32");
  const [components, setComponents] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(featureId)
        ? prev.filter((f) => f !== featureId)
        : [...prev, featureId]
    );
  };

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError("Please describe your project");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await api.post("/code/generate", {
        description: description.trim(),
        board,
        components: components
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        features: selectedFeatures,
      });

      onCodeGenerated(response.data);
      setOpen(false);

      // Reset form
      setDescription("");
      setComponents("");
      setSelectedFeatures([]);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to generate code");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-primary hover:bg-primary/90">
          <Wand2 className="w-4 h-4" />
          Generate Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            AI Code Generator
          </DialogTitle>
          <DialogDescription>
            Describe your project and let AI generate the code for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Project Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Project Description</Label>
            <Textarea
              id="description"
              placeholder="E.g., Temperature monitor that displays readings on OLED and sends data to a web server every 5 minutes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Board Selection */}
          <div className="space-y-2">
            <Label>Target Board</Label>
            <Select value={board} onValueChange={setBoard}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BOARDS.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    <div className="flex items-center gap-2">
                      <b.icon className="w-4 h-4" />
                      {b.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Components */}
          <div className="space-y-2">
            <Label htmlFor="components">Components (comma separated)</Label>
            <Input
              id="components"
              placeholder="DHT22, OLED Display, Relay Module..."
              value={components}
              onChange={(e) => setComponents(e.target.value)}
            />
          </div>

          {/* Features */}
          <div className="space-y-2">
            <Label>Features</Label>
            <div className="flex flex-wrap gap-2">
              {FEATURES.map((feature) => (
                <Badge
                  key={feature.id}
                  variant={
                    selectedFeatures.includes(feature.id) ? "default" : "outline"
                  }
                  className="cursor-pointer transition-colors"
                  onClick={() => toggleFeature(feature.id)}
                >
                  <feature.icon className="w-3 h-3 mr-1" />
                  {feature.name}
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
            disabled={isGenerating || !description.trim()}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Generate Code
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CodeGenerationDialog;
