"use client";

import { ColorPickerPopover } from "@/components/common/ColorPickerPopover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import useTypesSection from "@/features/(workspace)/configuration/hooks/useTypesSection";
import { cn } from "@/lib/utils";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";

const TypesSection = ({ canManage }: { canManage: boolean }) => {
  const {
    ticketTypes,
    isLoading,
    isError,
    state: {
      draftKey,
      draftColor,
      editingTypeId,
      editKey,
      editColor,
      isCreating,
      isEditing,
      deletingTypeId,
      updatingTypeId,
    },
    actions: {
      setDraftKey,
      setDraftColor,
      setEditKey,
      setEditColor,
      startEditing,
      cancelEditing,
      submitCreate,
      submitEdit,
      toggleTypeEnabled,
      deleteType,
    },
  } = useTypesSection(canManage);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading issue types…
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">Failed to load issue types.</p>
    );
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <ColorPickerPopover color={draftColor} onChange={setDraftColor} />
            <Input
              value={draftKey}
              onChange={(e) => setDraftKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitCreate()}
              placeholder="issue-type-key"
              className="h-9 flex-1"
              maxLength={32}
            />
            <Button
              type="button"
              onClick={submitCreate}
              disabled={isCreating || !draftKey.trim()}
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
            Keys are lowercased automatically. Duplicates are not allowed.
          </p>
        </div>
      )}
      {!canManage && (
        <p className="text-[11px] text-muted-foreground">
          Only project admins can manage issue types.
        </p>
      )}

      <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
        {ticketTypes.map((ticketType) => (
          <div
            key={ticketType.id}
            className="flex items-center gap-3 px-3 py-2.5"
          >
            {editingTypeId === ticketType.id ? (
              <>
                <ColorPickerPopover
                  color={editColor}
                  onChange={setEditColor}
                  size="sm"
                />
                <Input
                  autoFocus
                  value={editKey}
                  onChange={(e) => setEditKey(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitEdit(ticketType.id);
                    if (e.key === "Escape") cancelEditing();
                  }}
                  className="h-8 flex-1"
                  maxLength={32}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0"
                  disabled={isEditing || !editKey.trim()}
                  onClick={() => submitEdit(ticketType.id)}
                >
                  {isEditing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0"
                  onClick={cancelEditing}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ background: ticketType.color }}
                  />
                  <span
                    className={cn(
                      "flex-1 text-sm font-medium lowercase",
                      !ticketType.isEnabled &&
                        "text-muted-foreground line-through",
                    )}
                  >
                    {ticketType.key}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {ticketType.ticketCount}{" "}
                    {ticketType.ticketCount === 1 ? "ticket" : "tickets"}
                  </span>
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <Switch
                    checked={ticketType.isEnabled}
                    disabled={updatingTypeId === ticketType.id}
                    onCheckedChange={(checked) =>
                      toggleTypeEnabled(ticketType.id, checked)
                    }
                    aria-label={`Toggle ${ticketType.key}`}
                  />

                  {canManage && (
                    <>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => startEditing(ticketType)}
                        aria-label={`Edit ${ticketType.key}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        disabled={deletingTypeId === ticketType.id}
                        onClick={() => deleteType(ticketType.id)}
                        aria-label={`Delete ${ticketType.key}`}
                      >
                        {deletingTypeId === ticketType.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        ))}

        {!ticketTypes.length && (
          <div className="px-3 py-10 text-center text-sm text-muted-foreground">
            {canManage
              ? "No issue types yet. Create your first one above."
              : "No issue types configured for this project."}
          </div>
        )}
      </div>
    </div>
  );
};

export default TypesSection;
