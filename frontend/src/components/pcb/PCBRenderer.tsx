import { useMemo } from "react";

interface PCBComponent {
  id: string;
  type: "chip" | "resistor" | "capacitor" | "led" | "connector" | "crystal" | "transistor" | "inductor" | "ic" | "header";
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  sublabel?: string;
  rotation?: number;
  pins?: { x: number; y: number }[];
}

interface PCBTrace {
  id: string;
  points: { x: number; y: number }[];
  width?: number;
  layer?: "top" | "bottom";
}

interface PCBVia {
  x: number;
  y: number;
  size?: "small" | "medium" | "large";
}

interface PCBRendererProps {
  components?: PCBComponent[];
  traces?: PCBTrace[];
  vias?: PCBVia[];
  width?: number;
  height?: number;
  showGrid?: boolean;
  showLabels?: boolean;
  layers?: {
    top: boolean;
    bottom: boolean;
    silkscreen: boolean;
    traces: boolean;
  };
}

// Default demo circuit - Smart Sensor Hub
const defaultComponents: PCBComponent[] = [
  // Main CPU
  { id: "cpu", type: "chip", x: 200, y: 180, width: 80, height: 80, label: "CPU", sublabel: "M:0302011", pins: [] },
  
  // Chip modules
  { id: "chip1", type: "ic", x: 300, y: 40, width: 100, height: 35, label: "Chip A02", pins: [] },
  { id: "chip2", type: "ic", x: 300, y: 440, width: 100, height: 35, label: "Chip A02", pins: [] },
  
  // Memory/peripheral chips
  { id: "ram1", type: "ic", x: 50, y: 60, width: 60, height: 25, label: "RAM", pins: [] },
  { id: "flash", type: "ic", x: 50, y: 380, width: 60, height: 25, label: "FLASH", pins: [] },
  
  // Connectors
  { id: "conn1", type: "connector", x: 30, y: 120, width: 80, height: 50, label: "J1", pins: [] },
  { id: "conn2", type: "connector", x: 30, y: 280, width: 80, height: 50, label: "J2", pins: [] },
  { id: "conn3", type: "header", x: 380, y: 120, width: 25, height: 100, label: "P1", pins: [] },
  
  // Passive components
  { id: "r1", type: "resistor", x: 150, y: 100, width: 30, height: 10, label: "R1", pins: [] },
  { id: "r2", type: "resistor", x: 150, y: 120, width: 30, height: 10, label: "R2", pins: [] },
  { id: "r3", type: "resistor", x: 150, y: 140, width: 30, height: 10, label: "R3", pins: [] },
  { id: "r4", type: "resistor", x: 290, y: 300, width: 30, height: 10, label: "R4", pins: [] },
  { id: "r5", type: "resistor", x: 290, y: 320, width: 30, height: 10, label: "R5", pins: [] },
  
  { id: "c1", type: "capacitor", x: 120, y: 200, width: 15, height: 25, label: "C1", pins: [] },
  { id: "c2", type: "capacitor", x: 120, y: 240, width: 15, height: 25, label: "C2", pins: [] },
  { id: "c3", type: "capacitor", x: 300, y: 200, width: 15, height: 25, label: "C3", pins: [] },
  { id: "c4", type: "capacitor", x: 300, y: 240, width: 15, height: 25, label: "C4", pins: [] },
  
  // LEDs
  { id: "led1", type: "led", x: 350, y: 180, width: 10, height: 10, label: "D1", pins: [] },
  { id: "led2", type: "led", x: 350, y: 200, width: 10, height: 10, label: "D2", pins: [] },
  { id: "led3", type: "led", x: 350, y: 220, width: 10, height: 10, label: "D3", pins: [] },
  
  // Crystal
  { id: "xtal", type: "crystal", x: 170, y: 280, width: 25, height: 12, label: "Y1", pins: [] },
  
  // Transistors
  { id: "q1", type: "transistor", x: 250, y: 350, width: 12, height: 12, label: "Q1", pins: [] },
  { id: "q2", type: "transistor", x: 270, y: 350, width: 12, height: 12, label: "Q2", pins: [] },
];

const defaultTraces: PCBTrace[] = [
  // Main bus traces from CPU
  { id: "t1", points: [{ x: 200, y: 220 }, { x: 150, y: 220 }, { x: 150, y: 300 }, { x: 100, y: 300 }], width: 2 },
  { id: "t2", points: [{ x: 280, y: 200 }, { x: 350, y: 200 }], width: 2 },
  { id: "t3", points: [{ x: 280, y: 220 }, { x: 310, y: 220 }, { x: 310, y: 180 }, { x: 350, y: 180 }], width: 2 },
  { id: "t4", points: [{ x: 240, y: 260 }, { x: 240, y: 350 }, { x: 250, y: 350 }], width: 2 },
  
  // Power traces
  { id: "t5", points: [{ x: 30, y: 450 }, { x: 420, y: 450 }], width: 4, layer: "bottom" },
  { id: "t6", points: [{ x: 30, y: 470 }, { x: 420, y: 470 }], width: 4, layer: "bottom" },
  
  // Signal traces
  { id: "t7", points: [{ x: 110, y: 140 }, { x: 140, y: 140 }, { x: 140, y: 160 }, { x: 200, y: 160 }], width: 1 },
  { id: "t8", points: [{ x: 110, y: 300 }, { x: 170, y: 300 }, { x: 170, y: 280 }], width: 1 },
  { id: "t9", points: [{ x: 180, y: 100 }, { x: 200, y: 100 }, { x: 200, y: 180 }], width: 1 },
  { id: "t10", points: [{ x: 300, y: 75 }, { x: 300, y: 120 }, { x: 280, y: 120 }, { x: 280, y: 180 }], width: 2 },
  { id: "t11", points: [{ x: 50, y: 85 }, { x: 50, y: 100 }, { x: 100, y: 100 }, { x: 100, y: 140 }], width: 1 },
  
  // More complex routing
  { id: "t12", points: [{ x: 320, y: 300 }, { x: 350, y: 300 }, { x: 350, y: 260 }], width: 1 },
  { id: "t13", points: [{ x: 320, y: 320 }, { x: 380, y: 320 }, { x: 380, y: 220 }], width: 1 },
  { id: "t14", points: [{ x: 135, y: 200 }, { x: 160, y: 200 }, { x: 160, y: 180 }, { x: 200, y: 180 }], width: 1 },
  { id: "t15", points: [{ x: 135, y: 240 }, { x: 160, y: 240 }, { x: 160, y: 260 }, { x: 200, y: 260 }], width: 1 },
];

const defaultVias: PCBVia[] = [
  { x: 100, y: 100, size: "small" },
  { x: 150, y: 300, size: "medium" },
  { x: 350, y: 260, size: "small" },
  { x: 350, y: 300, size: "small" },
  { x: 170, y: 280, size: "medium" },
  { x: 240, y: 130, size: "small" },
  { x: 300, y: 380, size: "small" },
  { x: 160, y: 180, size: "small" },
  { x: 160, y: 260, size: "small" },
  { x: 310, y: 180, size: "small" },
];

// Component rendering functions
const renderChip = (comp: PCBComponent) => (
  <g key={comp.id} transform={`translate(${comp.x}, ${comp.y})`}>
    {/* Chip body */}
    <rect
      width={comp.width}
      height={comp.height}
      rx="3"
      fill="hsl(var(--pcb-chip))"
      stroke="hsl(var(--pcb-chip-stroke))"
      strokeWidth="1"
    />
    {/* Chip marking */}
    <rect
      x={comp.width * 0.1}
      y={comp.height * 0.15}
      width={comp.width * 0.8}
      height={comp.height * 0.7}
      rx="2"
      fill="hsl(var(--pcb-chip-inner))"
      stroke="hsl(var(--pcb-chip-stroke))"
      strokeWidth="0.5"
    />
    {/* Pin 1 indicator */}
    <circle
      cx={comp.width * 0.15}
      cy={comp.height * 0.85}
      r="3"
      fill="hsl(var(--pcb-trace))"
      opacity="0.5"
    />
    {/* Labels */}
    <text
      x={comp.width / 2}
      y={comp.height * 0.4}
      textAnchor="middle"
      fill="hsl(var(--pcb-text))"
      fontSize="8"
      fontFamily="monospace"
    >
      {comp.sublabel ? "◈ 01021010" : ""}
    </text>
    <text
      x={comp.width / 2}
      y={comp.height * 0.55}
      textAnchor="middle"
      fill="hsl(var(--pcb-text))"
      fontSize="10"
      fontWeight="bold"
      fontFamily="monospace"
    >
      {comp.label}
    </text>
    {comp.sublabel && (
      <text
        x={comp.width / 2}
        y={comp.height * 0.72}
        textAnchor="middle"
        fill="hsl(var(--pcb-text))"
        fontSize="7"
        fontFamily="monospace"
      >
        {comp.sublabel}
      </text>
    )}
    {/* Pins */}
    {[...Array(Math.floor(comp.width / 6))].map((_, i) => (
      <g key={`pin-top-${i}`}>
        <rect x={6 + i * 6} y={-4} width="3" height="5" fill="hsl(var(--pcb-pad))" />
        <rect x={6 + i * 6} y={comp.height - 1} width="3" height="5" fill="hsl(var(--pcb-pad))" />
      </g>
    ))}
    {[...Array(Math.floor(comp.height / 6))].map((_, i) => (
      <g key={`pin-side-${i}`}>
        <rect x={-4} y={6 + i * 6} width="5" height="3" fill="hsl(var(--pcb-pad))" />
        <rect x={comp.width - 1} y={6 + i * 6} width="5" height="3" fill="hsl(var(--pcb-pad))" />
      </g>
    ))}
  </g>
);

const renderIC = (comp: PCBComponent) => (
  <g key={comp.id} transform={`translate(${comp.x}, ${comp.y})`}>
    <rect
      width={comp.width}
      height={comp.height}
      rx="2"
      fill="hsl(var(--pcb-ic))"
      stroke="hsl(var(--pcb-chip-stroke))"
      strokeWidth="1"
    />
    {/* IC pins on sides */}
    {[...Array(Math.floor(comp.width / 8))].map((_, i) => (
      <g key={`pin-${i}`}>
        <rect x={8 + i * 8} y={-3} width="4" height="4" fill="hsl(var(--pcb-pad))" />
        <rect x={8 + i * 8} y={comp.height - 1} width="4" height="4" fill="hsl(var(--pcb-pad))" />
      </g>
    ))}
    <text
      x={comp.width / 2}
      y={comp.height / 2 + 3}
      textAnchor="middle"
      fill="hsl(var(--pcb-silkscreen))"
      fontSize="8"
      fontFamily="monospace"
    >
      {comp.label}
    </text>
  </g>
);

const renderResistor = (comp: PCBComponent) => (
  <g key={comp.id} transform={`translate(${comp.x}, ${comp.y})`}>
    <rect
      width={comp.width}
      height={comp.height}
      rx="1"
      fill="hsl(var(--pcb-resistor))"
      stroke="hsl(var(--pcb-chip-stroke))"
      strokeWidth="0.5"
    />
    {/* Pads */}
    <rect x={-4} y={comp.height / 2 - 3} width="5" height="6" fill="hsl(var(--pcb-pad))" />
    <rect x={comp.width - 1} y={comp.height / 2 - 3} width="5" height="6" fill="hsl(var(--pcb-pad))" />
  </g>
);

const renderCapacitor = (comp: PCBComponent) => (
  <g key={comp.id} transform={`translate(${comp.x}, ${comp.y})`}>
    <rect
      width={comp.width}
      height={comp.height}
      rx="2"
      fill="hsl(var(--pcb-capacitor))"
      stroke="hsl(var(--pcb-chip-stroke))"
      strokeWidth="0.5"
    />
    {/* Marking stripe */}
    <rect
      x={0}
      y={0}
      width={comp.width}
      height={4}
      fill="hsl(var(--pcb-chip-stroke))"
      opacity="0.5"
    />
    {/* Pads */}
    <rect x={comp.width / 2 - 3} y={-3} width="6" height="4" fill="hsl(var(--pcb-pad))" />
    <rect x={comp.width / 2 - 3} y={comp.height - 1} width="6" height="4" fill="hsl(var(--pcb-pad))" />
  </g>
);

const renderLED = (comp: PCBComponent) => (
  <g key={comp.id} transform={`translate(${comp.x}, ${comp.y})`}>
    <rect
      width={comp.width}
      height={comp.height}
      rx="1"
      fill="hsl(var(--pcb-led))"
      stroke="hsl(var(--pcb-chip-stroke))"
      strokeWidth="0.5"
    />
    {/* LED glow effect */}
    <circle
      cx={comp.width / 2}
      cy={comp.height / 2}
      r={comp.width / 3}
      fill="hsl(var(--pcb-led-glow))"
      className="animate-pulse"
    />
  </g>
);

const renderConnector = (comp: PCBComponent) => (
  <g key={comp.id} transform={`translate(${comp.x}, ${comp.y})`}>
    <rect
      width={comp.width}
      height={comp.height}
      rx="3"
      fill="hsl(var(--pcb-connector))"
      stroke="hsl(var(--pcb-chip-stroke))"
      strokeWidth="1"
    />
    {/* Connector pins */}
    {[...Array(5)].map((_, i) => (
      <rect
        key={`cpin-${i}`}
        x={10 + i * 12}
        y={comp.height / 2 - 4}
        width="8"
        height="8"
        fill="hsl(var(--pcb-pad-inner))"
        stroke="hsl(var(--pcb-pad))"
        strokeWidth="2"
      />
    ))}
    {/* Metal housing */}
    <rect
      x={5}
      y={5}
      width={comp.width - 10}
      height={comp.height - 10}
      rx="2"
      fill="none"
      stroke="hsl(var(--pcb-chip-stroke))"
      strokeWidth="0.5"
      strokeDasharray="4 2"
    />
  </g>
);

const renderHeader = (comp: PCBComponent) => (
  <g key={comp.id} transform={`translate(${comp.x}, ${comp.y})`}>
    <rect
      width={comp.width}
      height={comp.height}
      fill="hsl(var(--pcb-header))"
      stroke="hsl(var(--pcb-chip-stroke))"
      strokeWidth="1"
    />
    {/* Header pins */}
    {[...Array(8)].map((_, i) => (
      <circle
        key={`hpin-${i}`}
        cx={comp.width / 2}
        cy={10 + i * 12}
        r="3"
        fill="hsl(var(--pcb-pad-inner))"
        stroke="hsl(var(--pcb-pad))"
        strokeWidth="2"
      />
    ))}
  </g>
);

const renderCrystal = (comp: PCBComponent) => (
  <g key={comp.id} transform={`translate(${comp.x}, ${comp.y})`}>
    <rect
      width={comp.width}
      height={comp.height}
      rx="2"
      fill="hsl(var(--pcb-crystal))"
      stroke="hsl(var(--pcb-chip-stroke))"
      strokeWidth="0.5"
    />
    {/* Crystal casing */}
    <rect
      x={2}
      y={2}
      width={comp.width - 4}
      height={comp.height - 4}
      rx="1"
      fill="none"
      stroke="hsl(var(--pcb-pad))"
      strokeWidth="0.5"
    />
    {/* Pads */}
    <rect x={-3} y={comp.height / 2 - 2} width="4" height="4" fill="hsl(var(--pcb-pad))" />
    <rect x={comp.width - 1} y={comp.height / 2 - 2} width="4" height="4" fill="hsl(var(--pcb-pad))" />
  </g>
);

const renderTransistor = (comp: PCBComponent) => (
  <g key={comp.id} transform={`translate(${comp.x}, ${comp.y})`}>
    <circle
      cx={comp.width / 2}
      cy={comp.height / 2}
      r={comp.width / 2}
      fill="hsl(var(--pcb-transistor))"
      stroke="hsl(var(--pcb-chip-stroke))"
      strokeWidth="0.5"
    />
    {/* 3 pads */}
    <rect x={-2} y={comp.height / 2 - 2} width="3" height="4" fill="hsl(var(--pcb-pad))" />
    <rect x={comp.width / 2 - 1} y={-2} width="3" height="3" fill="hsl(var(--pcb-pad))" />
    <rect x={comp.width - 1} y={comp.height / 2 - 2} width="3" height="4" fill="hsl(var(--pcb-pad))" />
  </g>
);

const renderComponent = (comp: PCBComponent) => {
  switch (comp.type) {
    case "chip": return renderChip(comp);
    case "ic": return renderIC(comp);
    case "resistor": return renderResistor(comp);
    case "capacitor": return renderCapacitor(comp);
    case "led": return renderLED(comp);
    case "connector": return renderConnector(comp);
    case "header": return renderHeader(comp);
    case "crystal": return renderCrystal(comp);
    case "transistor": return renderTransistor(comp);
    default: return renderIC(comp);
  }
};

const PCBRenderer = ({
  components = defaultComponents,
  traces = defaultTraces,
  vias = defaultVias,
  width = 450,
  height = 500,
  showGrid = true,
  showLabels = true,
  layers = { top: true, bottom: true, silkscreen: true, traces: true },
}: PCBRendererProps) => {
  const tracePaths = useMemo(() => {
    return traces.map((trace) => {
      if (trace.points.length < 2) return null;
      const pathData = trace.points
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
        .join(" ");
      return { ...trace, pathData };
    });
  }, [traces]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full"
      style={{ backgroundColor: "hsl(var(--pcb-background))" }}
    >
      <defs>
        {/* Grid pattern */}
        <pattern id="pcb-grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path
            d="M 10 0 L 0 0 0 10"
            fill="none"
            stroke="hsl(var(--pcb-grid))"
            strokeWidth="0.3"
            opacity="0.4"
          />
        </pattern>
        
        {/* Larger grid */}
        <pattern id="pcb-grid-large" width="50" height="50" patternUnits="userSpaceOnUse">
          <rect width="50" height="50" fill="url(#pcb-grid)" />
          <path
            d="M 50 0 L 0 0 0 50"
            fill="none"
            stroke="hsl(var(--pcb-grid))"
            strokeWidth="0.5"
            opacity="0.6"
          />
        </pattern>

        {/* Glow filter for traces */}
        <filter id="trace-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Via gradient */}
        <radialGradient id="via-gradient">
          <stop offset="0%" stopColor="hsl(var(--pcb-pad-inner))" />
          <stop offset="60%" stopColor="hsl(var(--pcb-pad))" />
          <stop offset="100%" stopColor="hsl(var(--pcb-pad))" stopOpacity="0.5" />
        </radialGradient>
      </defs>

      {/* Background with grid */}
      {showGrid && (
        <rect width={width} height={height} fill="url(#pcb-grid-large)" />
      )}

      {/* Board outline */}
      <rect
        x="20"
        y="20"
        width={width - 40}
        height={height - 40}
        rx="4"
        fill="none"
        stroke="hsl(var(--pcb-outline))"
        strokeWidth="2"
      />

      {/* Mounting holes */}
      {[
        { x: 35, y: 35 },
        { x: width - 35, y: 35 },
        { x: 35, y: height - 35 },
        { x: width - 35, y: height - 35 },
      ].map((hole, i) => (
        <g key={`mount-${i}`}>
          <circle cx={hole.x} cy={hole.y} r="8" fill="none" stroke="hsl(var(--pcb-pad))" strokeWidth="3" />
          <circle cx={hole.x} cy={hole.y} r="4" fill="hsl(var(--pcb-background))" />
        </g>
      ))}

      {/* Traces - bottom layer */}
      {layers.bottom && layers.traces && (
        <g opacity="0.6">
          {tracePaths
            .filter((t) => t && t.layer === "bottom")
            .map((trace) =>
              trace ? (
                <path
                  key={trace.id}
                  d={trace.pathData}
                  fill="none"
                  stroke="hsl(var(--pcb-trace-bottom))"
                  strokeWidth={trace.width || 2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null
            )}
        </g>
      )}

      {/* Traces - top layer */}
      {layers.top && layers.traces && (
        <g filter="url(#trace-glow)">
          {tracePaths
            .filter((t) => t && t.layer !== "bottom")
            .map((trace) =>
              trace ? (
                <path
                  key={trace.id}
                  d={trace.pathData}
                  fill="none"
                  stroke="hsl(var(--pcb-trace))"
                  strokeWidth={trace.width || 2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null
            )}
        </g>
      )}

      {/* Vias */}
      {layers.top && layers.bottom && (
        <g>
          {vias.map((via, i) => {
            const size = via.size === "large" ? 6 : via.size === "medium" ? 4 : 3;
            return (
              <g key={`via-${i}`}>
                <circle
                  cx={via.x}
                  cy={via.y}
                  r={size + 2}
                  fill="url(#via-gradient)"
                />
                <circle
                  cx={via.x}
                  cy={via.y}
                  r={size - 1}
                  fill="hsl(var(--pcb-background))"
                />
              </g>
            );
          })}
        </g>
      )}

      {/* Components */}
      {layers.top && (
        <g>
          {components.map((comp) => renderComponent(comp))}
        </g>
      )}

      {/* Silkscreen labels */}
      {showLabels && layers.silkscreen && (
        <g>
          <text x="370" y="32" fill="hsl(var(--pcb-silkscreen))" fontSize="9" fontFamily="monospace">
            Chip A02
          </text>
          <text x="350" y="190" fill="hsl(var(--pcb-silkscreen))" fontSize="6" fontFamily="monospace">
            KKD
          </text>
          <text x="350" y="230" fill="hsl(var(--pcb-silkscreen))" fontSize="6" fontFamily="monospace">
            LVL02
          </text>
          <text x="360" y="315" fill="hsl(var(--pcb-silkscreen))" fontSize="6" fontFamily="monospace">
            01K
          </text>
          <text x="60" y="360" fill="hsl(var(--pcb-silkscreen))" fontSize="6" fontFamily="monospace">
            0102
          </text>
          <text x="60" y="370" fill="hsl(var(--pcb-silkscreen))" fontSize="6" fontFamily="monospace">
            PPK
          </text>
          <text x="370" y="452" fill="hsl(var(--pcb-silkscreen))" fontSize="9" fontFamily="monospace">
            Chip A02
          </text>
          <text x={width - 80} y={height - 25} fill="hsl(var(--pcb-silkscreen))" fontSize="7" fontFamily="monospace">
            ElectroLab v1.0
          </text>
        </g>
      )}

      {/* Random decorative dots (test points) */}
      {[
        { x: 90, y: 250 }, { x: 95, y: 260 }, { x: 100, y: 255 },
        { x: 330, y: 280 }, { x: 335, y: 290 }, { x: 340, y: 275 },
        { x: 190, y: 380 }, { x: 200, y: 385 }, { x: 195, y: 375 },
      ].map((dot, i) => (
        <circle
          key={`dot-${i}`}
          cx={dot.x}
          cy={dot.y}
          r="3"
          fill="hsl(var(--pcb-led-glow))"
          opacity="0.6"
        />
      ))}
    </svg>
  );
};

export default PCBRenderer;
