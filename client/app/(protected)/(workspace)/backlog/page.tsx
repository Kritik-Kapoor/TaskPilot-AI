"use client";

import { DataTable } from "@/components/common/table";
import FormDialog from "@/components/common/dialogs/FormDialog";
import CreateTicketForm from "@/features/(workspace)/components/CreateTicketForm";
import BacklogToolbar from "@/features/(workspace)/backlog/components/BacklogToolbar";
import useBacklogPage from "@/features/(workspace)/backlog/hooks/useBacklogPage";
import { formatDisplayName } from "@/features/(workspace)/lib/utils";
import { ChevronRight } from "lucide-react";

const BacklogPage = () => {
  const { state, actions } = useBacklogPage();

  const projectName = state.activeProject
    ? formatDisplayName(state.activeProject.projectName)
    : undefined;

  return (
    <>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <BacklogToolbar state={state} actions={actions} />
        <div className="min-h-0 flex-1 overflow-auto pt-4">
          <DataTable columns={state.columns} data={state.tickets} />
        </div>
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
                <span className="font-medium text-foreground">Backlog</span> in{" "}
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

export default BacklogPage;
