import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Loader2 } from "lucide-react";
import type { CreateProjectFormTypes } from "../hooks/useCreateProjectPage";

type CreateProjectFormProps = {
  form: CreateProjectFormTypes;
  isSubmitting: boolean;
};

const CreateProjectForm = ({
  form,
  isSubmitting,
}: CreateProjectFormProps) => {
  return (
    <form
      className="mt-8 space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.AppField name="name">
          {(field) => (
            <field.Input
              label="Project name"
              placeholder="e.g. Mobile App"
              className="h-12 text-base"
              autoComplete="off"
            />
          )}
        </form.AppField>

        <form.AppField name="description">
          {(field) => (
            <field.Textarea
              label="Description"
              placeholder="What is this project about?"
              optional={true}
            />
          )}
        </form.AppField>
      </FieldGroup>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-11 bg-gradient-brand text-brand-foreground shadow-elegant hover:opacity-95"
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating...
            </span>
          ) : (
            "Create project"
          )}
        </Button>
      </div>
    </form>
  );
};

export default CreateProjectForm;
