import { FolderKanban, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Org } from "@/lib/mock-orgs";

type Props = {
  org: Org;
  action?: "join" | "taken" | "none";
  onAction?: () => void;
};

export function OrgCard({ org, action = "none", onAction }: Props) {
  const initials = org.name
    .split(" ")
    .map((word: string) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card transition-all hover:border-brand/40 hover:shadow-elegant">
      <div
        className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-sm font-semibold text-white shadow-card"
        style={{
          background: `linear-gradient(135deg, ${org.color}, ${org.color}cc)`,
        }}
      >
        {initials}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {org.name}
          </h3>
          {action === "taken" && (
            <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wider text-destructive uppercase">
              Taken
            </span>
          )}
        </div>
        {org.description && (
          <p className="truncate text-xs text-muted-foreground">
            {org.description}
          </p>
        )}
        <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <FolderKanban className="h-3.5 w-3.5" />
            {org.projects} {org.projects === 1 ? "project" : "projects"}
          </span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {org.members} {org.members === 1 ? "member" : "members"}
          </span>
        </div>
      </div>

      {action === "join" && (
        <Button size="sm" variant="outline" onClick={onAction}>
          Request to join
        </Button>
      )}
    </div>
  );
}
