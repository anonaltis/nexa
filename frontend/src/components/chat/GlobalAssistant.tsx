import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Bot, X, Send, Minus, Maximize2, Sparkles, MessageSquare, Brain, Zap, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Mock responses for Demo Mode
const DEMO_CACHE: Record<string, { response: string, reasoning?: string[] }> = {
    "default": {
        response: "I'm currently in Demo Mode. I can simulate high-reasoning engineering advice without consuming real-time tokens.",
        reasoning: ["System initialized in stable_demo_v1", "Scanning local engineering knowledge base", "Generating optimized simulation data"]
    },
    "WHAT_SHOULD_I_DO_NEXT": {
        "analyzer": {
            response: "Since you are in the **Logic Processor (Analyzer)**, you should run a 'Logic Check' on your circuit description. I've detected potential floating nodes in your input.",
            reasoning: ["Detected Route: /analyzer", "Parsing circuit text buffer", "Identifying missing ground reference (GND)"]
        },
        "schematic": {
            response: "You are currently in the **Schematic Editor**. I recommend adding a decoupling capacitor (100nF) near the VCC pin of your IC to suppress noise.",
            reasoning: ["Detected Route: /schematic", "Analyzing IC power pin topology", "Applying best-practice noise suppression rules"]
        },
        "code": {
            response: "In the **Code Studio**, you should verify your baud rate settings. If using ESP32, 115200 is the standard for stable serial communication.",
            reasoning: ["Detected Route: /code", "Scanning buffer for Serial.begin()", "Verifying clock frequency compatibility"]
        }
    }
};

const GlobalAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [useReasoning, setUseReasoning] = useState(true);

    const location = useLocation();
    const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string; reasoning?: string[] }[]>([
        { role: "assistant", content: "Hello! I am the Nexa Co-pilot. I'm context-aware and ready to provide technical reasoning for your project." }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const getPageContext = () => {
        const path = location.pathname;
        if (path.includes("analyzer")) return "analyzer";
        if (path.includes("schematic")) return "schematic";
        if (path.includes("code")) return "code";
        if (path.includes("pcb")) return "pcb";
        if (path.includes("components")) return "components";
        return "general";
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        const context = getPageContext();

        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setInput("");
        setIsLoading(true);

        // DEMO MODE BYPASS
        if (isDemoMode) {
            await new Promise(r => setTimeout(r, 1200)); // Simulate thinking
            let demoResp = DEMO_CACHE["default"];

            const normalizedQuery = userMsg.toUpperCase().replace(/\s/g, '_');
            if (normalizedQuery.includes("NEXT") || normalizedQuery.includes("DO")) {
                const cat = DEMO_CACHE["WHAT_SHOULD_I_DO_NEXT"] as any;
                demoResp = cat[context] || cat["analyzer"];
            }

            setMessages(prev => [...prev, {
                role: "assistant",
                content: demoResp.response,
                reasoning: demoResp.reasoning
            }]);
            setIsLoading(false);
            return;
        }

        try {
            const response = await api.post("/v3/chat/message", {
                message: userMsg,
                mode: "auto",
                use_reasoning: useReasoning,
                context: context
            });

            setMessages(prev => [...prev, {
                role: "assistant",
                content: response.data.content || response.data.response,
                reasoning: response.data.metadata?.reasoning_steps
            }]);
        } catch (error) {
            console.error("Assistant Error:", error);
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "⚠️ CRITICAL_COMM_FAILURE: Unable to reach Nexa Brain. Check your neural link."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-[0_0_30px_rgba(var(--primary-rgb),0.4)] bg-primary hover:bg-primary/90 z-[100] p-0 group overflow-hidden"
            >
                <div className="absolute inset-0 bg-primary/20 animate-ping opacity-20" />
                <Bot className="h-6 w-6 text-primary-foreground group-hover:scale-110 transition-transform" />
            </Button>
        );
    }

    return (
        <div
            className={`fixed bottom-6 right-6 w-96 bg-black/90 backdrop-blur-2xl border border-primary/20 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,1)] z-[100] flex flex-col transition-all duration-300 ${isMinimized ? 'h-14' : 'h-[550px]'
                }`}
        >
            {/* Header */}
            <div className="p-4 border-b border-primary/10 flex items-center justify-between bg-primary/5">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">NEXA_CO-PILOT_v5.0</span>
                        <span className="text-[7px] text-muted-foreground uppercase font-bold tracking-widest">Context: {getPageContext().toUpperCase()}</span>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-primary/10 text-muted-foreground"
                        onClick={() => setShowSettings(!showSettings)}
                    >
                        <Settings2 className="h-3 w-3" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-primary/10 text-muted-foreground"
                        onClick={() => setIsMinimized(!isMinimized)}
                    >
                        {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        onClick={() => setIsOpen(false)}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Settings Overlay */}
                    {showSettings && (
                        <div className="absolute top-14 left-0 right-0 p-4 bg-black/95 border-b border-primary/10 z-20 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                                    <Zap className="h-3 w-3" /> Token_Safe_Demo_Mode
                                </span>
                                <input
                                    type="checkbox"
                                    checked={isDemoMode}
                                    onChange={(e) => setIsDemoMode(e.target.checked)}
                                    className="h-4 w-4 accent-primary"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                                    <Brain className="h-3 w-3" /> High_Reasoning_Protocol
                                </span>
                                <input
                                    type="checkbox"
                                    checked={useReasoning}
                                    onChange={(e) => setUseReasoning(e.target.checked)}
                                    className="h-4 w-4 accent-primary"
                                />
                            </div>
                        </div>
                    )}

                    {/* Chat Area */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[88%] p-3 rounded-xl text-xs leading-relaxed ${msg.role === 'user'
                                        ? 'bg-primary text-primary-foreground rounded-br-none'
                                        : 'bg-primary/5 border border-primary/20 text-foreground rounded-bl-none shadow-[inset_0_0_20px_rgba(var(--primary-rgb),0.05)]'
                                    }`}>
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>

                                {msg.reasoning && msg.reasoning.length > 0 && (
                                    <div className="mt-2 ml-2 space-y-1.5 border-l-2 border-primary/10 pl-3 py-1">
                                        <div className="flex items-center gap-1.5 opacity-40">
                                            <Brain className="h-2.5 w-2.5" />
                                            <span className="text-[7px] font-black uppercase tracking-[0.2em]">Logical_Reasoning_Path</span>
                                        </div>
                                        {msg.reasoning.map((step, si) => (
                                            <div key={si} className="text-[8px] text-muted-foreground/60 font-mono italic flex gap-2">
                                                <span className="text-primary/40">[{si + 1}]</span>
                                                <span>{step}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex flex-col gap-2">
                                <div className="bg-primary/5 border border-primary/10 p-3 rounded-xl w-fit">
                                    <div className="flex gap-1.5 items-center">
                                        <div className="h-1 w-1 bg-primary rounded-full animate-bounce" />
                                        <div className="h-1 w-1 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                                        <div className="h-1 w-1 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                                        <span className="text-[8px] font-bold text-primary/40 uppercase tracking-widest ml-2">Processing_Engineering_Logic...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-primary/10 bg-black/60">
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder={isDemoMode ? "DEMO_INJECTION..." : "SYSTEM_QUERY..."}
                                className={`w-full bg-background/50 border rounded-lg px-4 py-3 text-[10px] font-bold uppercase tracking-widest focus:outline-none transition-all placeholder:opacity-20 ${isDemoMode ? 'border-yellow-500/30 focus:border-yellow-500/50' : 'border-primary/20 focus:border-primary/50'
                                    }`}
                            />
                            <Button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className={`absolute right-1.5 top-1.5 h-8 w-8 p-0 rounded-md transition-all ${isDemoMode
                                        ? 'bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-500'
                                        : 'bg-primary/20 hover:bg-primary/40 text-primary'
                                    }`}
                            >
                                <Send className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                        {isDemoMode && (
                            <div className="mt-2 text-center">
                                <span className="text-[6px] font-black text-yellow-500/50 uppercase tracking-[0.3em]">Warning: Demo_Mode_Active • Tokens_Suspended</span>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default GlobalAssistant;
