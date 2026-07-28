import { Badge } from "@/components/ui/badge";
import {
  initialsOf,
  memberById,
  PRIORITY_META,
  Ticket,
  TYPE_META,
} from "@/features/(onboarding)/lib/mock-app";
import { cn } from "@/lib/utils";

const TicketCard = ({ ticket }: { ticket: Ticket }) => {
  const m = memberById(ticket.assigneeId);
  const type = TYPE_META[ticket.type];

  return (
    <div className="group cursor-pointer rounded-lg border border-border bg-card p-3 shadow-card transition-all hover:border-brand/40 hover:shadow-elegant">
      <div className="flex items-center justify-between">
        <Badge
          variant="outline"
          className={cn("border text-[10px]", type.className)}
        >
          {type.label}
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
          {m ? (
            <div
              className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold text-white"
              style={{ background: m.avatarColor }}
              title={m.name}
            >
              {initialsOf(m.name)}
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
