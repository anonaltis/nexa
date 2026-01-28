import { useState, useCallback, useRef } from "react";

export interface PCBComponent {
  id: string;
  type: "chip" | "resistor" | "capacitor" | "led" | "connector" | "crystal" | "transistor" | "inductor" | "ic" | "header";
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  sublabel?: string;
  rotation?: number;
  pins: { id: string; x: number; y: number; side: "top" | "bottom" | "left" | "right" }[];
}

export interface PCBTrace {
  id: string;
  points: { x: number; y: number }[];
  width?: number;
  layer?: "top" | "bottom";
  fromPin?: { componentId: string; pinId: string };
  toPin?: { componentId: string; pinId: string };
}

export interface PCBVia {
  x: number;
  y: number;
  size?: "small" | "medium" | "large";
}

interface DragState {
  componentId: string | null;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

interface RoutingState {
  isRouting: boolean;
  fromComponent: string | null;
  fromPin: string | null;
  currentPoints: { x: number; y: number }[];
}

export const usePCBEditor = (
  initialComponents: PCBComponent[],
  initialTraces: PCBTrace[],
  initialVias: PCBVia[]
) => {
  const [components, setComponents] = useState<PCBComponent[]>(initialComponents);
  const [traces, setTraces] = useState<PCBTrace[]>(initialTraces);
  const [vias, setVias] = useState<PCBVia[]>(initialVias);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const dragState = useRef<DragState>({
    componentId: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
  });

  const [routingState, setRoutingState] = useState<RoutingState>({
    isRouting: false,
    fromComponent: null,
    fromPin: null,
    currentPoints: [],
  });

  // Drag handlers
  const handleDragStart = useCallback((componentId: string, clientX: number, clientY: number, svgX: number, svgY: number) => {
    if (!isEditMode) return;
    
    const component = components.find(c => c.id === componentId);
    if (!component) return;

    dragState.current = {
      componentId,
      startX: clientX,
      startY: clientY,
      offsetX: svgX - component.x,
      offsetY: svgY - component.y,
    };
    setSelectedComponent(componentId);
  }, [components, isEditMode]);

  const handleDragMove = useCallback((svgX: number, svgY: number) => {
    if (!dragState.current.componentId || !isEditMode) return;

    const newX = Math.max(30, Math.min(400, svgX - dragState.current.offsetX));
    const newY = Math.max(30, Math.min(450, svgY - dragState.current.offsetY));

    // Snap to grid (10px)
    const snappedX = Math.round(newX / 10) * 10;
    const snappedY = Math.round(newY / 10) * 10;

    setComponents(prev => 
      prev.map(c => 
        c.id === dragState.current.componentId 
          ? { ...c, x: snappedX, y: snappedY }
          : c
      )
    );

    // Update traces connected to this component
    updateTracesForComponent(dragState.current.componentId, snappedX, snappedY);
  }, [isEditMode]);

  const handleDragEnd = useCallback(() => {
    dragState.current.componentId = null;
  }, []);

  // Update traces when component moves
  const updateTracesForComponent = useCallback((componentId: string, newX: number, newY: number) => {
    setTraces(prev => 
      prev.map(trace => {
        if (trace.fromPin?.componentId === componentId || trace.toPin?.componentId === componentId) {
          // Recalculate trace points based on new component position
          const component = components.find(c => c.id === componentId);
          if (!component) return trace;
          
          const updatedPoints = [...trace.points];
          if (trace.fromPin?.componentId === componentId && updatedPoints.length > 0) {
            updatedPoints[0] = { x: newX + component.width / 2, y: newY + component.height / 2 };
          }
          if (trace.toPin?.componentId === componentId && updatedPoints.length > 1) {
            updatedPoints[updatedPoints.length - 1] = { x: newX + component.width / 2, y: newY + component.height / 2 };
          }
          return { ...trace, points: updatedPoints };
        }
        return trace;
      })
    );
  }, [components]);

  // Trace routing handlers
  const startRouting = useCallback((componentId: string, pinId: string, x: number, y: number) => {
    if (!isEditMode) return;
    
    setRoutingState({
      isRouting: true,
      fromComponent: componentId,
      fromPin: pinId,
      currentPoints: [{ x, y }],
    });
  }, [isEditMode]);

  const addRoutingPoint = useCallback((x: number, y: number) => {
    if (!routingState.isRouting) return;

    // Snap to grid
    const snappedX = Math.round(x / 10) * 10;
    const snappedY = Math.round(y / 10) * 10;

    setRoutingState(prev => ({
      ...prev,
      currentPoints: [...prev.currentPoints, { x: snappedX, y: snappedY }],
    }));
  }, [routingState.isRouting]);

  const completeRouting = useCallback((toComponentId: string, toPinId: string, x: number, y: number) => {
    if (!routingState.isRouting || !routingState.fromComponent) return;

    const newTrace: PCBTrace = {
      id: `trace-${Date.now()}`,
      points: [...routingState.currentPoints, { x, y }],
      width: 2,
      layer: "top",
      fromPin: { componentId: routingState.fromComponent, pinId: routingState.fromPin! },
      toPin: { componentId: toComponentId, pinId: toPinId },
    };

    setTraces(prev => [...prev, newTrace]);
    cancelRouting();
  }, [routingState]);

  const cancelRouting = useCallback(() => {
    setRoutingState({
      isRouting: false,
      fromComponent: null,
      fromPin: null,
      currentPoints: [],
    });
  }, []);

  // Delete selected component
  const deleteSelectedComponent = useCallback(() => {
    if (!selectedComponent) return;
    
    setComponents(prev => prev.filter(c => c.id !== selectedComponent));
    setTraces(prev => prev.filter(t => 
      t.fromPin?.componentId !== selectedComponent && 
      t.toPin?.componentId !== selectedComponent
    ));
    setSelectedComponent(null);
  }, [selectedComponent]);

  // Rotate selected component
  const rotateSelectedComponent = useCallback(() => {
    if (!selectedComponent) return;
    
    setComponents(prev => 
      prev.map(c => 
        c.id === selectedComponent 
          ? { ...c, rotation: ((c.rotation || 0) + 90) % 360 }
          : c
      )
    );
  }, [selectedComponent]);

  // Delete trace
  const deleteTrace = useCallback((traceId: string) => {
    setTraces(prev => prev.filter(t => t.id !== traceId));
  }, []);

  // Add new via
  const addVia = useCallback((x: number, y: number) => {
    if (!isEditMode) return;
    
    const snappedX = Math.round(x / 10) * 10;
    const snappedY = Math.round(y / 10) * 10;
    
    setVias(prev => [...prev, { x: snappedX, y: snappedY, size: "small" }]);
  }, [isEditMode]);

  return {
    components,
    traces,
    vias,
    selectedComponent,
    isEditMode,
    routingState,
    setIsEditMode,
    setSelectedComponent,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    startRouting,
    addRoutingPoint,
    completeRouting,
    cancelRouting,
    deleteSelectedComponent,
    rotateSelectedComponent,
    deleteTrace,
    addVia,
    setComponents,
    setTraces,
  };
};
