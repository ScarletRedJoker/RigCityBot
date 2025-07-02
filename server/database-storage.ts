import { 
  type User, 
  type InsertUser, 
  type DiscordUser, 
  type InsertDiscordUser,
  type Server,
  type InsertServer,
  type BotSettings,
  type InsertBotSettings,
  type TicketCategory, 
  type InsertTicketCategory, 
  type Ticket, 
  type InsertTicket, 
  type TicketMessage, 
  type InsertTicketMessage,
  users,
  discordUsers,
  servers,
  botSettings,
  ticketCategories,
  tickets,
  ticketMessages
} from "@shared/schema";
import { IStorage } from "./storage";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  // Discord user operations
  async getAllDiscordUsers(): Promise<DiscordUser[]> {
    return await db.select().from(discordUsers);
  }
  
  async getDiscordUser(id: string): Promise<DiscordUser | undefined> {
    const [user] = await db.select().from(discordUsers).where(eq(discordUsers.id, id));
    return user;
  }
  
  async createDiscordUser(user: InsertDiscordUser): Promise<DiscordUser> {
    const [discordUser] = await db.insert(discordUsers).values({
      ...user,
      serverId: user.serverId || null
    }).returning();
    return discordUser;
  }
  
  async updateDiscordUser(id: string, updates: Partial<InsertDiscordUser>): Promise<DiscordUser | undefined> {
    const [updatedUser] = await db
      .update(discordUsers)
      .set(updates)
      .where(eq(discordUsers.id, id))
      .returning();
    return updatedUser;
  }
  
  // Server operations
  async getAllServers(): Promise<Server[]> {
    return await db.select().from(servers);
  }
  
  async getServer(id: string): Promise<Server | undefined> {
    const [server] = await db.select().from(servers).where(eq(servers.id, id));
    return server;
  }
  
  async createServer(server: InsertServer): Promise<Server> {
    const [newServer] = await db.insert(servers).values(server).returning();
    return newServer;
  }
  
  async updateServer(id: string, updates: Partial<InsertServer>): Promise<Server | undefined> {
    const [updatedServer] = await db
      .update(servers)
      .set(updates)
      .where(eq(servers.id, id))
      .returning();
    return updatedServer;
  }
  
  // Bot settings operations
  async getBotSettings(serverId: string): Promise<BotSettings | undefined> {
    const [settings] = await db.select().from(botSettings).where(eq(botSettings.serverId, serverId));
    return settings;
  }
  
  async createBotSettings(settings: InsertBotSettings): Promise<BotSettings> {
    const [newSettings] = await db.insert(botSettings).values({
      ...settings,
      updatedAt: new Date()
    }).returning();
    return newSettings;
  }
  
  async updateBotSettings(serverId: string, updates: Partial<InsertBotSettings>): Promise<BotSettings | undefined> {
    const [updatedSettings] = await db
      .update(botSettings)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(botSettings.serverId, serverId))
      .returning();
    return updatedSettings;
  }
  
  // Ticket category operations
  async getAllTicketCategories(): Promise<TicketCategory[]> {
    return await db.select().from(ticketCategories);
  }
  
  async getTicketCategoriesByServerId(serverId: string): Promise<TicketCategory[]> {
    return await db.select().from(ticketCategories).where(eq(ticketCategories.serverId, serverId));
  }
  
  async getTicketCategory(id: number): Promise<TicketCategory | undefined> {
    const [category] = await db.select().from(ticketCategories).where(eq(ticketCategories.id, id));
    return category;
  }
  
  async createTicketCategory(category: InsertTicketCategory): Promise<TicketCategory> {
    const [newCategory] = await db.insert(ticketCategories).values({
      ...category,
      serverId: category.serverId || null
    }).returning();
    return newCategory;
  }
  
  // Ticket operations
  async getAllTickets(): Promise<Ticket[]> {
    return await db.select().from(tickets);
  }
  
  async getTicket(id: number): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket;
  }
  
  async getTicketsByCreator(creatorId: string): Promise<Ticket[]> {
    return await db.select().from(tickets).where(eq(tickets.creatorId, creatorId));
  }
  
  async getTicketsByServerId(serverId: string): Promise<Ticket[]> {
    return await db.select().from(tickets).where(eq(tickets.serverId, serverId));
  }
  
  async getTicketsByCategory(categoryId: number): Promise<Ticket[]> {
    return await db.select().from(tickets).where(eq(tickets.categoryId, categoryId));
  }
  
  async getTicketsByStatus(status: string): Promise<Ticket[]> {
    return await db.select().from(tickets).where(eq(tickets.status, status));
  }
  
  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const now = new Date();
    const [newTicket] = await db.insert(tickets).values({
      ...ticket,
      serverId: ticket.serverId || null,
      createdAt: now,
      updatedAt: now
    }).returning();
    return newTicket;
  }
  
  async updateTicket(id: number, updates: Partial<InsertTicket>): Promise<Ticket | undefined> {
    const [updatedTicket] = await db
      .update(tickets)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(tickets.id, id))
      .returning();
    return updatedTicket;
  }
  
  // Ticket message operations
  async getTicketMessages(ticketId: number): Promise<TicketMessage[]> {
    return await db
      .select()
      .from(ticketMessages)
      .where(eq(ticketMessages.ticketId, ticketId))
      .orderBy(ticketMessages.createdAt);
  }
  
  async createTicketMessage(message: InsertTicketMessage): Promise<TicketMessage> {
    // Query the Discord user to get their username
    let senderUsername = null;
    
    try {
      const [discordUser] = await db
        .select()
        .from(discordUsers)
        .where(eq(discordUsers.id, message.senderId));
      
      if (discordUser) {
        senderUsername = discordUser.username;
      }
    } catch (error) {
      console.error("Error fetching user for message:", error);
    }
    
    const [newMessage] = await db.insert(ticketMessages).values({
      ...message,
      senderUsername,
      createdAt: new Date()
    }).returning();
    
    // Update the ticket's last update time
    if (message.ticketId) {
      await db
        .update(tickets)
        .set({ updatedAt: new Date() })
        .where(eq(tickets.id, message.ticketId));
    }
    
    return newMessage;
  }
}

// Export a single instance
export const dbStorage = new DatabaseStorage();