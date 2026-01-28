import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import {
  Code,
  Download,
  Copy,
  Check,
  ExternalLink,
  FileCode,
  Terminal,
  Cpu,
  Usb,
  Cable,
  BookOpen,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import CodeGenerationDialog from "@/components/code/CodeGenerationDialog";

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

const vsCodeExtensions = [
  {
    name: "PlatformIO IDE",
    id: "platformio.platformio-ide",
    description: "Professional embedded development platform",
    url: "https://marketplace.visualstudio.com/items?itemName=platformio.platformio-ide",
  },
  {
    name: "Arduino",
    id: "vsciot-vscode.vscode-arduino",
    description: "Official Arduino extension for VS Code",
    url: "https://marketplace.visualstudio.com/items?itemName=vsciot-vscode.vscode-arduino",
  },
  {
    name: "C/C++",
    id: "ms-vscode.cpptools",
    description: "IntelliSense, debugging, and code browsing",
    url: "https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools",
  },
];

// Default code shown before generation
const defaultCode: GeneratedCode = {
  files: [
    {
      filename: "main.ino",
      language: "arduino",
      content: `/*
 * ElectroLab - AI Code Generator
 *
 * Click "Generate Code" to create custom code
 * for your electronics project!
 *
 * Supported boards:
 * - ESP32
 * - ESP8266
 * - Arduino Uno/Nano
 * - Raspberry Pi Pico
 */

void setup() {
  Serial.begin(115200);
  Serial.println("Welcome to ElectroLab!");
  Serial.println("Generate your project code using AI.");
}

void loop() {
  // Your code will appear here
  delay(1000);
}`,
    },
  ],
  libraries: [],
  wiring: [],
  notes: "Use the Generate Code button to create custom code for your project.",
};

const CodeEditor = () => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode>(defaultCode);
  const [activeFile, setActiveFile] = useState("main.ino");
  const [selectedBoard, setSelectedBoard] = useState("esp32");

  const handleCopy = () => {
    const currentFile = generatedCode.files.find(
      (f) => f.filename === activeFile
    );
    if (currentFile) {
      navigator.clipboard.writeText(currentFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const currentFile = generatedCode.files.find(
      (f) => f.filename === activeFile
    );
    if (currentFile) {
      const blob = new Blob([currentFile.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = currentFile.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadAll = () => {
    generatedCode.files.forEach((file) => {
      const blob = new Blob([file.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  const handleCodeGenerated = (code: GeneratedCode) => {
    setGeneratedCode(code);
    if (code.files.length > 0) {
      setActiveFile(code.files[0].filename);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="py-20 text-center">
          <Code className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Login to Access Code Editor</h1>
          <Button asChild>
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const currentFile = generatedCode.files.find((f) => f.filename === activeFile);

  return (
    <Layout>
      <div className="py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Code Editor</h1>
            <p className="text-muted-foreground">
              AI-powered code generation for ESP32 & Arduino
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedBoard} onValueChange={setSelectedBoard}>
              <SelectTrigger className="w-40 bg-input border-border">
                <SelectValue placeholder="Select board" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="esp32">ESP32</SelectItem>
                <SelectItem value="esp8266">ESP8266</SelectItem>
                <SelectItem value="arduino-uno">Arduino Uno</SelectItem>
                <SelectItem value="arduino-nano">Arduino Nano</SelectItem>
                <SelectItem value="raspberry-pi-pico">RPi Pico</SelectItem>
              </SelectContent>
            </Select>
            <CodeGenerationDialog onCodeGenerated={handleCodeGenerated} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Code Panel */}
          <div className="lg:col-span-3">
            <Tabs
              value={activeFile}
              onValueChange={setActiveFile}
              className="w-full"
            >
              <div className="blueprint-card">
                <div className="flex items-center justify-between p-3 border-b border-border">
                  <TabsList className="bg-muted/50">
                    {generatedCode.files.map((file) => (
                      <TabsTrigger
                        key={file.filename}
                        value={file.filename}
                        className="gap-2 data-[state=active]:bg-primary/20"
                      >
                        <FileCode className="w-4 h-4" />
                        {file.filename}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopy}
                      className="gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                    {generatedCode.files.length > 1 && (
                      <Button
                        className="bg-primary hover:bg-primary/90 gap-2"
                        size="sm"
                        onClick={handleDownloadAll}
                      >
                        <Download className="w-4 h-4" />
                        Download All
                      </Button>
                    )}
                  </div>
                </div>

                {generatedCode.files.map((file) => (
                  <TabsContent key={file.filename} value={file.filename} className="m-0">
                    <ScrollArea className="h-[500px]">
                      <pre className="code-block p-4 text-xs">
                        <code className="text-foreground">{file.content}</code>
                      </pre>
                    </ScrollArea>
                  </TabsContent>
                ))}
              </div>
            </Tabs>

            {/* Notes Section */}
            {generatedCode.notes && (
              <div className="mt-4 p-4 blueprint-card">
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Notes
                </div>
                <p className="text-sm text-muted-foreground">
                  {generatedCode.notes}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Wiring Diagram */}
            {generatedCode.wiring.length > 0 && (
              <div className="blueprint-card p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Cable className="w-4 h-4 text-primary" />
                  Wiring Connections
                </h3>
                <div className="space-y-2 text-sm">
                  {generatedCode.wiring.map((wire, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between p-2 rounded bg-muted/30"
                    >
                      <span className="text-muted-foreground">
                        {wire.component} {wire.pin}
                      </span>
                      <span className="font-mono text-primary">
                        {wire.board_pin}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Instructions */}
            <div className="blueprint-card p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Usb className="w-4 h-4 text-primary" />
                Upload Instructions
              </h3>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary font-mono">1.</span>
                  <span>Install PlatformIO or Arduino IDE</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-mono">2.</span>
                  <span>Connect your board via USB</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-mono">3.</span>
                  <span>Select the correct port</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-mono">4.</span>
                  <span>Click Upload</span>
                </li>
              </ol>
            </div>

            {/* Required Libraries */}
            {generatedCode.libraries.length > 0 && (
              <div className="blueprint-card p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-primary" />
                  Required Libraries
                </h3>
                <div className="space-y-2 text-sm">
                  {generatedCode.libraries.map((lib, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded bg-muted/30"
                    >
                      <span className="font-mono">{lib.name}</span>
                      {lib.version && (
                        <span className="text-xs text-muted-foreground">
                          v{lib.version}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VS Code Extensions */}
            <div className="blueprint-card p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary" />
                VS Code Extensions
              </h3>
              <div className="space-y-3">
                {vsCodeExtensions.map((ext) => (
                  <a
                    key={ext.id}
                    href={ext.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-medium">{ext.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {ext.description}
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CodeEditor;
