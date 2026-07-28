"use client";

import { getProjects } from "@/features/(workspace)/api";
import type { Project } from "@/features/(workspace)/types";
import { useQuery } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const ACTIVE_PROJECT_KEY = "activeProjectId";

type ProjectContextType = {
  projects: Project[];
  activeProject: Project | null;
  handleSetActiveProjectId: (projectId: string) => void;
  isLoading: boolean;
};

const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { data: projects = [], isPending } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (!projects.length) {
      return;
    }

    const storedProjectId = localStorage.getItem(ACTIVE_PROJECT_KEY);
    const hasStoredProject = projects.some(
      (project) => project.id === storedProjectId,
    );

    if (storedProjectId && hasStoredProject) {
      setActiveProjectId(storedProjectId);
      return;
    }

    setActiveProjectId(projects[0].id);
    localStorage.setItem(ACTIVE_PROJECT_KEY, projects[0].id);
  }, [projects]);

  const handleSetActiveProjectId = useCallback((projectId: string) => {
    localStorage.setItem(ACTIVE_PROJECT_KEY, projectId);
    setActiveProjectId(projectId);
  }, []);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? null,
    [activeProjectId, projects],
  );

  const value = useMemo(
    () => ({
      projects,
      activeProject,
      handleSetActiveProjectId,
      isLoading: isPending,
    }),
    [activeProject, isPending, projects, handleSetActiveProjectId],
  );

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}

export const useProject = () => {
  const context = useContext(ProjectContext);

  if (!context) {
    throw new Error("useProject must be used within ProjectProvider");
  }

  return context;
};
