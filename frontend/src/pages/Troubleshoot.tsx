import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
            setCurrentAnswer("⚠️ CRITICAL_COMM_FAILURE: UNABLE_TO_ESTABLISH_NEURAL_LINK with DIAG_ENGINE.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Layout>
            <div className="container max-w-6xl mx-auto px-4 py-12 space-y-8">
                {/* Header Module */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 blueprint-card border-primary/20 bg-primary/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-1 opacity-10">
                        <span className="text-[8px] font-mono font-bold tracking-[0.5em] uppercase">NEURAL_DIAGNOSTICS_V7</span>
                    </div>
                    <div className="space-y-1 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            <h1 className="text-3xl font-bold tracking-tighter uppercase">Hardware Diagnostics</h1>
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] ml-5">
                            Subsystem: Failure_Analysis_Engine // Integrated_Neural_Electronics
                        </p>
                    </div>
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Neural Link</span>
                            <span className="text-xs font-bold text-success uppercase">Established_01</span>
                        </div>
                        <div className="h-10 w-px bg-primary/20" />
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Diagnostic_Logs</span>
                            <span className="text-xs font-bold text-primary uppercase">{history.length} Entries</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Workspace (8/12) */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 px-1">
                                <span className="h-0.5 w-4 bg-primary/40" />
                                <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Query_Injection</h2>
                            </div>
                            <div className="blueprint-card p-0 overflow-hidden border-primary/20 bg-background/50">
                                <div className="bg-primary/5 px-4 py-2 border-b border-primary/10 flex items-center justify-between">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Awaiting_Hardware_Specifications</span>
                                    <span className="text-[8px] font-mono text-primary animate-pulse">READING_BUFFER...</span>
                                </div>
                                <div className="p-8 space-y-6">
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <Input
                                            placeholder="DESCRIBE_ANOMALY: EX_VOLTAGE_REGULATOR_OVERHEATING..."
                                            value={question}
                                            onChange={(e) => setQuestion(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                                            className="h-14 bg-background border-primary/20 focus-visible:ring-primary text-[11px] font-bold uppercase tracking-widest placeholder:opacity-30 rounded-none"
                                            disabled={isLoading}
                                        />
                                        <Button
                                            onClick={handleAsk}
                                            disabled={isLoading || !question.trim()}
                                            className="h-14 px-10 bg-primary hover:bg-primary/90 text-[11px] font-black uppercase tracking-[0.3em] rounded-none shrink-0"
                                        >
                                            {isLoading ? "Analyzing..." : "Commence_Scan"}
                                        </Button>
                                    </div>

                                    <div className="flex flex-wrap gap-2 pt-2">
                                        <span className="text-[8px] font-mono font-bold text-muted-foreground/40 uppercase tracking-widest mr-2 self-center">Hot_Keys:</span>
                                        {["Voltage_Drop", "Boot_Failure", "Decoupling_Sync"].map(preset => (
                                            <button
                                                key={preset}
                                                onClick={() => setQuestion(preset.replace(/_/g, " "))}
                                                className="text-[9px] font-bold uppercase tracking-widest px-4 py-1.5 border border-primary/10 hover:bg-primary/5 text-primary/60 hover:text-primary transition-all rounded-none"
                                            >
                                                {preset}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {currentAnswer && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="flex items-center gap-2 px-1">
                                    <span className="h-0.5 w-4 bg-primary/40" />
                                    <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Diagnostic_Payload</h2>
                                </div>
                                <div className="blueprint-card p-0 overflow-hidden border-primary/30 ring-1 ring-primary/10 shadow-[0_0_50px_rgba(var(--primary-rgb),0.1)]">
                                    <div className="flex items-center justify-between p-4 border-b border-primary/20 bg-primary/10">
                                        <div className="flex items-center gap-3">
                                            <span className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">AI_Report_Validated</span>
                                        </div>
                                        <span className="text-[9px] font-mono text-primary/40 font-bold">TS_ID: {Math.random().toString(16).substring(2, 10).toUpperCase()}</span>
                                    </div>
                                    <div className="p-10 prose prose-invert max-w-none bg-black/40">
                                        <div className="text-[13px] uppercase tracking-wide font-bold leading-relaxed text-blue-50/80">
                                            <ReactMarkdown>{currentAnswer}</ReactMarkdown>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-primary/5 border-t border-primary/10 flex items-center justify-between">
                                        <span className="text-[8px] font-bold text-primary/40 uppercase tracking-[0.5em]">Transmission_End</span>
                                        <span className="text-[8px] font-mono text-muted-foreground/40 font-bold uppercase">Nexa_Neural_Diagnostics</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar (4/12) */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 px-1">
                                <span className="h-0.5 w-3 bg-primary/40" />
                                <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">History_Log</h2>
                            </div>
                            <div className="space-y-3">
                                {history.length === 0 ? (
                                    <div className="blueprint-card p-12 border-dashed border-primary/10 text-center opacity-40">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Log_Stream_Empty</span>
                                    </div>
                                ) : (
                                    history.map((item) => (
                                        <div key={item.id} className="blueprint-card p-4 border-primary/10 hover:border-primary/30 transition-all bg-primary/[0.02]">
                                            <div className="text-[8px] font-mono text-primary/40 uppercase mb-2">{item.timestamp.toLocaleTimeString()}</div>
                                            <p className="text-[10px] font-bold uppercase tracking-tight text-foreground line-clamp-1 opacity-80 mb-2">"{item.question}"</p>
                                            <div className="text-[9px] font-medium text-muted-foreground line-clamp-2 uppercase leading-snug opacity-50">
                                                <ReactMarkdown>{item.answer}</ReactMarkdown>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="blueprint-card p-6 border-primary/10 bg-primary/5 space-y-6">
                            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                Neural_Parameters
                            </h4>
                            <div className="space-y-4">
                                {[
                                    { label: "ENGINE_STATE", val: "NOMINAL" },
                                    { label: "NEURAL_NODES", val: "ACTIVE" },
                                    { label: "SYNC_QUALITY", val: "0.982" },
                                    { label: "MODEL", val: "GEMINI_2_PRO" }
                                ].map(spec => (
                                    <div key={spec.label} className="flex justify-between items-center border-b border-primary/5 pb-2">
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase">{spec.label}</span>
                                        <span className="text-[10px] font-mono font-bold text-primary">{spec.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Troubleshoot;
