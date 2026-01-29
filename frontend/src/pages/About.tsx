import Layout from "@/components/layout/Layout";

const About = () => {
  const values = [
    {
      title: "PRECISE_LOGIC",
      description: "Every analysis is grounded in solid electrical engineering principles and verified methodologies.",
    },
    {
      title: "STRUCTURAL_EDUCATION",
      description: "We don't just give answers — we teach the reasoning behind every diagnosis and correction.",
    },
    {
      title: "NETWORK_ACCESSIBILITY",
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
      <div className="container max-w-5xl mx-auto px-4 py-20 space-y-24">
        {/* Hero - Mission Identity */}
        <section className="relative text-center space-y-8">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-top-4 duration-1000">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold font-mono text-primary uppercase tracking-[0.4em]">Project_Identity: ElectroLab_v3</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-none">
            Engineering <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/40">Intelligence</span>
          </h1>

          <p className="text-sm md:text-base text-muted-foreground uppercase tracking-[0.1em] font-bold max-w-2xl mx-auto opacity-80 leading-relaxed">
            ElectroLab was born from the idea that every engineering student deserves
            a patient, knowledgeable lab partner who can explain not just what's wrong,
            but why — and how to fix it.
          </p>

          {/* Corner Decorative Accents */}
          <div className="absolute -top-10 -left-10 w-20 h-20 border-l-2 border-t-2 border-primary/10 pointer-events-none" />
          <div className="absolute -top-10 -right-10 w-20 h-20 border-r-2 border-t-2 border-primary/10 pointer-events-none" />
        </section>

        {/* Mission Matrix */}
        <section className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="h-0.5 w-4 bg-primary/40" />
              <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Operational_Mission</h2>
            </div>
            <p className="text-sm uppercase font-bold tracking-wide leading-relaxed opacity-70">
              We believe that understanding electronics shouldn't be intimidating.
              ElectroLab bridges the gap between theoretical knowledge and practical
              debugging skills.
            </p>
            <p className="text-sm uppercase font-bold tracking-wide leading-relaxed opacity-70">
              By showing our reasoning process step-by-step, we help users develop
              the intuition needed to become confident circuit designers and troubleshooters.
            </p>
          </div>
          <div className="blueprint-card p-12 bg-primary/[0.02] border-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 text-[8px] font-mono text-primary/30 font-bold uppercase tracking-widest">OBJ_001</div>
            <h3 className="text-xl font-black uppercase tracking-tighter mb-4 group-hover:text-primary transition-colors">The_Partner_Philosophy</h3>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-relaxed opacity-60">
              We're not just a tool — we're your learning companion. Like a patient
              lab partner who's always ready to help you understand the fundamentals
              while solving real problems.
            </p>
          </div>
        </section>

        {/* Core Values Registry */}
        <section className="space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black uppercase tracking-tighter">Core_Values</h2>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
              The Principles That Guide Our Neural Architectural Guidance
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value) => (
              <div key={value.title} className="blueprint-card p-8 bg-background/50 border-primary/10 hover:border-primary/30 transition-all duration-500 text-center space-y-4 group">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary group-hover:scale-110 transition-transform">{value.title}</div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-relaxed opacity-60">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Capability Buffer */}
        <section className="grid md:grid-cols-2 gap-12 items-center pt-12">
          <div className="blueprint-card p-12 bg-black/40 border-primary/20">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">System_Capabilities</h3>
            </div>
            <ul className="space-y-4">
              {capabilities.map((capability, index) => (
                <li key={index} className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 border-b border-primary/5 pb-2">
                  <span className="text-primary font-mono text-[8px]">0{index + 1}</span>
                  <span>{capability}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-6">
            <h2 className="text-3xl font-black uppercase tracking-tighter">Real_World_Deployments</h2>
            <p className="text-sm uppercase font-bold tracking-wide leading-relaxed opacity-70">
              ElectroLab focuses on practical circuit analysis scenarios that
              students and hobbyists encounter in labs and projects.
            </p>
            <p className="text-sm uppercase font-bold tracking-wide leading-relaxed opacity-70">
              From simple voltage dividers to complex operational amplifier configurations,
              our AI reasoning engine handles a wide range of analog circuit topologies.
            </p>
          </div>
        </section>

        {/* Global Footer Accent */}
        <div className="flex items-center justify-center pt-12 opacity-20">
          <div className="h-px w-24 bg-gradient-to-r from-transparent to-primary" />
          <div className="px-6 text-[8px] font-mono font-black uppercase tracking-[1em]">End_Of_Transmission</div>
          <div className="h-px w-24 bg-gradient-to-l from-transparent to-primary" />
        </div>
      </div>
    </Layout>
  );
};

export default About;
