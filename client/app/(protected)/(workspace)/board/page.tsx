"use client";

import FormDialog from "@/components/common/dialogs/FormDialog";
import CreateTicketForm from "@/features/(workspace)/components/CreateTicketForm";
import BoardColumns from "@/features/(workspace)/board/components/BoardColumns";
import BoardToolbar from "@/features/(workspace)/board/components/BoardToolbar";
import useBoardPage from "@/features/(workspace)/board/hooks/useBoardPage";
import { useAiChat } from "@/features/(workspace)/ai/AiChatProvider";
import { formatDisplayName } from "@/lib/utils/common";
import { ChevronRight } from "lucide-react";
import { useProject } from "@/providers/projectProvider";
import { useWorkspaceUi } from "@/providers/workspaceUiProvider";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const BoardPage = () => {
  const { state, actions } = useBoardPage();
  const { pendingAction, consumeAction } = useAiChat();
  const { buildWorkspacePath } = useProject();
  const { openConfiguration } = useWorkspaceUi();
  const router = useRouter();
  const appliedRef = useRef(false);

  useEffect(() => {
    if (!pendingAction || appliedRef.current) {
      return;
    }

    if (pendingAction.type === "navigate_board") {
      appliedRef.current = true;
      actions.applyFilters({
        query: pendingAction.filters.query ?? "",
        assignee: pendingAction.filters.assignee ?? [],
        priority: (pendingAction.filters.priority as "all") ?? "all",
        type: pendingAction.filters.type ?? "all",
        labels: pendingAction.filters.labels ?? [],
      });
      consumeAction();
      return () => {
        appliedRef.current = false;
      };
    }

    const boardRefreshOnly =
      pendingAction.type === "create_ticket" ||
      pendingAction.type === "assign_tickets" ||
      pendingAction.type === "apply_labels" ||
      pendingAction.type === "remove_labels" ||
      pendingAction.type === "move_tickets";

    if (boardRefreshOnly) consumeAction();
  }, [pendingAction, consumeAction, actions]);

  const projectName = state.activeProject
    ? formatDisplayName(state.activeProject.projectName)
    : undefined;

  return (
    <>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <BoardToolbar state={state} actions={actions} />
        <BoardColumns
          columns={state.columns}
          dndHandlers={actions.dndHandlers}
          onAddTicket={actions.openCreateTicketDialog}
          isLoading={state.isBoardLoading}
          isFetching={state.isBoardFetching}
          dragDisabled={state.isFiltering}
          isMinimalBoard={state.isMinimalBoard}
          onOpenConfiguration={() => openConfiguration("statuses")}
          onOpenAssistant={() => router.push(buildWorkspacePath("/assistant"))}
        />
      </div>

      <FormDialog
        isOpen={state.isCreateTicketOpen}
        onClose={actions.closeCreateTicketDialog}
        title={
          <div className="flex items-center gap-1">
            <div className="text-lg font-medium">Create ticket</div>
            {projectName && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <ChevronRight className="size-4" strokeWidth={1.5} /> Adding to{" "}
                <span className="font-medium text-foreground">
                  {projectName}
                </span>
              </p>
            )}
          </div>
        }
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl md:max-w-2xl"
        closeOnOutsideClick={!state.isSubmittingCreateTicket}
      >
        <CreateTicketForm
          form={state.createTicketForm}
          isSubmitting={state.isSubmittingCreateTicket}
          members={state.members}
          onCancel={actions.closeCreateTicketDialog}
        />
      </FormDialog>
    </>
  );
};

export default BoardPage;
