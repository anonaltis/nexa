import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Calendar, 
  Tag, 
  Cpu, 
  Code, 
  FileText, 
  ExternalLink,
  Clock
} from "lucide-react";
import type { Project, ProjectStatus } from "@/types/project";

interface ProjectDetailsPanelProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusLabels: Record<ProjectStatus, string> = {
  planning: "Planning",
  designing: "Designing",
  coding: "Coding",
  building: "Building",
  testing: "Testing",
  completed: "Completed",
};

const ProjectDetailsPanel = ({ project, open, onOpenChange }: ProjectDetailsPanelProps) => {
  if (!project) return null;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] bg-card border-border">
        <SheetHeader>
          <SheetTitle className="text-xl">{project.name}</SheetTitle>
          <SheetDescription>{project.description}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status & Category */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
              {statusLabels[project.status]}
            </Badge>
            <Badge variant="outline">
              {project.category.toUpperCase()}
            </Badge>
          </div>

          {/* Metadata */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Created: {formatDate(project.createdAt)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Updated: {formatDate(project.updatedAt)}</span>
            </div>
            {project.tags.length > 0 && (
              <div className="flex items-start gap-3 text-sm">
                <Tag className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex flex-wrap gap-1">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded bg-muted text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                asChild
                variant="outline"
                className="justify-start gap-2"
              >
                <Link to={`/chat?project=${project.id}`}>
                  <FileText className="w-4 h-4" />
                  Edit Plan
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="justify-start gap-2"
              >
                <Link to={`/pcb?project=${project.id}`}>
                  <Cpu className="w-4 h-4" />
                  View PCB
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="justify-start gap-2"
              >
                <Link to={`/code?project=${project.id}`}>
                  <Code className="w-4 h-4" />
                  Edit Code
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="justify-start gap-2"
              >
                <Link to={`/project/${project.id}`}>
                  <ExternalLink className="w-4 h-4" />
                  Full View
                </Link>
              </Button>
            </div>
          </div>

          {/* Planning Document Preview */}
          {project.planningDoc && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Planning Document</h4>
              <div className="blueprint-card p-4 text-sm">
                <p className="text-muted-foreground">{project.planningDoc.purpose}</p>
                {project.planningDoc.components && project.planningDoc.components.length > 0 && (
                  <div className="mt-3">
                    <span className="text-xs text-muted-foreground uppercase">Components:</span>
                    <ul className="mt-1 space-y-1">
                      {project.planningDoc.components.slice(0, 3).map((comp) => (
                        <li key={comp.id} className="text-xs">
                          {comp.quantity}x {comp.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProjectDetailsPanel;
