"use client";

import { useQuery } from "@tanstack/react-query";
import { useProject } from "@/providers/projectProvider";
import {
  getTicketTypes,
  ticketTypesQueryKey,
} from "@/features/(workspace)/configuration/api";
import type { TicketType } from "@/features/(workspace)/configuration/types";

const useProjectIssueTypes = () => {
  const { activeProject } = useProject();
  const projectId = activeProject?.id ?? null;

  const { data: issueTypes = [], isPending } = useQuery({
    queryKey: ticketTypesQueryKey(projectId ?? ""),
    queryFn: () => getTicketTypes(projectId!),
    enabled: Boolean(projectId),
    select: (types: TicketType[]) => types.filter((t) => t.isEnabled),
  });

  return { issueTypes, isPending };
};

export default useProjectIssueTypes;
