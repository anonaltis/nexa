import { useState } from "react";
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

const PCBViewer = () => {
  const { user } = useAuth();
  const [generatedPCB, setGeneratedPCB] = useState<GeneratedPCB>(defaultPCB);
  const [showLayers, setShowLayers] = useState({
    top: true,
    bottom: true,
    silkscreen: true,
    traces: true,
  });

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
              <div className="aspect-[4/3] bg-[#0a1628]">
                <PCBRenderer svg={generatedPCB.svg} className="w-full h-full" />
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
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PCBViewer;
