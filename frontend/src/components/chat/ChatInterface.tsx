import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useNavigate } from "react-router-dom";
import { Send, Bot, User, Loader2, CheckCircle2, Cpu, Code, FileText, Sparkles, Layout, Activity, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { ChatMessage, PollOption as PollOptionType } from "@/types/project";

interface ChatInterfaceProps {
  onPlanComplete?: (plan: any) => void;
  onGeneratePCB?: () => void;
  onGenerateCode?: () => void;
  sessionId: string | null;
  projectId?: string | null;
  onSessionCreated?: (sessionId: string) => void;
}

interface ProjectPlan {
  projectType: string;
  experienceLevel: string;
  microcontroller: string;
  features: string[];
  components: { name: string; quantity: number; purpose: string }[];
  connections: { from: string; to: string; description: string }[];
}

// Design keywords detection
const DESIGN_KEYWORDS = [
  "design", "create circuit", "build circuit", "make circuit",
  "pcb layout", "schematic", "circuit for", "led circuit",
  "power supply", "amplifier", "voltage regulator", "motor driver"
];

const isDesignRequest = (message: string): boolean => {
  const lower = message.toLowerCase();
  return DESIGN_KEYWORDS.some(keyword => lower.includes(keyword));
};

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Welcome to ElectroLab! I'm your AI project assistant.\n\nDescribe your electronics project idea, and I'll help you:\n- Plan the components and connections\n- Generate PCB diagrams\n- Write code for ESP32/Arduino\n- Troubleshoot issues\n\nWhat would you like to build?",
  timestamp: new Date(),
};

const ChatInterface = ({
  onPlanComplete,
  onGeneratePCB,
  onGenerateCode,
  sessionId,
  projectId,
  onSessionCreated,
}: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [useReasoning, setUseReasoning] = useState(false);
  const [useDesignAgent, setUseDesignAgent] = useState(true); // Auto-route design requests
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingSchematic, setIsCreatingSchematic] = useState<string | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [planningPhase, setPlanningPhase] = useState<"none" | "questions" | "complete">("none");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const extractThinking = (content: string) => {
    const match = content.match(/<thinking>([\s\S]*?)<\/thinking>/);
    if (match) {
      return {
        thinking: match[1].trim(),
        content: content.replace(/<thinking>[\s\S]*?<\/thinking>/, "").trim()
      };
    }
    return { thinking: null, content };
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load session messages when sessionId changes
  useEffect(() => {
    const loadSession = async () => {
      if (!sessionId) {
        setMessages([WELCOME_MESSAGE]);
        setPlanningPhase("none");
        setIsLoadingSession(false);
        return;
      }

      // Safeguard: If we already have messages and the sessionId matches, maybe skip?
      // But for now, let's just ensure we handle the loading state safely.
      setIsLoadingSession(true);
      try {
        console.log(`📡 Loading session: ${sessionId}`);
        const response = await api.get(`/chat/sessions/${sessionId}`);
        const sessionData = response.data;

        if (sessionData && sessionData.messages && Array.isArray(sessionData.messages)) {
          console.log(`✅ Loaded ${sessionData.messages.length} messages`);
          setMessages(
            sessionData.messages.map((msg: any) => ({
              ...msg,
              timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
            }))
          );

          if (sessionData.messages.some((m: any) => m.metadata?.isPlanComplete)) {
            setPlanningPhase("complete");
          }
        } else {
          console.log("ℹ️ Session empty or malformed, using welcome message");
          setMessages([WELCOME_MESSAGE]);
          setPlanningPhase("none");
        }
      } catch (error) {
        console.error("❌ Failed to load session:", error);
        toast.error("DATA_RETRIEVAL_FAILURE: LINK_TIMEOUT");
        setMessages([WELCOME_MESSAGE]);
      } finally {
        setIsLoadingSession(false);
      }
    };

    loadSession();
  }, [sessionId]);

  const createSessionIfNeeded = async (): Promise<string | null> => {
    if (sessionId) return sessionId;

    try {
      const response = await api.post("/chat/sessions", {
        title: "New Chat",
        project_id: projectId
      });
      const newSessionId = response.data._id || response.data.id;
      onSessionCreated?.(newSessionId);
      return newSessionId;
    } catch (error) {
      console.error("Failed to create session:", error);
      toast.error("SESSION_INIT_FAILURE: FAILED_TO_ESTABLISH_NEURAL_LINK");
      return null;
    }
  };

  const handleLabNavigation = (path: string, state: any, successMsg: string) => {
    // 1. Save data to localStorage for multi-tab support
    const transferId = Date.now().toString(36);
    localStorage.setItem(`nexa_lab_data_${transferId}`, JSON.stringify(state));

    // 2. Open in new tab
    const url = window.location.origin + path + (path.includes('?') ? '&' : '?') + `transfer=${transferId}`;
    window.open(url, '_blank');

    // 3. Keep current tab context and show toast
    toast.success(successMsg);
  };

  const generateUUID = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Create session if first message
      const currentSessionId = await createSessionIfNeeded();

      // Check if this is a design request and Design Agent is enabled
      const shouldUseDesignAgent = useDesignAgent && isDesignRequest(userMessage.content);

      let data;

      if (shouldUseDesignAgent) {
        // Use Design Agent for circuit design requests
        console.log("🔧 Routing to Design Agent...");
        const response = await api.post("/api/design/generate", {
          query: userMessage.content,
          session_id: currentSessionId,
          use_cache: true
        });

        data = {
          id: generateUUID(),
          content: response.data.content,
          metadata: {
            ...response.data.metadata,
            agent: "design",
            pcb_data: response.data.pcb_data,
            pcb_svg: response.data.pcb_svg,
            bom: response.data.bom,
            schematic_data: response.data.schematic_data,
          },
          timestamp: Date.now(),
        };
      } else {
        // Use regular V3 Chat Endpoint
        const response = await api.post("/v3/chat/message", {
          message: userMessage.content,
          session_id: currentSessionId,
          mode: "auto",
          useReasoning: useReasoning
        });
        data = response.data;
      }

      const aiMessage: ChatMessage = {
        id: data.id || generateUUID(),
        role: "assistant",
        content: data.content || data.response,
        timestamp: new Date(data.timestamp || Date.now()),
        metadata: data.metadata,
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Check if plan is complete from AI response
      if (data.metadata?.isPlanComplete) {
        setPlanningPhase("complete");
        if (onPlanComplete && data.metadata.plan) {
          onPlanComplete(data.metadata.plan);
        }
      }

      // Auto-show PCB option if design agent returned PCB data
      if (data.metadata?.pcb_data || data.metadata?.pcb_svg) {
        setPlanningPhase("complete");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: ChatMessage = {
        id: generateUUID(),
        role: "assistant",
        content:
          "Sorry, I encountered an error connecting to the server. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!sessionId) return;

    try {
      await api.delete(`/chat/sessions/${sessionId}/messages/${messageId}`);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      toast.success("Message purged from database");
    } catch (error) {
      console.error("Failed to delete message:", error);
      toast.error("Failed to delete message");
    }
  };

  const handlePollSelect = async (messageId: string, optionId: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId && msg.metadata?.pollOptions) {
          return {
            ...msg,
            metadata: {
              ...msg.metadata,
              selectedOption: optionId,
              pollOptions: msg.metadata.pollOptions.map((opt) => ({
                ...opt,
                selected: opt.id === optionId,
              })),
            },
          };
        }
        return msg;
      })
    );

    const selectedOption = messages
      .find((m) => m.id === messageId)
      ?.metadata?.pollOptions?.find((o) => o.id === optionId);

    if (selectedOption) {
      setInput(selectedOption.label);
      setTimeout(() => {
        handleSend();
      }, 100);
    }
  };

  const handleOpenBuilder = async (message: ChatMessage) => {
    if (!message.metadata?.schematic_data) return;

    setIsCreatingSchematic(message.id);
    try {
      const designName = messages.find(m => m.role === "user" && messages.indexOf(m) < messages.indexOf(message))?.content || "AI Generated Design";

      const response = await api.post("/api/schematics/", {
        name: designName.slice(0, 30),
        nodes: message.metadata.schematic_data.nodes,
        wires: message.metadata.schematic_data.wires,
        project_id: projectId
      });

      const schematicId = response.data._id || response.data.id;
      toast.success("Design synthesized! Initializing Schematic Builder...");
      window.open(window.location.origin + `/schematic?id=${schematicId}`, '_blank');
    } catch (error) {
      console.error("Failed to create schematic:", error);
      toast.error("Failed to sync design to builder");
    } finally {
      setIsCreatingSchematic(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoadingSession) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">
          Loading conversation...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`group flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"
              }`}
          >
            {message.role === "assistant" && (
              <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                <span className="text-[8px] font-bold text-primary">AI</span>
              </div>
            )}

            <div
              className={`max-w-[80%] ${message.role === "user" ? "order-first" : ""
                }`}
            >
              <div
                className={`p-4 rounded-2xl ${message.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"
                  }`}
              >
                {/* Design Agent Badge */}
                {message.metadata?.agent === "design" && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-primary/20">
                    <Sparkles className="w-3 h-3 text-green-400" />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-green-400">
                      Design Agent
                    </span>
                    {message.metadata?.validation_status && (
                      <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded ${message.metadata.validation_status === "PASS"
                        ? "bg-green-500/20 text-green-400"
                        : message.metadata.validation_status === "FAIL"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-yellow-500/20 text-yellow-400"
                        }`}>
                        {message.metadata.validation_status}
                      </span>
                    )}
                  </div>
                )}
                <div className="text-sm prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-950 prose-pre:text-slate-50 prose-pre:p-4 prose-pre:rounded-xl prose-pre:border prose-pre:border-primary/20 prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground text-foreground">
                  {message.role === "assistant" && extractThinking(message.content).thinking && (
                    <div className="mb-4 p-3 bg-amber-500/5 border-l-2 border-amber-500/30 rounded-r text-[10px] font-medium text-amber-200/60 italic leading-relaxed animate-in fade-in slide-in-from-left-2 duration-700">
                      <div className="flex items-center gap-1.5 mb-1 opacity-60">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span className="uppercase tracking-[0.2em]">Internal_Logic_Processing</span>
                      </div>
                      {extractThinking(message.content).thinking}
                    </div>
                  )}
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.role === "assistant" ? extractThinking(message.content).content : message.content}
                  </ReactMarkdown>
                </div>

                {/* View Schematic & PCB Buttons */}
                {(message.metadata?.schematic_data || message.metadata?.pcb_svg || message.metadata?.bom) && (
                  <div className="mt-4 pt-4 border-t border-primary/10 flex flex-wrap gap-2">
                    {message.metadata?.schematic_data && (
                      <Button
                        onClick={() => handleOpenBuilder(message)}
                        disabled={isCreatingSchematic === message.id}
                        className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 text-[9px] font-bold uppercase tracking-widest h-8 px-3 flex items-center gap-2"
                      >
                        {isCreatingSchematic === message.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Layout className="w-3 h-3" />
                        )}
                        Schematic Builder
                      </Button>
                    )}

                    {message.metadata?.pcb_svg && (
                      <Button
                        onClick={() => {
                          const win = window.open("", "_blank");
                          if (win) {
                            win.document.write(`
                              <html>
                                <head>
                                  <title>PCB Preview - Nexa AI</title>
                                  <style>
                                    body { margin: 0; display: flex; items-center: center; justify-content: center; background: #0f172a; height: 100vh; overflow: hidden; }
                                    svg { max-width: 90%; max-height: 90%; }
                                  </style>
                                </head>
                                <body>${message.metadata.pcb_svg}</body>
                              </html>
                            `);
                            win.document.close();
                          }
                        }}
                        className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 text-[9px] font-bold uppercase tracking-widest h-8 px-3 flex items-center gap-2"
                      >
                        <Cpu className="w-3 h-3" />
                        View PCB Layout
                      </Button>
                    )}

                    {message.metadata?.bom && (
                      <Button
                        onClick={() => {
                          const win = window.open("", "_blank");
                          if (win) {
                            win.document.write(`
                              <html>
                                <head>
                                  <title>BOM - Nexa AI</title>
                                  <style>
                                    body { font-family: sans-serif; padding: 40px; background: #0f172a; color: #f8fafc; }
                                    table { border-collapse: collapse; width: 100%; border: 1px solid #334155; }
                                    th, td { text-align: left; padding: 12px; border: 1px solid #334155; }
                                    th { background: #1e293b; color: #38bdf8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; }
                                    h2 { color: #f8fafc; font-size: 18px; text-transform: uppercase; letter-spacing: 0.2em; border-bottom: 2px solid #38bdf8; padding-bottom: 10px; margin-bottom: 20px; }
                                  </style>
                                </head>
                                <body>
                                  <h2>Bill of Materials</h2>
                                  <table>
                                    <thead>
                                      <tr><th>Designator</th><th>Component</th><th>Package</th><th>Value</th></tr>
                                    </thead>
                                    <tbody>
                                      ${message.metadata.bom.map((item: any) => `
                                        <tr>
                                          <td>${item.designator}</td>
                                          <td>${item.name}</td>
                                          <td>${item.package}</td>
                                          <td>${item.value}</td>
                                        </tr>
                                      `).join("")}
                                    </tbody>
                                  </table>
                                </body>
                              </html>
                            `);
                            win.document.close();
                          }
                        }}
                        className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 border border-yellow-500/30 text-[9px] font-bold uppercase tracking-widest h-8 px-3 flex items-center gap-2"
                      >
                        <FileText className="w-3 h-3" />
                        Export BOM
                      </Button>
                    )}

                    {message.metadata?.firmware && (
                      <Button
                        onClick={() => handleLabNavigation("/code", { code: message.metadata?.firmware }, "Firmware synced to Code Studio")}
                        className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 text-[9px] font-bold uppercase tracking-widest h-8 px-3 flex items-center gap-2"
                      >
                        <Code className="w-3 h-3" />
                        Open in Code Studio
                      </Button>
                    )}

                    {message.metadata?.simulation_results && (
                      <Button
                        onClick={() => handleLabNavigation("/test-lab", { results: message.metadata?.simulation_results }, "Signal analysis synced to Test Lab")}
                        className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 text-[9px] font-bold uppercase tracking-widest h-8 px-3 flex items-center gap-2"
                      >
                        <Cpu className="w-3 h-3" />
                        Analyze in Test Lab
                      </Button>
                    )}

                    <Button
                      onClick={() => {
                        const lastUserMsg = [...messages].reverse().find(m => m.role === "user")?.content || "Analyze the circuit";
                        handleLabNavigation("/analyzer", { description: lastUserMsg }, "Design synced to Logic Processor");
                      }}
                      className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 text-[9px] font-bold uppercase tracking-widest h-8 px-3 flex items-center gap-2"
                    >
                      <Activity className="w-3 h-3" />
                      Logic Processor Analysis
                    </Button>

                    <Button
                      onClick={() => {
                        const lastUserMsg = [...messages].reverse().find(m => m.role === "user")?.content || "Explain the circuit design and potential issues";
                        handleLabNavigation("/troubleshoot", { question: lastUserMsg }, "Design context synced to Troubleshoot");
                      }}
                      className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-[9px] font-bold uppercase tracking-widest h-8 px-3 flex items-center gap-2"
                    >
                      <Bot className="w-3 h-3" />
                      Troubleshoot Diagnostic
                    </Button>
                  </div>
                )}
              </div>

              {/* Poll Options */}
              {message.metadata?.type === "poll" &&
                message.metadata.pollOptions && (
                  <div className="mt-3 space-y-2">
                    {message.metadata.pollOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handlePollSelect(message.id, option.id)}
                        disabled={!!message.metadata?.selectedOption}
                        className={`w-full p-3 rounded-lg border text-left transition-all ${option.selected
                          ? "border-primary bg-primary/20 text-primary"
                          : "border-border bg-card hover:border-primary/50 hover:bg-card/80"
                          } ${message.metadata?.selectedOption
                            ? "cursor-default"
                            : "cursor-pointer"
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-[10px] uppercase">
                              {option.label}
                            </div>
                            {option.description && (
                              <div className="text-[8px] text-muted-foreground mt-0.5 uppercase">
                                {option.description}
                              </div>
                            )}
                          </div>
                          {option.selected && (
                            <span className="text-[8px] font-bold uppercase text-primary">SELECTED</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

              <div className="flex items-center justify-between mt-1 px-1">
                <div className="text-[8px] font-bold uppercase text-muted-foreground">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>

                {message.id !== "welcome" && (
                  <button
                    onClick={() => handleDeleteMessage(message.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-500 text-muted-foreground"
                    title="Delete message"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>

            {message.role === "user" && (
              <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                <span className="text-[8px] font-bold text-muted-foreground">ME</span>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
            </div>
            <div className="chat-bubble-ai py-3 px-4 rounded-2xl border border-amber-500/10 bg-amber-500/[0.02]">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-amber-500/40 text-[9px] font-bold uppercase tracking-[0.2em]">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  Analyzing_Context...
                </div>
                <div className="flex gap-1 pl-1">
                  <div className="h-1 w-1 bg-amber-500/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="h-1 w-1 bg-amber-500/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="h-1 w-1 bg-amber-500/40 rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Action Buttons when planning is complete */}
      {planningPhase === "complete" && (
        <div className="px-4 pb-2">
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={onGeneratePCB}
              variant="outline"
              size="sm"
              className="border-primary/30 hover:bg-primary/10 text-[10px] font-bold uppercase"
            >
              View PCB Diagram
            </Button>
            <Button
              onClick={onGenerateCode}
              variant="outline"
              size="sm"
              className="border-primary/30 hover:bg-primary/10 text-[10px] font-bold uppercase"
            >
              Generate Code
            </Button>
            <Button variant="outline" size="sm" className="text-[10px] font-bold uppercase">
              Export Plan
            </Button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-4 mb-2 px-1 flex-wrap">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={useReasoning}
              onChange={(e) => setUseReasoning(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
            />
            <span>Deep Reasoning</span>
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={useDesignAgent}
              onChange={(e) => setUseDesignAgent(e.target.checked)}
              className="rounded border-gray-300 text-green-500 focus:ring-green-500 h-4 w-4"
            />
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Design Agent (Auto-route)
            </span>
          </label>
        </div>

        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="DESCRIBE YOUR PROJECT IDEA..."
            rows={1}
            className="flex-1 resize-none bg-input border border-border rounded-lg px-4 py-3 text-xs font-bold uppercase tracking-tight focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground/30"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-primary hover:bg-primary/90 px-6 text-xs font-bold uppercase tracking-widest"
          >
            SEND
          </Button>
        </div>
        <p className="text-[8px] font-bold uppercase text-muted-foreground/50 mt-2 tracking-widest text-center">
          ENTER TO SEND • SHIFT+ENTER FOR NEW LINE
        </p>
      </div>
    </div >
  );
};

export default ChatInterface;
