import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "PARITY_CHECK_FAILED",
        description: "SECURITY_TOKENS_DO_NOT_MATCH",
        variant: "destructive",
      });
      return;
    }

    if (!acceptTerms) {
      toast({
        title: "PROTOCOL_VIOLATION",
        description: "GOVERNANCE_TERMS_MUST_BE_ACCEPTED",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const success = await signup(formData.email, formData.password, formData.name);
      if (success) {
        toast({
          title: "IDENTITY_SYNTHESIZED",
          description: "WELCOME_TO_THE_NETWORK",
        });
        navigate("/dashboard");
      }
    } catch (error) {
      toast({
        title: "INITIALIZATION_FAILED",
        description: "IDENTITY_BUFFER_ERROR",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative Technical Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="blueprint-card p-0 overflow-hidden border-primary/30 bg-background/80 backdrop-blur-xl shadow-[0_0_50px_rgba(var(--primary-rgb),0.1)]">
          {/* Header Module */}
          <div className="bg-primary/10 px-6 py-4 border-b border-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Identity_Synthesis_v14</h2>
            </div>
            <span className="text-[9px] font-mono text-muted-foreground/40 font-bold uppercase tracking-widest">REG_07.X</span>
          </div>

          <div className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-black uppercase tracking-tighter">Create_Unit</h1>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                Register_New_Operator_Node
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Operator_Identity_Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="ENGINEER_NAME"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="bg-primary/5 border-primary/20 h-10 text-[11px] font-bold uppercase tracking-wider placeholder:opacity-20 rounded-none focus-visible:ring-primary px-4"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="email" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Communication_Buffer (Email)</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="OPERATOR@SYSTEM.CORE"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="bg-primary/5 border-primary/20 h-10 text-[11px] font-bold uppercase tracking-wider placeholder:opacity-20 rounded-none focus-visible:ring-primary px-4"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="password" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Security_Token</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="bg-primary/5 border-primary/20 h-10 text-[11px] font-bold uppercase tracking-wider placeholder:opacity-20 rounded-none focus-visible:ring-primary px-4"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="confirmPassword" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Token_Verify</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="bg-primary/5 border-primary/20 h-10 text-[11px] font-bold uppercase tracking-wider placeholder:opacity-20 rounded-none focus-visible:ring-primary px-4"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 py-2">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                  className="border-primary/40 data-[state=checked]:bg-primary rounded-none"
                />
                <Label htmlFor="terms" className="text-[8px] text-muted-foreground font-bold uppercase cursor-pointer leading-tight tracking-widest">
                  AUTHORIZE_COMPLIANCE_WITH_SYSTEM_TERMS_&_PRIVACY_MODEL
                </Label>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full bg-primary hover:bg-primary/90 text-[11px] font-black uppercase tracking-[0.3em] rounded-none border border-primary/20 shadow-[0_4px_20px_rgba(var(--primary-rgb),0.1)] mt-2"
              >
                {isLoading ? "Synthesizing..." : "Initialize_Identity"}
              </Button>
            </form>

            <div className="pt-4 text-center border-t border-primary/10">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Authenticated?{" "}
                <Link to="/login" className="text-primary hover:underline decoration-2 underline-offset-4">
                  Establish_Connection
                </Link>
              </p>
            </div>
          </div>

          {/* Footer Module */}
          <div className="bg-primary/5 px-6 py-3 flex items-center justify-between border-t border-primary/10">
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none">Security: Encrypted_X10</span>
            <span className="text-[8px] font-mono text-primary/40 leading-none">BUILD_ID: N3XA-664</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
