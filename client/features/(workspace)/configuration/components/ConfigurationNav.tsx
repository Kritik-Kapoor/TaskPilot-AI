"use client";

import { CONFIGURATION_SECTIONS } from "@/features/(workspace)/configuration/lib/constants";
import type { ConfigurationSection } from "@/features/(workspace)/configuration/types";
import { cn } from "@/lib/utils";

type ConfigurationNavProps = {
  section: ConfigurationSection;
  onSectionChange: (section: ConfigurationSection) => void;
};

const ConfigurationNav = ({
  section,
  onSectionChange,
}: ConfigurationNavProps) => {
  return (
    <aside className="border-r border-border bg-muted/30 p-3">
      <div className="px-2 pb-3 pt-1">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Project
        </div>
        <div className="text-sm font-semibold">Configuration</div>
      </div>
      <nav className="space-y-1">
        {CONFIGURATION_SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSectionChange(item.id)}
            className={cn(
              "w-full rounded-md px-2.5 py-2 text-left transition-colors flex items-start gap-2.5",
              section === item.id
                ? "bg-background shadow-card text-foreground"
                : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
            )}
          >
            <item.icon className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="min-w-0">
              <span className="block text-sm font-medium leading-tight">
                {item.title}
              </span>
              <span className="block text-[10px] text-muted-foreground truncate">
                {item.description}
              </span>
            </span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default ConfigurationNav;
