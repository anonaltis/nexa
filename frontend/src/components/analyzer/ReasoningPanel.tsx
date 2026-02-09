import { Brain, Calculator, GitBranch, Lightbulb, Search } from "lucide-react";

interface ReasoningStep {
  id: number;
  title: string;
  explanation: string;
  icon: "analyze" | "calculate" | "logic" | "insight" | "search";
}

interface ReasoningPanelProps {
  steps: ReasoningStep[];
  isVisible: boolean;
}

const iconMap = {
  analyze: Brain,
  calculate: Calculator,
  logic: GitBranch,
  insight: Lightbulb,
  search: Search,
};

const ReasoningPanel = ({ steps, isVisible }: ReasoningPanelProps) => {
  if (!isVisible || steps.length === 0) return null;

  return (
    <section className="w-full animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
      <div className="space-y-2">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground uppercase tracking-tight">Logic Reasoning Path</h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Physics-Based Verification Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/20">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">High_Reasoning_Active</span>
          </div>
        </div>

        {/* Reasoning Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => {
            const IconComponent = iconMap[step.icon];
            return (
              <div key={step.id}>
                <div
                  className="floating-card p-5 animate-slide-in-right"
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  <div className="flex items-start gap-4">
                    {/* Step Number */}
                    <div className="step-number flex-shrink-0">
                      {String(step.id).padStart(2, "0")}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4 text-primary/70" />
                        <h3 className="font-semibold text-foreground">{step.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.explanation}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Timeline Connector */}
                {index < steps.length - 1 && (
                  <div className="timeline-connector" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ReasoningPanel;
