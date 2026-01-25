import { useState } from "react";
import Header from "@/components/Header";
import CircuitInputPanel from "@/components/CircuitInputPanel";
import ReasoningPanel from "@/components/ReasoningPanel";
import FaultDetectionPanel from "@/components/FaultDetectionPanel";
import CorrectionPanel from "@/components/CorrectionPanel";
import LearningNotesPanel from "@/components/LearningNotesPanel";

// Mock data for demonstration
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

const Index = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const handleAnalyze = (input: string) => {
    console.log("Analyzing circuit:", input);
    setIsAnalyzing(true);
    setAnalysisComplete(false);

    // Simulate analysis delay
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisComplete(true);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background gradient effect */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10">
        <Header />

        <main className="container max-w-5xl mx-auto px-4 pb-16 space-y-8">
          {/* Circuit Input */}
          <CircuitInputPanel onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />

          {/* Analysis Results */}
          {analysisComplete && (
            <>
              <div className="subtle-divider my-8" />
              
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
        </main>

        {/* Footer */}
        <footer className="border-t border-border/50 py-6">
          <div className="container max-w-5xl mx-auto px-4 text-center">
            <p className="text-xs text-muted-foreground">
              CircuitSathi — Engineering Intelligence for Circuit Analysis
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
