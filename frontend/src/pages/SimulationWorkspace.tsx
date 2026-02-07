import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Sparkles, Code, Activity, ShieldAlert, Cpu } from "lucide-react";
import WaveformViewer from "@/components/simulation/WaveformViewer";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { simulate } from "@/lib/api";

const SimulationWorkspace = () => {
    const [description, setDescription] = useState("");
    const [netlist, setNetlist] = useState("");
    const [isSimulating, setIsSimulating] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

    const handleSimulate = async () => {
        if (!description && !netlist) {
            toast.error("Please provide either a circuit description or a netlist.");
            return;
        }

        setIsSimulating(true);
        setResults(null);
        setAiAnalysis(null);

        try {
            const data = await simulate(
                description || undefined,
                netlist || undefined
            );
            setResults(data.result);
            if (data.netlist) setNetlist(data.netlist);
            if (data.result.ai_analysis) setAiAnalysis(data.result.ai_analysis);

            toast.success("Simulation completed successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to run simulation. Make sure the AI Microservice is running.");
        } finally {
            setIsSimulating(false);
        }
    };

    return (
        <Layout>
            <div className="container max-w-7xl mx-auto px-4 py-12 space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 blueprint-card border-primary/20 bg-primary/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-1 opacity-10">
                        <span className="text-[8px] font-mono font-bold tracking-[0.5em] uppercase">SIMULATION_AGENT_V1</span>
                    </div>
                    <div className="space-y-1 relative z-10">
                        <div className="flex items-center gap-3">
                            <Cpu className="h-6 w-6 text-primary" />
                            <h1 className="text-3xl font-bold tracking-tighter uppercase">Simulation Agent</h1>
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] ml-9">
                            Neural Processing Unit: Circuit Dynamics Solver
                        </p>
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                        <Button
                            onClick={handleSimulate}
                            disabled={isSimulating}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] h-10 px-8 rounded-none border-b-4 border-primary-foreground/20 active:border-b-0 active:translate-y-1 transition-all"
                        >
                            {isSimulating ? "Processing..." : (
                                <>
                                    <Play className="h-3 w-3 mr-2 fill-current" />
                                    Initiate_Cycle
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Input & Netlist */}
                    <div className="lg:col-span-5 space-y-6">
                        <Tabs defaultValue="description" className="w-full">
                            <TabsList className="grid grid-cols-2 w-full bg-primary/5 border border-primary/10 p-1 rounded-none mb-4">
                                <TabsTrigger value="description" className="rounded-none text-[9px] font-bold uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    Circuit_Description
                                </TabsTrigger>
                                <TabsTrigger value="netlist" className="rounded-none text-[9px] font-bold uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    SPICE_Netlist
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="description" className="m-0">
                                <div className="blueprint-card p-0 border-primary/20 bg-background/50">
                                    <div className="bg-primary/10 px-4 py-2 border-b border-primary/20 flex items-center gap-2">
                                        <Sparkles className="h-3 w-3 text-primary" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-primary">Natural_Language_Inference</span>
                                    </div>
                                    <div className="p-4">
                                        <Textarea
                                            placeholder="e.g., A low pass RC filter with R=1k, C=1uF. Run transient analysis for 10ms."
                                            className="min-h-[200px] bg-transparent border-none focus-visible:ring-0 font-mono text-sm resize-none"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="netlist" className="m-0">
                                <div className="blueprint-card p-0 border-primary/20 bg-background/50 text-white">
                                    <div className="bg-primary/10 px-4 py-2 border-b border-primary/20 flex items-center gap-2">
                                        <Code className="h-3 w-3 text-primary" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-primary">raw_netlist_buffer</span>
                                    </div>
                                    <div className="p-4">
                                        <Textarea
                                            placeholder="* SPICE Netlist Example&#10;V1 1 0 5V&#10;R1 1 2 1k&#10;C1 2 0 1uF&#10;.tran 0.1m 10m&#10;.end"
                                            className="min-h-[200px] bg-neutral-900 border-none focus-visible:ring-0 font-mono text-xs text-green-400 resize-none"
                                            value={netlist}
                                            onChange={(e) => setNetlist(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        {aiAnalysis && (
                            <div className="blueprint-card p-0 overflow-hidden border-primary/20 bg-primary/5">
                                <div className="bg-primary/10 px-4 py-2 border-b border-primary/20 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <ShieldAlert className="h-3 w-3 text-primary" />
                                        <h3 className="text-[9px] font-black uppercase tracking-widest text-primary">Expert_Analysis_Report</h3>
                                    </div>
                                </div>
                                <div className="p-6 prose prose-sm prose-invert max-w-none text-[11px] font-medium leading-relaxed text-muted-foreground">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {aiAnalysis || ""}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Visualization */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="blueprint-card p-0 overflow-hidden border-primary/20 bg-background/50 h-[500px] flex flex-col">
                            <div className="bg-primary/10 px-4 py-3 border-b border-primary/20 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-primary" />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Dynamics_Visualization</h3>
                                </div>
                                {results?.is_mock && (
                                    <span className="text-[8px] font-bold uppercase tracking-widest text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded border border-orange-400/20 animate-pulse">
                                        EMULATED_DATA
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 p-8">
                                {results && results.data ? (
                                    <WaveformViewer data={results.data} />
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-30">
                                        <div className="h-12 w-12 rounded-full border-4 border-dashed border-primary animate-spin" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest">Waiting_for_Simulation_Data</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {results?.error && (
                            <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-none">
                                <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <ShieldAlert className="h-3 w-3" />
                                    Kernel_Error_Detected
                                </h4>
                                <pre className="text-xs font-mono overflow-auto whitespace-pre-wrap">
                                    {results.error}
                                </pre>
                            </div>
                        )}

                        {results?.raw_output && (
                            <div className="blueprint-card p-0 overflow-hidden border-primary/20 bg-neutral-950">
                                <div className="bg-white/5 px-4 py-1 border-b border-white/10 flex items-center justify-between">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Raw_Solver_Output</span>
                                </div>
                                <div className="p-4">
                                    <pre className="text-[10px] font-mono text-muted-foreground max-h-40 overflow-auto">
                                        {results.raw_output}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default SimulationWorkspace;
