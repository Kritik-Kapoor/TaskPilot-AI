"use client";

import ConfirmationDialog from "@/components/common/dialogs/ConfirmationDialogl";
import useProfilePage from "@/features/(auth)/hooks/useProfilePage";
import { formatDisplayName } from "@/lib/utils/common";
import { formatDate } from "@/lib/utils/dateFormatting";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const ProfilePage = () => {
  const {
    user,
    form,
    isLoading,
    isSaving,
    isDeleting,
    isDeleteDialogOpen,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDeleteAccount,
  } = useProfilePage();

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Loading profile…</p>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
          <p className="text-sm text-muted-foreground">
            Manage your personal account details.
          </p>
        </div>

        <form
          className="max-w-md space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <form.AppField name="username">
            {(field) => (
              <field.Input
                label="Username"
                disabled={isSaving}
                autoComplete="username"
              />
            )}
          </form.AppField>

          <form.AppField name="email">
            {(field) => (
              <field.Input
                label="Email"
                type="email"
                disabled
                autoComplete="email"
              />
            )}
          </form.AppField>

          <Button
            type="submit"
            disabled={isSaving}
            className="bg-gradient-brand text-brand-foreground shadow-elegant hover:opacity-95"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </form>

        <div className="max-w-md space-y-5">
          <div className="space-y-1">
            <p className="text-sm font-medium">Joined on</p>
            <p className="text-sm text-muted-foreground">
              {user?.joinedOn ? formatDate(user.joinedOn) : "—"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">Organization</p>
            <p className="text-sm text-muted-foreground">
              {user?.organizationName
                ? formatDisplayName(user.organizationName)
                : "Not part of an organization"}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Projects</p>
            {user?.projects && user.projects.length > 0 ? (
              <ul className="space-y-1 text-sm text-muted-foreground">
                {user.projects.map((project) => (
                  <li key={project.projectId}>
                    {formatDisplayName(project.projectName)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No projects yet</p>
            )}
          </div>
        </div>

        <div>
          <Button
            type="button"
            variant="destructive"
            onClick={openDeleteDialog}
            disabled={isDeleting}
          >
            Delete account
          </Button>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        callbackFn={confirmDeleteAccount}
        title="Delete your account?"
        description="This will permanently delete your account and remove your access to all projects. This action cannot be undone."
        btnText="account"
        isLoading={isDeleting}
      />
    </>
  );
};

export default ProfilePage;
