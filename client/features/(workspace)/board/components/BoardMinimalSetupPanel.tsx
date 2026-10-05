"use client";

import { Button } from "@/components/ui/button";
import { SlidersHorizontal, Sparkles } from "lucide-react";

type BoardMinimalSetupPanelProps = {
  onOpenConfiguration: () => void;
  onOpenAssistant: () => void;
};

const BoardMinimalSetupPanel = ({
  onOpenConfiguration,
  onOpenAssistant,
}: BoardMinimalSetupPanelProps) => (
  <div className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-8 py-12 text-center">
    <p className="max-w-md text-sm text-muted-foreground">
      Create more columns through{" "}
      <span className="font-medium text-foreground">
        Configuration → Stages
      </span>{" "}
      or through our AI assistant.
    </p>
    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
      <Button type="button" variant="outline" onClick={onOpenConfiguration}>
        <SlidersHorizontal className="mr-2 h-4 w-4" />
        Open stages configuration
      </Button>
      <Button
        type="button"
        className="bg-gradient-brand text-brand-foreground"
        onClick={onOpenAssistant}
      >
        <Sparkles className="mr-2 h-4 w-4" />
        Go to AI assistant
      </Button>
    </div>
  </div>
);

export default BoardMinimalSetupPanel;
