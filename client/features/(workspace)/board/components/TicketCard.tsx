import { useSortable } from "@dnd-kit/react/sortable";
import { Badge } from "@/components/ui/badge";
import {
  initialsOf,
  memberById,
  PRIORITY_META,
  TYPE_META,
  type Ticket,
  type TicketStatus,
} from "@/features/(onboarding)/lib/mock-app";
import { cn } from "@/lib/utils";

type TicketCardProps = {
  ticket: Ticket;
  /** Zero-based position inside this column (required by useSortable). */
  index: number;
  /** The column this ticket belongs to — used as the dnd-kit group key. */
  column: TicketStatus;
};

const TicketCard = ({ ticket, index, column }: TicketCardProps) => {
  const { ref, isDragging } = useSortable({
    id: ticket.id,
    index,
    // "item" distinguishes tickets from the "column" type used by useDroppable,
    // so column droppables never accidentally accept another column as a child.
    type: "item",
    accept: "item",
    // group tells dnd-kit which column this card lives in. Cards with different
    // group values can be dragged between columns; the `move` helper uses this
    // to know which key in the Record<status, Ticket[]> to update.
    group: column,
  });

  const member = memberById(ticket.assigneeId);
  const typeStyle = TYPE_META[ticket.type];

  return (
    <div
      ref={ref}
      className={cn(
        "group cursor-grab rounded-lg border border-border bg-card p-3 shadow-card transition-all",
        "hover:border-brand/40 hover:shadow-elegant",
        isDragging && "opacity-40 shadow-none",
      )}
    >
      <div className="flex items-center justify-between">
        <Badge
          variant="outline"
          className={cn("border text-[10px]", typeStyle.className)}
        >
          {typeStyle.label}
        </Badge>
        <span
          className={cn(
            "text-[10px] font-medium tracking-wider uppercase",
            PRIORITY_META[ticket.priority].className,
          )}
        >
          {ticket.priority}
        </span>
      </div>

      <h4 className="mt-2 text-sm leading-snug font-medium">{ticket.title}</h4>

      {ticket.labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {ticket.labels.map((label) => (
            <span
              key={label}
              className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="font-mono text-[11px] text-muted-foreground">
          {ticket.key}
        </span>
        <div className="flex items-center gap-2">
          {ticket.points && (
            <span className="grid h-5 w-5 place-items-center rounded-full bg-muted text-[10px] font-semibold">
              {ticket.points}
            </span>
          )}
          {member ? (
            <div
              className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold text-white"
              style={{ background: member.avatarColor }}
              title={member.name}
            >
              {initialsOf(member.name)}
            </div>
          ) : (
            <div
              className="h-6 w-6 rounded-full border border-dashed border-border"
              title="Unassigned"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketCard;
