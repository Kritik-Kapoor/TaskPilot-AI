"use client";

import TicketDetailsView from "@/features/(workspace)/ticket/components/TicketDetailsView";
import { use } from "react";

type TicketDetailsPageProps = {
  params: Promise<{ ticketId: string }>;
};

const TicketDetailsPage = ({ params }: TicketDetailsPageProps) => {
  const { ticketId } = use(params);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <TicketDetailsView ticketId={ticketId} />
    </div>
  );
};

export default TicketDetailsPage;
