import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Layout from "@/components/layout/Layout";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Mock form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "PROTOCOL_VERIFIED",
      description: "MESSAGE_STORED_IN_COMMUNICATION_BUFFER",
    });

    setFormData({ name: "", email: "", subject: "", message: "" });
    setIsSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const contactInfo = [
    {
      title: "EMAIL_NODE",
      value: "HELLO@ELECTROLAB.IO",
      href: "mailto:hello@electrolab.io",
    },
    {
      title: "SUPPORT_NODE",
      value: "SUPPORT@ELECTROLAB.IO",
      href: "mailto:support@electrolab.io",
    },
    {
      title: "GEO_LOCATION",
      value: "ENGINEERING_DISTRICT_7",
      href: "#",
    },
  ];

  return (
    <Layout>
      <div className="container max-w-5xl mx-auto px-4 py-20 space-y-16">
        {/* Hero Module */}
        <section className="text-center space-y-6">
          <div className="inline-flex items-center gap-3 px-3 py-1 rounded bg-primary/5 border border-primary/20">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] font-bold font-mono text-primary uppercase tracking-[0.3em]">Comm_Link: Established</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter">
            Access_Transmission
          </h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] max-w-xl mx-auto opacity-60">
            Establish direct link with engineering lead // Query_Buffer_Available
          </p>
        </section>

        {/* Action Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Info Sidebar */}
          <div className="space-y-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="h-0.5 w-4 bg-primary/40" />
              <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Registry_Info</h2>
            </div>

            <div className="grid gap-4">
              {contactInfo.map((item) => (
                <a
                  key={item.title}
                  href={item.href}
                  className="blueprint-card p-6 border-primary/10 bg-primary/[0.02] hover:border-primary/40 transition-all group"
                >
                  <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{item.title}</div>
                  <div className="text-[11px] font-mono font-bold text-primary group-hover:tracking-wider transition-all">{item.value}</div>
                </a>
              ))}
            </div>

            <div className="p-6 blueprint-card border-dashed border-primary/20 bg-black/20">
              <h3 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Sync_Hours</h3>
              <div className="space-y-2 text-[10px] font-bold uppercase tracking-widest opacity-60">
                <div className="flex justify-between">
                  <span>WK_DAY</span>
                  <span className="text-primary font-mono">0900-1800</span>
                </div>
                <div className="flex justify-between">
                  <span>WK_END</span>
                  <span className="text-destructive font-mono">OFFLINE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Module */}
          <div className="lg:col-span-2">
            <div className="blueprint-card p-0 border-primary/20 overflow-hidden bg-background/50">
              <div className="bg-primary/10 px-6 py-3 border-b border-primary/20 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Transmission_Injection_Buffer</span>
                <span className="text-[8px] font-mono text-muted-foreground/40 font-bold uppercase">SIG_AUTH: TRUE</span>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Operator_Identity</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="ENGINEER_NAME"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="bg-primary/5 border-primary/20 h-11 text-[11px] font-bold uppercase tracking-wider placeholder:opacity-20 rounded-none focus-visible:ring-primary px-4 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Access_Identifier (Email)</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="OPERATOR@SYSTEM.CORE"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="bg-primary/5 border-primary/20 h-11 text-[11px] font-bold uppercase tracking-wider placeholder:opacity-20 rounded-none focus-visible:ring-primary px-4 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Message_Header</Label>
                  <Input
                    id="subject"
                    name="subject"
                    placeholder="QUERY_CLASSIFICATION"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="bg-primary/5 border-primary/20 h-11 text-[11px] font-bold uppercase tracking-wider placeholder:opacity-20 rounded-none focus-visible:ring-primary px-4 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Logic_Payload (Message)</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="INJECT_QUERY_DATA_HERE..."
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    required
                    className="bg-primary/5 border-primary/20 text-[11px] font-bold uppercase tracking-wider placeholder:opacity-20 rounded-none focus-visible:ring-primary px-4 py-4 transition-all min-h-[150px]"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 w-full md:w-auto md:px-12 bg-primary hover:bg-primary/90 text-[11px] font-bold uppercase tracking-[0.3em] rounded-none border border-primary/20 shadow-[0_4px_20px_rgba(var(--primary-rgb),0.1)]"
                >
                  {isSubmitting ? "Transmitting..." : "Initialize_Send"}
                </Button>
              </form>
            </div>
          </div>
        </section>

        {/* Global Footer Accent */}
        <div className="flex items-center justify-center pt-12 opacity-20">
          <div className="h-px w-24 bg-gradient-to-r from-transparent to-primary" />
          <div className="px-6 text-[8px] font-mono font-black uppercase tracking-[1em]">Secure_Channel</div>
          <div className="h-px w-24 bg-gradient-to-l from-transparent to-primary" />
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
