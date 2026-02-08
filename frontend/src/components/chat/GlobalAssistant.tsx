import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Minus, Maximize2, Sparkles, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const GlobalAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
        { role: "assistant", content: "Hello! I am the Nexa Orchestrator. How can I help you with your electronics project today?" }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await api.post("/v3/chat/message", {
                message: userMsg,
                mode: "auto",
            });

            setMessages(prev => [...prev, {
                role: "assistant",
                content: response.data.content || response.data.response
            }]);
        } catch (error) {
            console.error("Assistant Error:", error);
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "⚠️ CONNECTION_ERROR: Unable to reach Orchestrator. Please check your link."
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
            className={`fixed bottom-6 right-6 w-96 bg-black/80 backdrop-blur-2xl border border-primary/20 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] z-[100] flex flex-col transition-all duration-300 ${isMinimized ? 'h-14' : 'h-[500px]'
                }`}
        >
            {/* Header */}
            <div className="p-4 border-b border-primary/10 flex items-center justify-between bg-primary/5">
                <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Nexa_Orchestrator_v4.4</span>
                </div>
                <div className="flex items-center gap-1">
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
                    {/* Chat Area */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-xl text-xs leading-relaxed ${msg.role === 'user'
                                        ? 'bg-primary text-primary-foreground rounded-br-none'
                                        : 'bg-primary/10 border border-primary/20 text-foreground rounded-bl-none'
                                    }`}>
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-primary/5 border border-primary/10 p-2 rounded-xl">
                                    <div className="flex gap-1">
                                        <div className="h-1 w-1 bg-primary rounded-full animate-bounce" />
                                        <div className="h-1 w-1 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                                        <div className="h-1 w-1 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-primary/10 bg-black/40">
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="COMMAND_INJECTION..."
                                className="w-full bg-background/50 border border-primary/20 rounded-lg px-4 py-2 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-primary/50 transition-colors placeholder:opacity-30"
                            />
                            <Button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="absolute right-1 top-1 h-[26px] w-[26px] p-0 bg-primary/20 hover:bg-primary/40 border border-primary/20"
                            >
                                <Send className="h-3 w-3 text-primary" />
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default GlobalAssistant;
