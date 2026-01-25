import { useState, useEffect, useCallback } from "react";

export interface CircuitAnalysis {
  id: string;
  timestamp: number;
  circuitInput: string;
  title: string;
  faultsCount: number;
  severity: "low" | "medium" | "high";
}

const STORAGE_KEY = "circuitsathi_history";
const MAX_HISTORY_ITEMS = 20;

export const useCircuitHistory = () => {
  const [history, setHistory] = useState<CircuitAnalysis[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load circuit history:", error);
    }
  }, []);

  // Save history to localStorage whenever it changes
  const saveToStorage = useCallback((items: CircuitAnalysis[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Failed to save circuit history:", error);
    }
  }, []);

  const addAnalysis = useCallback((circuitInput: string, faultsCount: number, severity: "low" | "medium" | "high") => {
    const newAnalysis: CircuitAnalysis = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      circuitInput,
      title: generateTitle(circuitInput),
      faultsCount,
      severity,
    };

    setHistory((prev) => {
      const updated = [newAnalysis, ...prev].slice(0, MAX_HISTORY_ITEMS);
      saveToStorage(updated);
      return updated;
    });

    return newAnalysis.id;
  }, [saveToStorage]);

  const removeAnalysis = useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const getAnalysis = useCallback((id: string) => {
    return history.find((item) => item.id === id);
  }, [history]);

  return {
    history,
    addAnalysis,
    removeAnalysis,
    clearHistory,
    getAnalysis,
  };
};

// Generate a short title from circuit input
function generateTitle(input: string): string {
  const lines = input.trim().split("\n");
  const firstMeaningfulLine = lines.find((line) => line.trim().length > 0) || "Untitled Circuit";
  
  // Look for component mentions
  const opAmpMatch = input.match(/OpAmp\s*[=:]\s*(\w+)/i);
  if (opAmpMatch) {
    return `${opAmpMatch[1]} Circuit`;
  }

  // Look for common circuit types
  if (input.toLowerCase().includes("amplifier")) return "Amplifier Circuit";
  if (input.toLowerCase().includes("filter")) return "Filter Circuit";
  if (input.toLowerCase().includes("oscillator")) return "Oscillator Circuit";
  if (input.toLowerCase().includes("regulator")) return "Voltage Regulator";

  // Truncate first line if needed
  return firstMeaningfulLine.length > 30 
    ? firstMeaningfulLine.substring(0, 27) + "..." 
    : firstMeaningfulLine;
}
