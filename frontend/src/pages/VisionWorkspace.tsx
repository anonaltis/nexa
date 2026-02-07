import { useState, useRef } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Upload, Camera, Search, Layers, Cpu, Zap, Download, FileJson, Play } from "lucide-react";
import { analyzeImage } from "@/lib/api";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const VisionWorkspace = () => {
    const [image, setImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [results, setResults] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const performAnalysis = async (type: 'pcb' | 'schematic') => {
        if (!image) return;

        setIsAnalyzing(true);
        setResults(null);

        try {
            // Extract base64 part
            const base64Data = image.split(',')[1];
            const response = await analyzeImage(base64Data, type);
            setResults(response);
            toast.success("VISION_ANALYSIS_COMPLETE");
        } catch (error) {
            toast.error("ANALYSIS_FAILURE");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <Layout>
            <div className="container max-w-7xl mx-auto px-4 py-12 space-y-8">
                {/* Header Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 blueprint-card border-primary/20">
                            <Camera className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black uppercase tracking-tighter">Vision Agent</h1>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em]">IMAGE_TO_CIRCUIT_EXTRACTION_ENGINE</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Upload & Controls */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="blueprint-card border-primary/20 bg-primary/5 p-8 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden group">
                            {image ? (
                                <div className="relative w-full h-full">
                                    <img src={image} alt="Circuit Preview" className="max-w-full h-auto rounded border border-primary/20 grayscale group-hover:grayscale-0 transition-all duration-500" />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/80"
                                        onClick={() => { setImage(null); setResults(null); }}
                                    >
                                        <Download className="h-4 w-4 rotate-180" />
                                    </Button>
                                </div>
                            ) : (
                                <div
                                    className="flex flex-col items-center gap-6 cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className="h-20 w-20 border-2 border-dashed border-primary/40 rounded-full flex items-center justify-center group-hover:border-primary transition-colors">
                                        <Upload className="h-8 w-8 text-primary/40 group-hover:text-primary transition-colors" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Deploy_Visual_Payload</p>
                                        <p className="text-[8px] font-medium text-muted-foreground uppercase mt-2 tracking-widest">Supports JPEG, PNG (PCB/Schematics)</p>
                                    </div>
                                </div>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                disabled={!image || isAnalyzing}
                                onClick={() => performAnalysis('pcb')}
                                className="h-16 blueprint-card bg-primary/10 hover:bg-primary/20 border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest"
                            >
                                {isAnalyzing ? "Processing..." : "Analyze_PCB"}
                            </Button>
                            <Button
                                disabled={!image || isAnalyzing}
                                onClick={() => performAnalysis('schematic')}
                                className="h-16 blueprint-card bg-primary/10 hover:bg-primary/20 border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest"
                            >
                                {isAnalyzing ? "Processing..." : "Analyze_Schematic"}
                            </Button>
                        </div>
                    </div>

                    {/* Right Column: Extracted Data */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="blueprint-card border-primary/20 bg-black/40 min-h-[500px] flex flex-col">
                            <div className="bg-primary/10 px-6 py-4 border-b border-primary/20 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Search className="h-4 w-4 text-primary" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Extraction_Log</span>
                                </div>
                                {results && (
                                    <div className="flex gap-2">
                                        <Button asChild size="sm" variant="outline" className="h-7 text-[8px] border-primary/20 hover:bg-primary/10">
                                            <Link to="/simulation">Export_To_Sim</Link>
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 p-8 space-y-8 overflow-y-auto">
                                {!results && !isAnalyzing && (
                                    <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-4">
                                        <Layers className="h-12 w-12" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Awaiting_Image_Payload</span>
                                    </div>
                                )}

                                {isAnalyzing && (
                                    <div className="h-full flex flex-col items-center justify-center space-y-6">
                                        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Running_Neural_Extraction...</p>
                                    </div>
                                )}

                                {results && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                        <div className="space-y-4">
                                            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                                                <Cpu className="h-3 w-3" />
                                                Component_Registry
                                            </h3>
                                            <div className="grid gap-2">
                                                {results.components?.map((comp: any, idx: number) => (
                                                    <div key={idx} className="blueprint-card p-4 border-primary/5 bg-primary/[0.02] flex items-center justify-between group hover:border-primary/20 transition-all">
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-[10px] font-black text-primary w-12">{comp.id}</span>
                                                            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{comp.type}</span>
                                                        </div>
                                                        <span className="text-[10px] font-mono text-primary/60">{comp.value || "—"}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                                                <Zap className="h-3 w-3" />
                                                Topology_Inference
                                            </h3>
                                            <div className="blueprint-card p-6 border-white/5 bg-neutral-900/50">
                                                <p className="text-[11px] font-medium text-muted-foreground uppercase leading-relaxed tracking-wider">
                                                    {results.topology_summary}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                                                    <FileJson className="h-3 w-3" />
                                                    Raw_Netlist_Data
                                                </h3>
                                            </div>
                                            <pre className="blueprint-card p-6 border-white/5 bg-black/80 font-mono text-[9px] text-primary/40 overflow-x-auto">
                                                {JSON.stringify(results.components, null, 2)}
                                            </pre>
                                        </div>
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

export default VisionWorkspace;
