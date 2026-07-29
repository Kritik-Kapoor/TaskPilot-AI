"use client";

import FormDialog from "@/components/common/dialogs/FormDialog";
import BoardColumns from "@/features/(workspace)/board/components/BoardColumns";
import BoardToolbar from "@/features/(workspace)/board/components/BoardToolbar";
import CreateTicketForm from "@/features/(workspace)/board/components/CreateTickerForm";
import useBoardPage from "@/features/(workspace)/board/hooks/useBoardPage";
import { formatDisplayName } from "@/features/(workspace)/lib/utils";

const BoardPage = () => {
  const { state, actions } = useBoardPage({
    defaultCreateTicketStatus: "todo",
  });

  return (
    <>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <BoardToolbar state={state} actions={actions} />
        <BoardColumns
          columns={state.columns}
          ticketsByColumn={state.ticketsByColumn}
          snapshotRef={state.snapshotRef}
          setTicketsByColumn={actions.setTicketsByColumn}
          onTicketReposition={actions.handleTicketReposition}
        />
      </div>

      <FormDialog
        isOpen={state.isCreateTicketOpen}
        onClose={actions.closeCreateTicketDialog}
        title="Create ticket"
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl md:max-w-2xl"
        closeOnOutsideClick={!state.isSubmittingCreateTicket}
      >
        <CreateTicketForm
          form={state.createTicketForm}
          isSubmitting={state.isSubmittingCreateTicket}
          members={state.members}
          projectName={
            state.activeProject
              ? formatDisplayName(state.activeProject.projectName)
              : undefined
          }
          onCancel={actions.closeCreateTicketDialog}
        />
      </FormDialog>
    </>
  );
};

export default BoardPage;
