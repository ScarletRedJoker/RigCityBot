import { Ticket, TicketMessage } from "@shared/schema";

/**
 * Format date for display
 */
export function formatDate(date: Date | string | undefined | null): string {
  if (!date) return "Unknown date";
  
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString();
}

/**
 * Get color for ticket category
 */
export function getCategoryColor(categoryId: number | undefined | null): string {
  switch (categoryId) {
    case 1: return "#5865F2"; // General Support - Discord blue
    case 2: return "#F04747"; // Bug Reports - Discord red
    case 3: return "#FAA61A"; // Feature Requests - Discord yellow
    case 4: return "#43B581"; // Account Issues - Discord green
    default: return "#5865F2"; // Default - Discord blue
  }
}

/**
 * Get status color for ticket
 */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "open": return "#43B581"; // Discord green
    case "closed": return "#F04747"; // Discord red
    default: return "#5865F2"; // Discord blue
  }
}

/**
 * Get priority badge color
 */
export function getPriorityColor(priority: string): string {
  switch (priority.toLowerCase()) {
    case "urgent": return "#FAA61A"; // Discord yellow
    case "high": return "#F04747"; // Discord red
    case "normal": return "#5865F2"; // Discord blue
    case "low": return "#43B581"; // Discord green
    default: return "#5865F2"; // Discord blue
  }
}

/**
 * Connect to WebSocket for real-time updates
 */
export function connectWebSocket(onMessage: (data: any) => void, userId?: string): WebSocket {
  // Check if we have a custom WebSocket URL defined in environment
  const customWsUrl = import.meta.env.VITE_CUSTOM_WS_URL;
  
  let wsUrl;
  if (customWsUrl) {
    // Use the custom WebSocket URL if provided
    wsUrl = customWsUrl;
  } else {
    // Otherwise use the default host-based URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    wsUrl = `${protocol}//${window.location.host}/ws`;
  }
  
  const socket = new WebSocket(wsUrl);
  
  socket.onopen = () => {
    console.log('WebSocket connection established');
    
    // Authenticate with user ID if available
    if (userId) {
      socket.send(JSON.stringify({
        type: 'auth',
        userId
      }));
    }
  };
  
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };
  
  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  socket.onclose = () => {
    console.log('WebSocket connection closed');
    // Attempt to reconnect after a delay
    setTimeout(() => {
      connectWebSocket(onMessage, userId);
    }, 5000);
  };
  
  return socket;
}
