import { Cpu, Target, Users, Lightbulb, GraduationCap, Wrench } from "lucide-react";
import Layout from "@/components/layout/Layout";

const About = () => {
  const values = [
    {
      icon: Target,
      title: "Precision",
      description: "Every analysis is grounded in solid electrical engineering principles and verified methodologies.",
    },
    {
      icon: GraduationCap,
      title: "Education",
      description: "We don't just give answers — we teach the reasoning behind every diagnosis and correction.",
    },
    {
      icon: Users,
      title: "Accessibility",
      description: "Making professional-grade circuit analysis tools available to students and hobbyists alike.",
    },
  ];

  const capabilities = [
    "OpAmp circuit analysis and gain calculations",
    "Kirchhoff's voltage and current law verification",
    "Power supply rail saturation detection",
    "Feedback loop stability analysis",
    "Component value optimization suggestions",
    "Common circuit topology recognition",
  ];

  return (
    <Layout>
      {/* Hero */}
      <section className="py-20">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Cpu className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">About CircuitSathi</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Engineering Intelligence for{" "}
            <span className="text-gradient-primary">Circuit Analysis</span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            CircuitSathi was born from the idea that every engineering student deserves 
            a patient, knowledgeable lab partner who can explain not just what's wrong, 
            but why — and how to fix it.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 border-t border-border/50">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
              <p className="text-muted-foreground mb-4">
                We believe that understanding electronics shouldn't be intimidating. 
                CircuitSathi bridges the gap between theoretical knowledge and practical 
                debugging skills.
              </p>
              <p className="text-muted-foreground">
                By showing our reasoning process step-by-step, we help users develop 
                the intuition needed to become confident circuit designers and troubleshooters.
              </p>
            </div>
            <div className="floating-card p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Lightbulb className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">The "Sathi" Philosophy</h3>
                  <p className="text-sm text-muted-foreground">Hindi for "companion" or "partner"</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                We're not just a tool — we're your learning companion. Like a patient 
                lab partner who's always ready to help you understand the fundamentals 
                while solving real problems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 border-t border-border/50">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              The principles that guide everything we build
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {values.map((value) => (
              <div key={value.title} className="elevated-card p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section id="features" className="py-16 border-t border-border/50">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="floating-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <Wrench className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-semibold">Current Capabilities</h3>
              </div>
              <ul className="space-y-3">
                {capabilities.map((capability, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-success" />
                    </div>
                    <span className="text-sm text-muted-foreground">{capability}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-4">Built for Real Circuits</h2>
              <p className="text-muted-foreground mb-4">
                CircuitSathi focuses on practical circuit analysis scenarios that 
                students and hobbyists encounter in labs and projects.
              </p>
              <p className="text-muted-foreground">
                From simple voltage dividers to complex operational amplifier configurations, 
                our AI reasoning engine handles a wide range of analog circuit topologies.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
