import { useRef, useState, useEffect } from "react";
import { ZoomIn, ZoomOut, RotateCw, Move } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PCBRendererProps {
  svg: string;
  className?: string;
}

const PCBRenderer = ({ svg, className = "" }: PCBRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 25));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(100);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2 bg-card/90 backdrop-blur-sm rounded-lg p-2 border border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomOut}
          className="h-8 w-8"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="flex items-center justify-center text-xs font-mono w-12">
          {zoom}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomIn}
          className="h-8 w-8"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <div className="w-px h-8 bg-border" />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRotate}
          className="h-8 w-8"
          title="Rotate 90°"
        >
          <RotateCw className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleReset}
          className="h-8 w-8"
          title="Reset View"
        >
          <Move className="w-4 h-4" />
        </Button>
      </div>

      {/* PCB Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom / 100}) rotate(${rotation}deg)`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.2s ease-out",
          }}
        >
          {svg ? (
            <div
              className="pcb-svg-container"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : (
            <div className="text-muted-foreground text-sm">
              No PCB generated yet. Click "Generate PCB" to create a layout.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PCBRenderer;
