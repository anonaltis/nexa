import { useState } from "react";
import Layout from "@/components/layout/Layout";
import CircuitInputPanel from "@/components/CircuitInputPanel";
import CircuitHistoryPanel from "@/components/CircuitHistoryPanel";
import ReasoningPanel from "@/components/ReasoningPanel";
import FaultDetectionPanel from "@/components/FaultDetectionPanel";
import CorrectionPanel from "@/components/CorrectionPanel";
import LearningNotesPanel from "@/components/LearningNotesPanel";
import { useCircuitHistory, CircuitAnalysis } from "@/hooks/useCircuitHistory";
import BodePlot from "@/components/analysis/BodePlot";
import TruthTable from "@/components/analysis/TruthTable";
import PowerAnalysis from "@/components/analysis/PowerAnalysis";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Activity, Zap, Binary, Filter } from "lucide-react";

// Circuit type configurations
const CIRCUIT_ANALYSIS_CONFIGS: Record<string, any> = {
  rc_filter: {
    name: "RC Filter",
    icon: Filter,
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
    icon: Binary,
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
      NAND: {
        gate_type: "NAND",
        num_inputs: 2,
        inputs: [[0, 0], [0, 1], [1, 0], [1, 1]],
        outputs: [1, 1, 1, 0],
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
    icon: Zap,
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

// Mock data for OpAmp analysis
const mockReasoningSteps = [
  {
    id: 1,
    title: "Parse Circuit Topology",
    explanation: "Identifying components: OpAmp LM358, R1 (1kΩ), R2 (10kΩ). Detected non-inverting amplifier configuration with feedback resistor.",
    icon: "analyze" as const,
  },
  {
    id: 2,
    title: "Calculate Gain",
    explanation: "For non-inverting amplifier: Gain = 1 + (Rf/Rin) = 1 + (10kΩ/1kΩ) = 11. This amplification factor will be applied to input signal.",
    icon: "calculate" as const,
  },
  {
    id: 3,
    title: "Apply KVL Analysis",
    explanation: "Checking voltage loop constraints. With ±5V supply, output swing is limited to approximately ±3.5V due to LM358 output characteristics.",
    icon: "logic" as const,
  },
  {
    id: 4,
    title: "Evaluate Output Range",
    explanation: "With Gain=11 and Vin_max=0.5V, expected Vout_peak = 5.5V. This exceeds supply rail, indicating potential saturation condition.",
    icon: "insight" as const,
  },
];

const mockFaults = [
  {
    id: "fault-1",
    name: "Output Saturation",
    reason: "Output voltage (5.5V) exceeds the positive supply rail (+5V). The OpAmp will clip at approximately +3.5V.",
    severity: "high" as const,
  },
  {
    id: "fault-2",
    name: "Excessive Gain",
    reason: "Gain of 11 is too high for the given input signal range. Consider reducing R2 or increasing R1.",
    severity: "medium" as const,
  },
  {
    id: "fault-3",
    name: "Missing Bypass Capacitor",
    reason: "No decoupling capacitor detected on power supply pins. May cause oscillation or noise issues.",
    severity: "low" as const,
  },
];

const mockCorrections = [
  {
    id: "fix-1",
    description: "Reduce feedback resistor R2 to limit gain and prevent saturation",
    originalValue: "R2 = 10kΩ",
    correctedValue: "R2 = 4.7kΩ",
  },
  {
    id: "fix-2",
    description: "Add 100nF ceramic bypass capacitors between each supply pin and ground",
  },
  {
    id: "fix-3",
    description: "Limit input signal amplitude to stay within linear operating region",
    originalValue: "Vin_max = 0.5V",
    correctedValue: "Vin_max = 0.3V",
  },
];

const mockExpectedOutputs = [
  { parameter: "Corrected Gain", value: "5.7", unit: "" },
  { parameter: "Max Output Voltage", value: "1.71", unit: "V" },
  { parameter: "Bandwidth (-3dB)", value: "175", unit: "kHz" },
  { parameter: "Slew Rate", value: "0.5", unit: "V/μs" },
];

const mockLearningNotes = [
  {
    id: "note-1",
    concept: "Non-Inverting Amplifier Gain",
    explanation: "The gain of a non-inverting amplifier is always greater than 1 and is determined by the ratio of the feedback resistor to the input resistor, plus one.",
    formula: "Gain = 1 + (Rf / Rin)",
  },
  {
    id: "note-2",
    concept: "Output Saturation",
    explanation: "When the calculated output voltage exceeds the supply rails, the OpAmp enters saturation. The actual output will be limited to approximately 1-2V below the supply voltage for most general-purpose OpAmps.",
  },
  {
    id: "note-3",
    concept: "Power Supply Decoupling",
    explanation: "Bypass capacitors (typically 100nF ceramic) placed close to the IC power pins filter high-frequency noise and prevent oscillations caused by power supply impedance.",
    formula: "C_bypass ≈ 100nF (ceramic)",
  },
  {
    id: "note-4",
    concept: "Gain-Bandwidth Product",
    explanation: "OpAmps have a constant gain-bandwidth product (GBW). Higher gain means lower bandwidth. For LM358, GBW ≈ 1MHz, so at Gain=11, bandwidth ≈ 90kHz.",
    formula: "BW = GBW / Gain",
  },
];

const Analyzer = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [currentCircuitInput, setCurrentCircuitInput] = useState("");
  const [detectedCircuitType, setDetectedCircuitType] = useState<string>("opamp");
  const { history, addAnalysis, removeAnalysis, clearHistory } = useCircuitHistory();

  const detectCircuitType = (input: string): string => {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes("filter") || lowerInput.includes("rc") || lowerInput.includes("capacitor")) {
      return "rc_filter";
    }
    if (lowerInput.includes("logic") || lowerInput.includes("gate") || lowerInput.includes("digital") || lowerInput.includes("and") || lowerInput.includes("or") || lowerInput.includes("nand")) {
      return "digital";
    }
    if (lowerInput.includes("regulator") || lowerInput.includes("power supply") || lowerInput.includes("7805") || lowerInput.includes("ldo")) {
      return "power_supply";
    }
    return "opamp";
  };

  const handleAnalyze = (input: string) => {
    console.log("Analyzing circuit:", input);
    setCurrentCircuitInput(input);
    setIsAnalyzing(true);
    setAnalysisComplete(false);

    // Detect circuit type from input
    const circuitType = detectCircuitType(input);
    setDetectedCircuitType(circuitType);

    // Simulate analysis delay
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisComplete(true);

      // Determine highest severity from mock faults
      const highestSeverity = mockFaults.reduce((max, fault) => {
        const order = { low: 0, medium: 1, high: 2 };
        return order[fault.severity] > order[max] ? fault.severity : max;
      }, "low" as "low" | "medium" | "high");

      // Save to history
      addAnalysis(input, mockFaults.length, highestSeverity);
    }, 2000);
  };

  const handleSelectHistory = (analysis: CircuitAnalysis) => {
    handleAnalyze(analysis.circuitInput);
  };

  const renderCircuitTypeAnalysis = () => {
    const config = CIRCUIT_ANALYSIS_CONFIGS[detectedCircuitType];

    if (detectedCircuitType === "rc_filter" && config) {
      return (
        <div className="blueprint-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Filter Analysis</h3>
            <Badge variant="outline" className="ml-auto">RC Low-Pass</Badge>
          </div>
          <BodePlot
            data={config.bodeData}
            cutoffFrequency={config.cutoffFrequency}
          />
        </div>
      );
    }

    if (detectedCircuitType === "digital" && config) {
      return (
        <div className="blueprint-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Binary className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Digital Logic Analysis</h3>
          </div>
          <Tabs defaultValue="AND" className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              {Object.keys(config.truthTables).map((gate) => (
                <TabsTrigger key={gate} value={gate}>{gate}</TabsTrigger>
              ))}
            </TabsList>
            {Object.entries(config.truthTables).map(([gate, data]) => (
              <TabsContent key={gate} value={gate}>
                <TruthTable data={data as any} />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      );
    }

    if (detectedCircuitType === "power_supply" && config) {
      return (
        <div className="blueprint-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Power Supply Analysis</h3>
            <Badge variant="outline" className="ml-auto">Linear Regulator</Badge>
          </div>
          <PowerAnalysis data={config.powerData} />
        </div>
      );
    }

    return null;
  };

  return (
    <Layout>
      <div className="container max-w-5xl mx-auto px-4 py-12 space-y-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            <span className="text-gradient-primary">Circuit Analyzer</span>
          </h1>
          <p className="text-muted-foreground">
            Describe your circuit and let AI analyze it step-by-step
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
            <Activity className="w-4 h-4" />
            Supports: OpAmps, Filters, Digital Logic, Power Supplies
          </div>
        </div>

        {/* Circuit History */}
        <CircuitHistoryPanel
          history={history}
          onSelect={handleSelectHistory}
          onRemove={removeAnalysis}
          onClear={clearHistory}
        />

        {/* Circuit Input */}
        <CircuitInputPanel onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />

        {/* Analysis Results */}
        {analysisComplete && (
          <>
            <div className="subtle-divider my-8" />

            {/* Circuit Type Badge */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <Badge variant="secondary" className="text-sm px-4 py-1">
                Detected: {CIRCUIT_ANALYSIS_CONFIGS[detectedCircuitType]?.name || "OpAmp Circuit"}
              </Badge>
            </div>

            {/* Type-specific Analysis */}
            {renderCircuitTypeAnalysis()}

            <ReasoningPanel steps={mockReasoningSteps} isVisible={analysisComplete} />

            <div className="subtle-divider my-8" />

            <FaultDetectionPanel faults={mockFaults} isVisible={analysisComplete} />

            <div className="subtle-divider my-8" />

            <CorrectionPanel
              corrections={mockCorrections}
              expectedOutputs={mockExpectedOutputs}
              isVisible={analysisComplete}
            />

            <div className="subtle-divider my-8" />

            <LearningNotesPanel notes={mockLearningNotes} isVisible={analysisComplete} />
          </>
        )}
      </div>
    </Layout>
  );
};

export default Analyzer;
