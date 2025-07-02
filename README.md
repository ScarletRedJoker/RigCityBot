# Discord Ticket Bot

A modern Discord bot for creating and managing support tickets with an intuitive user interface and flexible theme support.

## Features

- Discord OAuth2 authentication with admin permission detection
- Admin panel for comprehensive ticket management
- Real-time updates via WebSockets
- Light/dark/system theme support with user preference memory
- Discord slash commands for ticket management
- Responsive design for mobile and desktop
- In-memory storage (no database configuration required)
- Customizable ticket categories with color coding
- Priority and status tracking for tickets
- Markdown support in ticket messages

## Setup Instructions

### Discord Developer Portal Setup

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application or select your existing one
3. Note the **Application ID** (DISCORD_APP_ID) and **Client ID** (DISCORD_CLIENT_ID) - these are usually the same value
4. Navigate to the "OAuth2" section
   - Copy the **Client Secret** (DISCORD_CLIENT_SECRET)
   - Add redirect URLs:
     - For local development: `http://localhost:5000/auth/discord/callback`
     - For Replit: `https://{your-repl-name}.{username}.repl.co/auth/discord/callback`
     - For custom domain: `https://your-domain.com/auth/discord/callback`
5. In the "Bot" section:
   - Click "Add Bot" if you haven't already
   - Copy the **Bot Token** (DISCORD_BOT_TOKEN)
   - Toggle off "Public Bot" if you only want to use it on your servers
   - Under "Privileged Gateway Intents", enable:
     - SERVER MEMBERS INTENT
     - MESSAGE CONTENT INTENT
   - Under "Bot Permissions", ensure your bot has the following permissions:
     - Read Messages/View Channels
     - Send Messages
     - Embed Links
     - Attach Files
     - Read Message History
     - Use Slash Commands
     - Use Application Commands

### Add the Bot to Your Server

Use the following URL to add your bot to your Discord server (replace YOUR_CLIENT_ID with your actual client ID):

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=274878221376&scope=bot%20applications.commands
```

This will give the bot the necessary permissions to function properly.

### Environment Variables

Copy `.env.example` to a new file called `.env` and fill in your Discord application credentials:

```
# Required Discord credentials
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_APP_ID=your_discord_application_id  # Usually the same as DISCORD_CLIENT_ID

# Session security - generate a strong random string
SESSION_SECRET=change_this_to_a_random_string
```

### Custom Domain Configuration

If you're using a custom domain instead of the default Replit URL:

1. Set your callback URL in the `.env` file:
   ```
   DISCORD_CALLBACK_URL=https://your-domain.com/auth/discord/callback
   ```

2. Configure WebSockets for your custom domain:
   ```
   VITE_CUSTOM_WS_URL=wss://your-domain.com/ws
   ```

3. Make sure to add your custom domain to the list of redirect URLs in the Discord Developer Portal OAuth2 settings

## Running the Application

### On Replit

The Replit environment is already configured with the necessary workflows. Just click the "Run" button.

### Local Development

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

This will start both the backend server and the frontend development server. The application will be available at http://localhost:5000.

## User Guide

### Authentication

- Users can authenticate through Discord OAuth2
- Server administrators automatically get admin privileges in the ticket system
- Non-admin users can create and manage their own tickets

### Creating Tickets

Tickets can be created in two ways:
1. Through the web dashboard using the "New Ticket" button
2. Via Discord using the `/create-ticket` slash command

### Admin Functions

Administrators can:
- View all tickets in the system
- Modify ticket statuses and priorities
- Create new ticket categories
- View system statistics
- Manage user permissions

## Troubleshooting

### Discord Bot Not Working

If the Discord bot isn't connecting:
1. Verify your DISCORD_BOT_TOKEN is correct and not expired
2. Check that your bot has the required intents enabled
3. Confirm the bot has been added to your server with the correct permissions

### OAuth Login Issues

If users can't log in:
1. Verify the DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET are correct
2. Check that your redirect URL matches exactly what's in the Discord Developer Portal
3. Ensure the OAuth2 scopes include 'identify' and 'guilds'

## Deployment

When deploying the application:

1. Make sure all environment variables are set correctly
2. Ensure your server can handle WebSocket connections
3. Configure your server to listen on port 5000 (or adjust the port in `server/index.ts`)
4. Update Discord Developer Portal redirect URLs to match your production domain

## License

MIT