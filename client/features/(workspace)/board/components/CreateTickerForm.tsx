import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SelectItem } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  initialsOf,
  PRIORITY_META,
  TYPE_META,
  type Member,
} from "@/features/(onboarding)/lib/mock-app";
import { cn } from "@/lib/utils";
import { Loader2, Plus, X } from "lucide-react";
import { BOARD_PRIORITIES, BOARD_TYPES } from "../constants";
import type { CreateTicketFormTypes } from "../hooks/useBoardPage";

type CreateTicketFormProps = {
  form: CreateTicketFormTypes;
  isSubmitting: boolean;
  members: Member[];
  projectName?: string;
  onCancel: () => void;
};

const CreateTicketForm = ({
  form,
  isSubmitting,
  members,
  projectName,
  onCancel,
}: CreateTicketFormProps) => {
  const activeMembers = members.filter((member) => member.status === "Active");

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
    >
      {projectName && (
        <p className="text-xs text-muted-foreground">
          Adding to{" "}
          <span className="font-medium text-foreground">{projectName}</span>
        </p>
      )}

      <form.AppField name="type">
        {(field) => (
          <field.Select label="Type" placeholder="Select type">
            {BOARD_TYPES.map((option) => (
              <SelectItem key={option} value={option}>
                <Badge
                  variant="outline"
                  className={cn(
                    "border text-[10px]",
                    TYPE_META[option].className,
                  )}
                >
                  {option}
                </Badge>
              </SelectItem>
            ))}
          </field.Select>
        )}
      </form.AppField>

      <form.AppField name="title">
        {(field) => (
          <field.Input
            label="Title"
            placeholder="Short, action-oriented summary"
            autoComplete="off"
          />
        )}
      </form.AppField>

      <form.AppField name="description">
        {(field) => (
          <field.Textarea
            label="Description"
            placeholder="Add context, acceptance criteria, links…"
            optional
          />
        )}
      </form.AppField>

      <Separator />

      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <form.AppField name="priority">
          {(field) => (
            <field.Select label="Priority" placeholder="Select priority">
              {BOARD_PRIORITIES.map((option) => (
                <SelectItem key={option} value={option}>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      PRIORITY_META[option].className,
                    )}
                  >
                    {option}
                  </span>
                </SelectItem>
              ))}
            </field.Select>
          )}
        </form.AppField>

        <form.AppField name="storyPoints">
          {(field) => (
            <field.Input
              label="Story points"
              placeholder="—"
              optional
              type="number"
            />
          )}
        </form.AppField>
      </FieldGroup>

      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <form.AppField name="assigneeId">
          {(field) => (
            <field.Select label="Assignee" placeholder="Select assignee">
              <SelectItem value="unassigned">
                <span className="text-muted-foreground">Unassigned</span>
              </SelectItem>
              {activeMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="grid h-5 w-5 place-items-center rounded-full text-[9px] font-semibold text-white"
                      style={{ background: member.avatarColor }}
                    >
                      {initialsOf(member.name)}
                    </span>
                    {member.name}
                  </span>
                </SelectItem>
              ))}
            </field.Select>
          )}
        </form.AppField>
      </FieldGroup>

      <form.AppField name="labels">
        {(field) => {
          const labels = field.state.value;

          const addLabels = (raw: string) => {
            const parts = raw
              .split(",")
              .map((part) => part.trim().toLowerCase())
              .filter(Boolean);

            if (!parts.length) return;

            field.handleChange(
              Array.from(new Set([...labels, ...parts])).slice(0, 8),
            );
          };

          return (
            <div className="space-y-1.5">
              <label
                htmlFor={`${field.name}-input`}
                className="text-xs font-medium"
              >
                Labels <span className="text-muted-foreground">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring/40">
                {labels.map((label) => (
                  <Badge
                    key={label}
                    variant="secondary"
                    className="gap-1 pr-1 text-[10px]"
                  >
                    {label}
                    <button
                      type="button"
                      onClick={() =>
                        field.handleChange(
                          labels.filter((item) => item !== label),
                        )
                      }
                      className="opacity-60 hover:opacity-100"
                      aria-label={`Remove ${label}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Input
                  id={`${field.name}-input`}
                  placeholder={labels.length ? "" : "frontend, api, a11y…"}
                  className="h-7 min-w-[8ch] flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
                  onKeyDown={(event) => {
                    const input = event.currentTarget;

                    if (event.key === "Enter") {
                      event.preventDefault();
                      addLabels(input.value);
                      input.value = "";
                      return;
                    }

                    if (
                      event.key === "Backspace" &&
                      !input.value &&
                      labels.length
                    ) {
                      field.handleChange(labels.slice(0, -1));
                    }
                  }}
                  onBlur={(event) => {
                    if (event.currentTarget.value) {
                      addLabels(event.currentTarget.value);
                      event.currentTarget.value = "";
                    }
                  }}
                />
              </div>
            </div>
          );
        }}
      </form.AppField>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
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
              Creating...
            </span>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Create ticket
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default CreateTicketForm;
