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
  type InsertTicketMessage 
} from "@shared/schema";

// Define the storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Discord user operations
  getAllDiscordUsers(): Promise<DiscordUser[]>;
  getDiscordUser(id: string): Promise<DiscordUser | undefined>;
  createDiscordUser(user: InsertDiscordUser): Promise<DiscordUser>;
  updateDiscordUser(id: string, updates: Partial<InsertDiscordUser>): Promise<DiscordUser | undefined>;
  
  // Server operations
  getAllServers(): Promise<Server[]>;
  getServer(id: string): Promise<Server | undefined>;
  createServer(server: InsertServer): Promise<Server>;
  updateServer(id: string, updates: Partial<InsertServer>): Promise<Server | undefined>;
  
  // Bot settings operations
  getBotSettings(serverId: string): Promise<BotSettings | undefined>;
  createBotSettings(settings: InsertBotSettings): Promise<BotSettings>;
  updateBotSettings(serverId: string, updates: Partial<InsertBotSettings>): Promise<BotSettings | undefined>;
  
  // Ticket category operations
  getAllTicketCategories(): Promise<TicketCategory[]>;
  getTicketCategory(id: number): Promise<TicketCategory | undefined>;
  getTicketCategoriesByServerId(serverId: string): Promise<TicketCategory[]>;
  createTicketCategory(category: InsertTicketCategory): Promise<TicketCategory>;
  
  // Ticket operations
  getAllTickets(): Promise<Ticket[]>;
  getTicket(id: number): Promise<Ticket | undefined>;
  getTicketsByCreator(creatorId: string): Promise<Ticket[]>;
  getTicketsByServerId(serverId: string): Promise<Ticket[]>;
  getTicketsByCategory(categoryId: number): Promise<Ticket[]>;
  getTicketsByStatus(status: string): Promise<Ticket[]>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: number, updates: Partial<InsertTicket>): Promise<Ticket | undefined>;
  
  // Ticket message operations
  getTicketMessages(ticketId: number): Promise<TicketMessage[]>;
  createTicketMessage(message: InsertTicketMessage): Promise<TicketMessage>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private discordUsers: Map<string, DiscordUser>;
  private servers: Map<string, Server>;
  private botSettings: Map<string, BotSettings>;
  private ticketCategories: Map<number, TicketCategory>;
  private tickets: Map<number, Ticket>;
  private ticketMessages: Map<number, TicketMessage>;
  
  private currentUserId: number;
  private currentTicketCategoryId: number;
  private currentTicketId: number;
  private currentTicketMessageId: number;
  private currentBotSettingsId: number;
  
  constructor() {
    this.users = new Map();
    this.discordUsers = new Map();
    this.ticketCategories = new Map();
    this.tickets = new Map();
    this.ticketMessages = new Map();
    
    this.currentUserId = 1;
    this.currentTicketCategoryId = 1;
    this.currentTicketId = 1;
    this.currentTicketMessageId = 1;
    
    // Initialize with default categories
    this.initializeDefaults();
  }
  
  private initializeDefaults() {
    // Add default ticket categories
    const defaultCategories = [
      { name: "General Support", color: "#5865F2" }, // Discord blue
      { name: "Bug Reports", color: "#F04747" },     // Discord red
      { name: "Feature Requests", color: "#FAA61A" }, // Discord yellow
      { name: "Account Issues", color: "#43B581" }   // Discord green
    ];
    
    defaultCategories.forEach(category => {
      this.createTicketCategory(category);
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Discord user operations
  async getAllDiscordUsers(): Promise<DiscordUser[]> {
    return Array.from(this.discordUsers.values());
  }
  
  async getDiscordUser(id: string): Promise<DiscordUser | undefined> {
    return this.discordUsers.get(id);
  }
  
  async createDiscordUser(insertUser: InsertDiscordUser): Promise<DiscordUser> {
    // Ensure required fields have default values if not provided
    const preparedUser = {
      ...insertUser,
      avatar: insertUser.avatar || null,
      isAdmin: insertUser.isAdmin !== undefined ? insertUser.isAdmin : null
    };
    
    const discordUser: DiscordUser = preparedUser;
    this.discordUsers.set(discordUser.id, discordUser);
    return discordUser;
  }
  
  async updateDiscordUser(id: string, updates: Partial<InsertDiscordUser>): Promise<DiscordUser | undefined> {
    const user = await this.getDiscordUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.discordUsers.set(id, updatedUser);
    return updatedUser;
  }
  
  // Ticket category operations
  async getAllTicketCategories(): Promise<TicketCategory[]> {
    return Array.from(this.ticketCategories.values());
  }
  
  async getTicketCategory(id: number): Promise<TicketCategory | undefined> {
    return this.ticketCategories.get(id);
  }
  
  async createTicketCategory(category: InsertTicketCategory): Promise<TicketCategory> {
    const id = this.currentTicketCategoryId++;
    const newCategory: TicketCategory = { 
      ...category, 
      id,
      color: category.color || '#3b82f6' // Default color if not provided
    };
    this.ticketCategories.set(id, newCategory);
    return newCategory;
  }
  
  // Ticket operations
  async getAllTickets(): Promise<Ticket[]> {
    return Array.from(this.tickets.values());
  }
  
  async getTicket(id: number): Promise<Ticket | undefined> {
    return this.tickets.get(id);
  }
  
  async getTicketsByCreator(creatorId: string): Promise<Ticket[]> {
    return Array.from(this.tickets.values())
      .filter(ticket => ticket.creatorId === creatorId);
  }
  
  async getTicketsByCategory(categoryId: number): Promise<Ticket[]> {
    return Array.from(this.tickets.values())
      .filter(ticket => ticket.categoryId === categoryId);
  }
  
  async getTicketsByStatus(status: string): Promise<Ticket[]> {
    return Array.from(this.tickets.values())
      .filter(ticket => ticket.status === status);
  }
  
  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    const id = this.currentTicketId++;
    const now = new Date();
    const ticket: Ticket = { 
      id,
      title: insertTicket.title,
      description: insertTicket.description,
      creatorId: insertTicket.creatorId,
      status: insertTicket.status || 'open',
      discordId: insertTicket.discordId || null,
      priority: insertTicket.priority || null,
      categoryId: insertTicket.categoryId || null,
      assigneeId: insertTicket.assigneeId || null,
      createdAt: now,
      updatedAt: now
    };
    this.tickets.set(id, ticket);
    return ticket;
  }
  
  async updateTicket(id: number, updates: Partial<InsertTicket>): Promise<Ticket | undefined> {
    const ticket = await this.getTicket(id);
    if (!ticket) return undefined;
    
    const updatedTicket: Ticket = { 
      ...ticket, 
      ...updates,
      updatedAt: new Date()
    };
    this.tickets.set(id, updatedTicket);
    return updatedTicket;
  }
  
  // Ticket message operations
  async getTicketMessages(ticketId: number): Promise<TicketMessage[]> {
    return Array.from(this.ticketMessages.values())
      .filter(message => message.ticketId === ticketId)
      .sort((a, b) => {
        // Handle null createdAt values (should not happen, but just in case)
        if (!a.createdAt) return -1;
        if (!b.createdAt) return 1;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
  }
  
  async createTicketMessage(insertMessage: InsertTicketMessage): Promise<TicketMessage> {
    const id = this.currentTicketMessageId++;
    const message: TicketMessage = { 
      ...insertMessage, 
      id,
      createdAt: new Date()
    };
    this.ticketMessages.set(id, message);
    
    // Update the ticket's updatedAt timestamp
    if (insertMessage.ticketId) {
      const ticket = await this.getTicket(insertMessage.ticketId);
      if (ticket) {
        await this.updateTicket(ticket.id, {});
      }
    }
    
    return message;
  }
}

export const storage = new MemStorage();
