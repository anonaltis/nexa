import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useProjectContext } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Plus, 
  Folder, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Settings, 
  MoreHorizontal,
  Cpu,
  Bot,
  Code,
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { ProjectStatus, ProjectCategory } from "@/types/project";

const statusConfig: Record<ProjectStatus, { label: string; color: string; icon: typeof Clock }> = {
  planning: { label: "Planning", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Clock },
  designing: { label: "Designing", color: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: Cpu },
  coding: { label: "Coding", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Code },
  building: { label: "Building", color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: Settings },
  testing: { label: "Testing", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30", icon: AlertCircle },
  completed: { label: "Completed", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle2 },
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

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return formatDate(date);
  };

  if (!user) {
    return (
      <Layout>
        <div className="py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to view your dashboard</h1>
          <Button asChild>
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="text-muted-foreground">Manage your electronics projects</p>
          </div>
          <Button asChild className="bg-primary hover:bg-primary/90 gap-2">
            <Link to="/chat">
              <Plus className="w-4 h-4" />
              New Project
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="blueprint-card p-4">
            <div className="text-3xl font-bold text-primary font-mono">{projects.length}</div>
            <div className="text-sm text-muted-foreground">Total Projects</div>
          </div>
          <div className="blueprint-card p-4">
            <div className="text-3xl font-bold text-yellow-400 font-mono">
              {projects.filter(p => p.status === 'designing' || p.status === 'building').length}
            </div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </div>
          <div className="blueprint-card p-4">
            <div className="text-3xl font-bold text-green-400 font-mono">
              {projects.filter(p => p.status === 'completed').length}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
          <div className="blueprint-card p-4">
            <div className="text-3xl font-bold text-blue-400 font-mono">
              {projects.filter(p => p.status === 'planning').length}
            </div>
            <div className="text-sm text-muted-foreground">Planning</div>
          </div>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="blueprint-card p-12 text-center">
            <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">No projects yet</h2>
            <p className="text-muted-foreground mb-6">
              Start by creating your first electronics project with AI assistance.
            </p>
            <Button asChild className="bg-primary hover:bg-primary/90 gap-2">
              <Link to="/chat">
                <Bot className="w-4 h-4" />
                Start with AI
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => {
              const status = statusConfig[project.status];
              const StatusIcon = status.icon;
              
              return (
                <div key={project.id} className="blueprint-card p-5 hover:border-primary/50 transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={status.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {categoryLabels[project.category]}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-border">
                        <DropdownMenuItem asChild>
                          <Link to={`/project/${project.id}`} className="flex items-center gap-2">
                            <Folder className="w-4 h-4" />
                            Open Project
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/pcb?project=${project.id}`} className="flex items-center gap-2">
                            <Cpu className="w-4 h-4" />
                            View PCB
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/code?project=${project.id}`} className="flex items-center gap-2">
                            <Code className="w-4 h-4" />
                            Edit Code
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => deleteProject(project.id)}
                          className="text-destructive flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <Link to={`/project/${project.id}`}>
                    <h3 className="font-semibold text-lg mb-2 hover:text-primary transition-colors">
                      {project.name}
                    </h3>
                  </Link>
                  
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {project.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-mono">Updated {getRelativeTime(project.updatedAt)}</span>
                    <div className="flex gap-1">
                      {project.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded bg-muted">
                          {tag}
                        </span>
                      ))}
                      {project.tags.length > 2 && (
                        <span className="px-2 py-0.5 rounded bg-muted">
                          +{project.tags.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
