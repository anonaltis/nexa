import { AlertTriangle, AlertCircle, AlertOctagon } from "lucide-react";

interface Fault {
  id: string;
  name: string;
  reason: string;
  severity: "low" | "medium" | "high";
}

interface FaultDetectionPanelProps {
  faults: Fault[];
  isVisible: boolean;
}

const severityConfig = {
  low: {
    icon: AlertCircle,
    className: "severity-low",
    borderColor: "border-l-fault-low",
    label: "Low",
  },
  medium: {
    icon: AlertTriangle,
    className: "severity-medium",
    borderColor: "border-l-fault-medium",
    label: "Medium",
  },
  high: {
    icon: AlertOctagon,
    className: "severity-high",
    borderColor: "border-l-fault-high",
    label: "High",
  },
};

const FaultDetectionPanel = ({ faults, isVisible }: FaultDetectionPanelProps) => {
  if (!isVisible || faults.length === 0) return null;

  return (
    <section className="w-full animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
      <div className="space-y-2">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Fault Detection</h2>
            <p className="text-sm text-muted-foreground">Identified circuit issues</p>
          </div>
        </div>

        {/* Fault Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {faults.map((fault, index) => {
            const config = severityConfig[fault.severity];
            const IconComponent = config.icon;

            return (
              <div
                key={fault.id}
                className={`floating-card p-5 border-l-4 ${config.borderColor} animate-fade-in`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <IconComponent className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold text-foreground">{fault.name}</h3>
                  </div>
                  <span className={config.className}>{config.label}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {fault.reason}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FaultDetectionPanel;
