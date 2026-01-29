import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProjectContext } from "@/contexts/ProjectContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import CodeMirror from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";

const CodeEditor = () => {
  const { user } = useAuth();
  const { projects, getProject } = useProjectContext();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project");

  const [code, setCode] = useState(`// Firmware Studio v4.0
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

  const [isUploading, setIsUploading] = useState(false);
  const currentProject = projectId ? getProject(projectId) : null;

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
              </div>
              <div className="grid gap-2">
                {["Arduino_Core", "WiFi_HAL", "ESP32_GPIO", "HTTP_Client"].map(lib => (
                  <div key={lib} className="blueprint-card p-4 border-primary/10 bg-primary/[0.02] flex items-center justify-between group">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">{lib}</span>
                    <span className="text-[8px] font-mono text-muted-foreground/40">V1.2.0</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="blueprint-card p-6 border-primary/20 bg-primary/5 space-y-6 flex-1">
              <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                BOM_Synchronization
              </h4>
              <div className="space-y-4">
                {currentProject?.description ? (
                  <p className="text-[10px] font-medium text-muted-foreground uppercase leading-relaxed opacity-60">
                    {currentProject.description}
                  </p>
                ) : (
                  <div className="text-center py-6 opacity-40">
                    <span className="text-[9px] font-bold uppercase tracking-widest">No_Project_Linked</span>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-primary/10">
                <h5 className="text-[8px] font-black uppercase tracking-[0.2em] mb-4 text-muted-foreground">IO_Hardware_Map</h5>
                <div className="space-y-2">
                  {[
                    { pin: "D13", label: "INTERNAL_LED" },
                    { pin: "A0", label: "VDD_SENSE" },
                    { pin: "TX0", label: "SER_UART" }
                  ].map(io => (
                    <div key={io.pin} className="flex justify-between text-[9px] font-mono">
                      <span className="text-primary font-bold">{io.pin}</span>
                      <span className="text-muted-foreground/60">{io.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CodeEditor;
