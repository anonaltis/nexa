import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

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
    title: "NEURAL_LINK_PROTOCOL",
    description: "Validates Gemini function-calling and autonomous routing modules.",
    tests: [
      {
        id: "chat-led-debug",
        name: "LED_CIRCUIT_DEBUG",
        description: "Expects analyze_circuit trigger.",
        endpoint: "/v3/chat/message",
        method: "POST",
        body: {
          message: "My red LED connected to 5V with a 10k ohm resistor is not lighting up. What's wrong?",
          session_id: "test-led-debug-" + Date.now(),
          user_id: "test-user",
          mode: "auto",
        },
      },
      {
        id: "chat-concept",
        name: "THEORY_QUERY",
        description: "Expects direct text response.",
        endpoint: "/v3/chat/message",
        method: "POST",
        body: {
          message: "What is Ohm's Law and why is it important?",
          session_id: "test-concept-" + Date.now(),
          user_id: "test-user",
          mode: "auto",
        },
      },
    ],
  },
  {
    id: "analyze",
    title: "LOGIC_PROCESSOR_VALIDATION",
    description: "Validates dedicated /analyze endpoints against physics laws.",
    tests: [
      {
        id: "analyze-led",
        name: "FAULT_DETECTION_SCAN",
        description: "Checks for insufficient current in LED loop.",
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
    ],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AITestLab = () => {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [runningAll, setRunningAll] = useState(false);

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
          error: err?.response?.data?.detail || err?.message || "Unknown error",
          response: err?.response?.data,
          durationMs,
        },
      }));
    }
  };

  const runAllTests = async () => {
    setRunningAll(true);
    for (const section of TEST_SECTIONS) {
      for (const test of section.tests) {
        await runTest(test);
      }
    }
    setRunningAll(false);
  };

  const allResults = Object.values(results);
  const passed = allResults.filter((r) => r.status === "pass").length;
  const failed = allResults.filter((r) => r.status === "fail").length;

  return (
    <Layout>
      <div className="container max-w-6xl mx-auto py-12 px-4 space-y-8">
        {/* Header Module */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 blueprint-card border-primary/20 bg-primary/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-1 opacity-10">
            <span className="text-[8px] font-mono font-bold tracking-[0.5em] uppercase">SYSTEM_DIAG_LAB_v4.4</span>
          </div>
          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <h1 className="text-3xl font-bold tracking-tighter uppercase">AI Diagnostic Lab</h1>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] ml-5">
              Operational_Environment: Virtual_Testing_Range_01
            </p>
          </div>
          <div className="flex items-center gap-6 relative z-10">
            <Button
              onClick={runAllTests}
              disabled={runningAll}
              className="h-10 px-8 bg-primary hover:bg-primary/90 text-[10px] font-black uppercase tracking-[0.3em] rounded-none shadow-[0_4px_20px_rgba(var(--primary-rgb),0.2)]"
            >
              {runningAll ? "Syncing..." : "Commence_Full_Scan"}
            </Button>
            <div className="h-10 w-px bg-primary/20" />
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Global Status</span>
              <span className="text-xs font-bold text-success uppercase">Awaiting_Instructions</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Stats Sidebar (3/12) */}
          <div className="lg:col-span-3 space-y-8">
            <div className="blueprint-card p-6 border-primary/20 bg-primary/5 space-y-6">
              <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Metric_Aggregation
              </h2>
              <div className="grid gap-4">
                {[
                  { label: "TOTAL_NODES", val: "12", color: "text-primary" },
                  { label: "NODES_PASSED", val: passed, color: "text-success" },
                  { label: "NODES_FAILED", val: failed, color: "text-destructive" },
                  { label: "MIN_LATENCY", val: "12MS", color: "text-blue-400" }
                ].map(stat => (
                  <div key={stat.label} className="border-b border-primary/5 pb-2">
                    <div className="text-[8px] font-bold text-muted-foreground uppercase mb-1">{stat.label}</div>
                    <div className={`text-xl font-mono font-bold ${stat.color}`}>{stat.val}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="blueprint-card p-6 border-primary/10 bg-black/40">
              <h3 className="text-[8px] font-black uppercase tracking-[0.2em] mb-4 text-muted-foreground">Log_Stream_Activity</h3>
              <div className="space-y-3">
                {allResults.slice(-3).reverse().map(r => (
                  <div key={r.id} className="text-[9px] font-mono flex items-start gap-2 border-l border-primary/20 pl-2">
                    <span className={r.status === 'pass' ? 'text-success' : 'text-destructive'}>[{r.status.toUpperCase()}]</span>
                    <span className="text-muted-foreground/60">{r.name}</span>
                  </div>
                ))}
                <div className="text-[9px] font-mono text-primary/40 animate-pulse">_</div>
              </div>
            </div>
          </div>

          {/* Test Console (9/12) */}
          <div className="lg:col-span-9 space-y-12">
            {TEST_SECTIONS.map((section) => (
              <div key={section.id} className="space-y-6">
                <div className="flex items-center gap-2 px-1">
                  <span className="h-0.5 w-4 bg-primary/40" />
                  <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">{section.title}</h2>
                </div>

                <div className="grid gap-4">
                  {section.tests.map((test) => {
                    const result = results[test.id];
                    return (
                      <div key={test.id} className="blueprint-card p-0 border-primary/10 bg-background/50 overflow-hidden group">
                        <div className="flex items-center justify-between p-5 border-b border-primary/5 bg-primary/[0.02] group-hover:bg-primary/5 transition-colors">
                          <div className="flex items-center gap-6">
                            <div className={`h-3 w-3 ${result?.status === 'pass' ? 'bg-success' :
                                result?.status === 'fail' ? 'bg-destructive' :
                                  result?.status === 'running' ? 'bg-blue-400 animate-pulse' : 'bg-muted/10'
                              }`} />
                            <div>
                              <div className="text-[12px] font-black uppercase tracking-wider group-hover:text-primary transition-colors">{test.name}</div>
                              <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest opacity-50">{test.description}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            {result && (
                              <span className="text-[9px] font-mono text-primary/60 font-bold uppercase">{result.durationMs}ms</span>
                            )}
                            <Button
                              onClick={() => runTest(test)}
                              disabled={result?.status === 'running'}
                              variant="ghost"
                              className="h-9 px-6 text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 rounded-none border border-primary/20"
                            >
                              Execute
                            </Button>
                          </div>
                        </div>
                        {result?.response && (
                          <div className="p-6 bg-black/60 border-t border-primary/5">
                            <div className="flex items-center gap-2 mb-4">
                              <span className="text-[8px] font-mono text-primary/40 uppercase">Output_Buffer_Dump:</span>
                              <div className="h-px flex-1 bg-primary/5" />
                            </div>
                            <pre className="text-[10px] font-mono text-primary/80 overflow-x-auto leading-relaxed">
                              <code>{JSON.stringify(result.response, null, 2)}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AITestLab;
