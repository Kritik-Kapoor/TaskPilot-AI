import type { OrganizationDetails } from "@/features/(workspace)/organization/types";
import { formatDisplayName } from "@/lib/utils/common";
import { formatDate } from "@/lib/utils/dateFormatting";
import { FileText } from "lucide-react";

type OrganizationDetailsCardProps = {
  organization: OrganizationDetails;
};

const detailRows = (organization: OrganizationDetails) => [
  { label: "Name", value: formatDisplayName(organization.orgName) },
  { label: "Slug", value: `@${organization.orgName}` },
  {
    label: "Description",
    value:
      organization.description?.trim() || "No description provided",
  },
  { label: "Owner", value: organization.owner.username },
  { label: "Created on", value: formatDate(organization.createdAt) },
  {
    label: "Members",
    value: `${organization.members.length} ${
      organization.members.length === 1 ? "member" : "members"
    }`,
  },
  {
    label: "Projects",
    value: `${organization.projects.length} ${
      organization.projects.length === 1 ? "project" : "projects"
    }`,
  },
];

const OrganizationDetailsCard = ({
  organization,
}: OrganizationDetailsCardProps) => {
  return (
    <section className="rounded-xl border bg-card shadow-sm">
      <div className="border-b px-5 py-4">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-muted-foreground" />
          <div>
            <h2 className="font-semibold">Details</h2>
            <p className="text-sm text-muted-foreground">
              Basic organization information
            </p>
          </div>
        </div>
      </div>

      <dl className="divide-y">
        {detailRows(organization).map((row) => (
          <div
            key={row.label}
            className="grid gap-1 px-5 py-3 sm:grid-cols-[120px_1fr]"
          >
            <dt className="text-sm text-muted-foreground">{row.label}</dt>
            <dd className="text-sm font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

export default OrganizationDetailsCard;
