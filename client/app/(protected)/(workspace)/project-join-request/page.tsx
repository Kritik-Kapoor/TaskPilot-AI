"use client";

import { DataTable } from "@/components/common/table";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Search } from "lucide-react";
import useProjectJoinRequestPage from "@/features/(workspace)/project-join-request/hooks/useProjectJoinRequestPage";
import { formatDisplayName } from "@/lib/utils/common";

const ProjectJoinRequestPage = () => {
  const {
    state: {
      query,
      activeProject,
      isProjectAdmin,
      joinRequests,
      totalCount,
      filteredCount,
      pendingCount,
      columns,
      isJoinRequestsLoading,
      isJoinRequestsError,
    },
    actions: { setQuery },
  } = useProjectJoinRequestPage();

  if (!isProjectAdmin) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Only project admins can review join requests.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 space-y-4 bg-background">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Project join requests
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeProject
                ? `${formatDisplayName(activeProject.projectName)} · `
                : ""}
              {filteredCount === totalCount
                ? `${totalCount} request${totalCount === 1 ? "" : "s"}`
                : `${filteredCount} of ${totalCount} requests`}
              {pendingCount > 0 ? ` · ${pendingCount} pending` : ""}
            </p>
          </div>

          <InputGroup className="h-9 w-56">
            <InputGroupAddon>
              <Search className="h-4 w-4 text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </InputGroup>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto pt-4">
        <DataTable
          columns={columns}
          data={joinRequests}
          emptyDataText={
            isJoinRequestsError
              ? "Failed to load join requests"
              : isJoinRequestsLoading
                ? "Loading join requests…"
                : "No join requests found"
          }
          isPaginated
          pageSize={10}
        />
      </div>
    </div>
  );
};

export default ProjectJoinRequestPage;
