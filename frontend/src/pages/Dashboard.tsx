import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useProjectContext } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ProjectStatus, ProjectCategory } from "@/types/project";

const statusConfig: Record<ProjectStatus, { label: string; color: string }> = {
  planning: { label: "Planning", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  designing: { label: "Designing", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  coding: { label: "Coding", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  building: { label: "Building", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  testing: { label: "Testing", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  completed: { label: "Completed", color: "bg-green-500/20 text-green-400 border-green-500/30" },
};

const categoryLabels: Record<ProjectCategory, string> = {
  iot: "IoT",
  robotics: "Robotics",
  audio: "Audio",
  power: "Power",
  communication: "Communication",
  sensor: "Sensor",
  display: "Display",
  other: "Other",
};

const Dashboard = () => {
  const { projects, isLoading, deleteProject } = useProjectContext();
  const { user } = useAuth();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "SYNC_LIVE";
    if (hours < 24) return `${hours}H_AGO`;
    if (days < 7) return `${days}D_AGO`;
    return formatDate(date).toUpperCase().replace(/ /g, "_");
  };

  if (!user) {
    return (
      <Layout>
        <div className="container max-w-4xl mx-auto py-32 text-center space-y-8 px-4">
          <div className="inline-flex items-center justify-center p-6 border-2 border-dashed border-primary/20 bg-primary/5 rounded-full mb-4">
            <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">Access_Restricted</h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em]">AUTHENTICATION_LOG_REQUIRED_FOR_DASHBOARD_ACCESS</p>
          <Button asChild className="h-12 px-12 bg-primary hover:bg-primary/90 text-[10px] font-black uppercase tracking-[0.3em] rounded-none shadow-[0_4px_20px_rgba(var(--primary-rgb),0.2)]">
            <Link to="/login">Initialize_Login_Protocol</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header Module */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 p-6 blueprint-card border-primary/20 bg-primary/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-1 opacity-10">
            <span className="text-[8px] font-mono font-bold tracking-[0.5em] uppercase">COMMAND_CENTER_v5.0</span>
          </div>
          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <h1 className="text-3xl font-bold tracking-tighter uppercase">System Dashboard</h1>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] ml-5">
              Operator: {user?.name} // Security_Level: 07 // Port: CLOUD_SYNC
            </p>
          </div>
          <div className="flex items-center gap-6 relative z-10">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">System_State</span>
              <span className="text-xs font-bold text-success uppercase">NOMINAL / STABLE</span>
            </div>
            <div className="h-10 w-px bg-primary/20" />
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Registry_Units</span>
              <span className="text-xs font-bold text-primary uppercase">{projects.length} ACTIVE</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content (9/12) */}
          <div className="lg:col-span-9 space-y-12">
            {/* Quick Access Grid */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <span className="h-0.5 w-4 bg-primary/40" />
                <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Operational_Hotlinks</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { label: "Initialize_Project", desc: "NEURAL_PLANNER", path: "/chat", color: "primary" },
                  { label: "Hardware_Diagnostics", desc: "FAULT_SENSING", path: "/troubleshoot", color: "destructive" },
                  { label: "Circuit_Analysis", desc: "LOGIC_SYNTHESIS", path: "/analyzer", color: "blue" },
                  { label: "PCB_Control", desc: "LAYOUT_ENGINE", path: "/pcb", color: "purple" },
                  { label: "Firmware_Studio", desc: "COMPILER_NODE", path: "/code", color: "yellow" },
                  { label: "Component_Registry", desc: "UNIT_DATABASE", path: "/components", color: "cyan" }
                ].map((tool) => (
                  <Link key={tool.path} to={tool.path} className="group">
                    <div className="blueprint-card p-6 h-full border-primary/10 bg-background/50 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 text-[7px] font-mono text-primary/20 group-hover:text-primary/40">LINK_{tool.label.substring(0, 3).toUpperCase()}</div>
                      <h3 className="text-[11px] font-black uppercase tracking-widest mb-1 group-hover:text-primary transition-colors">{tool.label}</h3>
                      <p className="text-[9px] text-muted-foreground font-bold uppercase opacity-40">{tool.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Project Registry */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="h-0.5 w-4 bg-primary/40" />
                  <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Deployment_Registry</h2>
                </div>
                <Button asChild className="h-9 px-6 bg-primary hover:bg-primary/90 text-[10px] font-black uppercase tracking-widest rounded-none shadow-[0_2px_10px_rgba(var(--primary-rgb),0.2)]">
                  <Link to="/chat">Create_Project_Node</Link>
                </Button>
              </div>

              {isLoading ? (
                <div className="py-32 flex flex-col items-center justify-center space-y-4 blueprint-card border-primary/10 bg-primary/[0.02]">
                  <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Establishing_Registry_Sync...</span>
                </div>
              ) : projects.length === 0 ? (
                <div className="py-32 text-center blueprint-card border-dashed border-primary/20 bg-primary/5 space-y-6">
                  <h3 className="text-xl font-black uppercase tracking-tighter">Registry_Vacant</h3>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-60 max-w-sm mx-auto">
                    No active deployments detected in the current buffer. Initialize project synthesis to begin.
                  </p>
                  <Button asChild className="h-10 px-10 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 text-[10px] font-black uppercase tracking-widest rounded-none">
                    <Link to="/chat">Begin_Synthesis</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                  {projects.map((project) => {
                    const status = statusConfig[project.status];
                    return (
                      <div key={project.id} className="blueprint-card p-0 border-primary/10 bg-background/50 hover:border-primary/40 transition-all group overflow-hidden flex flex-col">
                        <div className="px-5 py-3 border-b border-primary/10 bg-primary/5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`h-2 w-2 rounded-full ${status.color.split(' ')[1].replace('text-', 'bg-')}`} />
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-80">{status.label}</span>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 border border-primary/10 hover:bg-primary/10 transition-colors">ACTIONS</button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-neutral-900 border-primary/20 min-w-[160px] rounded-none">
                              <DropdownMenuItem asChild>
                                <Link to={`/project/${project.id}`} className="text-[10px] font-black uppercase tracking-widest py-3 cursor-pointer">OPEN_UNIT</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/pcb?project=${project.id}`} className="text-[10px] font-black uppercase tracking-widest py-3 cursor-pointer text-primary">SYNC_PCB_CORE</Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-primary/10" />
                              <DropdownMenuItem
                                onClick={() => deleteProject(project.id)}
                                className="text-destructive text-[10px] font-black uppercase tracking-widest py-3 cursor-pointer"
                              >
                                PURGE_REGISTRY
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="p-6 flex-1 space-y-4">
                          <div>
                            <span className="text-[7px] font-mono text-primary/40 font-bold uppercase tracking-[0.4em]">UID: {project.id.substring(0, 10).toUpperCase()}</span>
                            <h3 className="text-lg font-black uppercase tracking-tight group-hover:text-primary transition-colors mt-1">{project.name}</h3>
                          </div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide line-clamp-2 opacity-50 leading-relaxed">
                            {project.description}
                          </p>
                        </div>
                        <div className="px-5 py-4 border-t border-primary/5 bg-black/20 flex items-center justify-between">
                          <span className="text-[8px] font-mono font-black text-primary/40 uppercase tracking-widest">TS: {getRelativeTime(project.updatedAt)}</span>
                          <span className="text-[8px] font-black uppercase tracking-widest px-3 py-1 border border-primary/10 text-muted-foreground/60">{categoryLabels[project.category]}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar (3/12) */}
          <div className="lg:col-span-3 space-y-8 flex flex-col">
            {/* System Metrics */}
            <div className="blueprint-card p-6 border-primary/20 bg-primary/5 space-y-4 relative overflow-hidden">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-3xl" />
              <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2 relative z-10">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Live_Metrics
              </h4>
              <div className="space-y-5 relative z-10">
                {[
                  { label: "UPTIME", val: "99.98%" },
                  { label: "LATENCY", val: "22MS" },
                  { label: "BUFFER", val: "STABLE" },
                  { label: "THREADS", val: "12_ACTIVE" }
                ].map(metric => (
                  <div key={metric.label} className="flex justify-between items-center border-b border-primary/5 pb-2">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">{metric.label}</span>
                    <span className="text-[10px] font-mono font-bold text-primary">{metric.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity Stream */}
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-2 px-1">
                <span className="h-0.5 w-3 bg-primary/40" />
                <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Activity_Stream</h2>
              </div>
              {projects.slice(0, 4).map(p => (
                <div key={`act-${p.id}`} className="blueprint-card p-4 border-primary/10 bg-primary/[0.02] flex flex-col gap-2 group">
                  <div className="flex justify-between items-start">
                    <span className="text-[7px] font-mono font-bold text-primary opacity-40 uppercase">DATA_SYNC_NODE_0{projects.indexOf(p)}</span>
                    <span className="h-1 w-1 bg-success rounded-full group-hover:animate-ping" />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-foreground leading-tight">{p.name}_REGISTERED</p>
                  <span className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-widest">{getRelativeTime(p.updatedAt)}</span>
                </div>
              ))}
              <div className="text-[10px] font-mono text-primary/40 text-center pt-4 opacity-50 animate-pulse">AWAITING_NEW_TRANSMISSIONS...</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
