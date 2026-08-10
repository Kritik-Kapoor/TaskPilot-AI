"use client";

import ConfirmationDialog from "@/components/common/dialogs/ConfirmationDialogl";
import ProjectSettingsForm from "@/features/(workspace)/settings/components/ProjectSettingsForm";
import SettingsPageSkeleton from "@/features/(workspace)/settings/components/SettingsPageSkeleton";
import useSettingsPage from "@/features/(workspace)/settings/hooks/useSettingsPage";
import { formatDisplayName } from "@/lib/utils/common";
import { Button } from "@/components/ui/button";

const SettingsPage = () => {
  const {
    activeProject,
    form,
    canManage,
    canDelete,
    isLoading,
    isSaving,
    isDeleting,
    isDeleteDialogOpen,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDeleteProject,
  } = useSettingsPage();

  if (isLoading) {
    return <SettingsPageSkeleton />;
  }

  if (!activeProject) {
    return (
      <p className="text-sm text-muted-foreground">
        Select a project to manage its settings.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Project settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage details for {formatDisplayName(activeProject.projectName)}
          </p>
        </div>

        <ProjectSettingsForm
          form={form}
          projectId={activeProject.id}
          canManage={canManage}
          isSaving={isSaving}
        />

        {canDelete && (
          <div className="max-w-md space-y-2 border-t pt-6">
            <div>
              <p className="text-sm font-medium text-destructive">
                Danger zone
              </p>
              <p className="text-sm text-muted-foreground">
                Permanently delete this project and all of its tickets.
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              onClick={openDeleteDialog}
              disabled={isDeleting}
            >
              Delete project
            </Button>
          </div>
        )}
      </div>

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        callbackFn={confirmDeleteProject}
        title={`Delete ${formatDisplayName(activeProject.projectName)}?`}
        description="This will permanently delete the project and all associated tickets, columns, and labels. This action cannot be undone."
        btnText="project"
        isLoading={isDeleting}
      />
    </>
  );
};

export default SettingsPage;
