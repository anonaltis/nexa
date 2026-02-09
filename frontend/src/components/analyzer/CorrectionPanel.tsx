import { Wrench, Activity, CheckCircle2 } from "lucide-react";

interface Correction {
  id: string;
  description: string;
  originalValue?: string;
  correctedValue?: string;
}

interface OutputResult {
  parameter: string;
  value: string;
  unit: string;
}

interface CorrectionPanelProps {
  corrections: Correction[];
  expectedOutputs: OutputResult[];
  isVisible: boolean;
}

const CorrectionPanel = ({ corrections, expectedOutputs, isVisible }: CorrectionPanelProps) => {
  if (!isVisible || (corrections.length === 0 && expectedOutputs.length === 0)) return null;

  return (
    <section className="w-full animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
      <div className="grid gap-6 grid-cols-1">
        {/* Suggested Fixes */}
        <div className="floating-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-warning/10 border border-warning/20">
              <Wrench className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Suggested Fixes</h2>
              <p className="text-xs text-muted-foreground">Recommended corrections</p>
            </div>
          </div>

          <ul className="space-y-4">
            {corrections.map((correction, index) => (
              <li
                key={correction.id}
                className="flex items-start gap-3 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CheckCircle2 className="w-4 h-4 text-success mt-1 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm text-foreground">{correction.description}</p>
                  {correction.originalValue && correction.correctedValue && (
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-muted-foreground line-through">
                        {correction.originalValue}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-success">{correction.correctedValue}</span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Expected Output */}
        <div className="floating-card p-6 glow-success">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-success/10 border border-success/20">
              <Activity className="w-5 h-5 text-success" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Expected Output</h2>
              <p className="text-xs text-muted-foreground">After corrections applied</p>
            </div>
          </div>

          <div className="space-y-3">
            {expectedOutputs.map((output, index) => (
              <div
                key={output.parameter}
                className="flex items-center justify-between p-3 rounded-lg bg-background/50 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <span className="text-sm text-muted-foreground">{output.parameter}</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono font-semibold text-success">{output.value}</span>
                  <span className="text-xs text-muted-foreground">{output.unit}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <span className="success-indicator">✓ Circuit Corrected</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CorrectionPanel;
