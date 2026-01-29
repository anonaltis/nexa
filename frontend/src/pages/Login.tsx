import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        toast({
          title: "ACCESS_GRANTED",
          description: "SESSION_INITIALIZED",
        });
        navigate("/dashboard");
      }
    } catch (error) {
      toast({
        title: "ACCESS_DENIED",
        description: "INVALID_CREDENTIALS",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      const success = await login("demo@example.com", "password123");
      if (success) {
        toast({
          title: "DEMO_ACCESS_GRANTED",
          description: "TEMPORARY_SESSION_ESTABLISHED",
        });
        navigate("/dashboard");
      }
    } catch (error) {
       toast({
        title: "DEMO_ACCESS_FAILED",
        description: "SYSTEM_OVERLOAD",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative Technical Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      
      <div className="w-full max-w-md relative z-10 transition-all duration-500 animate-in fade-in zoom-in-95">
        <div className="blueprint-card p-0 overflow-hidden border-primary/30 bg-background/80 backdrop-blur-xl shadow-[0_0_50px_rgba(var(--primary-rgb),0.1)]">
          {/* Header Module */}
          <div className="bg-primary/10 px-6 py-4 border-b border-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
               <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Security_Protocol_v9</h2>
            </div>
            <span className="text-[9px] font-mono text-muted-foreground/40 font-bold uppercase tracking-widest">TS_404.99</span>
          </div>

          <div className="p-8 space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-black uppercase tracking-tighter">Initialize_Session</h1>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                Input_Operator_Credentials // Node_Id: {Math.random().toString(16).substring(2, 8).toUpperCase()}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Identity_Buffer</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="OPERATOR@SYSTEM.CORE"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-primary/5 border-primary/20 h-12 text-[11px] font-bold uppercase tracking-wider placeholder:opacity-20 rounded-none focus-visible:ring-primary focus-visible:border-primary px-4 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Security_Token</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-primary/5 border-primary/20 h-12 text-[11px] font-bold uppercase tracking-wider placeholder:opacity-20 rounded-none focus-visible:ring-primary focus-visible:border-primary px-4 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="h-12 w-full bg-primary hover:bg-primary/90 text-[11px] font-black uppercase tracking-[0.3em] rounded-none border border-primary/20 shadow-[0_4px_20px_rgba(var(--primary-rgb),0.2)]"
                >
                  {isLoading ? "Validating_Parity..." : "Establish_Connection"}
                </Button>

                <div className="relative py-2">
                   <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-primary/10"></span></div>
                   <div className="relative flex justify-center"><span className="bg-background px-2 text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">Alternative_Node</span></div>
                </div>

                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleDemoLogin}
                  disabled={isLoading}
                  className="h-10 w-full text-[10px] font-bold uppercase tracking-[0.2em] rounded-none border-primary/10 hover:bg-primary/5"
                >
                  Bypass_Authentication [Demo]
                </Button>
              </div>
            </form>

            <div className="pt-4 text-center border-t border-primary/10">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                New_Operator?{" "}
                <Link to="/signup" className="text-primary hover:underline decoration-2 underline-offset-4">
                  Register_Unit
                </Link>
              </p>
            </div>
          </div>

          {/* Footer Module */}
          <div className="bg-primary/5 px-6 py-3 flex items-center justify-between border-t border-primary/10">
             <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none">Status: Ready_For_Input</span>
             <span className="text-[8px] font-mono text-primary/40 leading-none">{new Date().toISOString().substring(11, 19)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
