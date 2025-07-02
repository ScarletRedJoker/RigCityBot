import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import TicketList from "@/pages/TicketList";
import NewTicketModal from "@/components/NewTicketModal";
import TicketDetailView from "@/components/TicketDetailView";
import CommandHelp from "@/components/CommandHelp";
import { Ticket, TicketMessage } from "@shared/schema";
import { connectWebSocket } from "@/lib/ticketUtils";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "@/components/AuthProvider";

export default function Dashboard() {
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [isTicketDetailOpen, setIsTicketDetailOpen] = useState(false);
  const [isCommandHelpOpen, setIsCommandHelpOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const socketRef = useRef<WebSocket | null>(null);
  
  // Initialize WebSocket connection
  useEffect(() => {
    const handleWebSocketMessage = (data: any) => {
      if (data.type === 'TICKET_CREATED' || data.type === 'TICKET_UPDATED') {
        // Invalidate tickets query to refresh the list
        queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
        
        // If there's a selected ticket and it matches the updated one, update messages
        if (selectedTicket && data.data && data.data.id === selectedTicket.id) {
          // Update the selected ticket with the latest data
          setSelectedTicket(data.data);
          
          // Refresh messages if the ticket is currently open
          if (isTicketDetailOpen) {
            queryClient.invalidateQueries({ 
              queryKey: [`/api/tickets/${selectedTicket.id}/messages`] 
            });
          }
        }
      } else if (data.type === 'MESSAGE_CREATED') {
        // If the message is for the currently selected ticket, add it to the list
        if (selectedTicket && data.data && data.data.ticketId === selectedTicket.id) {
          queryClient.invalidateQueries({ 
            queryKey: [`/api/tickets/${selectedTicket.id}/messages`] 
          });
        }
      }
    };
    
    // Initialize WebSocket connection if user is authenticated
    if (user) {
      socketRef.current = connectWebSocket(handleWebSocketMessage, user.id);
    } else {
      // Connect without authentication if user is not logged in
      socketRef.current = connectWebSocket(handleWebSocketMessage);
    }
    
    // Clean up the connection when component unmounts
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [user, queryClient, selectedTicket, isTicketDetailOpen]);

  const handleOpenNewTicket = () => {
    setIsNewTicketModalOpen(true);
  };

  const handleCloseNewTicket = () => {
    setIsNewTicketModalOpen(false);
  };

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsTicketDetailOpen(true);
    
    // Fetch messages for this ticket
    fetch(`/api/tickets/${ticket.id}/messages`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }
        return response.json();
      })
      .then(messages => {
        setTicketMessages(messages);
        // Also invalidate the query to keep the cache updated
        queryClient.invalidateQueries({ 
          queryKey: [`/api/tickets/${ticket.id}/messages`] 
        });
      })
      .catch(error => {
        console.error("Error fetching ticket messages:", error);
        setTicketMessages([]);
      });
  };

  const handleCloseTicketDetail = () => {
    setIsTicketDetailOpen(false);
    setSelectedTicket(null);
    setTicketMessages([]);
  };

  const handleOpenCommandHelp = () => {
    setIsCommandHelpOpen(true);
  };

  const handleCloseCommandHelp = () => {
    setIsCommandHelpOpen(false);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar onHelpClick={handleOpenCommandHelp} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TicketList 
          onNewTicket={handleOpenNewTicket} 
          onViewTicket={handleViewTicket}
        />
      </div>
      
      {/* Modals */}
      <NewTicketModal 
        isOpen={isNewTicketModalOpen} 
        onClose={handleCloseNewTicket} 
      />
      
      <TicketDetailView 
        isOpen={isTicketDetailOpen}
        onClose={handleCloseTicketDetail}
        ticket={selectedTicket}
        messages={ticketMessages}
        setMessages={setTicketMessages}
      />
      
      <CommandHelp 
        isOpen={isCommandHelpOpen}
        onClose={handleCloseCommandHelp}
      />
    </div>
  );
}
