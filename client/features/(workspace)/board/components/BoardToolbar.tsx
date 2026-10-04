"use client";

import { Plus, Search, X } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { SelectItem } from "@/components/ui/select";
import { FormInputGroup } from "@/components/common/form/FormInputGroup";
import { cn } from "@/lib/utils";
import { BOARD_PRIORITIES } from "../lib/constants";
import type useBoardPage from "../hooks/useBoardPage";
import { initialsOf, getColor } from "@/lib/utils/common";
import useProjectIssueTypes from "@/features/(workspace)/hooks/useProjectIssueTypes";
import { useProject } from "@/providers/projectProvider";

type BoardToolbarProps = {
  state: ReturnType<typeof useBoardPage>["state"];
  actions: ReturnType<typeof useBoardPage>["actions"];
};

const BoardToolbar = ({ state, actions }: BoardToolbarProps) => {
  const { filterForm, members, filteredCount, totalCount, activeFilterCount } =
    state;

  const { clearFilters, toggleAssigneeFilter } = actions;
  const { issueTypes } = useProjectIssueTypes();
  const { projectLabels, isLabelsLoading } = useProject();

  const labelOptions = useMemo(
    () =>
      projectLabels.map((label) => ({
        value: label.id,
        label: label.name,
        color: label.color,
      })),
    [projectLabels],
  );

  const assigneeOptions = useMemo(
    () => [
      { value: "unassigned", label: "Unassigned" },
      ...members.map((member) => ({
        value: member.id,
        label: member.username,
        color: getColor(member.username),
      })),
    ],
    [members],
  );

  return (
    <div className="shrink-0 space-y-3 border-b border-border bg-background pb-4 px-0.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Board</h1>
          <p className="text-xs text-muted-foreground">
            {filteredCount} of {totalCount} tickets
          </p>
        </div>
        <Button
          className="bg-gradient-brand text-brand-foreground shadow-elegant hover:opacity-95"
          onClick={() => actions.openCreateTicketDialog()}
        >
          <Plus className="h-4 w-4" /> New ticket
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <filterForm.AppField name="query">
          {(field) => (
            <field.InputGroup
              hideLabel
              label="Search"
              placeholder="Search tickets…"
              groupClasses="h-9 w-64"
            >
              <FormInputGroup.Addon>
                <Search className="h-4 w-4 text-muted-foreground" />
              </FormInputGroup.Addon>
            </field.InputGroup>
          )}
        </filterForm.AppField>

        <filterForm.AppField name="assignee">
          {(field) => (
            <div className="w-40">
              <field.MultiSelect
                hideLabel
                label="Assignee"
                placeholder="Assignee"
                displayValueType="count"
                emptyMessage="No members found."
                options={assigneeOptions}
              />
            </div>
          )}
        </filterForm.AppField>

        <filterForm.AppField name="priority">
          {(field) => (
            <field.Select
              hideLabel
              label="Priority"
              placeholder="Priority"
              controlClassName="h-9 w-35"
            >
              <SelectItem value="all">Any priority</SelectItem>
              {BOARD_PRIORITIES.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </field.Select>
          )}
        </filterForm.AppField>

        <filterForm.AppField name="type">
          {(field) => (
            <field.Select
              hideLabel
              label="Type"
              placeholder="Type"
              controlClassName="h-9 w-32.5"
            >
              <SelectItem value="all">Any type</SelectItem>
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
        </filterForm.AppField>

        <filterForm.AppField name="labels">
          {(field) => (
            <div className="w-36">
              <field.MultiSelect
                hideLabel
                label="Labels"
                placeholder="Labels"
                displayValueType="count"
                loading={isLabelsLoading}
                emptyMessage="No labels found."
                options={labelOptions}
              />
            </div>
          )}
        </filterForm.AppField>

        {activeFilterCount > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={clearFilters}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4" /> Clear ({activeFilterCount})
          </Button>
        )}

        <filterForm.Subscribe selector={(state) => state.values.assignee}>
          {(assignee) => (
            <div className="ml-auto flex -space-x-2">
              {members.slice(0, 5).map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => toggleAssigneeFilter(member.id)}
                  className={cn(
                    "grid h-7 w-7 place-items-center rounded-full text-[10px] font-semibold text-white ring-2 ring-background transition-transform hover:-translate-y-0.5",
                    assignee.includes(member.id) && "ring-brand",
                  )}
                  style={{ background: getColor(member.username) }}
                  title={member.username}
                >
                  {initialsOf(member.username)}
                </button>
              ))}
            </div>
          )}
        </filterForm.Subscribe>
      </div>
    </div>
  );
};

export default BoardToolbar;
