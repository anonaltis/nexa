import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { CircuitBoard, MessageSquare, Cpu, Code, Zap, Download, HelpCircle, ArrowRight } from "lucide-react";

const features = [
  {
    title: "AI Project Planner",
    description: "Describe your idea and get a structured plan with component lists, connections, and documentation.",
  },
  {
    title: "PCB Diagram Generator",
    description: "Visualize your circuit design with downloadable schematics ready for manufacturing.",
  },
  {
    title: "Code Assistant",
    description: "Get ESP32 and Arduino code with VS Code setup guides and compilation instructions.",
  },
  {
    title: "Build Support",
    description: "Stuck on wiring? Ask the AI for help with connections and troubleshooting.",
  },
];

const workflow = [
  {
    step: "01",
    title: "Describe Your Project",
    description: "Tell the AI what you want to build. It will ask clarifying questions to understand your requirements.",
  },
  {
    step: "02",
    title: "Review the Plan",
    description: "Get a complete project document with components, estimated costs, and step-by-step instructions.",
  },
  {
    step: "03",
    title: "Generate PCB & Code",
    description: "Download PCB diagrams and get ready-to-upload code for your microcontrollers.",
  },
  {
    step: "04",
    title: "Build with Guidance",
    description: "Follow the instructions and ask for help whenever you need assistance with your build.",
  },
];

const Home = () => {
  return (
    <Layout>
      <div className="relative overflow-hidden">
        {/* Technical Grid Background Accent */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        {/* Right Corner Accent */}
        <div className="absolute top-10 right-10 w-20 h-20 border-r-2 border-t-2 border-primary/20 pointer-events-none" />
        <div className="absolute top-12 right-12 w-4 h-4 border-r border-t border-primary/40 pointer-events-none" />

        {/* Hero Section - System Initialization */}
        <section className="relative py-24 md:py-40">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/20 mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-bold font-mono text-primary uppercase tracking-[0.4em]">Integrated_Neural_Electronics_V3.0</span>
            </div>

            <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-8 leading-none">
              Engineering_The <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/40">Future_Of_Logic</span>
            </h1>

            <p className="text-sm md:text-base text-muted-foreground uppercase tracking-[0.1em] font-bold max-w-2xl mx-auto mb-12 opacity-80 leading-relaxed">
              Plan, synthesize, and deploy specialized hardware with deep-neural architectural guidance.
              The ultimate mission control for modern circuit engineering.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button asChild size="lg" className="h-14 px-10 bg-primary hover:bg-primary/90 text-[11px] font-bold uppercase tracking-[0.3em] rounded-none border border-primary/20 shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)]">
                <Link to="/signup">Initialize_Session</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 px-10 text-[11px] font-bold uppercase tracking-[0.3em] rounded-none border-primary/20 hover:bg-primary/5">
                <Link to="/login">Access_Terminal</Link>
              </Button>
            </div>

            {/* Hardware Metrics Footer */}
            <div className="mt-20 grid grid-cols-3 gap-8 border-t border-primary/10 pt-10">
              <div className="text-left">
                <div className="text-xs font-mono font-bold text-primary">0.002MS</div>
                <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Synthesis_Latency</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-mono font-bold text-primary">1024-BIT</div>
                <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Logic_Parity</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-primary">CORE_ACTIVE</div>
                <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Eng_Status</div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Matrix */}
        <section className="py-24 border-t border-primary/10 bg-primary/[0.02]">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-16">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="h-0.5 w-4 bg-primary/40" />
                  <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Operational_Capabilities</span>
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tighter">System_Features</h2>
              </div>
              <div className="hidden md:block text-right">
                <span className="text-[9px] font-mono text-muted-foreground font-bold uppercase tracking-widest leading-tight">
                  MODE: HYPER_SYNTHESIS<br />
                  STATUS: OPTIMAL
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="blueprint-card p-8 border-primary/10 bg-background/50 hover:border-primary/40 hover:bg-primary/5 transition-all group relative overflow-hidden h-full flex flex-col justify-between"
                >
                  <div className="absolute top-0 right-0 p-4 text-[9px] font-mono text-primary/20 font-bold">TECH_UNIT_{index + 1}</div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-black uppercase tracking-widest group-hover:text-primary transition-colors">{feature.title.replace(/ /g, "_")}</h3>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold leading-relaxed opacity-60">
                      {feature.description}
                    </p>
                  </div>
                  <div className="mt-8 pt-6 border-t border-primary/5 flex items-center justify-between">
                    <span className="text-[9px] font-bold text-primary uppercase tracking-[0.2em]">Ready_For_Execution</span>
                    <span className="h-1 w-1 rounded-full bg-primary" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Deployment Path */}
        <section className="py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-20 space-y-4">
              <div className="flex items-center justify-center gap-2">
                <span className="h-0.5 w-4 bg-primary/40" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Deployment_Protocol</span>
                <span className="h-0.5 w-4 bg-primary/40" />
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tighter">Workflow_Matrix</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {workflow.map((item, index) => (
                <div key={item.step} className="relative group">
                  <div className="blueprint-card p-8 h-full border-primary/10 bg-background/40 hover:border-primary/30 transition-all">
                    <div className="text-3xl font-black text-primary/20 font-mono mb-6 group-hover:text-primary/40 transition-colors">
                      {item.step}
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest mb-4 leading-tight">{item.title.replace(/ /g, "_")}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold leading-relaxed opacity-60">
                      {item.description}
                    </p>
                  </div>
                  {index < 3 && (
                    <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-primary/20 font-black text-2xl">
                      &gt;&gt;
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Global Access CTA */}
        <section className="py-24 mb-20">
          <div className="max-w-4xl mx-auto px-4">
            <div className="blueprint-card p-12 md:p-20 text-center border-primary/20 bg-primary/[0.03] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

              <h2 className="text-4xl font-black uppercase tracking-tighter mb-6">
                Initiate_Global_Deploy
              </h2>
              <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-widest mb-10 max-w-xl mx-auto leading-relaxed">
                Join the decentralized network of ElectroLab engineers. Coordinate logic, optimize topology, and materialize infrastructure.
              </p>
              <Button asChild size="lg" className="h-14 px-12 bg-primary hover:bg-primary/90 text-[11px] font-bold uppercase tracking-[0.4em] rounded-none">
                <Link to="/signup">Initialize_Access</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Home;
