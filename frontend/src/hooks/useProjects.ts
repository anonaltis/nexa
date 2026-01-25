
import { useState, useEffect, useCallback } from "react";
import type { Project, ProjectStatus, ProjectCategory } from "@/types/project";
import { api } from "@/lib/api";

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await api.get('/projects/');
      const data = response.data;
      if (data) {
        const formattedProjects: Project[] = data.map((p: any) => ({
          ...p,
          id: p._id || p.id, // Handle MongoDB _id
          createdAt: new Date(p.created_at || p.createdAt), // Handle potential case diff
          updatedAt: new Date(p.updated_at || p.updatedAt)
        }));
        setProjects(formattedProjects);
      }
    } catch (error) {
      console.error('Unexpected error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = useCallback(async (
    name: string,
    description: string,
    category: ProjectCategory,
    tags: string[] = []
  ): Promise<Project | null> => {
    try {
      const response = await api.post('/projects/', {
        name,
        description,
        status: "planning",
        tags,
        category
      });
      const data = response.data;
      if (data) {
        const created: Project = {
          ...data,
          id: data._id || data.id,
          createdAt: new Date(data.created_at || data.createdAt),
          updatedAt: new Date(data.updated_at || data.updatedAt)
        };
        setProjects(prev => [created, ...prev]);
        return created;
      }
    } catch (error) {
      console.error('Error creating project:', error);
    }
    return null;
  }, []);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    try {
      const response = await api.put(`/projects/${id}`, updates);
      if (response.data) {
        setProjects(prev => prev.map(p =>
          p.id === id
            ? { ...p, ...updates, updatedAt: new Date() }
            : p
        ));
      }
    } catch (error) {
      console.error('Error updating project:', error);
    }
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    try {
      await api.delete(`/projects/${id}`);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  }, []);

  const getProject = useCallback((id: string) => {
    return projects.find(p => p.id === id);
  }, [projects]);

  const updateProjectStatus = useCallback(async (id: string, status: ProjectStatus) => {
    await updateProject(id, { status });
  }, [updateProject]);

  return {
    projects,
    isLoading,
    createProject,
    updateProject,
    deleteProject,
    getProject,
    updateProjectStatus,
  };
};

export default useProjects;
