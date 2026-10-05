"use client";

import { ColorPickerPopover } from "@/components/common/ColorPickerPopover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useStatusesSection from "@/features/(workspace)/configuration/hooks/useStatusesSection";
import DeleteColumnDialog from "@/features/(workspace)/configuration/components/DeleteColumnDialog";
import { getPositionBetween } from "@/features/(workspace)/board/lib/utils/ticketPosition";
import { cn } from "@/lib/utils";
import {
  type DragEndEvent,
  type DragOverEvent,
  DragDropProvider,
} from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import {
  Check,
  GripVertical,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import type { BoardColumn } from "@/features/(workspace)/board/types";

function reorderArray<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
}

type SortableColumnRowProps = {
  column: BoardColumn;
  index: number;
  isBacklog: boolean;
  canManage: boolean;
  isEditing: boolean;
  isDeleting: boolean;
  isUpdating: boolean;
  editName: string;
  editColor: string;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSubmitEdit: () => void;
  onDelete: () => void;
  onEditName: (v: string) => void;
  onEditColor: (v: string) => void;
};

function SortableColumnRow({
  column,
  index,
  isBacklog,
  canManage,
  isEditing,
  isDeleting,
  isUpdating,
  editName,
  editColor,
  onStartEdit,
  onCancelEdit,
  onSubmitEdit,
  onDelete,
  onEditName,
  onEditColor,
}: SortableColumnRowProps) {
  const { ref, isDragging } = useSortable({
    id: column.id,
    index,
    type: "column",
    accept: "column",
    disabled: isBacklog || !canManage || isEditing,
  });

  const canDelete = canManage && !isBacklog;

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 bg-background transition-opacity",
        isDragging && "opacity-40",
        isBacklog && !isEditing && "opacity-60",
      )}
    >
      <span
        className={cn(
          "shrink-0 text-muted-foreground",
          canManage && !isBacklog && !isEditing
            ? "cursor-grab"
            : "cursor-default opacity-30",
        )}
        aria-hidden="true"
      >
        {isBacklog ? (
          <Lock className="h-3.5 w-3.5" />
        ) : (
          <GripVertical className="h-3.5 w-3.5" />
        )}
      </span>

      {isEditing ? (
        <>
          <ColorPickerPopover
            color={editColor}
            onChange={onEditColor}
            size="sm"
          />
          <Input
            autoFocus
            value={editName}
            onChange={(e) => onEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSubmitEdit();
              if (e.key === "Escape") onCancelEdit();
            }}
            className="h-8 flex-1"
            disabled={isBacklog}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            disabled={isUpdating || !editName.trim()}
            onClick={onSubmitEdit}
          >
            {isUpdating ? (
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
            onClick={onCancelEdit}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </>
      ) : (
        <>
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: column.color ?? "#6b7280" }}
          />
          <span className="flex-1 text-sm font-medium">{column.name}</span>
          {isBacklog && (
            <span className="text-[10px] text-muted-foreground">Locked</span>
          )}
          {!isBacklog && (
            <span className="text-[10px] text-muted-foreground">
              {column.ticketCount ?? 0} ticket
              {(column.ticketCount ?? 0) !== 1 ? "s" : ""}
            </span>
          )}
          {canManage && (
            <div className="ml-auto flex items-center gap-1">
              {!isBacklog && (
                <>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={onStartEdit}
                    aria-label={`Edit ${column.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    disabled={!canDelete || isDeleting}
                    onClick={onDelete}
                    title={`Delete ${column.name}`}
                    aria-label={`Delete ${column.name}`}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

type StatusesSectionProps = {
  canManage: boolean;
};

const StatusesSection = ({ canManage }: StatusesSectionProps) => {
  const {
    columns,
    isLoading,
    isError,
    isBacklog,
    handleReorder,
    state: {
      draftName,
      draftColor,
      editingColumnId,
      editName,
      editColor,
      isCreating,
      isUpdating,
      deletingColumnId,
    },
    actions: {
      setDraftName,
      setDraftColor,
      setEditName,
      setEditColor,
      startEditing,
      cancelEditing,
      handleSubmit,
      requestDeleteColumn,
      confirmDeleteColumn,
      cancelDeleteColumn,
    },
    columnPendingDelete,
  } = useStatusesSection(canManage);

  const [optimisticOrder, setOptimisticOrder] = useState<BoardColumn[] | null>(
    null,
  );

  const displayedColumns = optimisticOrder ?? columns;

  const tryReorder = (
    source: { id: string | number },
    target: { id: string | number },
    current: BoardColumn[],
  ) => {
    const srcId = String(source.id);
    const tgtId = String(target.id);
    if (srcId === tgtId) return null;

    const srcIsBacklog = isBacklog(
      current.find((c) => c.id === srcId)?.name ?? "",
    );
    const tgtIsBacklog = isBacklog(
      current.find((c) => c.id === tgtId)?.name ?? "",
    );
    if (srcIsBacklog || tgtIsBacklog) return null;

    const from = current.findIndex((c) => c.id === srcId);
    const to = current.findIndex((c) => c.id === tgtId);
    if (from === -1 || to === -1) return null;

    return reorderArray(current, from, to);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { source, target } = event.operation;
    if (!source || !target) return;
    const reordered = tryReorder(source, target, optimisticOrder ?? columns);
    if (reordered) setOptimisticOrder(reordered);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (event.canceled) {
      setOptimisticOrder(null);
      return;
    }

    const { source, target } = event.operation;
    const final = optimisticOrder;
    setOptimisticOrder(null);

    if (!source || !target || !final) return;

    const movedId = String(source.id);
    const movedColumn = final.find((c) => c.id === movedId);
    if (!movedColumn || isBacklog(movedColumn.name)) return;

    const idx = final.findIndex((c) => c.id === movedId);
    const prev = idx > 0 ? final[idx - 1] : null;
    const next = idx < final.length - 1 ? final[idx + 1] : null;

    const newPosition = getPositionBetween(
      prev?.position ?? null,
      next?.position ?? null,
    );

    handleReorder(movedId, newPosition);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading statuses…
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">Failed to load board columns.</p>
    );
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <ColorPickerPopover color={draftColor} onChange={setDraftColor} />
            <Input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit("create")}
              placeholder="Column name…"
              className="h-9 flex-1"
              maxLength={32}
            />
            <Button
              type="button"
              onClick={() => handleSubmit("create")}
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
            New columns are added at the end. You can drag to reorder
            afterwards.
          </p>
        </div>
      )}

      {!canManage && (
        <p className="text-[11px] text-muted-foreground">
          Only project admins can manage board columns.
        </p>
      )}

      <DragDropProvider onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
          {displayedColumns.map((column, index) => (
            <SortableColumnRow
              key={column.id}
              column={column}
              index={index}
              isBacklog={isBacklog(column.name)}
              canManage={canManage}
              isEditing={editingColumnId === column.id}
              isDeleting={deletingColumnId === column.id}
              isUpdating={isUpdating}
              editName={editName}
              editColor={editColor}
              onStartEdit={() => {
                if (!isBacklog(column.name)) startEditing(column);
              }}
              onCancelEdit={cancelEditing}
              onSubmitEdit={() => handleSubmit("edit", column.id)}
              onDelete={() => requestDeleteColumn(column)}
              onEditName={setEditName}
              onEditColor={setEditColor}
            />
          ))}
          {!displayedColumns.length && (
            <div className="px-3 py-10 text-center text-sm text-muted-foreground">
              No board columns found.
            </div>
          )}
        </div>
      </DragDropProvider>

      <DeleteColumnDialog
        open={Boolean(columnPendingDelete)}
        column={columnPendingDelete}
        columns={columns}
        isDeleting={Boolean(deletingColumnId)}
        onClose={cancelDeleteColumn}
        onConfirm={(options) => confirmDeleteColumn(options)}
      />
    </div>
  );
};

export default StatusesSection;
