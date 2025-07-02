import { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import MemoryStore from 'memorystore';
import { IStorage } from './storage';

// Configure session store
const SessionStore = MemoryStore(session);

export function setupAuth(app: Express, storage: IStorage): void {
  // Session configuration
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'discord-ticket-bot-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 86400000 }, // 1 day
      store: new SessionStore({ checkPeriod: 86400000 }) // prune expired entries every 24h
    })
  );

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Discord strategy configuration
  if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
    console.log('Setting up Discord authentication strategy');
    try {
      passport.use(
        new DiscordStrategy(
          {
            clientID: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
            callbackURL: process.env.DISCORD_CALLBACK_URL || '/auth/discord/callback',
            scope: ['identify', 'guilds']
          },
          async (accessToken, refreshToken, profile, done) => {
            try {
              console.log(`Discord auth: Processing login for user ${profile.username}#${profile.discriminator}`);
              
              // Check if user exists in the database
              let user = await storage.getDiscordUser(profile.id);
              
              if (!user) {
                console.log(`Discord auth: Creating new user for ${profile.username}`);
                // Create new user if not found
                user = await storage.createDiscordUser({
                  id: profile.id,
                  username: profile.username,
                  discriminator: profile.discriminator,
                  avatar: profile.avatar,
                  isAdmin: null // Will be updated after checking guild permissions
                });
              }
              
              // Check if user is a server admin
              let isAdmin = false;
              
              // If user has guilds data and bot token is available, we can check admin status
              if (profile.guilds && process.env.DISCORD_BOT_TOKEN) {
                // This is a simplified approach. In a real app, you would check specific guilds
                // and specific permission bits to determine admin status
                isAdmin = profile.guilds.some((guild: any) => {
                  // Check if user has ADMINISTRATOR permission or is the owner
                  return (guild.permissions & 0x8) === 0x8 || guild.owner;
                });
                
                console.log(`Discord auth: User ${profile.username} admin status: ${isAdmin}`);
              } else {
                console.log('Discord auth: Could not determine admin status - missing guilds data or bot token');
              }
              
              // Update user admin status
              await storage.updateDiscordUser(profile.id, { isAdmin });
              
              // Update user in the database
              return done(null, { 
                ...user, 
                isAdmin 
              });
            } catch (error) {
              console.error('Discord auth: Error during authentication process:', error);
              return done(error);
            }
          }
        )
      );
    } catch (error) {
      console.error('Failed to set up Discord authentication strategy:', error);
    }
  } else {
    const missing = [];
    if (!process.env.DISCORD_CLIENT_ID) missing.push('DISCORD_CLIENT_ID');
    if (!process.env.DISCORD_CLIENT_SECRET) missing.push('DISCORD_CLIENT_SECRET');
    console.warn(`Discord OAuth credentials not provided: ${missing.join(', ')}. Discord login will not work.`);
  }

  // Serialize user to session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getDiscordUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Auth routes
  app.get('/auth/discord', passport.authenticate('discord'));
  
  app.get(
    '/auth/discord/callback',
    passport.authenticate('discord', {
      failureRedirect: '/'
    }),
    (_req, res) => {
      res.redirect('/');
    }
  );
  
  app.get('/auth/logout', (req, res) => {
    req.logout(() => {
      res.redirect('/');
    });
  });
  
  app.get('/api/auth/me', (req, res) => {
    if (req.user) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  });
}

// Authentication middleware
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Authentication required' });
}

// Admin-only middleware
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user && (req.user as any).isAdmin) {
    return next();
  }
  res.status(403).json({ message: 'Admin access required' });
}