import { CircuitAnalysis } from "@/hooks/useCircuitHistory";
import { History, Trash2, AlertTriangle, AlertCircle, Info, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CircuitHistoryPanelProps {
  history: CircuitAnalysis[];
  onSelect: (analysis: CircuitAnalysis) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

const CircuitHistoryPanel = ({ history, onSelect, onRemove, onClear }: CircuitHistoryPanelProps) => {
  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <AlertTriangle className="w-3.5 h-3.5 text-destructive" />;
      case "medium":
        return <AlertCircle className="w-3.5 h-3.5 text-warning" />;
      default:
        return <Info className="w-3.5 h-3.5 text-primary" />;
    }
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case "high":
        return "border-destructive/30 bg-destructive/5";
      case "medium":
        return "border-warning/30 bg-warning/5";
      default:
        return "border-primary/30 bg-primary/5";
    }
  };

  if (history.length === 0) {
    return (
      <section className="w-full animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
        <div className="elevated-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-muted/50 border border-border/50">
              <History className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Analysis History</h2>
              <p className="text-sm text-muted-foreground">Your past debugging sessions</p>
            </div>
          </div>
          <div className="text-center py-8 text-muted-foreground">
            <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No analyses yet. Start by describing a circuit above.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
      <div className="elevated-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <History className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Analysis History</h2>
              <p className="text-sm text-muted-foreground">{history.length} saved session{history.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all history?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all {history.length} saved analyses. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onClear} className="bg-destructive hover:bg-destructive/90">
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {history.map((analysis) => (
            <div
              key={analysis.id}
              className={`group relative flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent/50 ${getSeverityClass(analysis.severity)}`}
              onClick={() => onSelect(analysis)}
            >
              <div className="flex-shrink-0">
                {getSeverityIcon(analysis.severity)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{analysis.title}</p>
                <p className="text-xs text-muted-foreground">
                  {analysis.faultsCount} fault{analysis.faultsCount !== 1 ? "s" : ""} • {formatTimeAgo(analysis.timestamp)}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(analysis.id);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CircuitHistoryPanel;
