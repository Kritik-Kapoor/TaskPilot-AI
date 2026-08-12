"use client";

import { ColorPickerPopover } from "@/components/common/ColorPickerPopover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useLabelsSection from "@/features/(workspace)/configuration/hooks/useLabelsSection";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";

const LabelsSection = ({ canManage }: { canManage: boolean }) => {
  const {
    state: {
      labels,
      isLoading,
      draftName,
      draftColor,
      editingLabelId,
      editName,
      editColor,
      isCreating,
      isUpdating,
      deletingLabelId,
    },
    actions: {
      setDraftName,
      setDraftColor,
      setEditName,
      setEditColor,
      startEditing,
      cancelEditing,
      submitCreate,
      submitEdit,
      deleteLabel,
    },
  } = useLabelsSection(canManage);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading labels…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {canManage && (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <ColorPickerPopover color={draftColor} onChange={setDraftColor} />
            <Input
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && submitCreate()}
              placeholder="new-label-name"
              className="h-9 flex-1"
              maxLength={24}
            />
            <Button
              type="button"
              onClick={submitCreate}
              disabled={isCreating || !draftName.trim()}
              className="h-9 bg-gradient-brand text-brand-foreground hover:opacity-95"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4" /> Add
                </>
              )}
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Anyone on the project can create and edit labels. Names are
            lowercased automatically.
          </p>
        </div>
      )}

      {!canManage && (
        <p className="text-[11px] text-muted-foreground">
          Viewers can browse labels but cannot create or edit them.
        </p>
      )}

      <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
        {labels.map((label) => (
          <div
            key={label.id}
            className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40"
          >
            {editingLabelId === label.id ? (
              <>
                <ColorPickerPopover
                  color={editColor}
                  onChange={setEditColor}
                  size="sm"
                />
                <Input
                  autoFocus
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") submitEdit(label.id, label.name);
                    if (event.key === "Escape") cancelEditing();
                  }}
                  className="h-8 flex-1"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  disabled={isUpdating}
                  onClick={() => submitEdit(label.id, label.name)}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={cancelEditing}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ background: label.color }}
                />
                <Badge variant="secondary" className="text-[11px] font-medium">
                  {label.name}
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  {label.ticketCount}{" "}
                  {label.ticketCount === 1 ? "ticket" : "tickets"}
                </span>
                {canManage && (
                  <div className="ml-auto flex items-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => startEditing(label)}
                      aria-label={`Edit ${label.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      disabled={deletingLabelId === label.id}
                      onClick={() => deleteLabel(label.id)}
                      aria-label={`Delete ${label.name}`}
                    >
                      {deletingLabelId === label.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        {!labels.length && (
          <div className="px-3 py-10 text-center text-sm text-muted-foreground">
            No labels yet — create your first one above.
          </div>
        )}
      </div>
    </div>
  );
};

export default LabelsSection;
