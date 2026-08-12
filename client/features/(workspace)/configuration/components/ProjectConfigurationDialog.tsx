"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ConfigurationSection } from "@/features/(workspace)/configuration/types";
import type { ReactNode } from "react";
import {
  ConfigurationNav,
  LabelsSection,
  StatusesSection,
  TypesSection,
} from ".";

type ProjectConfigurationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section: ConfigurationSection;
  onSectionChange: (section: ConfigurationSection) => void;
  activeSectionTitle: string;
  activeSectionDescription: string;
  canManageLabels: boolean;
  isProjectAdmin: boolean;
  trigger?: ReactNode;
};

const ProjectConfigurationDialog = ({
  open,
  onOpenChange,
  section,
  onSectionChange,
  activeSectionTitle,
  activeSectionDescription,
  canManageLabels,
  isProjectAdmin,
  trigger,
}: ProjectConfigurationDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger}
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden">
        <div className="grid grid-cols-[220px_1fr] min-h-130">
          <ConfigurationNav
            section={section}
            onSectionChange={onSectionChange}
          />

          <div className="flex flex-col">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-border text-left">
              <DialogTitle className="text-lg">
                {activeSectionTitle}
              </DialogTitle>
              <DialogDescription>{activeSectionDescription}</DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 max-h-[60vh]">
              <div className="px-6 py-5">
                {section === "labels" && (
                  <LabelsSection canManage={canManageLabels} />
                )}
                {section === "statuses" && (
                  <StatusesSection canManage={isProjectAdmin} />
                )}
                {section === "types" && (
                  <TypesSection canManage={isProjectAdmin} />
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectConfigurationDialog;
