import { useState, useEffect, useCallback } from "react";
import type { Project, ProjectStatus, ProjectCategory } from "@/types/project";

const STORAGE_KEY = "electrolab_projects";

// Mock projects for demonstration
const mockProjects: Project[] = [
  {
    id: "1",
    name: "Smart Home Sensor Hub",
    description: "ESP32-based sensor hub for temperature, humidity, and air quality monitoring with MQTT support",
    status: "designing",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    userId: "user-1",
    tags: ["esp32", "mqtt", "sensors", "iot"],
    category: "iot",
  },
  {
    id: "2",
    name: "Motor Driver Board",
    description: "H-bridge motor driver for dual DC motors with current sensing and PWM control",
    status: "building",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    userId: "user-1",
    tags: ["motor", "h-bridge", "pwm"],
    category: "robotics",
  },
  {
    id: "3",
    name: "Audio Amplifier",
    description: "Class D audio amplifier with Bluetooth input and volume control",
    status: "completed",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    userId: "user-1",
    tags: ["audio", "bluetooth", "amplifier"],
    category: "audio",
  },
];

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load projects from localStorage or use mock data
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const projectsWithDates = parsed.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        }));
        setProjects(projectsWithDates);
      } catch (e) {
        console.error("Failed to parse projects:", e);
        setProjects(mockProjects);
      }
    } else {
      setProjects(mockProjects);
    }
    setIsLoading(false);
  }, []);

  // Save projects to localStorage whenever they change
  useEffect(() => {
    if (!isLoading && projects.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    }
  }, [projects, isLoading]);

  const createProject = useCallback((
    name: string, 
    description: string, 
    category: ProjectCategory,
    tags: string[] = []
  ): Project => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      description,
      status: "planning",
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: "current-user", // TODO: Get from auth context
      tags,
      category,
    };
    setProjects(prev => [newProject, ...prev]);
    return newProject;
  }, []);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => 
      p.id === id 
        ? { ...p, ...updates, updatedAt: new Date() }
        : p
    ));
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  }, []);

  const getProject = useCallback((id: string) => {
    return projects.find(p => p.id === id);
  }, [projects]);

  const updateProjectStatus = useCallback((id: string, status: ProjectStatus) => {
    updateProject(id, { status });
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
