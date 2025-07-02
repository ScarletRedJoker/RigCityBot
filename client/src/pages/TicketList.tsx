import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import TicketCard from "@/components/TicketCard";
import { Ticket } from "@shared/schema";

interface TicketListProps {
  onNewTicket: () => void;
  onViewTicket: (ticket: Ticket) => void;
}

export default function TicketList({ onNewTicket, onViewTicket }: TicketListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Fetch tickets
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['/api/tickets'],
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Filter tickets based on search query and filters
  const filteredTickets = tickets.filter((ticket: Ticket) => {
    // Apply search query filter
    if (searchQuery && !ticket.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Apply category filter
    if (categoryFilter !== null && ticket.categoryId !== categoryFilter) {
      return false;
    }
    
    // Apply status filter
    if (statusFilter !== null && ticket.status !== statusFilter) {
      return false;
    }
    
    return true;
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterToggle = () => {
    // Simple implementation - just toggling between open and all tickets
    if (statusFilter === 'open') {
      setStatusFilter(null);
    } else {
      setStatusFilter('open');
    }
  };

  // Count tickets by status
  const totalTickets = tickets.length;
  const openTickets = tickets.filter((ticket: Ticket) => ticket.status === 'open').length;
  const closedTickets = totalTickets - openTickets;

  return (
    <>
      {/* Header */}
      <Header 
        title="All Tickets" 
        totalTickets={totalTickets}
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        onFilterToggle={handleFilterToggle}
        onNewTicket={onNewTicket}
      />

      {/* Main ticket area */}
      <main className="flex-1 overflow-y-auto p-4 bg-discord-background">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-discord-text">Loading tickets...</div>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64">
            <div className="text-discord-text text-lg mb-2">No tickets found</div>
            <p className="text-discord-muted text-sm">
              {searchQuery 
                ? "Try adjusting your search criteria" 
                : "Create a new ticket to get started"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTickets.map((ticket: Ticket) => (
              <TicketCard 
                key={ticket.id}
                ticket={ticket}
                onViewTicket={() => onViewTicket(ticket)}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
