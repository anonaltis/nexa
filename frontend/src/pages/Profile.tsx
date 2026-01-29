import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const Profile = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");

  const handleUpdateProfile = () => {
    toast.success("OPERATOR_METRICS_UPDATED_SUCCESSFULLY");
    setIsEditing(false);
  };

  return (
    <Layout>
      <div className="container max-w-6xl mx-auto px-4 py-12 space-y-8">
        {/* Header Module */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 blueprint-card border-primary/20 bg-primary/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-1 opacity-10">
            <span className="text-[8px] font-mono font-bold tracking-[0.5em] uppercase">OPERATOR_PROFILE_NODE_v0.7</span>
          </div>
          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <h1 className="text-3xl font-bold tracking-tighter uppercase">Operator Control Center</h1>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] ml-5">
              Authorized_User: {user?.email} // Status: STABLE
            </p>
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <Button
              variant="destructive"
              onClick={logout}
              className="h-10 px-8 border border-destructive/20 bg-destructive/10 hover:bg-destructive/20 text-[10px] font-black uppercase tracking-widest rounded-none text-destructive"
            >
              Terminate_Session
            </Button>
            <div className="h-10 w-px bg-primary/20" />
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Access_Level</span>
              <span className="text-xs font-bold text-primary uppercase">ADMIN_01</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Identity Sidebar (4/12) */}
          <div className="lg:col-span-4 space-y-8">
            <div className="blueprint-card p-0 border-primary/20 overflow-hidden bg-primary/[0.02]">
              <div className="bg-primary/10 px-6 py-4 border-b border-primary/20">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Biometric_Snapshot</span>
              </div>
              <div className="p-10 flex flex-col items-center space-y-6">
                <div className="w-32 h-32 rounded-full border-2 border-primary/30 p-2 relative">
                  <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center relative overflow-hidden">
                    <span className="text-4xl font-black text-primary opacity-40">{user?.name?.substring(0, 1).toUpperCase()}</span>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-primary/20 animate-pulse" />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-neutral-900 border border-primary/40 px-3 py-1 text-[8px] font-mono font-bold text-primary uppercase tracking-widest">
                    OP_0{user?.id?.substring(0, 1)}
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-black uppercase tracking-tight">{user?.name}</h3>
                  <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest opacity-50">{user?.email}</p>
                </div>
              </div>
            </div>

            <div className="blueprint-card p-6 border-primary/10 bg-black/40 space-y-4">
              <h4 className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em] mb-4">Security_Protocols</h4>
              {[
                { label: "MFA_SYNC", val: "ENABLED", color: "text-success" },
                { label: "TOKEN_TTL", val: "3600S", color: "text-primary" },
                { label: "IP_LOCK", val: "RESTRICTED", color: "text-blue-400" }
              ].map(p => (
                <div key={p.label} className="flex justify-between items-center text-[9px] font-mono border-b border-primary/5 pb-2">
                  <span className="text-muted-foreground/40 font-bold">{p.label}</span>
                  <span className={`${p.color} font-bold`}>{p.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Registry Parameters (8/12) */}
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <span className="h-0.5 w-4 bg-primary/40" />
                <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Operational_Parameters</h2>
              </div>
              <div className="blueprint-card p-0 border-primary/20 bg-background/50 overflow-hidden">
                <div className="bg-primary/5 px-6 py-3 border-b border-primary/10 flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Modify_Operator_Identity</span>
                  <span className="text-[8px] font-mono text-primary/40">BUFFER_RW: ENABLED</span>
                </div>
                <div className="p-8 space-y-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 px-1">Operator_Legal_Identity</label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={!isEditing}
                        className="h-12 bg-primary/5 border-primary/20 text-[11px] font-bold uppercase tracking-widest focus-visible:ring-primary rounded-none px-4"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 px-1">Communication_Link (Email)</label>
                      <Input
                        value={user?.email}
                        disabled
                        className="h-12 bg-neutral-900 border-primary/5 text-[11px] font-bold uppercase tracking-widest opacity-30 rounded-none px-4 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-4 border-t border-primary/5">
                    {isEditing ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          className="h-12 px-8 border-primary/20 text-[10px] font-bold uppercase tracking-widest rounded-none"
                        >
                          Abort_Changes
                        </Button>
                        <Button
                          onClick={handleUpdateProfile}
                          className="h-12 px-10 bg-primary hover:bg-primary/90 text-[10px] font-black uppercase tracking-widest rounded-none shadow-[0_4px_20px_rgba(var(--primary-rgb),0.2)]"
                        >
                          Commit_Identity
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => setIsEditing(true)}
                        className="h-12 px-12 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 text-[10px] font-black uppercase tracking-widest rounded-none transition-all"
                      >
                        Initialize_Edit_Protocol
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 pt-8 border-t border-primary/10">
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <span className="h-0.5 w-3 bg-primary/40" />
                  <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Activity_Heatmap</h2>
                </div>
                <div className="blueprint-card p-6 border-primary/10 bg-primary/[0.01] h-32 flex items-center justify-center opacity-40">
                  <span className="text-[9px] font-bold uppercase tracking-[0.5em]">Establishing_Link...</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <span className="h-0.5 w-3 bg-primary/40" />
                  <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Hardware_Sync_Status</h2>
                </div>
                <div className="blueprint-card p-6 border-primary/10 bg-primary/[0.01] h-32 flex flex-col justify-center space-y-4 px-8">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold uppercase text-muted-foreground">Sync_Stability</span>
                    <div className="w-1/2 h-1 bg-primary/10 rounded-full overflow-hidden">
                      <div className="w-4/5 h-full bg-primary" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold uppercase text-muted-foreground">Uplink_Quality</span>
                    <div className="w-1/2 h-1 bg-primary/10 rounded-full overflow-hidden">
                      <div className="w-[92%] h-full bg-success" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
