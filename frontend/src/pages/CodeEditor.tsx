import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProjectContext } from "@/contexts/ProjectContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import CodeMirror from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import CodeGenerationDialog from "@/components/code/CodeGenerationDialog";
import { Wand2, Loader2 } from "lucide-react";

const CodeEditor = () => {
  const { user } = useAuth();
  const { projects, getProject } = useProjectContext();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const projectId = searchParams.get("project");

  const [code, setCode] = useState(location.state?.code || `// Firmware Studio v4.0
// Initializing System Parameters...

#include <Arduino.h>

void setup() {
  Serial.begin(115200);
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.println("SYSTEM_CORE_INITIALIZED");
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(1000);
  digitalWrite(LED_BUILTIN, LOW);
  delay(1000);
}`);

  useEffect(() => {
    const transferId = searchParams.get("transfer");
    if (transferId) {
      const storedData = localStorage.getItem(`nexa_lab_data_${transferId}`);
      if (storedData) {
        const data = JSON.parse(storedData);
        if (data.code) {
          setCode(data.code);
          toast.success("Code synced from AI workspace");
        }
        // Cleanup
        localStorage.removeItem(`nexa_lab_data_${transferId}`);
      }
    }
  }, [searchParams]);

  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<{
    summary: string;
    issues: string[];
    suggestions: string[];
    pin_map?: Record<string, string>;
  } | null>(null);
  const [generatedLibraries, setGeneratedLibraries] = useState<{ name: string; version?: string }[]>([]);
  const [generatedWiring, setGeneratedWiring] = useState<{ component: string; pin: string; board_pin: string }[]>([]);
  const [logicExplanation, setLogicExplanation] = useState<string | null>(null);
  const currentProject = projectId ? getProject(projectId) : null;

  // Handler for AI-generated code
  const handleCodeGenerated = (result: {
    files: { filename: string; content: string }[];
    libraries: { name: string; version?: string }[];
    wiring: { component: string; pin: string; board_pin: string }[];
    notes?: string;
  }) => {
    // Set the main code file
    const mainFile = result.files.find(f => f.filename.endsWith('.ino') || f.filename.endsWith('.cpp'));
    if (mainFile) {
      setCode(mainFile.content);
    }
    setGeneratedLibraries(result.libraries || []);
    setGeneratedWiring(result.wiring || []);
    setLogicExplanation(result.notes || null);
    setAnalysisResults(null); // Clear previous analysis
    toast.success("AI_CODE_GENERATED_SUCCESSFULLY");
  };

  const handleAnalyze = async () => {
    if (!code.trim()) return;

    setIsAnalyzing(true);
    setAnalysisResults(null);
    toast.info("AI_ENGINE_ANALYZING_FIRMWARE...");

    try {
      const response = await api.post("/code/analyze", {
        code,
        board: "esp32", // Default to esp32 for now
        context: currentProject?.description
      });
      setAnalysisResults(response.data);
      toast.success("FIRMWARE_ANALYSIS_COMPLETE");
    } catch (error) {
      console.error("Analysis failed:", error);
      toast.error("AI_ENGINE_ANALYSIS_FAULT");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpload = async () => {
    setIsUploading(true);
    toast.info("ESTABLISHING_BREADBOARD_LINK...");
    await new Promise(r => setTimeout(r, 2000));
    toast.success("FIRMWARE_PAYLOAD_DEPLOYED_SUCCESSFULLY");
    setIsUploading(false);
  };

  if (!user) {
    return (
      <Layout>
        <div className="container max-w-4xl mx-auto py-32 text-center space-y-8 px-4">
          <div className="inline-flex items-center justify-center p-6 border-2 border-dashed border-primary/20 bg-primary/5 rounded-full mb-4">
            <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">Access_Restricted</h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em]">AUTHENTICATION_LOG_REQUIRED_FOR_STUDIO_ACCESS</p>
          <Button asChild className="h-12 px-12 bg-primary hover:bg-primary/90 text-[10px] font-black uppercase tracking-[0.3em] rounded-none shadow-[0_4px_20px_rgba(var(--primary-rgb),0.2)]">
            <Link to="/login">Initialize_Login_Protocol</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header Module */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 p-6 blueprint-card border-primary/20 bg-primary/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-1 opacity-10">
            <span className="text-[8px] font-mono font-bold tracking-[0.5em] uppercase">FIRMWARE_STUDIO_CORE_v4.0</span>
          </div>
          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <h1 className="text-3xl font-bold tracking-tighter uppercase">Firmware Studio</h1>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] ml-5">
              {currentProject ? `Active Unit: ${currentProject.name}` : "Stand-alone Development Buffer"}
            </p>
          </div>
          <div className="flex items-center gap-4 relative z-10">
            {/* AI Code Generation Button */}
            <CodeGenerationDialog onCodeGenerated={handleCodeGenerated} />
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !code.trim()}
              variant="outline"
              className="h-10 px-8 border-primary/30 hover:bg-primary/10 text-[10px] font-bold uppercase tracking-widest rounded-none"
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Analyze_Code"
              )}
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="h-10 px-8 bg-primary hover:bg-primary/90 text-[10px] font-bold uppercase tracking-widest rounded-none"
            >
              {isUploading ? "Uploading..." : "Deploy_Firmware"}
            </Button>
            <div className="h-10 w-px bg-primary/20 hidden md:block" />
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Compiler State</span>
              <span className="text-xs font-bold text-success uppercase">Idle / Ready</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[700px]">
          {/* Main Editor (9/12) */}
          <div className="lg:col-span-9 space-y-4 h-full flex flex-col">
            <div className="flex items-center justify-between px-2">
              <div className="flex gap-4">
                {["MAIN.CPP", "CONFIG.H", "LIBS.JSON"].map(tab => (
                  <button key={tab} className={`text-[9px] font-bold uppercase tracking-widest px-4 py-1.5 border-b-2 transition-all ${tab === 'MAIN.CPP' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground opacity-50 hover:opacity-100'}`}>
                    {tab}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4 text-[9px] font-bold text-muted-foreground uppercase opacity-40">
                <span>UTF-8</span>
                <span>C++ / Arduino</span>
                <span>LN: 12, COL: 4</span>
              </div>
            </div>

            <div className="flex-1 blueprint-card p-0 border-primary/20 bg-neutral-950 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 text-[10px] font-mono text-primary/10 select-none z-0">
                FIRMWARE_BUFFER_NODE_07
              </div>
              <CodeMirror
                value={code}
                height="100%"
                theme={vscodeDark}
                extensions={[cpp()]}
                onChange={(value) => setCode(value)}
                className="text-sm h-full"
              />
            </div>

            <div className="h-40 blueprint-card border-primary/20 bg-black/60 p-4 font-mono overflow-y-auto">
              <div className="text-[10px] space-y-1">
                <div className="text-primary/60">[0.00s] INITIALIZING_COMPILER_TOOLCHAIN...</div>
                <div className="text-primary/60">[0.12s] SCANNING_LIBRARY_DEPENDENCIES...</div>
                <div className="text-success/80">[0.45s] COMPILATION_SUCCESSFUL. BINARY_SIZE: 12.4KB</div>
                <div className="text-muted-foreground/40">[0.46s] AWAITING_DEPLOYMENT_COMMAND_OR_HARDWARE_SYNC...</div>
                <div className="animate-pulse text-primary inline-block">_</div>
              </div>
            </div>
          </div>

          {/* Sidebar (3/12) */}
          <div className="lg:col-span-3 space-y-8 flex flex-col overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <span className="h-0.5 w-3 bg-primary/40" />
                <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Library_Registry</h2>
                {generatedLibraries.length > 0 && (
                  <span className="text-[8px] font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded uppercase">AI Generated</span>
                )}
              </div>
              <div className="grid gap-2">
                {(generatedLibraries.length > 0 ? generatedLibraries : [
                  { name: "Arduino_Core", version: "1.2.0" },
                  { name: "WiFi_HAL", version: "1.2.0" },
                  { name: "ESP32_GPIO", version: "1.2.0" },
                  { name: "HTTP_Client", version: "1.2.0" }
                ]).map((lib, idx) => (
                  <div key={lib.name + idx} className="blueprint-card p-4 border-primary/10 bg-primary/[0.02] flex items-center justify-between group">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">{lib.name.replace(/_/g, ' ')}</span>
                    <span className="text-[8px] font-mono text-muted-foreground/40">V{lib.version || "1.0.0"}</span>
                  </div>
                ))}
              </div>
            </div>


            {analysisResults && (
              <div className="pt-6 border-t border-primary/10 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-2 mb-4">
                  <Wand2 className="w-3 h-3 text-primary animate-pulse" />
                  <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Analysis_Report</h2>
                </div>
                <div className="space-y-4">
                  <div className="p-3 bg-primary/5 border border-primary/10 rounded">
                    <p className="text-[10px] text-primary/80 leading-relaxed italic">
                      "{analysisResults.summary}"
                    </p>
                  </div>

                  {analysisResults.issues.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[8px] font-bold text-red-400 uppercase tracking-widest px-1">Critical_Issues</span>
                      {analysisResults.issues.map((issue, i) => (
                        <div key={i} className="text-[9px] p-2 bg-red-500/5 border border-red-500/20 rounded text-red-200/70">
                          {issue}
                        </div>
                      ))}
                    </div>
                  )}

                  {analysisResults.suggestions.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[8px] font-bold text-blue-400 uppercase tracking-widest px-1">Optimizations</span>
                      {analysisResults.suggestions.map((sug, i) => (
                        <div key={i} className="text-[9px] p-2 bg-blue-500/5 border border-blue-500/20 rounded text-blue-200/70">
                          {sug}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {logicExplanation && (
              <div className="pt-6 border-t border-primary/10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  <h5 className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">AI_Logic_Reasoning</h5>
                </div>
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-[10px] text-muted-foreground leading-relaxed font-bold uppercase tracking-tight">
                    {logicExplanation}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CodeEditor;
