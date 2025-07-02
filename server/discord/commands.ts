import { 
  SlashCommandBuilder, 
  CommandInteraction, 
  Client, 
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Collection
} from 'discord.js';
import { IStorage } from '../storage';
import { InsertTicket, InsertTicketMessage } from '@shared/schema';

// Command execution context
interface CommandContext {
  storage: IStorage;
  broadcast: (data: any) => void;
}

// Command interface
interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: CommandInteraction, context: CommandContext) => Promise<void>;
}

// Create a collection to store commands
export const commands = new Collection<string, Command>();

// /ticket create command
const createTicketCommand: Command = {
  // @ts-ignore - Using subcommands causes TypeScript errors but is supported by Discord.js
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Ticket management commands')
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Create a new support ticket')
        .addStringOption(option =>
          option.setName('title')
            .setDescription('Title of your ticket')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('description')
            .setDescription('Describe your issue')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('category')
            .setDescription('Ticket category')
            .setRequired(true)
            .addChoices(
              { name: 'General Support', value: '1' },
              { name: 'Bug Reports', value: '2' },
              { name: 'Feature Requests', value: '3' },
              { name: 'Account Issues', value: '4' }
            )
        )
        .addBooleanOption(option =>
          option.setName('urgent')
            .setDescription('Mark this ticket as urgent')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List your open tickets')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View a specific ticket')
        .addIntegerOption(option =>
          option.setName('id')
            .setDescription('Ticket ID')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('close')
        .setDescription('Close a ticket')
        .addIntegerOption(option =>
          option.setName('id')
            .setDescription('Ticket ID')
            .setRequired(true)
        )
    ),
  execute: async (interaction, { storage, broadcast }) => {
    if (!interaction.isCommand()) return;
    
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'create') {
      try {
        await interaction.deferReply({ ephemeral: true });
        
        const title = interaction.options.getString('title', true);
        const description = interaction.options.getString('description', true);
        const categoryId = parseInt(interaction.options.getString('category', true));
        const isUrgent = interaction.options.getBoolean('urgent') || false;
        
        // Validate the user exists in our system, create if not
        const discordUser = await storage.getDiscordUser(interaction.user.id);
        
        if (!discordUser) {
          await storage.createDiscordUser({
            id: interaction.user.id,
            username: interaction.user.username,
            discriminator: interaction.user.discriminator || '0000',
            avatar: interaction.user.avatarURL() || undefined,
            isAdmin: false
          });
        }
        
        // Create the ticket
        const ticketData: InsertTicket = {
          title,
          description,
          status: 'open',
          priority: isUrgent ? 'urgent' : 'normal',
          categoryId,
          creatorId: interaction.user.id,
        };
        
        const ticket = await storage.createTicket(ticketData);
        
        // Create first message from the user
        await storage.createTicketMessage({
          ticketId: ticket.id,
          senderId: interaction.user.id,
          content: description
        });
        
        // Notify all connected clients about the new ticket
        broadcast({ type: 'TICKET_CREATED', data: ticket });
        
        // Get the base URL for the dashboard from environment variables or use a default
        const baseUrl = process.env.APP_URL || 'https://scarletredjoker.com';
        const dashboardUrl = `${baseUrl}/dashboard`;
        
        // Get the category name
        const category = await storage.getTicketCategory(categoryId);
        const categoryName = category ? category.name : 'Unknown Category';
        
        // Send confirmation with a rich embed and button link to the dashboard
        const embed = new EmbedBuilder()
          .setTitle('🎫 Ticket Created')
          .setDescription(`Your support ticket has been created successfully.\n\n**${title}**\n${description.substring(0, 100)}${description.length > 100 ? '...' : ''}`)
          .addFields(
            { name: 'Ticket ID', value: `#${ticket.id}`, inline: true },
            { name: 'Status', value: '✅ Open', inline: true },
            { name: 'Priority', value: isUrgent ? '🔴 Urgent' : '🟢 Normal', inline: true },
            { name: 'Category', value: categoryName, inline: true }
          )
          .setColor('#5865F2')
          .setFooter({ text: 'View and manage this ticket in the web dashboard' })
          .setTimestamp();
        
        // Create a button that links to the dashboard
        const linkButton = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setLabel('View in Dashboard')
              .setStyle(ButtonStyle.Link)
              .setURL(dashboardUrl),
          );
        
        await interaction.editReply({ 
          embeds: [embed],
          components: [linkButton]
        });
      } catch (error) {
        console.error('Error creating ticket:', error);
        await interaction.editReply('Failed to create ticket. Please try again later.');
      }
    } else if (subcommand === 'list') {
      try {
        await interaction.deferReply({ ephemeral: true });
        
        const tickets = await storage.getTicketsByCreator(interaction.user.id);
        
        if (tickets.length === 0) {
          await interaction.editReply('You have no open tickets.');
          return;
        }
        
        const embed = new EmbedBuilder()
          .setTitle('Your Tickets')
          .setDescription('Here are your current tickets:')
          .setColor('#5865F2')
          .setTimestamp();
        
        tickets.forEach(ticket => {
          embed.addFields({
            name: `#ticket-${ticket.id}: ${ticket.title}`,
            value: `Status: ${ticket.status} | Priority: ${ticket.priority}`
          });
        });
        
        await interaction.editReply({ embeds: [embed] });
      } catch (error) {
        console.error('Error listing tickets:', error);
        await interaction.editReply('Failed to list tickets. Please try again later.');
      }
    } else if (subcommand === 'view') {
      try {
        await interaction.deferReply({ ephemeral: true });
        
        const ticketId = interaction.options.getInteger('id', true);
        const ticket = await storage.getTicket(ticketId);
        
        if (!ticket) {
          await interaction.editReply(`Ticket #${ticketId} not found.`);
          return;
        }
        
        // Check if the user is the creator or has admin role
        const user = await storage.getDiscordUser(interaction.user.id);
        if (ticket.creatorId !== interaction.user.id && !(user?.isAdmin)) {
          await interaction.editReply('You do not have permission to view this ticket.');
          return;
        }
        
        const messages = await storage.getTicketMessages(ticketId);
        const category = ticket.categoryId 
          ? await storage.getTicketCategory(ticket.categoryId)
          : null;
        
        const embed = new EmbedBuilder()
          .setTitle(`Ticket #${ticket.id}: ${ticket.title}`)
          .setDescription(ticket.description)
          .addFields(
            { name: 'Status', value: ticket.status, inline: true },
            { name: 'Priority', value: ticket.priority, inline: true },
            { name: 'Category', value: category?.name || 'None', inline: true },
            { name: 'Created', value: ticket.createdAt ? ticket.createdAt.toLocaleString() : 'Unknown', inline: true }
          )
          .setColor('#5865F2')
          .setTimestamp();
        
        // Create buttons for actions
        const row = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`closeTicket_${ticket.id}`)
              .setLabel('Close Ticket')
              .setStyle(ButtonStyle.Danger),
          );
        
        await interaction.editReply({ 
          embeds: [embed],
          components: [row]
        });
        
        // Show the last 3 messages if any
        if (messages.length > 0) {
          const recentMessages = messages.slice(-3);
          const messagesEmbed = new EmbedBuilder()
            .setTitle('Recent Messages')
            .setColor('#36393F');
          
          recentMessages.forEach((msg, index) => {
            messagesEmbed.addFields({
              name: `Message ${index + 1}`,
              value: `From: <@${msg.senderId}>\n${msg.content}\n${msg.createdAt ? msg.createdAt.toLocaleString() : 'Unknown time'}`
            });
          });
          
          await interaction.followUp({ 
            embeds: [messagesEmbed],
            ephemeral: true
          });
        }
      } catch (error) {
        console.error('Error viewing ticket:', error);
        await interaction.editReply('Failed to view ticket. Please try again later.');
      }
    } else if (subcommand === 'close') {
      try {
        await interaction.deferReply({ ephemeral: true });
        
        const ticketId = interaction.options.getInteger('id', true);
        const ticket = await storage.getTicket(ticketId);
        
        if (!ticket) {
          await interaction.editReply(`Ticket #${ticketId} not found.`);
          return;
        }
        
        // Check if the user is the creator or has admin role
        const user = await storage.getDiscordUser(interaction.user.id);
        if (ticket.creatorId !== interaction.user.id && !(user?.isAdmin)) {
          await interaction.editReply('You do not have permission to close this ticket.');
          return;
        }
        
        if (ticket.status === 'closed') {
          await interaction.editReply('This ticket is already closed.');
          return;
        }
        
        const updatedTicket = await storage.updateTicket(ticketId, { status: 'closed' });
        
        // Notify all connected clients about the updated ticket
        broadcast({ type: 'TICKET_UPDATED', data: updatedTicket });
        
        // Create a system message for the closure
        await storage.createTicketMessage({
          ticketId: ticket.id,
          senderId: interaction.user.id,
          content: `Ticket closed by ${interaction.user.username}.`
        });
        
        const embed = new EmbedBuilder()
          .setTitle('Ticket Closed')
          .setDescription(`Ticket #${ticketId} has been closed successfully.`)
          .setColor('#F04747')
          .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
      } catch (error) {
        console.error('Error closing ticket:', error);
        await interaction.editReply('Failed to close ticket. Please try again later.');
      }
    }
  }
};

// Register all commands
commands.set('ticket', createTicketCommand);

// Function to handle additional command registration with a Discord client
export function registerCommands(client: Client): void {
  // Register button interactions
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    
    const [action, idStr] = interaction.customId.split('_');
    const id = parseInt(idStr);
    
    if (action === 'closeTicket') {
      try {
        await interaction.deferUpdate();
        
        // Get the storage instance from the client
        // @ts-ignore - We're accessing a property we set on client
        const storage = client.storage as IStorage;
        if (!storage) throw new Error('Storage not available');
        
        const ticket = await storage.getTicket(id);
        if (!ticket) {
          await interaction.followUp({ 
            content: `Ticket #${id} not found.`, 
            ephemeral: true 
          });
          return;
        }
        
        await storage.updateTicket(id, { status: 'closed' });
        
        // Create a system message for the closure
        await storage.createTicketMessage({
          ticketId: id,
          senderId: interaction.user.id,
          content: `Ticket closed by ${interaction.user.username}.`
        });
        
        // @ts-ignore - We're accessing a property we set on client
        const broadcast = client.broadcast as (data: any) => void;
        if (broadcast) {
          broadcast({ 
            type: 'TICKET_UPDATED', 
            data: { ...ticket, status: 'closed' } 
          });
        }
        
        await interaction.editReply({ 
          content: `Ticket #${id} has been closed.`,
          components: []
        });
      } catch (error) {
        console.error('Error handling button interaction:', error);
        await interaction.followUp({ 
          content: 'An error occurred while processing your request.',
          ephemeral: true
        });
      }
    }
  });
  
  // Store storage and broadcast on the client for easy access
  // @ts-ignore - We're setting properties on client
  client.storage = client.storage || null;
  // @ts-ignore - We're setting properties on client
  client.broadcast = client.broadcast || null;
}
