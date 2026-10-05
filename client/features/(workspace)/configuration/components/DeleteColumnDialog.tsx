"use client";

import FormDialog from "@/components/common/dialogs/FormDialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BoardColumn } from "@/features/(workspace)/board/types";
import { useMemo, useState } from "react";
import { DeleteBoardColumnPayload } from "../types";

type DeleteColumnDialogProps = {
  open: boolean;
  column: BoardColumn | null;
  columns: BoardColumn[];
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: (options?: DeleteBoardColumnPayload) => void;
};

const DeleteColumnDialog = ({
  open,
  column,
  columns,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteColumnDialogProps) => {
  const ticketCount = column?.ticketCount ?? 0;
  const [mode, setMode] = useState<"move" | "delete_all">("move");
  const [targetColumnId, setTargetColumnId] = useState("");

  const targetOptions = useMemo(
    () => columns.filter((c) => c.id !== column?.id),
    [column?.id, columns],
  );

  const handleClose = () => {
    setMode("move");
    setTargetColumnId("");
    onClose();
  };

  const handleConfirm = () => {
    if (ticketCount === 0) {
      onConfirm({});
      return;
    }

    if (mode === "move") {
      if (!targetColumnId) return;
      onConfirm({ ticketDisposition: "move", targetColumnId });
      return;
    }

    onConfirm({ ticketDisposition: "delete_all" });
  };

  if (!column) return null;

  return (
    <FormDialog
      isOpen={open}
      onClose={handleClose}
      title={`Delete "${column.name}" Column?`}
      className="sm:max-w-md"
      closeOnOutsideClick={!isDeleting}
    >
      <div className="space-y-4">
        {ticketCount > 0 ? (
          <>
            <p className="text-sm text-muted-foreground">
              This column has {ticketCount} ticket
              {ticketCount === 1 ? "" : "s"}. Move them to another column or
              delete them along with the column.
            </p>

            <div className="space-y-3">
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3">
                <input
                  type="radio"
                  name="delete-column-mode"
                  checked={mode === "move"}
                  onChange={() => setMode("move")}
                  className="mt-1"
                />
                <span className="space-y-2 text-sm">
                  <span className="font-medium">
                    Move tickets to another column
                  </span>
                  {mode === "move" && (
                    <div className="mt-1.5">
                      <Select
                        value={targetColumnId}
                        onValueChange={setTargetColumnId}
                      >
                        <SelectTrigger id="target-column" className="w-full">
                          <SelectValue placeholder="Select column…" />
                        </SelectTrigger>
                        <SelectContent>
                          {targetOptions.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-destructive/30 p-3">
                <input
                  type="radio"
                  name="delete-column-mode"
                  checked={mode === "delete_all"}
                  onChange={() => setMode("delete_all")}
                  className="mt-1"
                />
                <span className="text-sm">
                  <span className="font-medium text-destructive">
                    Delete all {ticketCount} ticket
                    {ticketCount === 1 ? "" : "s"} and remove this column
                  </span>
                  <p className="mt-1 text-muted-foreground">
                    This cannot be undone.
                  </p>
                </span>
              </label>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            This column has no tickets and will be removed.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={
              isDeleting ||
              (ticketCount > 0 && mode === "move" && !targetColumnId)
            }
            onClick={handleConfirm}
          >
            {isDeleting ? "Deleting…" : "Delete column"}
          </Button>
        </div>
      </div>
    </FormDialog>
  );
};

export default DeleteColumnDialog;
