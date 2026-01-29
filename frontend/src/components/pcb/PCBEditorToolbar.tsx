import { Button } from "@/components/ui/button";
import {
  MousePointer2,
  Move,
  Pencil,
  Trash2,
  RotateCw,
  Circle,
  Undo2,
  Redo2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PCBEditorToolbarProps {
  isEditMode: boolean;
  selectedComponent: string | null;
  isRouting: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onToggleEditMode: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onRotate: () => void;
  onCancelRouting: () => void;
}

const PCBEditorToolbar = ({
  isEditMode,
  selectedComponent,
  isRouting,
  canUndo,
  canRedo,
  onToggleEditMode,
  onUndo,
  onRedo,
  onDelete,
  onRotate,
  onCancelRouting,
}: PCBEditorToolbarProps) => {
  return (
    <div className="flex items-center gap-2 p-1 bg-black/40 backdrop-blur-md border border-primary/20 rounded shadow-lg">
      {/* Mode Switcher */}
      <div className="flex bg-primary/5 rounded border border-primary/10 overflow-hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleEditMode}
          className={`h-9 px-4 text-[10px] font-bold uppercase tracking-widest rounded-none transition-all ${isEditMode
            ? "bg-primary text-primary-foreground shadow-inner"
            : "text-muted-foreground hover:bg-primary/10 hover:text-primary"}`}
        >
          {isEditMode ? "WRT_MODE" : "RD_ONLY"}
        </Button>
      </div>

      <div className="h-6 w-px bg-primary/20 mx-1" />

      {isEditMode ? (
        <div className="flex items-center gap-1.5 px-1 animate-in fade-in slide-in-from-left-2">
          {/* History Module */}
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onUndo}
              disabled={!canUndo}
              className="h-8 px-3 text-[9px] font-bold uppercase border-primary/20 hover:bg-primary/10 disabled:opacity-30"
            >
              Undo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRedo}
              disabled={!canRedo}
              className="h-8 px-3 text-[9px] font-bold uppercase border-primary/20 hover:bg-primary/10 disabled:opacity-30"
            >
              Redo
            </Button>
          </div>

          <div className="h-4 w-px bg-primary/10 mx-2" />

          {/* Contextual Actions */}
          {isRouting ? (
            <div className="flex items-center gap-3 px-2 py-1 bg-primary/10 border border-primary/20 rounded">
              <span className="text-[9px] font-bold text-primary animate-pulse uppercase tracking-widest">Active Routing Sequence...</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancelRouting}
                className="h-6 px-2 text-[8px] font-bold uppercase hover:bg-destructive/20 text-destructive"
              >
                Abort (Esc)
              </Button>
            </div>
          ) : selectedComponent ? (
            <div className="flex items-center gap-1.5 animate-in zoom-in-95 duration-200">
              <span className="text-[8px] font-bold text-muted-foreground uppercase mr-1">Modify Asset:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={onRotate}
                className="h-8 px-3 text-[9px] font-bold uppercase border-primary/30 hover:bg-primary/10"
              >
                Rotate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                className="h-8 px-3 text-[9px] font-bold uppercase border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                Purge
              </Button>
            </div>
          ) : (
            <div className="flex items-center px-3 py-1 bg-primary/5 rounded border border-primary/5">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                Station Ready: Engage nodes or translate assets
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="px-3 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_8px_hsl(var(--success))]" />
          <span className="text-[9px] font-bold text-success/80 uppercase tracking-widest">
            Diagnostic Viewport Active • Integrity Verified
          </span>
        </div>
      )}
    </div>
  );
};

export default PCBEditorToolbar;
