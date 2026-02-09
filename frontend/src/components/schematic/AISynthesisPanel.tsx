import { useState } from "react";
import { Sparkles, Image as ImageIcon, Send, Brain, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface AISynthesisPanelProps {
    onGenerateDesign: (prompt: string) => Promise<void>;
    onVisionExtract: (file: File) => Promise<void>;
    isGenerating: boolean;
    isExtracting: boolean;
    designRationale?: string;
}

const AISynthesisPanel = ({
    onGenerateDesign,
    onVisionExtract,
    isGenerating,
    isExtracting,
    designRationale
}: AISynthesisPanelProps) => {
    const [prompt, setPrompt] = useState("");

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onVisionExtract(file);
        }
    };

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="blueprint-card p-4 border-primary/20 bg-primary/5 space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5" />
                        Synthesis_Engine
                    </h4>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/5 border border-primary/20">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-[7px] font-black text-primary uppercase tracking-widest">High_IQ</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="relative">
                        <Textarea
                            placeholder="Describe circuit logic... (e.g. 5V to 3.3V LDO regulator with power LED)"
                            className="min-h-[100px] text-[10px] bg-background/50 border-primary/10 font-bold uppercase tracking-tight focus:border-primary/40 ring-0 focus-visible:ring-0 resize-none"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                        <Button
                            size="icon"
                            className="absolute bottom-2 right-2 h-7 w-7 rounded-md bg-primary hover:bg-primary/90"
                            onClick={() => onGenerateDesign(prompt)}
                            disabled={isGenerating || !prompt.trim()}
                        >
                            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="h-px bg-primary/10 flex-1" />
                        <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">OR</span>
                        <div className="h-px bg-primary/10 flex-1" />
                    </div>

                    <div className="relative">
                        <input
                            type="file"
                            id="vision-upload"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileUpload}
                            disabled={isExtracting}
                        />
                        <Button
                            variant="outline"
                            className="w-full h-9 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 text-[9px] font-bold uppercase tracking-widest gap-2"
                            onClick={() => document.getElementById('vision-upload')?.click()}
                            disabled={isExtracting}
                        >
                            {isExtracting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
                            Extract_From_Image
                        </Button>
                    </div>
                </div>
            </div>

            {designRationale && (
                <div className="blueprint-card p-4 border-primary/20 bg-black/40 flex-1 overflow-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-center gap-2 mb-3 border-b border-primary/10 pb-2">
                        <Brain className="h-3 w-3 text-primary" />
                        <h5 className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Design_Rationale</h5>
                    </div>
                    <div className="space-y-3">
                        <p className="text-[10px] text-muted-foreground leading-relaxed font-medium uppercase tracking-tight">
                            {designRationale}
                        </p>
                        <div className="flex items-center gap-2 p-2 bg-primary/5 rounded border border-primary/10">
                            <Info className="h-3 w-3 text-primary/60" />
                            <span className="text-[8px] font-bold text-primary/60 uppercase tracking-widest">Validated by Physics Engine</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AISynthesisPanel;
