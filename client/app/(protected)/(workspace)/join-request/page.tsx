"use client";

import { DataTable } from "@/components/common/table";
import JoinRequestToolbar from "@/features/(workspace)/join-request/components/JoinRequestToolbar";
import useJoinRequestPage from "@/features/(workspace)/join-request/hooks/useJoinRequestPage";

const JoinRequestPage = () => {
  const { state, actions } = useJoinRequestPage();

  if (!state.canManage) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <JoinRequestToolbar
          query={state.query}
          totalCount={0}
          filteredCount={0}
          pendingCount={0}
          setQuery={actions.setQuery}
        />
        <div className="flex flex-1 items-center justify-center pt-4">
          <p className="text-sm text-muted-foreground">
            Only organization admins can review join requests.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <JoinRequestToolbar
        query={state.query}
        totalCount={state.totalCount}
        filteredCount={state.filteredCount}
        pendingCount={state.pendingCount}
        setQuery={actions.setQuery}
      />
      <div className="min-h-0 flex-1 overflow-auto pt-4">
        <DataTable
          columns={state.columns}
          data={state.joinRequests}
          emptyDataText={
            state.isJoinRequestsError
              ? "Failed to load join requests"
              : state.isJoinRequestsLoading
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

export default JoinRequestPage;
