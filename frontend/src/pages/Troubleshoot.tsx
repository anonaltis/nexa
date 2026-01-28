
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Sparkles, AlertTriangle, CheckCircle2, History } from "lucide-react";
import { api } from "@/lib/api";
import ReactMarkdown from "react-markdown";

interface TroubleshootingHistory {
    id: string;
    question: string;
    answer: string;
    timestamp: Date;
}

const Troubleshoot = () => {
    const [question, setQuestion] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState<TroubleshootingHistory[]>([]);
    const [currentAnswer, setCurrentAnswer] = useState<string | null>(null);

    const handleAsk = async () => {
        if (!question.trim() || isLoading) return;

        setIsLoading(true);
        setCurrentAnswer("");

        try {
            // Calling the Main Node Backend
            const response = await api.post("/api/pcb/ask", { question });
            const answer = response.data.ai_response;

            setCurrentAnswer(answer);

            const newEntry: TroubleshootingHistory = {
                id: crypto.randomUUID(),
                question,
                answer,
                timestamp: new Date(),
            };

            setHistory((prev) => [newEntry, ...prev]);
            setQuestion("");
        } catch (error) {
            console.error("AI Error:", error);
            setCurrentAnswer("⚠️ I am having trouble connecting to the troubleshooting engine. Please ensure the backend is running.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto py-10 px-4">
                {/* Header */}
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
                        <Bot className="w-10 h-10 text-blue-500" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">PCB Troubleshooting Assistant</h1>
                    <p className="text-muted-foreground">Powered by Gemini AI — Specialized in identifying and fixing hardware issues.</p>
                </div>

                {/* Input area */}
                <div className="blueprint-card p-6 md:p-8 mb-8 backdrop-blur-xl bg-card/50">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Ex: Why is my voltage regulator heating up? / My ESP32 won't boot..."
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                                className="bg-background/50 border-blue-500/30 focus-visible:ring-blue-500"
                                disabled={isLoading}
                            />
                        </div>
                        <Button
                            onClick={handleAsk}
                            disabled={isLoading || !question.trim()}
                            className="bg-blue-600 hover:bg-blue-700 gap-2 px-6 shadow-lg shadow-blue-500/20"
                        >
                            {isLoading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Ask AI
                        </Button>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                        <span className="text-xs text-muted-foreground">Try:</span>
                        <button onClick={() => setQuestion("Voltage drop in long traces")} className="text-xs px-2 py-1 rounded bg-muted hover:bg-blue-500/10 transition-colors border border-border">Traces</button>
                        <button onClick={() => setQuestion("Bypass capacitor selection")} className="text-xs px-2 py-1 rounded bg-muted hover:bg-blue-500/10 transition-colors border border-border">Decoupling</button>
                        <button onClick={() => setQuestion("ESD protection for sensors")} className="text-xs px-2 py-1 rounded bg-muted hover:bg-blue-500/10 transition-colors border border-border">Protection</button>
                    </div>
                </div>

                {/* Current Result */}
                {currentAnswer && (
                    <div className="animate-in fade-in slide-in-from-bottom-5 duration-500 mb-10">
                        <div className="blueprint-card-elevated border-blue-500/50">
                            <div className="flex items-center gap-2 p-4 border-b border-border bg-blue-500/5">
                                <Sparkles className="w-4 h-4 text-blue-400" />
                                <span className="text-sm font-semibold text-blue-400">AI Diagnostic Report</span>
                            </div>
                            <div className="p-6 prose prose-invert max-w-none prose-sm leading-relaxed">
                                <ReactMarkdown>{currentAnswer}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                )}

                {/* History */}
                {history.length > 0 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                            <History className="w-4 h-4 text-muted-foreground" />
                            <h3 className="text-lg font-semibold">Previous Diagnostics</h3>
                        </div>
                        {history.map((item) => (
                            <div key={item.id} className="blueprint-card p-5 border-border/50 hover:border-blue-500/30 transition-all opacity-80 hover:opacity-100">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                                        <History className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-sm mb-3">"{item.question}"</p>
                                        <div className="prose prose-invert prose-xs text-muted-foreground max-h-32 overflow-hidden line-clamp-3">
                                            <ReactMarkdown>{item.answer}</ReactMarkdown>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mt-4 uppercase tracking-widest font-mono">
                                            {item.timestamp.toLocaleTimeString()} — NEXA DIAGNOSTICS
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!currentAnswer && history.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/30 opacity-50 select-none">
                        <Bot className="w-20 h-20 mb-4 stroke-[1]" />
                        <p className="font-mono text-sm tracking-tighter">WAITING_FOR_INPUT...</p>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Troubleshoot;
