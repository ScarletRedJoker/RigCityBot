import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ticket } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface TicketCardProps {
  ticket: Ticket;
  onViewTicket: () => void;
}

export default function TicketCard({ ticket, onViewTicket }: TicketCardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get category info
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Get ticket messages for message count
  const { data: messages = [] } = useQuery({
    queryKey: [`/api/tickets/${ticket.id}/messages`],
  });

  // Determine category for this ticket
  const category = categories.find((c: any) => c.id === ticket.categoryId) || {
    name: "Uncategorized",
    color: "#5865F2"
  };

  // Get ticket creator info
  const creatorName = "User"; // In a real app, you'd fetch this from the API

  // Close ticket mutation
  const closeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/tickets/${ticket.id}`, { status: "closed" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: "Ticket closed",
        description: `Ticket #${ticket.id} has been closed.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to close ticket: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Reopen ticket mutation
  const reopenMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/tickets/${ticket.id}`, { status: "open" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: "Ticket reopened",
        description: `Ticket #${ticket.id} has been reopened.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to reopen ticket: ${error}`,
        variant: "destructive",
      });
    }
  });

  const handleCloseTicket = (e: React.MouseEvent) => {
    e.stopPropagation();
    closeMutation.mutate();
  };

  const handleReopenTicket = (e: React.MouseEvent) => {
    e.stopPropagation();
    reopenMutation.mutate();
  };

  // Format the date for display
  const formattedDate = ticket.createdAt 
    ? formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })
    : "Unknown date";

  // Determine border color and status badge based on ticket status and priority
  let borderColor, statusBgColor, statusTextColor, statusLabel;
  
  if (ticket.status === "open") {
    borderColor = "border-discord-success";
    statusBgColor = "bg-discord-success/20";
    statusTextColor = "text-discord-success";
    statusLabel = "Open";
  } else {
    borderColor = "border-discord-danger";
    statusBgColor = "bg-discord-danger/20";
    statusTextColor = "text-discord-danger";
    statusLabel = "Closed";
  }

  return (
    <div 
      className={`bg-discord-sidebar border-l-4 ${borderColor} rounded-md shadow-sm overflow-hidden cursor-pointer hover:opacity-90 transition-opacity`}
      onClick={onViewTicket}
    >
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-white">{ticket.title}</h3>
            <div className="flex items-center mt-1 text-sm text-discord-muted">
              <span>#{`ticket-${ticket.id}`}</span>
              <span className="mx-2">•</span>
              <span>
                <span 
                  className="w-2 h-2 inline-block rounded-full mr-1" 
                  style={{ backgroundColor: category.color }}
                ></span>
                {category.name}
              </span>
            </div>
          </div>
          
          <div className="flex">
            {ticket.priority === "urgent" && (
              <span className="bg-discord-warning/20 text-discord-warning text-xs font-medium px-2 py-1 rounded-full mr-2">
                Urgent
              </span>
            )}
            <span className={`${statusBgColor} ${statusTextColor} text-xs font-medium px-2 py-1 rounded-full`}>
              {statusLabel}
            </span>
          </div>
        </div>
        
        <div className="mt-3 text-sm">
          <div className="flex items-start space-x-2">
            <div className="w-8 h-8 rounded-full bg-gray-600 flex-shrink-0 flex items-center justify-center text-white">
              {creatorName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center">
                <span className="font-medium text-white">{creatorName}</span>
                <span className="ml-2 text-xs text-discord-muted">{formattedDate}</span>
              </div>
              <p className="text-discord-text mt-1 line-clamp-2">{ticket.description}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-discord-dark">
          <span className="text-xs text-discord-muted">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </span>
          
          <div className="flex space-x-2">
            <button 
              className="text-discord-muted hover:text-white transition-colors duration-150 text-sm"
              onClick={(e) => {
                e.stopPropagation();
                onViewTicket();
              }}
              aria-label="View ticket"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
            </button>
            
            {ticket.status === "open" ? (
              <button 
                className="text-discord-muted hover:text-discord-danger transition-colors duration-150 text-sm"
                onClick={handleCloseTicket}
                aria-label="Close ticket"
                disabled={closeMutation.isPending}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            ) : (
              <button 
                className="text-discord-muted hover:text-discord-success transition-colors duration-150 text-sm"
                onClick={handleReopenTicket}
                aria-label="Reopen ticket"
                disabled={reopenMutation.isPending}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
