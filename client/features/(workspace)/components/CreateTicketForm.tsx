import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { initialsOf, getColor } from "@/lib/utils/common";
import { useProject } from "@/providers/projectProvider";
import { Loader2, Plus } from "lucide-react";
import { useMemo } from "react";
import {
  BOARD_PRIORITIES,
  PRIORITY_CLASS,
} from "@/features/(workspace)/board/lib/constants";
import type { CreateTicketFormType } from "@/features/(workspace)/hooks/useCreateTicket";
import type { ProjectMember } from "@/features/(workspace)/types";
import useProjectIssueTypes from "@/features/(workspace)/hooks/useProjectIssueTypes";

type CreateTicketFormProps = {
  form: CreateTicketFormType;
  isSubmitting: boolean;
  members: ProjectMember[];
  onCancel: () => void;
};

const CreateTicketForm = ({
  form,
  isSubmitting,
  members,
  onCancel,
}: CreateTicketFormProps) => {
  const { projectLabels, isLabelsLoading } = useProject();
  const { issueTypes } = useProjectIssueTypes();

  const labelOptions = useMemo(
    () =>
      projectLabels.map((label) => ({
        value: label.id,
        label: label.name,
        color: label.color,
      })),
    [projectLabels],
  );

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
    >
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
          <field.TicketEditor
            label="Description"
            placeholder="Add context, acceptance criteria, links…"
            optional
          />
        )}
      </form.AppField>

      <FieldGroup columns={2}>
        <form.AppField name="priority">
          {(field) => (
            <field.Select label="Priority" placeholder="Select priority">
              {BOARD_PRIORITIES.map((option) => (
                <SelectItem key={option} value={option}>
                  <span
                    className={cn(
                      "text-xs font-medium uppercase",
                      PRIORITY_CLASS[option],
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
              placeholder="Assign points (0-100)"
              optional
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
            />
          )}
        </form.AppField>
      </FieldGroup>

      <FieldGroup columns={2}>
        <form.AppField name="assigneeId">
          {(field) => (
            <field.Select label="Assignee" placeholder="Select assignee">
              <SelectItem value="unassigned">
                <span className="text-muted-foreground">Unassigned</span>
              </SelectItem>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="grid h-5 w-5 place-items-center rounded-full text-[9px] font-semibold text-white"
                      style={{ background: getColor(member.username) }}
                    >
                      {initialsOf(member.username)}
                    </span>
                    {member.username}
                  </span>
                </SelectItem>
              ))}
            </field.Select>
          )}
        </form.AppField>

        <form.AppField name="typeId">
          {(field) => (
            <field.Select label="Issue type" placeholder="Select type" optional>
              <SelectItem value="none">
                <span className="text-muted-foreground">No type</span>
              </SelectItem>
              {issueTypes.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: t.color }}
                    />
                    <span className="capitalize">{t.key}</span>
                  </span>
                </SelectItem>
              ))}
            </field.Select>
          )}
        </form.AppField>
      </FieldGroup>

      <form.AppField name="labels">
        {(field) => (
          <field.MultiSelect
            label="Labels"
            optional
            loading={isLabelsLoading}
            placeholder="Select labels…"
            emptyMessage="No labels configured for this project."
            maxSelections={8}
            options={labelOptions}
          />
        )}
      </form.AppField>

      <div className="flex justify-end gap-2 pt-4">
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
