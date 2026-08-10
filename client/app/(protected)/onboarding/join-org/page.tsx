"use client";

import Link from "next/link";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrgCard } from "@/components/common/OrgCard";
import useJoinOrgPage from "@/features/(onboarding)/hooks/useJoinOrgPage";
import type { JoinRequestStatus } from "@/features/(onboarding)/types";

const JOIN_REQUEST_STATUS_MESSAGES: Record<
  JoinRequestStatus,
  { message: string; className: string }
> = {
  PENDING: {
    message: "Request sent. An admin will review it shortly.",
    className: "text-success",
  },
  DECLINED: {
    message: "Your request was declined. You can send a new request.",
    className: "text-destructive",
  },
  APPROVED: {
    message: "Your request was approved.",
    className: "text-success",
  },
};

const getOrgCardAction = (
  status: JoinRequestStatus | undefined,
): "join" | "requested" | "declined" => {
  if (status === "PENDING" || status === "APPROVED") {
    return "requested";
  }

  return "join";
};

const JoinOrgPage = () => {
  const {
    state: {
      query,
      searchedOrganizations,
      myJoinRequests,
      isSearching,
      isLoadingJoinRequests,
      joinRequestsError,
      requestingOrganizationId,
      searchError,
      getOrgJoinRequestStatus,
    },
    actions: { setQuery, requestJoin },
  } = useJoinOrgPage();

  return (
    <div>
      <Link
        href="/onboarding"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <h1 className="text-3xl font-semibold tracking-tight">
        Join your team&apos;s workspace
      </h1>
      <p className="mt-2 text-muted-foreground">
        Search for an organization by name. If you find yours, we&apos;ll send
        an admin your request to join.
      </p>

      <div className="relative mt-8">
        <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-12 pl-10 text-base"
          placeholder="Search by organization name…"
          autoFocus
        />
        {isSearching && (
          <Loader2 className="absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      <div className="mt-6 space-y-3">
        {joinRequestsError && (
          <div className="rounded-xl border border-dashed border-red-500 bg-red-50 p-8 text-center">
            <p className="text-sm font-medium text-red-500">
              Sorry, something went wrong!
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Error loading your join requests. Please refresh the page.
            </p>
          </div>
        )}

        {!query.trim() && isLoadingJoinRequests && (
          <div className="rounded-xl border border-dashed border-border bg-surface-elevated p-8 text-center">
            <Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              Loading your join requests...
            </p>
          </div>
        )}

        {!query.trim() &&
          !isLoadingJoinRequests &&
          myJoinRequests.length > 0 && (
            <div className="space-y-3">
              <div>
                <h2 className="text-sm font-medium text-foreground">
                  Your join requests
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Organizations you&apos;ve requested to join and their status.
                </p>
              </div>

              {myJoinRequests.map((request) => {
                const action =
                  request.status === "PENDING" || request.status === "APPROVED"
                    ? "requested"
                    : "declined";

                return (
                  <div key={request.organization.id}>
                    <OrgCard org={request.organization} action={action} />
                    <p
                      className={`mt-1.5 ml-1 text-xs ${JOIN_REQUEST_STATUS_MESSAGES[request.status].className}`}
                    >
                      {JOIN_REQUEST_STATUS_MESSAGES[request.status].message}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

        {searchError && (
          <div className="rounded-xl border border-dashed border-red-500 bg-red-50 p-8 text-center">
            <p className="text-sm font-medium text-red-500">
              Sorry, something went wrong!
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Error searching organizations. Please try again.
            </p>
          </div>
        )}

        {isSearching && (
          <div className="rounded-xl border border-dashed border-border bg-surface-elevated p-8 text-center">
            <p className="text-sm font-medium text-foreground">
              Searching for organizations matching &quot;{query}&quot;
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Double-check the spelling or ask a teammate for the exact name.
            </p>
            <Loader2 className="mx-auto mt-4 h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {query.trim() &&
          !isSearching &&
          searchedOrganizations?.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-surface-elevated p-8 text-center">
              <p className="text-sm font-medium text-foreground">
                No organizations found for &quot;{query}&quot;
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Double-check the spelling or ask a teammate for the exact name.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/onboarding/create-org">Create it instead</Link>
              </Button>
            </div>
          )}

        {!query.trim() &&
          !isLoadingJoinRequests &&
          myJoinRequests.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Start typing to search for organizations.
            </p>
          )}

        {searchedOrganizations?.map((org) => {
          const requestStatus = getOrgJoinRequestStatus(org.id);
          const action = getOrgCardAction(requestStatus);
          const statusMessage = requestStatus
            ? JOIN_REQUEST_STATUS_MESSAGES[requestStatus]
            : null;

          return (
            <div key={org.id}>
              <OrgCard
                org={org}
                action={action}
                isLoading={requestingOrganizationId === org.id}
                onAction={
                  action === "join" ? () => requestJoin(org) : undefined
                }
              />
              {statusMessage && action !== "join" && (
                <p className={`mt-1.5 ml-1 text-xs ${statusMessage.className}`}>
                  {statusMessage.message}
                </p>
              )}
              {requestStatus === "DECLINED" && action === "join" && (
                <p
                  className={`mt-1.5 ml-1 text-xs ${JOIN_REQUEST_STATUS_MESSAGES.DECLINED.className}`}
                >
                  {JOIN_REQUEST_STATUS_MESSAGES.DECLINED.message}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-10 text-sm text-muted-foreground">
        Don&apos;t see your team?{" "}
        <Link
          href="/onboarding/create-org"
          className="font-medium text-brand hover:underline"
        >
          Create a new organization
        </Link>
      </div>
    </div>
  );
};

export default JoinOrgPage;
