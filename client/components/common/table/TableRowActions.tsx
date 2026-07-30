import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  AlarmClock,
  BellRing,
  MoreHorizontal,
  Pen,
  Trash2,
} from "lucide-react";
import type { Row } from "@tanstack/react-table";

interface TableRowActionsProps<TData> {
  row: Row<TData>;
  onEdit?: (value: TData) => void;
  onDelete?: (value: TData) => void;
  onReminder?: (value: TData) => void;
  onSetNotification?: (value: TData) => void;
  requiredField?: boolean;
}

const TableRowActions = <TData,>({
  row,
  onEdit,
  onDelete,
  onReminder,
  onSetNotification,
  requiredField = false,
}: TableRowActionsProps<TData>) => {
  const [open, setOpen] = useState(false);

  const handleAction = (callback: (value: TData) => void) => {
    setOpen(false);
    callback(row.original);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        {onEdit && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              handleAction(onEdit);
            }}
            className="justify-between cursor-pointer"
          >
            Edit <Pen className="text-primary" />
          </DropdownMenuItem>
        )}
        {onReminder && (
          <DropdownMenuItem
            onClick={() => handleAction(onReminder)}
            className="justify-between cursor-pointer"
          >
            Reminder <AlarmClock className="text-orange-500" />
          </DropdownMenuItem>
        )}
        {onSetNotification && (
          <DropdownMenuItem
            onClick={() => handleAction(onSetNotification)}
            className="justify-between cursor-pointer"
          >
            Set Notification <BellRing className="text-blue-500" />
          </DropdownMenuItem>
        )}
        {onEdit || onReminder || onSetNotification ? (
          <DropdownMenuSeparator />
        ) : null}
        {onDelete && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              if (!requiredField) {
                handleAction(onDelete);
              }
            }}
            className={`justify-between ${requiredField ? "text-gray-300 disabled pointer-events-none cursor-not-allowed" : "cursor-pointer"}`}
          >
            Delete
            <Trash2
              className={`${requiredField ? "text-gray-300" : "text-red-500"}`}
            />
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TableRowActions;
