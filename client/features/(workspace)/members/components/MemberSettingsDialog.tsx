"use client";

import { useAppForm } from "@/components/common/form/hooks";
import FormDialog from "@/components/common/dialogs/FormDialog";
import { Button } from "@/components/ui/button";
import { SelectItem } from "@/components/ui/select";
import type { ProjectRole } from "@/features/(auth)/types";
import type { ProjectMember } from "@/features/(workspace)/types";
import { Loader2, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { z } from "zod";
import { formatProjectRole, PROJECT_MEMBER_ROLES } from "../lib/constants";

const memberSettingsSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters long"),
  email: z.string(),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]),
});

type MemberSettingsDialogProps = {
  member: ProjectMember | null;
  isOpen: boolean;
  canManage: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onSave: (payload: { username: string; role: ProjectRole }) => void;
  onDelete: () => void;
};

const MemberSettingsDialog = ({
  member,
  isOpen,
  canManage,
  isSaving,
  isDeleting,
  onClose,
  onSave,
  onDelete,
}: MemberSettingsDialogProps) => {
  const form = useAppForm({
    defaultValues: {
      username: "",
      email: "",
      role: "MEMBER" as ProjectRole,
    },
    validators: {
      onSubmit: memberSettingsSchema,
    },
    onSubmit: ({ value }) => {
      if (!canManage || !member) return;

      onSave({
        username: value.username.trim(),
        role: value.role,
      });
    },
  });

  useEffect(() => {
    if (!member) return;

    form.reset({
      username: member.username,
      email: member.email,
      role: member.role as ProjectRole,
    });
  }, [form, member]);

  if (!member) return null;

  return (
    <FormDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Member settings"
      closeOnOutsideClick={!isSaving && !isDeleting}
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
        <fieldset
          disabled={!canManage || isSaving || isDeleting}
          className="space-y-4"
        >
          <form.AppField name="username">
            {(field) => (
              <field.Input
                label="Name"
                placeholder="Username"
                autoComplete="off"
              />
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

          <form.AppField name="role">
            {(field) => (
              <field.Select label="Role" placeholder="Select role">
                {PROJECT_MEMBER_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {formatProjectRole(role)}
                  </SelectItem>
                ))}
              </field.Select>
            )}
          </form.AppField>
        </fieldset>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {canManage ? (
            <Button
              type="button"
              variant="outline"
              className="text-destructive hover:text-destructive"
              disabled={isSaving || isDeleting}
              onClick={onDelete}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Remove member
            </Button>
          ) : (
            <span />
          )}

          {canManage && (
            <Button
              type="submit"
              disabled={isSaving || isDeleting}
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
          )}
        </div>
      </form>
    </FormDialog>
  );
};

export default MemberSettingsDialog;
