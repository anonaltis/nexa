import { createContext, useContext, ReactNode } from "react";
import { useProjects } from "@/hooks/useProjects";
import type { Project, ProjectStatus, ProjectCategory } from "@/types/project";

interface ProjectContextType {
  projects: Project[];
  isLoading: boolean;
  createProject: (name: string, description: string, category: ProjectCategory, tags?: string[]) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getProject: (id: string) => Project | undefined;
  updateProjectStatus: (id: string, status: ProjectStatus) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const projectHook = useProjects();

  return (
    <ProjectContext.Provider value={projectHook}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjectContext = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProjectContext must be used within a ProjectProvider");
  }
  return context;
};
