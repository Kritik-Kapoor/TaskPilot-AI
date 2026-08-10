import type { OrganizationDetails } from "@/features/(workspace)/organization/types";
import { Crown, FolderKanban, Users } from "lucide-react";

type OrganizationStatsProps = {
  organization: OrganizationDetails;
};

const OrganizationStats = ({ organization }: OrganizationStatsProps) => {
  const stats = [
    {
      label: "Members",
      value: organization.members.length,
      description: "across all projects",
      icon: Users,
    },
    {
      label: "Projects",
      value: organization.projects.length,
      description: "active workspaces",
      icon: FolderKanban,
    },
    {
      label: "Owner",
      value: organization.owner.username,
      description: organization.owner.email,
      icon: Crown,
    },
  ] as const;

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <article
          key={stat.label}
          className="rounded-xl border bg-card p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="truncate text-2xl font-semibold tracking-tight">
                {stat.value}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {stat.description}
              </p>
            </div>
            <div className="grid size-9 place-items-center rounded-lg bg-muted/60 text-muted-foreground">
              <stat.icon className="size-4" />
            </div>
          </div>
        </article>
      ))}
    </section>
  );
};

export default OrganizationStats;
