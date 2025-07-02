import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Ticket, TicketCategory } from "@shared/schema";

interface SidebarProps {
  onHelpClick: () => void;
}

export default function Sidebar({ onHelpClick }: SidebarProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Fetch categories
  const { data: categories = [] } = useQuery<TicketCategory[]>({
    queryKey: ['/api/categories'],
  });

  // Fetch tickets for category counts
  const { data: tickets = [] } = useQuery<Ticket[]>({
    queryKey: ['/api/tickets'],
  });

  // Calculate ticket counts by category
  const getCategoryTicketCount = (categoryId: number) => {
    return tickets.filter((ticket: Ticket) => ticket.categoryId === categoryId).length;
  };

  // Close the sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('mobile-sidebar');
      if (sidebar && !sidebar.contains(event.target as Node) && isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileSidebarOpen]);

  return (
    <>
      {/* Mobile Sidebar Button - Only visible on small screens */}
      <div className="md:hidden fixed top-0 left-0 z-20 p-4">
        <button 
          className="text-discord-text focus:outline-none"
          onClick={() => setIsMobileSidebarOpen(true)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar - Hidden on mobile until toggled */}
      <div 
        id="mobile-sidebar"
        className={`${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:static left-0 top-0 z-40 md:z-0 h-screen w-64 bg-discord-sidebar transition-transform duration-200 ease-in-out`}
      >
        <div className="p-4 border-b border-discord-dark">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-discord-blue flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="ml-3 font-bold text-white">Ticket Bot</h1>
          </div>
        </div>
        
        <div className="overflow-y-auto flex-grow">
          <div className="px-4 pt-5 pb-2">
            <h2 className="text-xs font-semibold text-discord-muted uppercase tracking-wider">
              Server
            </h2>
          </div>
          <div className="mt-1">
            <a href="#" className="block px-4 py-2 hover:bg-gray-700 font-medium flex items-center rounded mx-2">
              <span className="w-2 h-2 rounded-full bg-discord-success mr-2"></span>
              Discord Server
            </a>
          </div>
          
          <div className="px-4 pt-5 pb-2">
            <h2 className="text-xs font-semibold text-discord-muted uppercase tracking-wider">
              Navigation
            </h2>
          </div>
          <div className="mt-1">
            <a href="/" className="block px-4 py-2 bg-gray-700 text-white font-medium flex items-center rounded mx-2 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>All Tickets</span>
            </a>
            <a href="/admin" className="block px-4 py-2 hover:bg-gray-700 font-medium flex items-center rounded mx-2 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v-1l1-1v-1H4a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v2zm-2 0a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2h2v1H7v1h4v-1h-1v-1h2a2 2 0 002-2V8z" clipRule="evenodd" />
              </svg>
              <span>Admin Panel</span>
            </a>
            <a href="/settings" className="block px-4 py-2 hover:bg-gray-700 font-medium flex items-center rounded mx-2 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              <span>Settings</span>
            </a>
            <button 
              className="w-full text-left px-4 py-2 hover:bg-gray-700 font-medium flex items-center rounded mx-2 mb-1"
              onClick={onHelpClick}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <span>Help</span>
            </button>
          </div>
          
          <div className="px-4 pt-5 pb-2">
            <h2 className="text-xs font-semibold text-discord-muted uppercase tracking-wider">
              Ticket Categories
            </h2>
          </div>
          <div className="mt-1">
            {categories.map((category: TicketCategory) => (
              <a 
                key={category.id}
                href="#" 
                className="block px-4 py-2 hover:bg-gray-700 font-medium flex items-center rounded mx-2 mb-1"
              >
                <span 
                  className="w-2 h-2 rounded-full mr-2" 
                  style={{ backgroundColor: category.color }}
                ></span>
                <span>{category.name}</span>
                <span className="ml-auto bg-discord-dark px-2 rounded-full text-xs">
                  {getCategoryTicketCount(category.id)}
                </span>
              </a>
            ))}
          </div>
        </div>
        
        <div className="p-4 border-t border-discord-dark">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                <span className="text-sm font-medium">TB</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">Ticket Bot</p>
                <p className="text-xs text-discord-muted">Online</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
