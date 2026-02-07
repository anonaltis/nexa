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
import {
  MessageSquare,
  Send,
  Terminal,
  Cpu,
  Layers,
  Sparkles,
  ChevronRight,
  X,
  Play,
  RotateCcw
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { generateCode, codeAgentChat } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const CodeEditor = () => {
  const { user } = useAuth();
  const { projects, getProject } = useProjectContext();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project");

  const [code, setCode] = useState(`// Firmware Studio v4.5
// Neural_Buffer_Locked

#include <Arduino.h>

void setup() {
  Serial.begin(115200);
}

void loop() {
  // Awaiting AI synthesis...
}`);

  const [isUploading, setIsUploading] = useState(false);
  const [board, setBoard] = useState("esp32");
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAgentResponding, setIsAgentResponding] = useState(false);

  const currentProject = projectId ? getProject(projectId) : null;

  const handleGenerate = async () => {
    if (!inputMessage) return;
    setIsGenerating(true);
    setMessages(prev => [...prev, { role: "user", content: inputMessage }]);
    const currentInput = inputMessage;
    setInputMessage("");

    try {
      const response = await generateCode(currentInput, board, currentProject?.pcbDiagram);
      setCode(response.code);
      setMessages(prev => [...prev, { role: "assistant", content: "I've generated the firmware core based on your specification. How else can I assist?" }]);
      toast.success("CORE_SYNTHESIS_COMPLETE");
    } catch (error) {
      toast.error("SYNTHESIS_FAILURE");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAgentChat = async () => {
    if (!inputMessage || isAgentResponding) return;
    const userMsg = inputMessage;
    setInputMessage("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsAgentResponding(true);

    try {
      const response = await codeAgentChat(userMsg, messages, code, board);
      setMessages(prev => [...prev, { role: "assistant", content: response.response }]);
      if (response.suggested_code) {
        // Option to apply code? For now just show in chat
      }
    } catch (error) {
      toast.error("COMMUNICATION_ERROR");
    } finally {
      setIsAgentResponding(false);
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

          {/* Sidebar (3/12) - Code Agent & Hardware Context */}
          <div className="lg:col-span-3 flex flex-col gap-6 h-full min-h-0">
            {/* Code Agent Chat */}
            <div className="flex-1 blueprint-card p-0 flex flex-col border-primary/20 bg-primary/[0.02] overflow-hidden">
              <div className="bg-primary/10 px-4 py-2 border-b border-primary/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <h3 className="text-[9px] font-black uppercase tracking-widest text-primary">Neural_Code_Agent</h3>
                </div>
                <div className="flex gap-1">
                  <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                  <div className="h-1 w-1 rounded-full bg-primary/40" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30 space-y-3">
                    <MessageSquare className="h-8 w-8 text-primary" />
                    <p className="text-[8px] font-bold uppercase tracking-[0.2em] leading-relaxed">
                      AWAITING_FIRMWARE_SPECIFICATIONS_OR_AGENT_QUERY
                    </p>
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[90%] p-3 text-[10px] font-medium leading-relaxed ${m.role === 'user'
                          ? 'bg-primary/20 text-foreground rounded-l-lg rounded-tr-lg border border-primary/10'
                          : 'bg-neutral-900 text-muted-foreground rounded-r-lg rounded-tl-lg border border-white/5'
                        }`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))
                )}
                {isAgentResponding && (
                  <div className="flex gap-1 p-2 opacity-50">
                    <div className="h-1 w-1 bg-primary rounded-full animate-bounce" />
                    <div className="h-1 w-1 bg-primary rounded-full animate-bounce delay-75" />
                    <div className="h-1 w-1 bg-primary rounded-full animate-bounce delay-150" />
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-primary/10 bg-black/20">
                <div className="relative">
                  <Input
                    placeholder="Specify firmware reqs..."
                    className="bg-neutral-900 border-primary/20 text-[10px] h-9 pr-10 focus-visible:ring-primary/30"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (messages.length === 0 ? handleGenerate() : handleAgentChat())}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => (messages.length === 0 ? handleGenerate() : handleAgentChat())}
                    disabled={isGenerating || isAgentResponding}
                    className="absolute right-1 top-1 h-7 w-7 text-primary hover:bg-primary/10"
                  >
                    <Send className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Hardware Context Panel */}
            <div className="h-48 blueprint-card p-0 border-primary/20 bg-primary/5 overflow-hidden flex flex-col">
              <div className="bg-primary/10 px-4 py-2 border-b border-primary/20 flex items-center justify-between">
                <h4 className="text-[9px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                  <Cpu className="h-3 w-3" />
                  Hardware_Context
                </h4>
                <Select value={board} onValueChange={setBoard}>
                  <SelectTrigger className="h-5 w-24 bg-black/40 border-primary/20 text-[8px] font-bold uppercase p-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-primary/30 text-[9px]">
                    <SelectItem value="esp32">ESP32 Core</SelectItem>
                    <SelectItem value="arduino_uno">Uno Rev3</SelectItem>
                    <SelectItem value="stm32">STM32 HAL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                {currentProject?.pcbDiagram ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 opacity-60">
                      <Layers className="h-3 w-3 text-primary" />
                      <span className="text-[8px] font-bold uppercase tracking-widest text-primary">Linked_Diagram_Detected</span>
                    </div>
                    <div className="space-y-1">
                      {(currentProject.pcbDiagram as any).components?.slice(0, 5).map((comp: any) => (
                        <div key={comp.id} className="flex justify-between text-[8px] font-mono border-b border-primary/5 pb-1">
                          <span className="text-muted-foreground">{comp.label}</span>
                          <span className="text-primary">{comp.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30 gap-2">
                    <RotateCcw className="h-4 w-4" />
                    <span className="text-[8px] font-bold uppercase tracking-widest">No_Hardware_Link</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CodeEditor;
