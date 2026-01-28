import { useState, useCallback } from "react";
import { analyzeCircuitText } from "@/lib/api";

export const useCircuitAnalysis = () => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisComplete, setAnalysisComplete] = useState(false);
    const [reasoningSteps, setReasoningSteps] = useState<any[]>([]);
    const [faults, setFaults] = useState<any[]>([]);
    const [corrections, setCorrections] = useState<any[]>([]);
    const [expectedOutputs, setExpectedOutputs] = useState<any[]>([]);
    const [learningNotes, setLearningNotes] = useState<any[]>([]);

    const analyze = useCallback(async (input: string) => {
        setIsAnalyzing(true);
        setAnalysisComplete(false);

        try {
            const response = await analyzeCircuitText(input);
            const { structured_analysis } = response;

            // Map backend response to frontend UI
            setReasoningSteps(structured_analysis.reasoning_steps.map((step: string, i: number) => ({
                id: i + 1,
                title: step.split(':')[0] || "Analysis Step",
                explanation: step.split(':').slice(1).join(':').trim() || step,
                icon: "analyze" as const
            })));

            setFaults(structured_analysis.detected_faults.map((fault: string, i: number) => ({
                id: `fault-${i}`,
                name: fault.split(':')[0] || "Critical Fault",
                reason: fault.split(':').slice(1).join(':').trim() || fault,
                severity: fault.toLowerCase().includes("saturation") ? "high" : "medium"
            })));

            setCorrections(structured_analysis.suggested_fixes.map((fix: string, i: number) => ({
                id: `fix-${i}`,
                description: fix
            })));

            setExpectedOutputs([
                { parameter: "Expected Output", value: structured_analysis.expected_output_after_fix, unit: "" }
            ]);

            setLearningNotes(structured_analysis.learning_notes.map((note: string, i: number) => ({
                id: `note-${i}`,
                concept: note.split(':')[0] || "Concept",
                explanation: note.split(':').slice(1).join(':').trim() || note,
            })));

            setAnalysisComplete(true);
            return structured_analysis;
        } catch (error) {
            console.error("Analysis error:", error);
            throw error;
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    return {
        analyze,
        isAnalyzing,
        analysisComplete,
        reasoningSteps,
        faults,
        corrections,
        expectedOutputs,
        learningNotes
    };
};
