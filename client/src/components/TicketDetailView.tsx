import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Ticket, TicketMessage } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { useAuthContext } from "./AuthProvider";

interface TicketDetailViewProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket | null;
  messages: TicketMessage[];
  setMessages: React.Dispatch<React.SetStateAction<TicketMessage[]>>;
}

export default function TicketDetailView({ 
  isOpen, 
  onClose, 
  ticket, 
  messages,
  setMessages
}: TicketDetailViewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageContent, setMessageContent] = useState("");
  const { user } = useAuthContext();
  
  // Update ticket status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      if (!ticket) return;
      return apiRequest("PATCH", `/api/tickets/${ticket.id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: `Ticket ${ticket?.status === 'open' ? 'closed' : 'reopened'}`,
        description: `The ticket has been ${ticket?.status === 'open' ? 'closed' : 'reopened'} successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update ticket status: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  // Add message mutation
  const addMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!ticket || !user) return;
      return apiRequest("POST", `/api/tickets/${ticket.id}/messages`, { 
        content,
        senderId: user.id
      });
    },
    onSuccess: (data) => {
      // Instead of manually adding the message, we'll rely on the query invalidation
      // to refresh the messages list from the API
      setMessageContent("");
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticket?.id}/messages`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to send message: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  const handleStatusChange = () => {
    if (!ticket) return;
    updateStatusMutation.mutate(ticket.status === 'open' ? 'closed' : 'open');
  };
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim()) return;
    addMessageMutation.mutate(messageContent);
  };
  
  // If modal is not open or no ticket is selected, don't render anything
  if (!isOpen || !ticket) return null;
  
  return (
    <div className="fixed inset-0 z-10 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-discord-background rounded-lg shadow-lg w-full max-w-4xl mx-4 h-[80vh] flex flex-col">
        <div className="p-4 border-b border-discord-dark flex justify-between items-center">
          <div className="flex items-center">
            <h2 className="text-xl font-bold text-white">{ticket.title}</h2>
            <span 
              className={`ml-3 ${
                ticket.status === 'open' 
                  ? 'bg-discord-success/20 text-discord-success' 
                  : 'bg-discord-danger/20 text-discord-danger'
              } text-xs font-medium px-2 py-1 rounded-full`}
            >
              {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
            </span>
          </div>
          <button 
            className="text-discord-muted hover:text-white"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 bg-discord-sidebar flex-shrink-0">
          <div className="flex items-start">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white">
              U
            </div>
            <div className="ml-3">
              <div className="flex items-center">
                <span className="font-medium text-white">User</span>
                <span className="ml-2 text-xs text-discord-muted">
                  {ticket.createdAt ? formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true }) : 'Unknown time'}
                </span>
                <span className="ml-3 text-xs text-discord-muted">#{`ticket-${ticket.id}`}</span>
              </div>
              <div className="mt-1 text-discord-text">{ticket.description}</div>
              <div className="mt-2 flex">
                <span className="bg-discord-dark text-discord-text text-xs px-2 py-1 rounded-full mr-2">
                  <span 
                    className="w-2 h-2 inline-block rounded-full mr-1" 
                    style={{ 
                      backgroundColor: ticket.priority === 'urgent' 
                        ? '#FAA61A' // Yellow for urgent
                        : '#5865F2'  // Blue for normal
                    }}
                  ></span>
                  {ticket.priority ? `${ticket.priority.charAt(0).toUpperCase()}${ticket.priority.slice(1)} Priority` : 'Normal Priority'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-discord-muted py-8">
                No messages yet. Start the conversation by sending a message below.
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center text-white">
                    {message.senderId.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3 bg-discord-sidebar rounded-lg p-3 flex-1">
                    <div className="flex items-center">
                      <span className="font-medium text-white">
                        {user && message.senderId === user.id ? "You" : message.senderId}
                      </span>
                      {user && message.senderId !== user.id && (
                        <span className="ml-2 text-xs bg-discord-blue text-white px-1.5 rounded">STAFF</span>
                      )}
                      <span className="ml-2 text-xs text-discord-muted">
                        {message.createdAt 
                          ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: true }) 
                          : 'Unknown time'
                        }
                      </span>
                    </div>
                    <div className="mt-1 text-discord-text">{message.content}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="p-4 border-t border-discord-dark">
          <div className="flex items-start">
            <div className="flex-1">
              <form onSubmit={handleSendMessage}>
                <textarea 
                  placeholder="Reply to this ticket..." 
                  className="w-full bg-discord-dark border-none text-discord-text py-2 px-3 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-discord-blue"
                  rows={2}
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  disabled={ticket.status === 'closed'}
                ></textarea>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex space-x-2 text-discord-muted">
                    <button 
                      type="button"
                      className="hover:text-white transition-colors duration-150"
                      disabled={ticket.status === 'closed'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button 
                      type="button"
                      className="hover:text-white transition-colors duration-150"
                      disabled={ticket.status === 'closed'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      type="button"
                      className="px-3 py-1 bg-discord-dark hover:bg-gray-700 text-discord-text rounded text-sm"
                      onClick={handleStatusChange}
                      disabled={updateStatusMutation.isPending}
                    >
                      {ticket.status === 'open' ? 'Close Ticket' : 'Reopen Ticket'}
                    </button>
                    <button 
                      type="submit"
                      className="px-3 py-1 bg-discord-blue hover:bg-discord-darkBlue text-white rounded text-sm"
                      disabled={!messageContent.trim() || ticket.status === 'closed' || addMessageMutation.isPending}
                    >
                      {addMessageMutation.isPending ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
