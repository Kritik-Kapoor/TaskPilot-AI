"use client";

import FormDialog from "@/components/common/dialogs/FormDialog";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import type useCreateProjectDialog from "@/features/(workspace)/projects/hooks/useCreateProjectDialog";
import { Loader2, Plus } from "lucide-react";

type CreateProjectDialogProps = {
  isOpen: boolean;
  close: () => void;
  form: ReturnType<typeof useCreateProjectDialog>["form"];
  isSubmitting: boolean;
};

const CreateProjectDialog = ({
  isOpen,
  close,
  form,
  isSubmitting,
}: CreateProjectDialogProps) => {
  return (
    <FormDialog
      isOpen={isOpen}
      onClose={close}
      title="Create project"
      closeOnOutsideClick={!isSubmitting}
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.AppField name="name">
            {(field) => (
              <field.Input
                label="Project name"
                placeholder="e.g. TaskPilot Development"
                autoComplete="off"
                hideLabel
              />
            )}
          </form.AppField>
        </FieldGroup>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={isSubmitting}
            onClick={close}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-brand text-brand-foreground shadow-elegant hover:opacity-95"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating…
              </span>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Create project
              </>
            )}
          </Button>
        </div>
      </form>
    </FormDialog>
  );
};

export default CreateProjectDialog;
