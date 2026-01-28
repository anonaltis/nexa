import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Zap,
  FlaskConical,
  BookOpen,
  Shield,
  Calculator,
  Cpu,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Send,
  Brain,
  Search,
  GraduationCap,
  FileText,
  RefreshCw,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TestResult {
  id: string;
  name: string;
  status: "idle" | "running" | "pass" | "fail";
  request?: any;
  response?: any;
  error?: string;
  durationMs?: number;
}

interface TestSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  tests: TestConfig[];
}

interface TestConfig {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: "GET" | "POST";
  body?: any;
  queryParams?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Test Definitions
// ---------------------------------------------------------------------------

const TEST_SECTIONS: TestSection[] = [
  {
    id: "chat",
    title: "Chat + Function Calling",
    icon: <Brain className="w-5 h-5" />,
    description:
      "Tests the main chat endpoint — Gemini decides whether to call a backend function or reply with plain text.",
    tests: [
      {
        id: "chat-led-debug",
        name: "LED Debug (should trigger analyze_circuit)",
        description:
          'Sends an LED-not-working message. Expects Gemini to call analyze_circuit and return physics-verified analysis.',
        endpoint: "/v3/chat/message",
        method: "POST",
        body: {
          message:
            "My red LED connected to 5V with a 10k ohm resistor is not lighting up. What's wrong?",
          session_id: "test-led-debug-" + Date.now(),
          user_id: "test-user",
          mode: "auto",
        },
      },
      {
        id: "chat-concept",
        name: "Concept Question (direct text reply)",
        description:
          "Sends a theory question. Expects Gemini to reply with text — no function call.",
        endpoint: "/v3/chat/message",
        method: "POST",
        body: {
          message: "What is Ohm's Law and why is it important?",
          session_id: "test-concept-" + Date.now(),
          user_id: "test-user",
          mode: "auto",
        },
      },
      {
        id: "chat-project-plan",
        name: "Project Planning (should trigger generate_project_plan)",
        description:
          "Asks to build a temperature monitor. Expects Gemini to call generate_project_plan.",
        endpoint: "/v3/chat/message",
        method: "POST",
        body: {
          message:
            "I want to build a room temperature monitoring system using ESP32 with an LCD display. What components do I need?",
          session_id: "test-plan-" + Date.now(),
          user_id: "test-user",
          mode: "auto",
        },
      },
      {
        id: "chat-safety",
        name: "Safety Query (should trigger fetch_lab_rule)",
        description:
          "Asks about safety. Expects Gemini to call fetch_lab_rule for grounding safety data.",
        endpoint: "/v3/chat/message",
        method: "POST",
        body: {
          message:
            "What are the grounding safety rules I should follow in the electronics lab?",
          session_id: "test-safety-" + Date.now(),
          user_id: "test-user",
          mode: "auto",
        },
      },
      {
        id: "chat-calculation",
        name: "Calculation Request (should trigger calculate_component_value)",
        description:
          "Asks to calculate a specific resistor value. Expects Gemini to call calculate_component_value.",
        endpoint: "/v3/chat/message",
        method: "POST",
        body: {
          message:
            "Calculate the resistor I need for a blue LED with 3.2V forward voltage and 15mA current from a 5V supply.",
          session_id: "test-calc-" + Date.now(),
          user_id: "test-user",
          mode: "auto",
        },
      },
      {
        id: "chat-datasheet",
        name: "Datasheet Request (should trigger fetch_datasheet)",
        description:
          "Asks about a specific component spec. Expects Gemini to call fetch_datasheet.",
        endpoint: "/v3/chat/message",
        method: "POST",
        body: {
          message:
            "What is the maximum current I can draw from an ESP32 GPIO pin?",
          session_id: "test-datasheet-" + Date.now(),
          user_id: "test-user",
          mode: "auto",
        },
      },
      {
        id: "chat-viva",
        name: "Viva Questions (should trigger generate_learning_summary)",
        description:
          "Asks for viva preparation. Expects Gemini to call generate_learning_summary.",
        endpoint: "/v3/chat/message",
        method: "POST",
        body: {
          message:
            "Generate viva questions about voltage dividers for an intermediate student.",
          session_id: "test-viva-" + Date.now(),
          user_id: "test-user",
          mode: "auto",
        },
      },
    ],
  },
  {
    id: "analyze",
    title: "Circuit Analysis + Validation",
    icon: <FlaskConical className="w-5 h-5" />,
    description:
      "Tests the dedicated /analyze endpoint which always validates the solution against physics laws.",
    tests: [
      {
        id: "analyze-led",
        name: "LED Circuit Analysis",
        description:
          "Analyzes an LED circuit with a high-value resistor. Should catch the insufficient-current fault.",
        endpoint: "/v3/chat/analyze",
        method: "POST",
        body: {
          description: "My red LED is not lighting up. The circuit has 5V, a 10k resistor and a red LED.",
          components: ["resistor 10k", "red LED"],
          supply_voltage: 5,
          session_id: "test-analyze-led-" + Date.now(),
          user_id: "test-user",
        },
      },
      {
        id: "analyze-divider",
        name: "Voltage Divider Analysis",
        description:
          "Analyzes a voltage divider. Should verify output voltage calculation.",
        endpoint: "/v3/chat/analyze",
        method: "POST",
        body: {
          description:
            "I built a voltage divider with R1=10k and R2=10k from 5V but I'm getting 3.3V on the output.",
          components: ["resistor 10k", "resistor 10k"],
          supply_voltage: 5,
          session_id: "test-analyze-div-" + Date.now(),
          user_id: "test-user",
        },
      },
      {
        id: "analyze-power",
        name: "Power Supply Circuit",
        description:
          "Analyzes a power supply. Should check thermal dissipation.",
        endpoint: "/v3/chat/analyze",
        method: "POST",
        body: {
          description:
            "Using LM7805 with 12V input and 1A load, the regulator gets very hot.",
          components: ["LM7805", "capacitor 0.33uF", "capacitor 0.1uF"],
          supply_voltage: 12,
          session_id: "test-analyze-psu-" + Date.now(),
          user_id: "test-user",
        },
      },
    ],
  },
  {
    id: "calculate",
    title: "Verified Calculations",
    icon: <Calculator className="w-5 h-5" />,
    description:
      "Tests the /calculate endpoint which performs physics-verified component calculations.",
    tests: [
      {
        id: "calc-led-resistor",
        name: "LED Resistor Calculation",
        description:
          "Calculates current-limiting resistor for a red LED at 15mA from 5V.",
        endpoint: "/v3/chat/calculate",
        method: "POST",
        body: {
          calculation_type: "led_resistor",
          inputs: {
            supply_voltage: 5,
            forward_voltage: 1.8,
            forward_current: 15,
          },
        },
      },
      {
        id: "calc-voltage-divider",
        name: "Voltage Divider Calculation",
        description:
          "Calculates output voltage with R1=10k and R2=4.7k from 5V.",
        endpoint: "/v3/chat/calculate",
        method: "POST",
        body: {
          calculation_type: "voltage_divider",
          inputs: {
            voltage: 5,
            r1: 10000,
            r2: 4700,
          },
        },
      },
      {
        id: "calc-power",
        name: "Power Dissipation Calculation",
        description: "Calculates power across a 220 ohm resistor at 5V.",
        endpoint: "/v3/chat/calculate",
        method: "POST",
        body: {
          calculation_type: "power_dissipation",
          inputs: {
            voltage: 5,
            resistance: 220,
          },
        },
      },
      {
        id: "calc-rc-freq",
        name: "RC Cutoff Frequency",
        description:
          "Calculates filter cutoff for R=10k, C=100nF.",
        endpoint: "/v3/chat/calculate",
        method: "POST",
        body: {
          calculation_type: "rc_cutoff_frequency",
          inputs: {
            resistance: 10000,
            capacitance: 100,   // nF → function normalizes
          },
        },
      },
    ],
  },
  {
    id: "datasheet",
    title: "Datasheet / RAG",
    icon: <FileText className="w-5 h-5" />,
    description:
      "Tests the knowledge base retrieval — fetches component specs from YAML datasheets.",
    tests: [
      {
        id: "ds-esp32",
        name: "ESP32 Datasheet",
        description:
          "Fetches full ESP32 datasheet data. Should return max_ratings, pinout, etc.",
        endpoint: "/v3/chat/datasheet",
        method: "POST",
        body: { component: "ESP32", info_type: "all" },
      },
      {
        id: "ds-arduino-pinout",
        name: "Arduino Nano Pinout",
        description: "Fetches only pinout for Arduino Nano.",
        endpoint: "/v3/chat/datasheet",
        method: "POST",
        body: { component: "Arduino Nano", info_type: "pinout" },
      },
      {
        id: "ds-lm7805-ratings",
        name: "LM7805 Max Ratings",
        description: "Fetches max ratings for LM7805 regulator.",
        endpoint: "/v3/chat/datasheet",
        method: "POST",
        body: { component: "LM7805", info_type: "max_ratings" },
      },
      {
        id: "ds-led",
        name: "LED General Specs",
        description: "Fetches standard LED specifications.",
        endpoint: "/v3/chat/datasheet",
        method: "POST",
        body: { component: "LED", info_type: "all" },
      },
      {
        id: "ds-unknown",
        name: "Unknown Component (Fallback)",
        description:
          "Requests a component that doesn't exist. Should return helpful default data.",
        endpoint: "/v3/chat/datasheet",
        method: "POST",
        body: { component: "XYZ123", info_type: "all" },
      },
    ],
  },
  {
    id: "learning",
    title: "Adaptive Learning",
    icon: <GraduationCap className="w-5 h-5" />,
    description:
      "Tests the learning system — viva questions, concept summaries, user profile.",
    tests: [
      {
        id: "learn-viva",
        name: "Viva Questions – LED",
        description: "Generates beginner viva questions about LEDs.",
        endpoint: "/v3/chat/learn",
        method: "POST",
        body: {
          topic: "LED circuits",
          format: "viva_questions",
          skill_level: "beginner",
          user_id: "test-user",
        },
      },
      {
        id: "learn-viva-adv",
        name: "Viva Questions – RC Filter (Advanced)",
        description: "Generates advanced viva questions about RC filters.",
        endpoint: "/v3/chat/learn",
        method: "POST",
        body: {
          topic: "RC filter",
          format: "viva_questions",
          skill_level: "advanced",
          user_id: "test-user",
        },
      },
      {
        id: "learn-summary",
        name: "Concept Summary – Power Supply",
        description: "Generates a concept summary for power supply topic.",
        endpoint: "/v3/chat/learn",
        method: "POST",
        body: {
          topic: "power supply",
          format: "concept_summary",
          skill_level: "intermediate",
          user_id: "test-user",
        },
      },
      {
        id: "learn-practice",
        name: "Practice Problems – Ohm's Law",
        description: "Generates practice problems about Ohm's Law.",
        endpoint: "/v3/chat/learn",
        method: "POST",
        body: {
          topic: "Ohm's Law",
          format: "practice_problems",
          skill_level: "beginner",
          user_id: "test-user",
        },
      },
      {
        id: "learn-profile",
        name: "User Learning Profile",
        description:
          "Retrieves the learning profile for a user, including skill level and history.",
        endpoint: "/v3/chat/profile/test-user",
        method: "GET",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const statusIcon = (status: TestResult["status"]) => {
  switch (status) {
    case "running":
      return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />;
    case "pass":
      return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    case "fail":
      return <XCircle className="w-4 h-4 text-red-400" />;
    default:
      return <div className="w-4 h-4 rounded-full border border-border" />;
  }
};

const statusBadge = (status: TestResult["status"]) => {
  const base = "px-2 py-0.5 rounded text-xs font-mono font-medium";
  switch (status) {
    case "running":
      return `${base} bg-blue-500/15 text-blue-400 border border-blue-500/30`;
    case "pass":
      return `${base} bg-emerald-500/15 text-emerald-400 border border-emerald-500/30`;
    case "fail":
      return `${base} bg-red-500/15 text-red-400 border border-red-500/30`;
    default:
      return `${base} bg-muted text-muted-foreground border border-border`;
  }
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AITestLab = () => {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({ chat: true });
  const [expandedResults, setExpandedResults] = useState<
    Record<string, boolean>
  >({});
  const [runningAll, setRunningAll] = useState(false);

  const toggleSection = (id: string) =>
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleResult = (id: string) =>
    setExpandedResults((prev) => ({ ...prev, [id]: !prev[id] }));

  // Run a single test
  const runTest = async (test: TestConfig) => {
    setResults((prev) => ({
      ...prev,
      [test.id]: {
        id: test.id,
        name: test.name,
        status: "running",
        request: test.body || test.queryParams,
      },
    }));

    const start = performance.now();

    try {
      let response;
      if (test.method === "GET") {
        response = await api.get(test.endpoint, { params: test.queryParams });
      } else {
        response = await api.post(test.endpoint, test.body);
      }

      const durationMs = Math.round(performance.now() - start);

      setResults((prev) => ({
        ...prev,
        [test.id]: {
          id: test.id,
          name: test.name,
          status: "pass",
          request: test.body || test.queryParams,
          response: response.data,
          durationMs,
        },
      }));
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - start);
      setResults((prev) => ({
        ...prev,
        [test.id]: {
          id: test.id,
          name: test.name,
          status: "fail",
          request: test.body || test.queryParams,
          error:
            err?.response?.data?.detail ||
            err?.message ||
            "Unknown error",
          response: err?.response?.data,
          durationMs,
        },
      }));
    }
  };

  // Run all tests in a section
  const runSection = async (section: TestSection) => {
    setExpandedSections((prev) => ({ ...prev, [section.id]: true }));
    for (const test of section.tests) {
      await runTest(test);
    }
  };

  // Run all tests across all sections
  const runAllTests = async () => {
    setRunningAll(true);
    for (const section of TEST_SECTIONS) {
      setExpandedSections((prev) => ({ ...prev, [section.id]: true }));
      for (const test of section.tests) {
        await runTest(test);
      }
    }
    setRunningAll(false);
  };

  // Reset all results
  const resetAll = () => {
    setResults({});
    setExpandedResults({});
  };

  // Stats
  const allResults = Object.values(results);
  const passed = allResults.filter((r) => r.status === "pass").length;
  const failed = allResults.filter((r) => r.status === "fail").length;
  const running = allResults.filter((r) => r.status === "running").length;
  const total = TEST_SECTIONS.reduce((s, sec) => s + sec.tests.length, 0);

  return (
    <Layout>
      <div className="py-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Test Lab</h1>
              <p className="text-sm text-muted-foreground">
                Test every feature of the ElectroLab AI system from the frontend
              </p>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-4 mb-6 p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-6 flex-1">
            <div className="text-sm">
              <span className="text-muted-foreground">Total:</span>{" "}
              <span className="font-mono font-medium">{total}</span>
            </div>
            <div className="text-sm">
              <span className="text-emerald-400">Passed:</span>{" "}
              <span className="font-mono font-medium">{passed}</span>
            </div>
            <div className="text-sm">
              <span className="text-red-400">Failed:</span>{" "}
              <span className="font-mono font-medium">{failed}</span>
            </div>
            <div className="text-sm">
              <span className="text-blue-400">Running:</span>{" "}
              <span className="font-mono font-medium">{running}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetAll}
              disabled={runningAll}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={runAllTests}
              disabled={runningAll}
              className="bg-primary hover:bg-primary/90"
            >
              {runningAll ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5 mr-1.5" />
              )}
              Run All Tests
            </Button>
          </div>
        </div>

        {/* Test Sections */}
        <div className="space-y-4">
          {TEST_SECTIONS.map((section) => (
            <div
              key={section.id}
              className="rounded-lg border border-border bg-card overflow-hidden"
            >
              {/* Section Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex items-center gap-3">
                  {expandedSections[section.id] ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  <div className="text-primary">{section.icon}</div>
                  <div>
                    <h2 className="font-semibold text-sm">{section.title}</h2>
                    <p className="text-xs text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-mono">
                    {section.tests.filter((t) => results[t.id]?.status === "pass").length}
                    /{section.tests.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      runSection(section);
                    }}
                    disabled={runningAll}
                    className="text-xs h-7"
                  >
                    <Send className="w-3 h-3 mr-1" />
                    Run Section
                  </Button>
                </div>
              </div>

              {/* Section Tests */}
              {expandedSections[section.id] && (
                <div className="border-t border-border">
                  {section.tests.map((test) => {
                    const result = results[test.id];
                    const isExpanded = expandedResults[test.id];

                    return (
                      <div
                        key={test.id}
                        className="border-b border-border last:border-b-0"
                      >
                        {/* Test Row */}
                        <div className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors">
                          {statusIcon(result?.status || "idle")}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">
                                {test.name}
                              </span>
                              {result && (
                                <span className={statusBadge(result.status)}>
                                  {result.status === "pass"
                                    ? `PASS ${result.durationMs}ms`
                                    : result.status === "fail"
                                    ? `FAIL ${result.durationMs}ms`
                                    : result.status.toUpperCase()}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {test.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {result && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleResult(test.id)}
                                className="text-xs h-7"
                              >
                                <Search className="w-3 h-3 mr-1" />
                                {isExpanded ? "Hide" : "Details"}
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => runTest(test)}
                              disabled={result?.status === "running"}
                              className="text-xs h-7"
                            >
                              <Send className="w-3 h-3 mr-1" />
                              Run
                            </Button>
                          </div>
                        </div>

                        {/* Expanded Result */}
                        {isExpanded && result && (
                          <div className="px-4 pb-4 space-y-3">
                            {/* Transparency Badges (for chat responses) */}
                            {result.response?.function_called && (
                              <div className="flex flex-wrap gap-2">
                                <span className="px-2 py-1 rounded text-xs font-mono bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                  Function: {result.response.function_called}()
                                </span>
                                {result.response.confidence && (
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-mono border ${
                                      result.response.confidence === "high"
                                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                        : result.response.confidence === "low"
                                        ? "bg-red-500/15 text-red-400 border-red-500/30"
                                        : "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
                                    }`}
                                  >
                                    Confidence: {result.response.confidence.toUpperCase()}
                                  </span>
                                )}
                                {result.response.verified_by?.length > 0 && (
                                  <span className="px-2 py-1 rounded text-xs font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                    Verified: {result.response.verified_by.join(", ")}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Warnings */}
                            {result.response?.warnings?.length > 0 && (
                              <div className="space-y-1">
                                {result.response.warnings.map(
                                  (w: string, i: number) => (
                                    <div
                                      key={i}
                                      className="flex items-start gap-2 text-xs text-yellow-400 bg-yellow-500/10 rounded p-2 border border-yellow-500/20"
                                    >
                                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                      {w}
                                    </div>
                                  )
                                )}
                              </div>
                            )}

                            {/* Reasoning Chain */}
                            {result.response?.reasoning_steps?.length > 0 && (
                              <div>
                                <h4 className="text-xs font-semibold text-muted-foreground mb-1">
                                  Reasoning Chain
                                </h4>
                                <div className="space-y-1">
                                  {result.response.reasoning_steps.map(
                                    (step: string, i: number) => (
                                      <div
                                        key={i}
                                        className="text-xs text-muted-foreground font-mono pl-3 border-l-2 border-primary/30"
                                      >
                                        {step}
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Request */}
                            <div>
                              <h4 className="text-xs font-semibold text-muted-foreground mb-1">
                                Request
                              </h4>
                              <pre className="text-xs font-mono bg-background rounded-lg p-3 overflow-auto max-h-48 border border-border">
                                {JSON.stringify(result.request, null, 2)}
                              </pre>
                            </div>

                            {/* Response or Error */}
                            {result.error ? (
                              <div>
                                <h4 className="text-xs font-semibold text-red-400 mb-1">
                                  Error
                                </h4>
                                <pre className="text-xs font-mono bg-red-500/10 rounded-lg p-3 text-red-300 overflow-auto max-h-48 border border-red-500/20">
                                  {typeof result.error === "string"
                                    ? result.error
                                    : JSON.stringify(result.error, null, 2)}
                                </pre>
                              </div>
                            ) : (
                              <div>
                                <h4 className="text-xs font-semibold text-emerald-400 mb-1">
                                  Response
                                </h4>
                                <pre className="text-xs font-mono bg-background rounded-lg p-3 overflow-auto max-h-80 border border-border">
                                  {JSON.stringify(result.response, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-8 p-4 rounded-lg bg-card border border-border text-xs text-muted-foreground space-y-1">
          <p>
            <strong className="text-foreground">Backend:</strong>{" "}
            {api.defaults.baseURL}
          </p>
          <p>
            <strong className="text-foreground">Endpoints Tested:</strong>{" "}
            /v3/chat/message, /v3/chat/analyze, /v3/chat/calculate, /v3/chat/datasheet, /v3/chat/learn, /v3/chat/profile
          </p>
          <p>
            <strong className="text-foreground">Tests:</strong> {total} total across {TEST_SECTIONS.length} categories
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default AITestLab;
