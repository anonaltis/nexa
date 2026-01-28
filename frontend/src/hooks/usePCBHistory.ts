import { useState, useCallback, useRef } from "react";
import { PCBComponent, PCBTrace, PCBVia } from "@/hooks/usePCBEditor";

interface PCBState {
  components: PCBComponent[];
  traces: PCBTrace[];
  vias: PCBVia[];
}

interface UsePCBHistoryReturn {
  pushState: (state: PCBState) => void;
  undo: () => PCBState | null;
  redo: () => PCBState | null;
  canUndo: boolean;
  canRedo: boolean;
  historyLength: number;
  currentIndex: number;
}

const MAX_HISTORY_SIZE = 50;

export const usePCBHistory = (initialState: PCBState): UsePCBHistoryReturn => {
  const [history, setHistory] = useState<PCBState[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isUpdating = useRef(false);

  const pushState = useCallback((state: PCBState) => {
    if (isUpdating.current) return;

    setHistory(prev => {
      // Remove any future states if we're not at the end
      const newHistory = prev.slice(0, currentIndex + 1);
      
      // Add new state
      newHistory.push({
        components: JSON.parse(JSON.stringify(state.components)),
        traces: JSON.parse(JSON.stringify(state.traces)),
        vias: JSON.parse(JSON.stringify(state.vias)),
      });

      // Limit history size
      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory.shift();
        return newHistory;
      }

      return newHistory;
    });

    setCurrentIndex(prev => Math.min(prev + 1, MAX_HISTORY_SIZE - 1));
  }, [currentIndex]);

  const undo = useCallback((): PCBState | null => {
    if (currentIndex <= 0) return null;

    isUpdating.current = true;
    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    
    setTimeout(() => {
      isUpdating.current = false;
    }, 0);

    return history[newIndex];
  }, [currentIndex, history]);

  const redo = useCallback((): PCBState | null => {
    if (currentIndex >= history.length - 1) return null;

    isUpdating.current = true;
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    
    setTimeout(() => {
      isUpdating.current = false;
    }, 0);

    return history[newIndex];
  }, [currentIndex, history]);

  return {
    pushState,
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
    historyLength: history.length,
    currentIndex,
  };
};
