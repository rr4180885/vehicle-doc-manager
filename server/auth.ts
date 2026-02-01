import { Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db.js";

const PgSession = connectPgSimple(session);

// Default credentials
const DEFAULT_USER = {
  id: "kisun01",
  username: "kisun01",
  password: "Kisun@7257"
};

declare module "express-session" {
  interface SessionData {
    user?: {
      id: string;
      username: string;
    };
  }
}

export function setupAuth(app: any) {
  // Trust proxy for Vercel
  app.set('trust proxy', 1);
  
  // Session configuration
  const sessionConfig: any = {
    secret: process.env.SESSION_SECRET || "vehicle-doc-manager-secret-key-change-in-production",
    resave: true, // Changed to true for serverless
    saveUninitialized: false,
    rolling: true, // Refresh cookie on each request
    cookie: {
      secure: true, // Always use secure in production
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: "lax", // Changed from "none" to "lax" for better compatibility
      path: '/',
    },
  };

  // Always try to use PostgreSQL session store if database is available
  if (pool && process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('your-database-url')) {
    try {
      sessionConfig.store = new PgSession({
        pool: pool,
        tableName: "sessions",
        createTableIfMissing: true,
        pruneSessionInterval: 60 * 15, // Prune every 15 minutes
        errorLog: (err) => {
          console.error("Session store error:", err);
        },
      });
      console.log("✓ Using PostgreSQL session store");
    } catch (error) {
      console.error("✗ Failed to initialize PG session store:", error);
      console.log("Falling back to memory store (sessions will not persist!)");
    }
  } else {
    console.warn("⚠ No database configured - using memory store (sessions will NOT persist in serverless!)");
  }

  app.use(session(sessionConfig));
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  try {
    console.log("=== Authentication Check ===");
    console.log("Session exists:", !!req.session);
    console.log("Session ID:", req.sessionID);
    console.log("Session user:", req.session?.user);
    console.log("Cookie:", req.headers.cookie);
    
    if (req.session && req.session.user) {
      console.log("✓ Authenticated as:", req.session.user.id);
      return next();
    }
    
    console.log("✗ Not authenticated - returning 401");
    return res.status(401).json({ 
      message: "Unauthorized",
      debug: {
        hasSession: !!req.session,
        hasUser: !!req.session?.user,
        sessionId: req.sessionID
      }
    });
  } catch (error) {
    console.error("Error in isAuthenticated middleware:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
}

export function registerAuthRoutes(app: any) {
  // Login endpoint
  app.post("/api/auth/login", (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      console.log("=== Login Attempt ===");
      console.log("Username:", username);

      if (username === DEFAULT_USER.username && password === DEFAULT_USER.password) {
        // Ensure session exists before setting user
        if (!req.session) {
          console.log("✗ Session not initialized!");
          return res.status(500).json({ message: "Session not initialized" });
        }
        
        console.log("Session ID before save:", req.sessionID);
        req.session.user = {
          id: DEFAULT_USER.id,
          username: DEFAULT_USER.username
        };
        
        // Force session save
        req.session.save((err) => {
          if (err) {
            console.error("Error saving session:", err);
            return res.status(500).json({ message: "Failed to save session" });
          }
          
          console.log("✓ Session saved successfully");
          console.log("Session ID after save:", req.sessionID);
          console.log("Session user:", req.session.user);
          
          return res.json({ 
            user: {
              id: DEFAULT_USER.id,
              username: DEFAULT_USER.username
            }
          });
        });
        return;
      }

      return res.status(401).json({ message: "Invalid username or password" });
    } catch (error) {
      console.error("Error in /api/auth/login:", error);
      return res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    try {
      if (!req.session) {
        return res.json({ message: "Already logged out" });
      }
      
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
          return res.status(500).json({ message: "Failed to logout" });
        }
        res.clearCookie("connect.sid");
        return res.json({ message: "Logged out successfully" });
      });
    } catch (error) {
      console.error("Error in /api/auth/logout:", error);
      return res.status(500).json({ message: "Logout failed" });
    }
  });

  // Get current user
  app.get("/api/auth/user", (req: Request, res: Response) => {
    try {
      // Handle cases where session might not be initialized
      if (req.session && req.session.user) {
        return res.json({ user: req.session.user });
      }
      return res.status(401).json({ message: "Not authenticated" });
    } catch (error) {
      console.error("Error in /api/auth/user:", error);
      return res.status(401).json({ message: "Not authenticated" });
    }
  });
}
