import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize, MousePointer, Minus } from "lucide-react";

interface SchematicNode {
  id: string;
  component_id: string;
  x: number;
  y: number;
  rotation: number;
  properties: {
    label: string;
    value?: string;
    type: string;
    package?: string;
  };
}

interface SchematicWire {
  id: string;
  from_node: string;
  from_pin: string;
  to_node: string;
  to_pin: string;
  points: { x: number; y: number }[];
}

interface SchematicCanvasProps {
  nodes: SchematicNode[];
  wires: SchematicWire[];
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  onUpdateNode: (id: string, updates: Partial<SchematicNode>) => void;
  onAddWire: (wire: SchematicWire) => void;
  onDropComponent: (componentType: string, x: number, y: number) => void;
  tool: "select" | "wire";
}

const GRID_SIZE = 20;

const getComponentSymbol = (type: string): JSX.Element => {
  const baseStyle = "stroke-current fill-none stroke-2";

  switch (type) {
    case "resistor":
      return (
        <g className={baseStyle}>
          <path d="M0,0 L5,0 L7,-5 L11,5 L15,-5 L19,5 L23,-5 L27,5 L29,0 L34,0" />
        </g>
      );
    case "capacitor":
      return (
        <g className={baseStyle}>
          <line x1="0" y1="0" x2="14" y2="0" />
          <line x1="14" y1="-8" x2="14" y2="8" />
          <line x1="20" y1="-8" x2="20" y2="8" />
          <line x1="20" y1="0" x2="34" y2="0" />
        </g>
      );
    case "led":
      return (
        <g className={baseStyle}>
          <polygon points="10,0 24,8 24,-8" />
          <line x1="24" y1="-8" x2="24" y2="8" />
          <line x1="0" y1="0" x2="10" y2="0" />
          <line x1="24" y1="0" x2="34" y2="0" />
          <line x1="20" y1="-12" x2="28" y2="-20" />
          <line x1="24" y1="-12" x2="32" y2="-20" />
        </g>
      );
    case "mcu":
      return (
        <g className={baseStyle}>
          <rect x="0" y="-20" width="60" height="40" rx="2" />
          <text x="30" y="4" textAnchor="middle" fontSize="8" className="fill-current">MCU</text>
        </g>
      );
    case "opamp":
      return (
        <g className={baseStyle}>
          <polygon points="0,-20 40,0 0,20" />
          <line x1="-10" y1="-10" x2="0" y2="-10" />
          <line x1="-10" y1="10" x2="0" y2="10" />
          <line x1="40" y1="0" x2="50" y2="0" />
          <text x="8" y="-6" fontSize="8" className="fill-current">-</text>
          <text x="8" y="8" fontSize="8" className="fill-current">+</text>
        </g>
      );
    case "power":
      return (
        <g className={baseStyle}>
          <line x1="0" y1="0" x2="0" y2="10" />
          <line x1="-8" y1="0" x2="8" y2="0" />
          <text x="0" y="-4" textAnchor="middle" fontSize="8" className="fill-current">VCC</text>
        </g>
      );
    case "ground":
      return (
        <g className={baseStyle}>
          <line x1="0" y1="0" x2="0" y2="-10" />
          <line x1="-10" y1="0" x2="10" y2="0" />
          <line x1="-6" y1="4" x2="6" y2="4" />
          <line x1="-2" y1="8" x2="2" y2="8" />
        </g>
      );
    default:
      return (
        <g className={baseStyle}>
          <rect x="-15" y="-15" width="30" height="30" rx="2" />
          <text x="0" y="4" textAnchor="middle" fontSize="8" className="fill-current">
            {type.slice(0, 3).toUpperCase()}
          </text>
        </g>
      );
  }
};

const SchematicCanvas = ({
  nodes,
  wires,
  selectedNodeId,
  onSelectNode,
  onUpdateNode,
  onAddWire,
  onDropComponent,
  tool,
}: SchematicCanvasProps) => {
  const canvasRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [wireStart, setWireStart] = useState<{ nodeId: string; x: number; y: number } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const snapToGrid = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE;

  const screenToCanvas = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  }, [pan, zoom]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      // Middle click or Alt+click for panning
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      e.preventDefault();
    } else if (e.button === 0 && tool === "select") {
      // Left click on canvas - deselect
      onSelectNode(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    setMousePos(canvasPos);

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else if (draggingNode) {
      const snappedX = snapToGrid(canvasPos.x);
      const snappedY = snapToGrid(canvasPos.y);
      onUpdateNode(draggingNode, { x: snappedX, y: snappedY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNode(null);
    if (wireStart) {
      setWireStart(null);
    }
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    onSelectNode(nodeId);

    if (tool === "select") {
      setDraggingNode(nodeId);
    } else if (tool === "wire") {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        if (!wireStart) {
          setWireStart({ nodeId, x: node.x, y: node.y });
        } else if (wireStart.nodeId !== nodeId) {
          // Complete wire
          const newWire: SchematicWire = {
            id: `wire-${Date.now()}`,
            from_node: wireStart.nodeId,
            from_pin: "out",
            to_node: nodeId,
            to_pin: "in",
            points: [
              { x: wireStart.x, y: wireStart.y },
              { x: node.x, y: node.y },
            ],
          };
          onAddWire(newWire);
          setWireStart(null);
        }
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const componentData = e.dataTransfer.getData("component");
    if (componentData) {
      const component = JSON.parse(componentData);
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      onDropComponent(component.type, snapToGrid(canvasPos.x), snapToGrid(canvasPos.y));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.max(0.25, Math.min(4, prev * delta)));
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a1628]">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex gap-2 bg-card/90 backdrop-blur-sm rounded-lg p-2 border border-border">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setZoom((z) => Math.min(4, z * 1.2))}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <span className="flex items-center justify-center text-xs font-mono w-12">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setZoom((z) => Math.max(0.25, z / 1.2))}
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <div className="w-px h-8 bg-border" />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
        >
          <Maximize className="w-4 h-4" />
        </Button>
      </div>

      {/* Tool indicator */}
      <div className="absolute top-4 right-4 z-10 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-border">
        <div className="flex items-center gap-2 text-xs">
          {tool === "select" ? (
            <MousePointer className="w-4 h-4 text-primary" />
          ) : (
            <Minus className="w-4 h-4 text-primary" />
          )}
          <span className="capitalize">{tool} Mode</span>
        </div>
      </div>

      {/* Canvas */}
      <svg
        ref={canvasRef}
        width="100%"
        height="100%"
        className="cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {/* Grid */}
        <defs>
          <pattern
            id="grid"
            width={GRID_SIZE * zoom}
            height={GRID_SIZE * zoom}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${pan.x % (GRID_SIZE * zoom)}, ${pan.y % (GRID_SIZE * zoom)})`}
          >
            <circle cx={GRID_SIZE * zoom / 2} cy={GRID_SIZE * zoom / 2} r="1" fill="#1e3a5f" opacity="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Content group with pan and zoom */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Wires */}
          {wires.map((wire) => {
            const points = wire.points.map((p) => `${p.x},${p.y}`).join(" ");
            return (
              <polyline
                key={wire.id}
                points={points}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={2 / zoom}
                className="hover:stroke-primary"
              />
            );
          })}

          {/* Wire being drawn */}
          {wireStart && (
            <line
              x1={wireStart.x}
              y1={wireStart.y}
              x2={mousePos.x}
              y2={mousePos.y}
              stroke="#3b82f6"
              strokeWidth={2 / zoom}
              strokeDasharray="5,5"
            />
          )}

          {/* Nodes */}
          {nodes.map((node) => (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y}) rotate(${node.rotation})`}
              className={`cursor-pointer transition-colors ${
                selectedNodeId === node.id ? "text-primary" : "text-foreground"
              }`}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
            >
              {/* Selection highlight */}
              {selectedNodeId === node.id && (
                <rect
                  x="-25"
                  y="-25"
                  width="50"
                  height="50"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={2 / zoom}
                  strokeDasharray="4,4"
                  rx="4"
                />
              )}

              {/* Component symbol */}
              {getComponentSymbol(node.properties.type)}

              {/* Label */}
              <text
                x="0"
                y="25"
                textAnchor="middle"
                fontSize={10 / zoom}
                className="fill-muted-foreground pointer-events-none"
              >
                {node.properties.label}
                {node.properties.value && ` (${node.properties.value})`}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
};

export default SchematicCanvas;
export type { SchematicNode, SchematicWire };
