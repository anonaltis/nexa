import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { CircuitBoard, MessageSquare, Cpu, Code, Zap, Download, HelpCircle, ArrowRight } from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "AI Project Planner",
    description: "Describe your idea and get a structured plan with component lists, connections, and documentation.",
  },
  {
    icon: Cpu,
    title: "PCB Diagram Generator",
    description: "Visualize your circuit design with downloadable schematics ready for manufacturing.",
  },
  {
    icon: Code,
    title: "Code Assistant",
    description: "Get ESP32 and Arduino code with VS Code setup guides and compilation instructions.",
  },
  {
    icon: HelpCircle,
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
      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-mono text-primary">AI-Powered Electronics Platform</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Build Electronics Projects{" "}
            <span className="text-gradient-primary">With AI Guidance</span>
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            From idea to hardware. ElectroLab helps you plan, design, and build 
            electronics projects with AI-powered documentation, PCB diagrams, and code generation.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 gap-2">
              <Link to="/signup">
                Start Building
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Everything You Need</h2>
          <p className="text-muted-foreground">Powerful tools for every stage of your project</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="blueprint-card p-6 hover:border-primary/50 transition-colors"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground">Four simple steps from idea to working hardware</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {workflow.map((item, index) => (
            <div key={item.step} className="relative">
              <div className="blueprint-card p-6 h-full">
                <div className="text-4xl font-bold text-primary/30 font-mono mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              {index < workflow.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                  <ArrowRight className="w-6 h-6 text-primary/30" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="blueprint-card-elevated p-8 md:p-12 text-center max-w-3xl mx-auto">
          <CircuitBoard className="w-12 h-12 text-primary mx-auto mb-4 glow-icon" />
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Build Your Next Project?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Join ElectroLab and start transforming your electronics ideas into reality 
            with AI-powered guidance every step of the way.
          </p>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 gap-2">
            <Link to="/signup">
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Home;
