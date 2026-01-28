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
    <div className="flex items-center gap-1 p-2 bg-card/80 backdrop-blur-sm border border-border rounded-lg">
      {/* Edit Mode Toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isEditMode ? "default" : "ghost"}
            size="icon"
            onClick={onToggleEditMode}
            className="h-8 w-8"
          >
        {isEditMode ? <Move className="w-4 h-4" /> : <MousePointer2 className="w-4 h-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isEditMode ? "Exit Edit Mode" : "Enter Edit Mode"}
        </TooltipContent>
      </Tooltip>

      {isEditMode && (
        <>
          <div className="w-px h-6 bg-border mx-1" />
          
          {/* Undo/Redo buttons */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onUndo}
                disabled={!canUndo}
                className="h-8 w-8"
              >
                <Undo2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRedo}
                disabled={!canRedo}
                className="h-8 w-8"
              >
                <Redo2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-border mx-1" />
          
          {/* Routing indicator */}
          
          {/* Routing indicator */}
          {isRouting && (
            <div className="flex items-center gap-2 px-2">
              <Pencil className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-xs text-primary font-medium">Routing...</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancelRouting}
                className="h-6 px-2 text-xs"
              >
                Cancel (Esc)
              </Button>
            </div>
          )}

          {/* Component actions */}
          {selectedComponent && !isRouting && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onRotate}
                    className="h-8 w-8"
                  >
                    <RotateCw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Rotate 90°</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onDelete}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete Component</TooltipContent>
              </Tooltip>
            </>
          )}

          {!selectedComponent && !isRouting && (
            <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
              <Circle className="w-3 h-3" />
              <span>Click pins to route • Drag components to move</span>
            </div>
          )}
        </>
      )}

      {!isEditMode && (
        <span className="text-xs text-muted-foreground px-2">
          Click Edit Mode to customize
        </span>
      )}
    </div>
  );
};

export default PCBEditorToolbar;
