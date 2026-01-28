import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Zap, CircuitBoard } from "lucide-react";

interface CircuitInputPanelProps {
  onAnalyze: (input: string) => void;
  isAnalyzing: boolean;
}

const placeholderText = `Components:
R1 = 1kΩ
R2 = 10kΩ
OpAmp = LM358

Supply:
+5V, -5V

Connections:
R1 → Non-inverting input (+)
R2 → Feedback (Output to Inverting input)
Vin → R1`;

const CircuitInputPanel = ({ onAnalyze, isAnalyzing }: CircuitInputPanelProps) => {
  const [circuitInput, setCircuitInput] = useState("");

  const handleAnalyze = () => {
    if (circuitInput.trim()) {
      onAnalyze(circuitInput);
    }
  };

  const hasInput = circuitInput.trim().length > 0;

  return (
    <section className="w-full animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
      <div className="elevated-card p-6 md:p-8">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <CircuitBoard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Circuit Input</h2>
            <p className="text-sm text-muted-foreground">Describe your circuit configuration</p>
          </div>
        </div>

        {/* Input Area */}
        <div className="space-y-4">
          <div className="circuit-input">
            <div className="flex flex-wrap gap-4 mb-4 text-xs text-muted-foreground">
              <span className="section-title">Components & Values</span>
              <span className="section-title">Connections</span>
              <span className="section-title">Supply Voltages</span>
            </div>
            <textarea
              value={circuitInput}
              onChange={(e) => setCircuitInput(e.target.value)}
              placeholder={placeholderText}
              className="w-full min-h-[200px] bg-transparent resize-none focus:outline-none text-foreground placeholder:text-muted-foreground/50 leading-relaxed"
              spellCheck={false}
            />
          </div>

          {/* Analyze Button */}
          <div className="flex justify-end">
            <Button
              variant="hero"
              size="lg"
              glow={hasInput}
              onClick={handleAnalyze}
              disabled={!hasInput || isAnalyzing}
              className={`min-w-[180px] transition-all duration-300 ${
                hasInput ? "opacity-100" : "opacity-50"
              }`}
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Analyze Circuit
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CircuitInputPanel;
