import { OrgCard } from "@/components/common/OrgCard";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Check, Loader2, X } from "lucide-react";
import Link from "next/link";
import { CreateOrgFormTypes, NameStatus } from "../hooks/useCreateOrgPage";
import { Organization } from "../types";

type CreateOrgFormProps = {
  form: CreateOrgFormTypes;
  isSubmitting: boolean;
  isInitializing: boolean;
  isEditingExistingOrg: boolean;
  submit: () => void;
  status: NameStatus;
  takenOrg: Organization | null;
  canSubmit: boolean;
  slug: string;
};

const CreateOrgForm = ({
  form,
  isSubmitting,
  isInitializing,
  isEditingExistingOrg,
  submit,
  status,
  takenOrg,
  canSubmit,
  slug,
}: CreateOrgFormProps) => {
  if (isInitializing) {
    return (
      <div className="mt-8 flex items-center justify-center py-16 text-sm text-muted-foreground">
        Loading organization details...
      </div>
    );
  }

  return (
    <form
      className="mt-8 space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <FieldGroup>
        <div className="space-y-2">
          <form.AppField name="orgName">
            {(field) => (
              <div className="relative">
                <field.Input
                  label="Organization name"
                  placeholder="e.g. Taskpilot AI"
                  className="h-12 pr-10 text-base"
                  autoComplete="off"
                />
                <div className="absolute top-8.5 right-3">
                  {status === "checking" && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {status === "available" && (
                    <div className="grid h-6 w-6 place-items-center rounded-full bg-success/15">
                      <Check className="h-3.5 w-3.5 text-success" />
                    </div>
                  )}
                  {status === "taken" && (
                    <div className="grid h-6 w-6 place-items-center rounded-full bg-destructive/15">
                      <X className="h-3.5 w-3.5 text-destructive" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </form.AppField>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              URL:{" "}
              <span className="font-mono text-foreground">
                taskpilot.app/{slug || "your-org"}
              </span>
            </span>
            {status === "available" && (
              <span className="font-medium text-success">
                Name is available
              </span>
            )}
            {status === "taken" && (
              <span className="font-medium text-destructive">
                Already taken
              </span>
            )}
          </div>
        </div>

        <form.AppField name="description">
          {(field) => (
            <field.Textarea
              label="Description"
              placeholder="What does your organization do?"
              optional={true}
            />
          )}
        </form.AppField>
      </FieldGroup>

      {status === "taken" && takenOrg && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="mb-3 text-sm font-medium text-foreground">
            An organization with this name already exists:
          </div>
          <OrgCard org={takenOrg} action="taken" />
          <div className="mt-3 text-xs text-muted-foreground">
            Is this your team?{" "}
            <Link
              href={`/onboarding/join-org?q=${encodeURIComponent(takenOrg.orgName)}`}
              className="font-medium text-brand hover:underline"
            >
              Request to join instead
            </Link>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button asChild variant="ghost">
          <Link href="/onboarding">Cancel</Link>
        </Button>
        <Button
          type="submit"
          disabled={!canSubmit}
          className="bg-gradient-brand text-brand-foreground shadow-elegant hover:opacity-95"
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {isEditingExistingOrg ? "Saving..." : "Creating..."}
            </span>
          ) : isEditingExistingOrg ? (
            "Save and continue"
          ) : (
            "Continue"
          )}
        </Button>
      </div>
    </form>
  );
};

export default CreateOrgForm;
