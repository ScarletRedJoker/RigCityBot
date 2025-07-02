import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import WebSocket, { WebSocketServer } from "ws";
import { z } from "zod";
import { 
  insertTicketSchema, 
  insertTicketMessageSchema, 
  insertTicketCategorySchema,
  insertServerSchema,
  insertBotSettingsSchema
} from "@shared/schema";
import { startBot } from "./discord/bot";
import { isAuthenticated, isAdmin } from "./auth";

interface SocketData {
  userId?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Create WebSocket server with a specific path to avoid conflict with Vite's HMR
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // WebSocket handling
  wss.on('connection', (ws: WebSocket & { data?: SocketData }) => {
    ws.data = {};
    
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'auth' && data.userId) {
          ws.data!.userId = data.userId;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
  });
  
  // Broadcast to all connected clients
  const broadcast = (data: any) => {
    wss.clients.forEach(client => {
      // Import WebSocket from ws package to access the OPEN state
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // API routes
  app.get('/api/categories', async (_req: Request, res: Response) => {
    try {
      const categories = await storage.getAllTicketCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  });
  
  app.get('/api/categories/server/:serverId', async (req: Request, res: Response) => {
    try {
      const serverId = req.params.serverId;
      const categories = await storage.getTicketCategoriesByServerId(serverId);
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories by server:', error);
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  });

  app.post('/api/categories', isAdmin, async (req: Request, res: Response) => {
    try {
      const validatedData = insertTicketCategorySchema.parse(req.body);
      const category = await storage.createTicketCategory(validatedData);
      res.status(201).json(category);
      broadcast({ type: 'CATEGORY_CREATED', data: category });
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(400).json({ message: 'Invalid category data' });
    }
  });

  app.get('/api/tickets', async (_req: Request, res: Response) => {
    try {
      const tickets = await storage.getAllTickets();
      res.json(tickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      res.status(500).json({ message: 'Failed to fetch tickets' });
    }
  });
  
  app.get('/api/tickets/server/:serverId', async (req: Request, res: Response) => {
    try {
      const serverId = req.params.serverId;
      const tickets = await storage.getTicketsByServerId(serverId);
      res.json(tickets);
    } catch (error) {
      console.error('Error fetching tickets by server:', error);
      res.status(500).json({ message: 'Failed to fetch tickets' });
    }
  });

  app.get('/api/tickets/:id', async (req: Request, res: Response) => {
    try {
      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) {
        return res.status(400).json({ message: 'Invalid ticket ID' });
      }
      
      const ticket = await storage.getTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
      
      res.json(ticket);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      res.status(500).json({ message: 'Failed to fetch ticket' });
    }
  });

  app.post('/api/tickets', async (req: Request, res: Response) => {
    try {
      const validatedData = insertTicketSchema.parse(req.body);
      const ticket = await storage.createTicket(validatedData);
      res.status(201).json(ticket);
      broadcast({ type: 'TICKET_CREATED', data: ticket });
    } catch (error) {
      console.error('Error creating ticket:', error);
      res.status(400).json({ message: 'Invalid ticket data' });
    }
  });

  app.patch('/api/tickets/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) {
        return res.status(400).json({ message: 'Invalid ticket ID' });
      }
      
      const updateSchema = insertTicketSchema.partial();
      const validatedData = updateSchema.parse(req.body);
      
      const updatedTicket = await storage.updateTicket(ticketId, validatedData);
      if (!updatedTicket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
      
      res.json(updatedTicket);
      broadcast({ type: 'TICKET_UPDATED', data: updatedTicket });
    } catch (error) {
      console.error('Error updating ticket:', error);
      res.status(400).json({ message: 'Invalid ticket data' });
    }
  });

  app.get('/api/tickets/:id/messages', async (req: Request, res: Response) => {
    try {
      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) {
        return res.status(400).json({ message: 'Invalid ticket ID' });
      }
      
      const ticket = await storage.getTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
      
      const messages = await storage.getTicketMessages(ticketId);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching ticket messages:', error);
      res.status(500).json({ message: 'Failed to fetch ticket messages' });
    }
  });

  app.post('/api/tickets/:id/messages', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) {
        return res.status(400).json({ message: 'Invalid ticket ID' });
      }
      
      const ticket = await storage.getTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
      
      const messageData = {
        ...req.body,
        ticketId
      };
      
      const validatedData = insertTicketMessageSchema.parse(messageData);
      const message = await storage.createTicketMessage(validatedData);
      
      res.status(201).json(message);
      broadcast({ 
        type: 'MESSAGE_CREATED', 
        data: { ticketId, message } 
      });
    } catch (error) {
      console.error('Error creating ticket message:', error);
      res.status(400).json({ message: 'Invalid message data' });
    }
  });

  // Server routes
  app.get('/api/servers', isAdmin, async (_req: Request, res: Response) => {
    try {
      const servers = await storage.getAllServers();
      res.json(servers);
    } catch (error) {
      console.error('Error fetching servers:', error);
      res.status(500).json({ message: 'Failed to fetch servers' });
    }
  });

  app.get('/api/servers/:id', isAdmin, async (req: Request, res: Response) => {
    try {
      const serverId = req.params.id;
      const server = await storage.getServer(serverId);
      if (!server) {
        return res.status(404).json({ message: 'Server not found' });
      }
      res.json(server);
    } catch (error) {
      console.error('Error fetching server:', error);
      res.status(500).json({ message: 'Failed to fetch server' });
    }
  });

  app.post('/api/servers', isAdmin, async (req: Request, res: Response) => {
    try {
      const validatedData = insertServerSchema.parse(req.body);
      const server = await storage.createServer(validatedData);
      res.status(201).json(server);
    } catch (error) {
      console.error('Error creating server:', error);
      res.status(400).json({ message: 'Invalid server data' });
    }
  });

  app.patch('/api/servers/:id', isAdmin, async (req: Request, res: Response) => {
    try {
      const serverId = req.params.id;
      const updateSchema = insertServerSchema.partial();
      const validatedData = updateSchema.parse(req.body);
      
      const updatedServer = await storage.updateServer(serverId, validatedData);
      if (!updatedServer) {
        return res.status(404).json({ message: 'Server not found' });
      }
      
      res.json(updatedServer);
    } catch (error) {
      console.error('Error updating server:', error);
      res.status(400).json({ message: 'Invalid server data' });
    }
  });

  // Bot settings routes
  app.get('/api/bot-settings/:serverId', isAdmin, async (req: Request, res: Response) => {
    try {
      const serverId = req.params.serverId;
      const settings = await storage.getBotSettings(serverId);
      if (!settings) {
        return res.status(404).json({ message: 'Bot settings not found' });
      }
      res.json(settings);
    } catch (error) {
      console.error('Error fetching bot settings:', error);
      res.status(500).json({ message: 'Failed to fetch bot settings' });
    }
  });

  app.post('/api/bot-settings', isAdmin, async (req: Request, res: Response) => {
    try {
      const validatedData = insertBotSettingsSchema.parse(req.body);
      const settings = await storage.createBotSettings(validatedData);
      res.status(201).json(settings);
    } catch (error) {
      console.error('Error creating bot settings:', error);
      res.status(400).json({ message: 'Invalid bot settings data' });
    }
  });

  app.patch('/api/bot-settings/:serverId', isAdmin, async (req: Request, res: Response) => {
    try {
      const serverId = req.params.serverId;
      const updateSchema = insertBotSettingsSchema.partial();
      const validatedData = updateSchema.parse(req.body);
      
      const updatedSettings = await storage.updateBotSettings(serverId, validatedData);
      if (!updatedSettings) {
        return res.status(404).json({ message: 'Bot settings not found' });
      }
      
      res.json(updatedSettings);
    } catch (error) {
      console.error('Error updating bot settings:', error);
      res.status(400).json({ message: 'Invalid bot settings data' });
    }
  });

  // Admin-specific routes
  app.get('/api/admin/stats', isAdmin, async (_req: Request, res: Response) => {
    try {
      const tickets = await storage.getAllTickets();
      const categories = await storage.getAllTicketCategories();
      const discordUsers = await storage.getAllDiscordUsers();
      
      const openTickets = tickets.filter(ticket => ticket.status === 'open').length;
      const closedTickets = tickets.filter(ticket => ticket.status === 'closed').length;
      const pendingTickets = tickets.filter(ticket => ticket.status === 'pending').length;
      
      const stats = {
        ticketCounts: {
          total: tickets.length,
          open: openTickets,
          closed: closedTickets,
          pending: pendingTickets
        },
        categoryStats: categories.map(category => {
          const categoryTickets = tickets.filter(ticket => ticket.categoryId === category.id);
          return {
            id: category.id,
            name: category.name,
            count: categoryTickets.length,
            openCount: categoryTickets.filter(ticket => ticket.status === 'open').length
          };
        }),
        userStats: {
          totalUsers: discordUsers.length,
          adminUsers: discordUsers.filter(user => user.isAdmin).length
        }
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ message: 'Failed to fetch admin stats' });
    }
  });

  // Start the Discord bot
  try {
    if (process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_APP_ID) {
      console.log('Attempting to start Discord bot...');
      await startBot(storage, broadcast);
    } else {
      const missing = [];
      if (!process.env.DISCORD_BOT_TOKEN) missing.push('DISCORD_BOT_TOKEN');
      if (!process.env.DISCORD_APP_ID) missing.push('DISCORD_APP_ID');
      console.warn(`Some Discord configuration values are missing: ${missing.join(', ')}. Discord bot functionality will be disabled.`);
    }
  } catch (error) {
    console.error('Failed to start Discord bot:', error);
    console.warn('The application will continue to run without Discord bot integration. You can still use the web dashboard.');
  }

  return httpServer;
}
