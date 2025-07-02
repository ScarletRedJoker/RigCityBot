import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TicketCategory } from "@shared/schema";

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewTicketModal({ isOpen, onClose }: NewTicketModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number>(1); // Default to first category
  const [isUrgent, setIsUrgent] = useState(false);
  
  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });
  
  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (ticketData: any) => {
      return apiRequest("POST", "/api/tickets", ticketData);
    },
    onSuccess: () => {
      // Reset form and close modal
      resetForm();
      onClose();
      
      // Invalidate and refetch tickets
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      
      toast({
        title: "Ticket Created",
        description: "Your ticket has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create ticket: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategoryId(1);
    setIsUrgent(false);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create a temporary user ID (in a real app, this would be the actual user ID)
    const creatorId = "user123";
    
    // Create the ticket
    createTicketMutation.mutate({
      title,
      description,
      categoryId,
      priority: isUrgent ? "urgent" : "normal",
      status: "open",
      creatorId
    });
  };
  
  // If modal is not open, don't render anything
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-10 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-discord-sidebar rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="p-4 border-b border-discord-dark">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Create New Ticket</h2>
            <button 
              className="text-discord-muted hover:text-white"
              onClick={onClose}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-4">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-discord-text font-medium mb-2" htmlFor="category">
                Category
              </label>
              <select 
                id="category" 
                name="category" 
                className="w-full bg-discord-dark border-none text-discord-text py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-discord-blue"
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
              >
                {categories.map((category: TicketCategory) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-discord-text font-medium mb-2" htmlFor="title">
                Title
              </label>
              <input 
                type="text" 
                id="title" 
                name="title" 
                placeholder="Brief description of your issue" 
                className="w-full bg-discord-dark border-none text-discord-text py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-discord-blue"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-discord-text font-medium mb-2" htmlFor="description">
                Description
              </label>
              <textarea 
                id="description" 
                name="description" 
                rows={4} 
                placeholder="Provide details about your issue..." 
                className="w-full bg-discord-dark border-none text-discord-text py-2 px-3 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-discord-blue"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              ></textarea>
            </div>
            
            <div className="mb-4">
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  name="urgent" 
                  className="rounded bg-discord-dark border-none text-discord-blue focus:ring-discord-blue focus:ring-offset-0"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                />
                <span className="ml-2 text-discord-text">Mark as urgent</span>
              </label>
            </div>
            
            <div className="text-sm text-discord-muted mb-4">
              <p>A new ticket will be created in the server. Staff will respond as soon as possible.</p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                type="button" 
                className="px-4 py-2 bg-discord-dark text-discord-text hover:bg-gray-700 rounded-md text-sm font-medium"
                onClick={onClose}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-discord-blue hover:bg-discord-darkBlue text-white rounded-md text-sm font-medium"
                disabled={createTicketMutation.isPending}
              >
                {createTicketMutation.isPending ? "Creating..." : "Create Ticket"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
