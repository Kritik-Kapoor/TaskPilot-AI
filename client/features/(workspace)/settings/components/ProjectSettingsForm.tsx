"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type useSettingsPage from "../hooks/useSettingsPage";

type ProjectSettingsFormProps = {
  form: ReturnType<typeof useSettingsPage>["form"];
  projectId: string;
  canManage: boolean;
  isSaving: boolean;
};

const ProjectSettingsForm = ({
  form,
  projectId,
  canManage,
  isSaving,
}: ProjectSettingsFormProps) => {
  return (
    <form
      key={projectId}
      className="max-w-md space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <fieldset disabled={!canManage || isSaving} className="space-y-4">
        <form.AppField name="projectName">
          {(field) => <field.Input label="Project name" autoComplete="off" />}
        </form.AppField>

        <form.AppField name="projectKey">
          {(field) => (
            <field.Input
              label="Project key (auto generated)"
              disabled
              className="uppercase font-mono"
              autoComplete="off"
            />
          )}
        </form.AppField>

        <form.AppField name="description">
          {(field) => (
            <field.Textarea
              label="Description"
              placeholder="Describe what this project is for…"
            />
          )}
        </form.AppField>
      </fieldset>

      {canManage && (
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
      )}

      {!canManage && (
        <p className="text-sm text-muted-foreground">
          Only project admins and organization admins can edit project settings.
        </p>
      )}
    </form>
  );
};

export default ProjectSettingsForm;
