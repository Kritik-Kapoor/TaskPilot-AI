"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { OrganizationDetails } from "@/features/(workspace)/organization/types";
import { formatDisplayName, getColor, initialsOf } from "@/lib/utils/common";
import { formatDate } from "@/lib/utils/dateFormatting";
import { CalendarDays, FolderKanban, Pencil } from "lucide-react";
import Link from "next/link";

type OrganizationHeaderProps = {
  organization: OrganizationDetails;
  canManage: boolean;
};

const OrganizationHeader = ({
  organization,
  canManage,
}: OrganizationHeaderProps) => {
  const color = getColor(organization.orgName);

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className="grid size-14 shrink-0 place-items-center rounded-2xl text-lg font-semibold text-white shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            }}
          >
            {initialsOf(organization.orgName)}
          </div>

          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {formatDisplayName(organization.orgName)}
              </h1>
              <Badge variant="outline" className="font-mono text-xs">
                @{organization.orgName}
              </Badge>
            </div>
            <p className="max-w-2xl text-sm text-muted-foreground">
              {organization.description?.trim() ||
                "No description provided for this organization."}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4" />
                Created {formatDate(organization.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {canManage && (
            <Button variant="outline" size="sm" disabled>
              <Pencil className="size-4" />
              Edit
            </Button>
          )}
          <Button size="sm" asChild>
            <Link href="/projects">
              <FolderKanban className="size-4" />
              View projects
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default OrganizationHeader;
