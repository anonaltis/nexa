import { useRef, useCallback, useMemo } from "react";
import { PCBComponent, PCBTrace, PCBVia } from "@/hooks/usePCBEditor";

interface InteractivePCBRendererProps {
  components: PCBComponent[];
  traces: PCBTrace[];
  vias: PCBVia[];
  width?: number;
  height?: number;
  showGrid?: boolean;
  showLabels?: boolean;
  isEditMode?: boolean;
  selectedComponent?: string | null;
  routingState?: {
    isRouting: boolean;
    currentPoints: { x: number; y: number }[];
  };
  layers?: {
    top: boolean;
    bottom: boolean;
    silkscreen: boolean;
    traces: boolean;
  };
  onDragStart?: (componentId: string, clientX: number, clientY: number, svgX: number, svgY: number) => void;
  onDragMove?: (svgX: number, svgY: number) => void;
  onDragEnd?: () => void;
  onPinClick?: (componentId: string, pinId: string, x: number, y: number) => void;
  onCanvasClick?: (x: number, y: number) => void;
  onComponentSelect?: (componentId: string | null) => void;
}

const InteractivePCBRenderer = ({
  components,
  traces,
  vias,
  width = 450,
  height = 500,
  showGrid = true,
  showLabels = true,
  isEditMode = false,
  selectedComponent = null,
  routingState = { isRouting: false, currentPoints: [] },
  layers = { top: true, bottom: true, silkscreen: true, traces: true },
  onDragStart,
  onDragMove,
  onDragEnd,
  onPinClick,
  onCanvasClick,
  onComponentSelect,
}: InteractivePCBRendererProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const isDragging = useRef(false);

  const getSVGCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    return { x: svgP.x, y: svgP.y };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, componentId: string) => {
    if (!isEditMode) return;
    e.stopPropagation();
    isDragging.current = true;
    const { x, y } = getSVGCoordinates(e.clientX, e.clientY);
    onDragStart?.(componentId, e.clientX, e.clientY, x, y);
  }, [isEditMode, getSVGCoordinates, onDragStart]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !isEditMode) return;
    const { x, y } = getSVGCoordinates(e.clientX, e.clientY);
    onDragMove?.(x, y);
  }, [isEditMode, getSVGCoordinates, onDragMove]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    onDragEnd?.();
  }, [onDragEnd]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === svgRef.current) {
      onComponentSelect?.(null);
      if (routingState.isRouting) {
        const { x, y } = getSVGCoordinates(e.clientX, e.clientY);
        onCanvasClick?.(x, y);
      }
    }
  }, [getSVGCoordinates, onCanvasClick, onComponentSelect, routingState.isRouting]);

  const handlePinClick = useCallback((e: React.MouseEvent, componentId: string, pinId: string, x: number, y: number) => {
    if (!isEditMode) return;
    e.stopPropagation();
    onPinClick?.(componentId, pinId, x, y);
  }, [isEditMode, onPinClick]);

  const tracePaths = useMemo(() => {
    return traces.map((trace) => {
      if (trace.points.length < 2) return null;
      const pathData = trace.points
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
        .join(" ");
      return { ...trace, pathData };
    });
  }, [traces]);

  const routingPath = useMemo(() => {
    if (!routingState.isRouting || routingState.currentPoints.length === 0) return null;
    return routingState.currentPoints
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");
  }, [routingState]);

  // Generate pins for components
  const getComponentPins = (comp: PCBComponent) => {
    const pins: { id: string; x: number; y: number }[] = [];
    
    // Generate pins based on component type
    if (comp.type === "chip" || comp.type === "ic") {
      const pinsPerSide = Math.floor(comp.width / 12);
      for (let i = 0; i < pinsPerSide; i++) {
        pins.push({ id: `top-${i}`, x: comp.x + 10 + i * 12, y: comp.y - 2 });
        pins.push({ id: `bottom-${i}`, x: comp.x + 10 + i * 12, y: comp.y + comp.height + 2 });
      }
      const sidePins = Math.floor(comp.height / 12);
      for (let i = 0; i < sidePins; i++) {
        pins.push({ id: `left-${i}`, x: comp.x - 2, y: comp.y + 10 + i * 12 });
        pins.push({ id: `right-${i}`, x: comp.x + comp.width + 2, y: comp.y + 10 + i * 12 });
      }
    } else if (comp.type === "resistor" || comp.type === "crystal") {
      pins.push({ id: `left`, x: comp.x - 2, y: comp.y + comp.height / 2 });
      pins.push({ id: `right`, x: comp.x + comp.width + 2, y: comp.y + comp.height / 2 });
    } else if (comp.type === "capacitor") {
      pins.push({ id: `top`, x: comp.x + comp.width / 2, y: comp.y - 2 });
      pins.push({ id: `bottom`, x: comp.x + comp.width / 2, y: comp.y + comp.height + 2 });
    } else if (comp.type === "led") {
      pins.push({ id: `anode`, x: comp.x + comp.width / 2, y: comp.y - 2 });
      pins.push({ id: `cathode`, x: comp.x + comp.width / 2, y: comp.y + comp.height + 2 });
    } else if (comp.type === "transistor") {
      pins.push({ id: `base`, x: comp.x - 2, y: comp.y + comp.height / 2 });
      pins.push({ id: `collector`, x: comp.x + comp.width / 2, y: comp.y - 2 });
      pins.push({ id: `emitter`, x: comp.x + comp.width + 2, y: comp.y + comp.height / 2 });
    }
    
    return pins;
  };

  const renderComponent = (comp: PCBComponent) => {
    const isSelected = selectedComponent === comp.id;
    const rotation = comp.rotation || 0;
    const pins = getComponentPins(comp);
    
    return (
      <g 
        key={comp.id}
        transform={`rotate(${rotation}, ${comp.x + comp.width / 2}, ${comp.y + comp.height / 2})`}
        onMouseDown={(e) => handleMouseDown(e, comp.id)}
        onClick={(e) => {
          e.stopPropagation();
          onComponentSelect?.(comp.id);
        }}
        style={{ cursor: isEditMode ? "move" : "pointer" }}
      >
        {/* Selection highlight */}
        {isSelected && (
          <rect
            x={comp.x - 5}
            y={comp.y - 5}
            width={comp.width + 10}
            height={comp.height + 10}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            strokeDasharray="4 2"
            rx="4"
            className="animate-pulse"
          />
        )}
        
        {/* Component body based on type */}
        {renderComponentBody(comp)}
        
        {/* Interactive pins (only in edit mode) */}
        {isEditMode && pins.map((pin) => (
          <circle
            key={pin.id}
            cx={pin.x}
            cy={pin.y}
            r="4"
            fill={routingState.isRouting ? "hsl(var(--primary))" : "hsl(var(--pcb-pad))"}
            stroke="hsl(var(--primary))"
            strokeWidth="1"
            className="cursor-crosshair hover:fill-primary transition-colors"
            onClick={(e) => handlePinClick(e, comp.id, pin.id, pin.x, pin.y)}
          />
        ))}
      </g>
    );
  };

  const renderComponentBody = (comp: PCBComponent) => {
    switch (comp.type) {
      case "chip":
        return (
          <g transform={`translate(${comp.x}, ${comp.y})`}>
            <rect width={comp.width} height={comp.height} rx="3" fill="hsl(var(--pcb-chip))" stroke="hsl(var(--pcb-chip-stroke))" strokeWidth="1" />
            <rect x={comp.width * 0.1} y={comp.height * 0.15} width={comp.width * 0.8} height={comp.height * 0.7} rx="2" fill="hsl(var(--pcb-chip-inner))" stroke="hsl(var(--pcb-chip-stroke))" strokeWidth="0.5" />
            <circle cx={comp.width * 0.15} cy={comp.height * 0.85} r="3" fill="hsl(var(--pcb-trace))" opacity="0.5" />
            <text x={comp.width / 2} y={comp.height * 0.55} textAnchor="middle" fill="hsl(var(--pcb-text))" fontSize="10" fontWeight="bold" fontFamily="monospace">{comp.label}</text>
            {comp.sublabel && <text x={comp.width / 2} y={comp.height * 0.72} textAnchor="middle" fill="hsl(var(--pcb-text))" fontSize="7" fontFamily="monospace">{comp.sublabel}</text>}
            {[...Array(Math.floor(comp.width / 6))].map((_, i) => (
              <g key={`pin-${i}`}>
                <rect x={6 + i * 6} y={-4} width="3" height="5" fill="hsl(var(--pcb-pad))" />
                <rect x={6 + i * 6} y={comp.height - 1} width="3" height="5" fill="hsl(var(--pcb-pad))" />
              </g>
            ))}
            {[...Array(Math.floor(comp.height / 6))].map((_, i) => (
              <g key={`side-pin-${i}`}>
                <rect x={-4} y={6 + i * 6} width="5" height="3" fill="hsl(var(--pcb-pad))" />
                <rect x={comp.width - 1} y={6 + i * 6} width="5" height="3" fill="hsl(var(--pcb-pad))" />
              </g>
            ))}
          </g>
        );
      case "ic":
        return (
          <g transform={`translate(${comp.x}, ${comp.y})`}>
            <rect width={comp.width} height={comp.height} rx="2" fill="hsl(var(--pcb-ic))" stroke="hsl(var(--pcb-chip-stroke))" strokeWidth="1" />
            {[...Array(Math.floor(comp.width / 8))].map((_, i) => (
              <g key={`pin-${i}`}>
                <rect x={8 + i * 8} y={-3} width="4" height="4" fill="hsl(var(--pcb-pad))" />
                <rect x={8 + i * 8} y={comp.height - 1} width="4" height="4" fill="hsl(var(--pcb-pad))" />
              </g>
            ))}
            <text x={comp.width / 2} y={comp.height / 2 + 3} textAnchor="middle" fill="hsl(var(--pcb-silkscreen))" fontSize="8" fontFamily="monospace">{comp.label}</text>
          </g>
        );
      case "resistor":
        return (
          <g transform={`translate(${comp.x}, ${comp.y})`}>
            <rect width={comp.width} height={comp.height} rx="1" fill="hsl(var(--pcb-resistor))" stroke="hsl(var(--pcb-chip-stroke))" strokeWidth="0.5" />
            <rect x={-4} y={comp.height / 2 - 3} width="5" height="6" fill="hsl(var(--pcb-pad))" />
            <rect x={comp.width - 1} y={comp.height / 2 - 3} width="5" height="6" fill="hsl(var(--pcb-pad))" />
          </g>
        );
      case "capacitor":
        return (
          <g transform={`translate(${comp.x}, ${comp.y})`}>
            <rect width={comp.width} height={comp.height} rx="2" fill="hsl(var(--pcb-capacitor))" stroke="hsl(var(--pcb-chip-stroke))" strokeWidth="0.5" />
            <rect x={0} y={0} width={comp.width} height={4} fill="hsl(var(--pcb-chip-stroke))" opacity="0.5" />
            <rect x={comp.width / 2 - 3} y={-3} width="6" height="4" fill="hsl(var(--pcb-pad))" />
            <rect x={comp.width / 2 - 3} y={comp.height - 1} width="6" height="4" fill="hsl(var(--pcb-pad))" />
          </g>
        );
      case "led":
        return (
          <g transform={`translate(${comp.x}, ${comp.y})`}>
            <rect width={comp.width} height={comp.height} rx="1" fill="hsl(var(--pcb-led))" stroke="hsl(var(--pcb-chip-stroke))" strokeWidth="0.5" />
            <circle cx={comp.width / 2} cy={comp.height / 2} r={comp.width / 3} fill="hsl(var(--pcb-led-glow))" className="animate-pulse" />
          </g>
        );
      case "connector":
        return (
          <g transform={`translate(${comp.x}, ${comp.y})`}>
            <rect width={comp.width} height={comp.height} rx="3" fill="hsl(var(--pcb-connector))" stroke="hsl(var(--pcb-chip-stroke))" strokeWidth="1" />
            {[...Array(5)].map((_, i) => (
              <rect key={`cpin-${i}`} x={10 + i * 12} y={comp.height / 2 - 4} width="8" height="8" fill="hsl(var(--pcb-pad-inner))" stroke="hsl(var(--pcb-pad))" strokeWidth="2" />
            ))}
            <rect x={5} y={5} width={comp.width - 10} height={comp.height - 10} rx="2" fill="none" stroke="hsl(var(--pcb-chip-stroke))" strokeWidth="0.5" strokeDasharray="4 2" />
          </g>
        );
      case "header":
        return (
          <g transform={`translate(${comp.x}, ${comp.y})`}>
            <rect width={comp.width} height={comp.height} fill="hsl(var(--pcb-header))" stroke="hsl(var(--pcb-chip-stroke))" strokeWidth="1" />
            {[...Array(8)].map((_, i) => (
              <circle key={`hpin-${i}`} cx={comp.width / 2} cy={10 + i * 12} r="3" fill="hsl(var(--pcb-pad-inner))" stroke="hsl(var(--pcb-pad))" strokeWidth="2" />
            ))}
          </g>
        );
      case "crystal":
        return (
          <g transform={`translate(${comp.x}, ${comp.y})`}>
            <rect width={comp.width} height={comp.height} rx="2" fill="hsl(var(--pcb-crystal))" stroke="hsl(var(--pcb-chip-stroke))" strokeWidth="0.5" />
            <rect x={2} y={2} width={comp.width - 4} height={comp.height - 4} rx="1" fill="none" stroke="hsl(var(--pcb-pad))" strokeWidth="0.5" />
            <rect x={-3} y={comp.height / 2 - 2} width="4" height="4" fill="hsl(var(--pcb-pad))" />
            <rect x={comp.width - 1} y={comp.height / 2 - 2} width="4" height="4" fill="hsl(var(--pcb-pad))" />
          </g>
        );
      case "transistor":
        return (
          <g transform={`translate(${comp.x}, ${comp.y})`}>
            <circle cx={comp.width / 2} cy={comp.height / 2} r={comp.width / 2} fill="hsl(var(--pcb-transistor))" stroke="hsl(var(--pcb-chip-stroke))" strokeWidth="0.5" />
            <rect x={-2} y={comp.height / 2 - 2} width="3" height="4" fill="hsl(var(--pcb-pad))" />
            <rect x={comp.width / 2 - 1} y={-2} width="3" height="3" fill="hsl(var(--pcb-pad))" />
            <rect x={comp.width - 1} y={comp.height / 2 - 2} width="3" height="4" fill="hsl(var(--pcb-pad))" />
          </g>
        );
      default:
        return (
          <g transform={`translate(${comp.x}, ${comp.y})`}>
            <rect width={comp.width} height={comp.height} rx="2" fill="hsl(var(--pcb-ic))" stroke="hsl(var(--pcb-chip-stroke))" strokeWidth="1" />
            <text x={comp.width / 2} y={comp.height / 2 + 3} textAnchor="middle" fill="hsl(var(--pcb-silkscreen))" fontSize="8" fontFamily="monospace">{comp.label}</text>
          </g>
        );
    }
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full"
      style={{ backgroundColor: "hsl(var(--pcb-background))" }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
    >
      <defs>
        <pattern id="pcb-grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="hsl(var(--pcb-grid))" strokeWidth="0.3" opacity="0.4" />
        </pattern>
        <pattern id="pcb-grid-large" width="50" height="50" patternUnits="userSpaceOnUse">
          <rect width="50" height="50" fill="url(#pcb-grid)" />
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="hsl(var(--pcb-grid))" strokeWidth="0.5" opacity="0.6" />
        </pattern>
        <filter id="trace-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="via-gradient">
          <stop offset="0%" stopColor="hsl(var(--pcb-pad-inner))" />
          <stop offset="60%" stopColor="hsl(var(--pcb-pad))" />
          <stop offset="100%" stopColor="hsl(var(--pcb-pad))" stopOpacity="0.5" />
        </radialGradient>
      </defs>

      {/* Background with grid */}
      {showGrid && <rect width={width} height={height} fill="url(#pcb-grid-large)" />}

      {/* Board outline */}
      <rect x="20" y="20" width={width - 40} height={height - 40} rx="4" fill="none" stroke="hsl(var(--pcb-outline))" strokeWidth="2" />

      {/* Mounting holes */}
      {[
        { x: 35, y: 35 }, { x: width - 35, y: 35 },
        { x: 35, y: height - 35 }, { x: width - 35, y: height - 35 },
      ].map((hole, i) => (
        <g key={`mount-${i}`}>
          <circle cx={hole.x} cy={hole.y} r="8" fill="none" stroke="hsl(var(--pcb-pad))" strokeWidth="3" />
          <circle cx={hole.x} cy={hole.y} r="4" fill="hsl(var(--pcb-background))" />
        </g>
      ))}

      {/* Traces - bottom layer */}
      {layers.bottom && layers.traces && (
        <g opacity="0.6">
          {tracePaths.filter((t) => t && t.layer === "bottom").map((trace) =>
            trace ? (
              <path key={trace.id} d={trace.pathData} fill="none" stroke="hsl(var(--pcb-trace-bottom))" strokeWidth={trace.width || 2} strokeLinecap="round" strokeLinejoin="round" />
            ) : null
          )}
        </g>
      )}

      {/* Traces - top layer */}
      {layers.top && layers.traces && (
        <g filter="url(#trace-glow)">
          {tracePaths.filter((t) => t && t.layer !== "bottom").map((trace) =>
            trace ? (
              <path key={trace.id} d={trace.pathData} fill="none" stroke="hsl(var(--pcb-trace))" strokeWidth={trace.width || 2} strokeLinecap="round" strokeLinejoin="round" />
            ) : null
          )}
        </g>
      )}

      {/* Active routing preview */}
      {routingPath && (
        <path
          d={routingPath}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="5 3"
          className="animate-pulse"
        />
      )}

      {/* Vias */}
      {layers.top && layers.bottom && (
        <g>
          {vias.map((via, i) => {
            const size = via.size === "large" ? 6 : via.size === "medium" ? 4 : 3;
            return (
              <g key={`via-${i}`}>
                <circle cx={via.x} cy={via.y} r={size + 2} fill="url(#via-gradient)" />
                <circle cx={via.x} cy={via.y} r={size - 1} fill="hsl(var(--pcb-background))" />
              </g>
            );
          })}
        </g>
      )}

      {/* Components */}
      {layers.top && <g>{components.map((comp) => renderComponent(comp))}</g>}

      {/* Silkscreen labels */}
      {showLabels && layers.silkscreen && (
        <g>
          <text x={width - 80} y={height - 25} fill="hsl(var(--pcb-silkscreen))" fontSize="7" fontFamily="monospace">ElectroLab v1.0</text>
        </g>
      )}

      {/* Edit mode indicator */}
      {isEditMode && (
        <g>
          <rect x="25" y="25" width="60" height="18" rx="4" fill="hsl(var(--primary))" opacity="0.9" />
          <text x="55" y="37" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">EDIT MODE</text>
        </g>
      )}
    </svg>
  );
};

export default InteractivePCBRenderer;
