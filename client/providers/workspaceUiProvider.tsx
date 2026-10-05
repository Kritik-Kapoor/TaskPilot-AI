"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ConfigurationSection } from "@/features/(workspace)/configuration/types";

type WorkspaceUiContextValue = {
  isConfigOpen: boolean;
  configSection: ConfigurationSection;
  openConfiguration: (section?: ConfigurationSection) => void;
  closeConfiguration: () => void;
  setConfigSection: (section: ConfigurationSection) => void;
};

const WorkspaceUiContext = createContext<WorkspaceUiContextValue | null>(null);

export function WorkspaceUiProvider({ children }: { children: ReactNode }) {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configSection, setConfigSection] =
    useState<ConfigurationSection>("labels");

  const openConfiguration = useCallback((section?: ConfigurationSection) => {
    if (section) setConfigSection(section);
    setIsConfigOpen(true);
  }, []);

  const closeConfiguration = useCallback(() => setIsConfigOpen(false), []);

  const value = useMemo(
    () => ({
      isConfigOpen,
      configSection,
      openConfiguration,
      closeConfiguration,
      setConfigSection,
    }),
    [isConfigOpen, configSection, openConfiguration, closeConfiguration],
  );

  return (
    <WorkspaceUiContext.Provider value={value}>
      {children}
    </WorkspaceUiContext.Provider>
  );
}

export const useWorkspaceUi = () => {
  const ctx = useContext(WorkspaceUiContext);
  if (!ctx) {
    throw new Error("useWorkspaceUi must be used within WorkspaceUiProvider");
  }
  return ctx;
};
