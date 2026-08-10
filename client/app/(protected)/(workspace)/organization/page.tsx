"use client";

import {
  OrganizationDetailsCard,
  OrganizationHeader,
  OrganizationPageSkeleton,
  OrganizationStats,
  OrganizationTeamList,
} from "@/features/(workspace)/organization/components";
import useOrganizationPage from "@/features/(workspace)/organization/hooks/useOrganizationPage";

const OrganizationPage = () => {
  const { organization, isLoading, isError, isOrgAdmin } = useOrganizationPage();

  if (isLoading) {
    return <OrganizationPageSkeleton />;
  }

  if (isError || !organization) {
    return (
      <p className="text-sm text-muted-foreground">
        Failed to load organization details. Please refresh the page.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <OrganizationHeader
        organization={organization}
        canManage={isOrgAdmin}
      />
      <OrganizationStats organization={organization} />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <OrganizationTeamList
          organization={organization}
          canManage={isOrgAdmin}
        />
        <OrganizationDetailsCard organization={organization} />
      </div>
    </div>
  );
};

export default OrganizationPage;
