"use client";

import { Badge } from "@/components/ui/badge";
import { SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getColor, initialsOf } from "@/lib/utils/common";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import {
  BOARD_PRIORITIES,
  BOARD_TYPES,
  PRIORITY_CLASS,
  TYPE_CLASS,
} from "../../board/lib/constants";
import type {
  BoardColumn,
  TicketDetail,
  TicketPriority,
  TicketType,
} from "../../board/types";
import type { ProjectLabel, ProjectMember } from "../../types";
import { formatTicketEnum } from "../../backlog/lib/constants";
import type { UpdateTicketPayload } from "../types";
import useTicketDetailsSidebarForm from "../hooks/useTicketDetailsSidebarForm";

type TicketDetailsSidebarProps = {
  ticket: TicketDetail;
  columns: BoardColumn[];
  members: ProjectMember[];
  labels: ProjectLabel[];
  isLabelsLoading: boolean;
  canEdit: boolean;
  isSaving: boolean;
  onPatch: (payload: UpdateTicketPayload) => void;
};

const TicketDetailsSidebar = ({
  ticket,
  columns,
  members,
  labels,
  isLabelsLoading,
  canEdit,
  isSaving,
  onPatch,
}: TicketDetailsSidebarProps) => {
  const { form, patchIfEditable, isSyncingRef } = useTicketDetailsSidebarForm({
    ticket,
    canEdit,
    onPatch,
  });

  const labelOptions = useMemo(
    () =>
      labels.map((label) => ({
        value: label.id,
        label: label.name,
        color: label.color,
      })),
    [labels],
  );

  return (
    <aside className="space-y-5 rounded-xl border bg-card/70 p-5 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Details</h2>
        {isSaving && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Saving
          </span>
        )}
      </div>

      <form
        className="space-y-5"
        onSubmit={(event) => event.preventDefault()}
      >
        <fieldset disabled={!canEdit} className="space-y-5">
          <form.AppField
            name="columnId"
            listeners={{
              onChange: ({ value }) => {
                if (isSyncingRef.current || value === ticket.columnId) return;
                patchIfEditable({ columnId: value });
              },
            }}
          >
            {(field) => (
              <field.Select label="Status" placeholder="Select status">
                {columns.map((column) => (
                  <SelectItem key={column.id} value={column.id}>
                    <span className="inline-flex items-center gap-2">
                      {column.color && (
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: column.color }}
                        />
                      )}
                      {formatTicketEnum(column.name.replace(/_/g, " "))}
                    </span>
                  </SelectItem>
                ))}
              </field.Select>
            )}
          </form.AppField>

          <form.AppField
            name="type"
            listeners={{
              onChange: ({ value }) => {
                if (isSyncingRef.current || value === ticket.type) return;
                patchIfEditable({ type: value as TicketType });
              },
            }}
          >
            {(field) => (
              <field.Select label="Type" placeholder="Select type">
                {BOARD_TYPES.map((option) => (
                  <SelectItem key={option} value={option}>
                    <Badge
                      variant="outline"
                      className={cn(
                        "border text-[10px] uppercase",
                        TYPE_CLASS[option],
                      )}
                    >
                      {formatTicketEnum(option)}
                    </Badge>
                  </SelectItem>
                ))}
              </field.Select>
            )}
          </form.AppField>

          <form.AppField
            name="priority"
            listeners={{
              onChange: ({ value }) => {
                if (isSyncingRef.current || value === ticket.priority) return;
                patchIfEditable({ priority: value as TicketPriority });
              },
            }}
          >
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
                      {formatTicketEnum(option)}
                    </span>
                  </SelectItem>
                ))}
              </field.Select>
            )}
          </form.AppField>

          <form.AppField
            name="assigneeId"
            listeners={{
              onChange: ({ value }) => {
                const assigneeId = value === "unassigned" ? null : value;
                if (
                  isSyncingRef.current ||
                  assigneeId === ticket.assigneeId
                ) {
                  return;
                }
                patchIfEditable({ assigneeId });
              },
            }}
          >
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

          <form.AppField
            name="storyPoints"
            listeners={{
              onBlur: ({ value }) => {
                if (isSyncingRef.current) return;

                const trimmed = value.trim();
                const nextPoints = trimmed ? Number(trimmed) : null;

                if (
                  trimmed &&
                  (!Number.isInteger(nextPoints) ||
                    nextPoints! < 0 ||
                    nextPoints! > 100)
                ) {
                  return;
                }

                if (nextPoints === ticket.storyPoints) return;

                patchIfEditable({ storyPoints: nextPoints });
              },
            }}
          >
            {(field) => (
              <field.Input
                label="Story points"
                placeholder="0–100"
                optional
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
              />
            )}
          </form.AppField>

          <form.AppField
            name="labels"
            listeners={{
              onChange: ({ value }) => {
                if (isSyncingRef.current) return;

                const currentIds = ticket.labels.map((label) => label.id);
                if (
                  value.length === currentIds.length &&
                  value.every((id) => currentIds.includes(id))
                ) {
                  return;
                }

                patchIfEditable({ labels: value });
              },
            }}
          >
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
        </fieldset>
      </form>
    </aside>
  );
};

export default TicketDetailsSidebar;
