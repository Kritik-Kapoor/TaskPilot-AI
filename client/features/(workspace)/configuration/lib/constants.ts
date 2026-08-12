import { Shapes, Tag, Workflow } from "lucide-react";
import type { ConfigurationSection } from "../types";

export const CONFIGURATION_SECTIONS: Array<{
  id: ConfigurationSection;
  title: string;
  description: string;
  icon: typeof Tag;
}> = [
  {
    id: "labels",
    title: "Labels",
    description: "Tag tickets for filtering",
    icon: Tag,
  },
  {
    id: "statuses",
    title: "Stage",
    description: "Board columns",
    icon: Workflow,
  },
  {
    id: "types",
    title: "Issue types",
    description: "Story, Bug, Task…",
    icon: Shapes,
  },
];

