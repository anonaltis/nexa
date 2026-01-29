import { useState } from "react";
import Layout from "@/components/layout/Layout";
import CircuitInputPanel from "@/components/analyzer/CircuitInputPanel";
import CircuitHistoryPanel from "@/components/analyzer/CircuitHistoryPanel";
import ReasoningPanel from "@/components/analyzer/ReasoningPanel";
import FaultDetectionPanel from "@/components/analyzer/FaultDetectionPanel";
import CorrectionPanel from "@/components/analyzer/CorrectionPanel";
import LearningNotesPanel from "@/components/analyzer/LearningNotesPanel";
import { useCircuitHistory, CircuitAnalysis } from "@/hooks/useCircuitHistory";
import BodePlot from "@/components/analysis/BodePlot";
import TruthTable from "@/components/analysis/TruthTable";
import PowerAnalysis from "@/components/analysis/PowerAnalysis";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCircuitAnalysis } from "@/hooks/useCircuitAnalysis";

// Circuit type configurations
const CIRCUIT_ANALYSIS_CONFIGS: Record<string, any> = {
  rc_filter: {
    name: "RC Filter",
    bodeData: [
      { frequency: 1, magnitude_db: 0, phase_deg: -0.57 },
      { frequency: 10, magnitude_db: -0.04, phase_deg: -5.71 },
      { frequency: 100, magnitude_db: -3.01, phase_deg: -45 },
      { frequency: 200, magnitude_db: -6.99, phase_deg: -63.43 },
      { frequency: 500, magnitude_db: -13.98, phase_deg: -78.69 },
      { frequency: 1000, magnitude_db: -20, phase_deg: -84.29 },
      { frequency: 2000, magnitude_db: -26.02, phase_deg: -87.14 },
      { frequency: 5000, magnitude_db: -33.98, phase_deg: -88.85 },
      { frequency: 10000, magnitude_db: -40, phase_deg: -89.43 },
    ],
    cutoffFrequency: 100,
  },
  digital: {
    name: "Digital Logic",
    truthTables: {
      AND: {
        gate_type: "AND",
        num_inputs: 2,
        inputs: [[0, 0], [0, 1], [1, 0], [1, 1]],
        outputs: [0, 0, 0, 1],
      },
      OR: {
        gate_type: "OR",
        num_inputs: 2,
        inputs: [[0, 0], [0, 1], [1, 0], [1, 1]],
        outputs: [0, 1, 1, 1],
      },
      XOR: {
        gate_type: "XOR",
        num_inputs: 2,
        inputs: [[0, 0], [0, 1], [1, 0], [1, 1]],
        outputs: [0, 1, 1, 0],
      },
    },
  },
  power_supply: {
    name: "Power Supply",
    powerData: {
      input_voltage: 12,
      output_voltage: 5,
      output_current: 0.5,
      power_input: 6,
      power_output: 2.5,
      power_dissipation: 3.5,
      efficiency: 41.67,
      thermal_resistance: 50,
      temperature_rise: 175,
      junction_temperature: 200,
      regulator_type: "Linear",
    },
  },
};

const Analyzer = () => {
  const [detectedCircuitType, setDetectedCircuitType] = useState<string>("opamp");
  const { history, addAnalysis, removeAnalysis, clearHistory } = useCircuitHistory();
  const {
    analyze,
    isAnalyzing,
    analysisComplete,
    reasoningSteps,
    faults,
    corrections,
    expectedOutputs,
    learningNotes
  } = useCircuitAnalysis();

  const detectCircuitType = (input: string): string => {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes("filter") || lowerInput.includes("rc") || lowerInput.includes("capacitor")) return "rc_filter";
    if (lowerInput.includes("logic") || lowerInput.includes("gate") || lowerInput.includes("digital")) return "digital";
    if (lowerInput.includes("regulator") || lowerInput.includes("power supply")) return "power_supply";
    return "opamp";
  };

  const handleAnalyze = async (input: string) => {
    setDetectedCircuitType(detectCircuitType(input));
    try {
      const result = await analyze(input);
      const highestSeverity = result.detected_faults.length > 0 ? "high" : "low" as any;
      addAnalysis(input, result.detected_faults.length, highestSeverity);
    } catch (error) {
      console.error("Analysis failed", error);
    }
  };

  const handleSelectHistory = (analysis: CircuitAnalysis) => {
    handleAnalyze(analysis.circuitInput);
  };

  const renderCircuitTypeAnalysis = () => {
    const config = CIRCUIT_ANALYSIS_CONFIGS[detectedCircuitType];

    if (detectedCircuitType === "rc_filter" && config) {
      return (
        <div className="blueprint-card p-0 overflow-hidden border-primary/20 bg-background/50">
          <div className="bg-primary/10 px-4 py-3 border-b border-primary/20 flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Signal_Attenuation_Matrix</h3>
            <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground bg-primary/5 px-2 py-0.5 rounded border border-primary/10">RC_LOW_PASS</span>
          </div>
          <div className="p-8">
            <BodePlot data={config.bodeData} cutoffFrequency={config.cutoffFrequency} />
          </div>
        </div>
      );
    }

    if (detectedCircuitType === "digital" && config) {
      return (
        <div className="blueprint-card p-0 overflow-hidden border-primary/20 bg-background/50">
          <div className="bg-primary/10 px-4 py-3 border-b border-primary/20 flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Logic_State_Verification</h3>
            <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground bg-primary/5 px-2 py-0.5 rounded border border-primary/10">BINARY_ARRAY</span>
          </div>
          <div className="p-8">
            <Tabs defaultValue="AND" className="w-full">
              <TabsList className="grid grid-cols-3 w-full bg-primary/5 border border-primary/10 p-1 rounded-none">
                {Object.keys(config.truthTables).map((gate) => (
                  <TabsTrigger key={gate} value={gate} className="rounded-none text-[9px] font-bold uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    {gate}
                  </TabsTrigger>
                ))}
              </TabsList>
              {Object.entries(config.truthTables).map(([gate, data]) => (
                <TabsContent key={gate} value={gate} className="mt-6">
                  <TruthTable data={data as any} />
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      );
    }

    if (detectedCircuitType === "power_supply" && config) {
      return (
        <div className="blueprint-card p-0 overflow-hidden border-primary/20 bg-background/50">
          <div className="bg-primary/10 px-4 py-3 border-b border-primary/20 flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Power_Thermal_Metrics</h3>
            <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground bg-primary/5 px-2 py-0.5 rounded border border-primary/10">LINEAR_REG</span>
          </div>
          <div className="p-8">
            <PowerAnalysis data={config.powerData} />
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Layout>
      <div className="container max-w-6xl mx-auto px-4 py-12 space-y-8">
        {/* Header Module */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 blueprint-card border-primary/20 bg-primary/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-1 opacity-10">
            <span className="text-[8px] font-mono font-bold tracking-[0.5em] uppercase">SYSTEM_ANALYZER_CORE</span>
          </div>
          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <h1 className="text-3xl font-bold tracking-tighter uppercase">Logic Processor</h1>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] ml-5">
              System Initialization: Circuit Synthesis Environment
            </p>
          </div>
          <div className="flex items-center gap-6 relative z-10">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Global Status</span>
              <span className="text-xs font-bold text-success uppercase">Active / Sync_Ready</span>
            </div>
            <div className="h-10 w-px bg-primary/20" />
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Buffer_Load</span>
              <span className="text-xs font-bold text-primary uppercase">{history.length} Units</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content (9/12) */}
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <span className="h-0.5 w-4 bg-primary/40" />
                <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Synthesis_Injection</h2>
              </div>
              <CircuitInputPanel onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
            </div>

            {analysisComplete && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pt-8 border-t border-primary/10">
                <div className="flex items-center justify-center">
                  <div className="h-px w-8 bg-primary/40" />
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.5em] px-4">Analysis_Payload</span>
                  <div className="h-px w-8 bg-primary/40" />
                </div>

                {renderCircuitTypeAnalysis()}

                <div className="grid gap-8">
                  <ReasoningPanel steps={reasoningSteps} isVisible={analysisComplete} />
                  <FaultDetectionPanel faults={faults} isVisible={analysisComplete} />
                  <div className="grid md:grid-cols-2 gap-8">
                    <CorrectionPanel
                      corrections={corrections}
                      expectedOutputs={expectedOutputs}
                      isVisible={analysisComplete}
                    />
                    <LearningNotesPanel notes={learningNotes} isVisible={analysisComplete} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar (3/12) */}
          <div className="lg:col-span-4 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <span className="h-0.5 w-3 bg-primary/40" />
                <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Logic_Buffers</h2>
              </div>
              <CircuitHistoryPanel
                history={history}
                onSelect={handleSelectHistory}
                onRemove={removeAnalysis}
                onClear={clearHistory}
              />
            </div>

            <div className="blueprint-card p-6 border-primary/20 bg-primary/5 space-y-6">
              <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                System_Specs
              </h4>
              <div className="space-y-4">
                {[
                  { label: "PRECISION", val: "99.9%" },
                  { label: "LATENCY", val: "24MS" },
                  { label: "NODES", val: "DISTRIBUTED" },
                  { label: "KERNEL", val: "NEXA_V2" }
                ].map(spec => (
                  <div key={spec.label} className="flex justify-between items-center border-b border-primary/5 pb-2">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">{spec.label}</span>
                    <span className="text-[10px] font-mono font-bold text-primary">{spec.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Analyzer;
