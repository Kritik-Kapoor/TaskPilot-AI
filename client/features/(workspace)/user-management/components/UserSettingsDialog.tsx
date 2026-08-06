"use client";

import { useAppForm } from "@/components/common/form/hooks";
import FormDialog from "@/components/common/dialogs/FormDialog";
import { Button } from "@/components/ui/button";
import { SelectItem } from "@/components/ui/select";
import type { OrganizationRole } from "@/features/(auth)/types";
import { formatDisplayName } from "@/lib/utils/common";
import type { Project } from "@/features/(workspace)/types";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import { z } from "zod";
import { formatOrganizationRole, MANAGEABLE_ORG_ROLES } from "../lib/constants";
import {
  canChangeOrganizationUserRole,
  canEditOrganizationUser,
} from "../lib/permissions";
import type { OrganizationUser, UpdateOrganizationUserPayload } from "../types";

const userSettingsSchema = z.object({
  username: z.string(),
  email: z.string(),
  organizationRole: z.enum(["ADMIN", "MEMBER"]),
  projectIds: z.array(z.string()),
});

type UserSettingsDialogProps = {
  user: OrganizationUser | null;
  projects: Project[];
  isOpen: boolean;
  isOrgOwner: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSave: (payload: UpdateOrganizationUserPayload) => void;
};

const UserSettingsDialog = ({
  user,
  projects,
  isOpen,
  isOrgOwner,
  isSaving,
  onClose,
  onSave,
}: UserSettingsDialogProps) => {
  const projectOptions = useMemo(
    () =>
      projects.map((project) => ({
        value: project.id,
        label: formatDisplayName(project.projectName),
      })),
    [projects],
  );

  const form = useAppForm({
    defaultValues: {
      username: "",
      email: "",
      organizationRole: "MEMBER" as Exclude<OrganizationRole, "OWNER">,
      projectIds: [] as string[],
    },
    validators: {
      onSubmit: userSettingsSchema,
    },
    onSubmit: ({ value }) => {
      if (!user || !canEditOrganizationUser(isOrgOwner, user)) return;

      onSave({
        organizationRole: canChangeOrganizationUserRole(isOrgOwner, user)
          ? value.organizationRole
          : user.organizationRole === "ADMIN"
            ? "ADMIN"
            : "MEMBER",
        projectIds: value.projectIds,
      });
    },
  });

  useEffect(() => {
    if (!user) return;

    form.reset({
      username: user.username,
      email: user.email,
      organizationRole: user.isOwner
        ? "ADMIN"
        : ((user.organizationRole === "ADMIN" ? "ADMIN" : "MEMBER") as Exclude<
            OrganizationRole,
            "OWNER"
          >),
      projectIds: user.projects.map((project) => project.projectId),
    });
  }, [form, user]);

  if (!user) return null;

  const canEdit = canEditOrganizationUser(isOrgOwner, user);
  const canChangeRole = canChangeOrganizationUserRole(isOrgOwner, user);
  const roleIsReadOnly = user.isOwner || !canChangeRole;
  const fieldsDisabled = !canEdit || isSaving;

  return (
    <FormDialog
      isOpen={isOpen}
      onClose={onClose}
      title="User settings"
      closeOnOutsideClick={!isSaving}
      className="sm:max-w-md"
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <fieldset disabled={fieldsDisabled} className="space-y-4">
          <form.AppField name="username">
            {(field) => (
              <field.Input label="Name" disabled autoComplete="off" />
            )}
          </form.AppField>

          <form.AppField name="email">
            {(field) => (
              <field.Input
                label="Email"
                type="email"
                disabled
                autoComplete="off"
              />
            )}
          </form.AppField>

          {roleIsReadOnly ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Organization role</p>
              <p className="text-sm text-muted-foreground">
                {formatOrganizationRole(
                  user.isOwner ? "OWNER" : user.organizationRole,
                )}
              </p>
            </div>
          ) : (
            <form.AppField name="organizationRole">
              {(field) => (
                <field.Select
                  label="Organization role"
                  placeholder="Select role"
                >
                  {MANAGEABLE_ORG_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {formatOrganizationRole(role)}
                    </SelectItem>
                  ))}
                </field.Select>
              )}
            </form.AppField>
          )}

          <form.AppField name="projectIds">
            {(field) => (
              <field.MultiSelect
                label="Projects"
                placeholder="Select projects…"
                emptyMessage="No projects in this organization."
                options={projectOptions}
                displayValueType="count"
              />
            )}
          </form.AppField>
        </fieldset>

        {canEdit && (
          <div className="flex justify-end pt-2">
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
          </div>
        )}
      </form>
    </FormDialog>
  );
};

export default UserSettingsDialog;
