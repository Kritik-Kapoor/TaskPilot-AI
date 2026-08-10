"use client";

import { Badge } from "@/components/ui/badge";
import { formatOrganizationRole } from "@/features/(workspace)/organization/lib/constants";
import type { OrganizationDetails } from "@/features/(workspace)/organization/types";
import { formatDisplayName, getColor, initialsOf } from "@/lib/utils/common";
import { Crown } from "lucide-react";
import Link from "next/link";

type OrganizationTeamListProps = {
  organization: OrganizationDetails;
  canManage: boolean;
};

const OrganizationTeamList = ({
  organization,
  canManage,
}: OrganizationTeamListProps) => {
  return (
    <section className="rounded-xl border bg-card shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
        <div>
          <h2 className="font-semibold">Team</h2>
          <p className="text-sm text-muted-foreground">
            {organization.members.length}{" "}
            {organization.members.length === 1 ? "person" : "people"} in{" "}
            {formatDisplayName(organization.orgName)}
          </p>
        </div>
        {canManage && (
          <Link
            href="/user-management"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Manage
          </Link>
        )}
      </div>

      <ul className="divide-y">
        {organization.members.map((member) => {
          const color = getColor(member.username);
          const isOwner = member.organizationRole === "OWNER";

          return (
            <li
              key={member.id}
              className="flex items-center justify-between gap-4 px-5 py-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                  }}
                >
                  {initialsOf(member.username)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-medium">{member.username}</p>
                    {isOwner && (
                      <Crown className="size-3.5 shrink-0 text-amber-500" />
                    )}
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {member.email}
                  </p>
                </div>
              </div>

              <Badge variant="outline" className="shrink-0 capitalize">
                {formatOrganizationRole(member.organizationRole)}
              </Badge>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default OrganizationTeamList;
