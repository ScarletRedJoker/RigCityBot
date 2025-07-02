import { Client, GatewayIntentBits, Events, REST, Routes } from 'discord.js';
import { commands, registerCommands } from './commands';
import { IStorage } from '../storage';

// Discord bot instance
let client: Client | null = null;

export async function startBot(storage: IStorage, broadcast: (data: any) => void): Promise<void> {
  if (!process.env.DISCORD_BOT_TOKEN) {
    console.warn('DISCORD_BOT_TOKEN is not defined in environment variables');
    return;
  }

  if (!process.env.DISCORD_APP_ID) {
    console.warn('DISCORD_APP_ID is not defined in environment variables');
    return;
  }

  // Validate that the token matches the expected format
  const tokenRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
  if (!tokenRegex.test(process.env.DISCORD_BOT_TOKEN)) {
    console.warn('DISCORD_BOT_TOKEN appears to be in an invalid format.');
    return;
  }

  try {
    // Create a new Discord client with minimal required intents
    client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
      ]
    });

    // Register commands with Discord API
    try {
      await registerCommandsWithAPI(process.env.DISCORD_BOT_TOKEN);
    } catch (error) {
      console.error('Error registering commands with Discord API. Continuing with limited functionality:', error);
      // Continue with bot startup even if command registration fails
    }

    // Handle interaction create events (slash commands)
    client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isCommand()) return;
      
      const command = commands.get(interaction.commandName);
      if (!command) return;
      
      try {
        await command.execute(interaction, { storage, broadcast });
      } catch (error) {
        console.error(`Error executing command ${interaction.commandName}:`, error);
        
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ 
            content: 'There was an error while executing this command!', 
            ephemeral: true 
          });
        } else {
          await interaction.reply({ 
            content: 'There was an error while executing this command!', 
            ephemeral: true 
          });
        }
      }
    });

    // Handle ready event
    client.once(Events.ClientReady, (readyClient) => {
      console.log(`Discord bot ready! Logged in as ${readyClient.user.tag}`);
      registerCommands(client!);
    });

    // Setup error handlers
    client.on('error', (error) => {
      console.error('Discord client error:', error);
    });

    client.on('warn', (warning) => {
      console.warn('Discord client warning:', warning);
    });

    // Login to Discord with a timeout
    const loginPromise = client.login(process.env.DISCORD_BOT_TOKEN);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Discord login timed out after 15 seconds')), 15000);
    });

    await Promise.race([loginPromise, timeoutPromise]);
  } catch (error) {
    console.error('Failed to start Discord bot:', error);
    // Don't throw the error, just log it to prevent the app from crashing
  }
}

// Register commands with Discord API
async function registerCommandsWithAPI(token: string): Promise<void> {
  try {
    if (!process.env.DISCORD_APP_ID) {
      console.warn('DISCORD_APP_ID not provided. Commands will not be registered globally.');
      return;
    }
    
    const rest = new REST({ version: '10' }).setToken(token);
    const commandsData = Array.from(commands.values()).map(cmd => cmd.data.toJSON());
    
    // Add timeout to the request to prevent hanging indefinitely
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      // Global commands
      await rest.put(
        Routes.applicationCommands(process.env.DISCORD_APP_ID),
        { 
          body: commandsData,
          signal: controller.signal
        }
      );
      console.log('Successfully registered application commands globally');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.error('Request to register commands timed out');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('Error registering commands with Discord API:', error);
    throw error;
  }
}

// Shutdown the bot gracefully
export function shutdownBot(): Promise<void> {
  if (!client) {
    return Promise.resolve();
  }
  
  console.log('Shutting down Discord bot...');
  return client.destroy();
}
