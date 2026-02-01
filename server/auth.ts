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
  // For Vercel serverless, we need to handle sessions differently
  const sessionConfig: any = {
    secret: process.env.SESSION_SECRET || "vehicle-doc-manager-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  };

  // Use memory sessions for Vercel (serverless doesn't support persistent PG sessions)
  if (pool && process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('your-database-url') && !process.env.VERCEL) {
    try {
      sessionConfig.store = new PgSession({
        pool: pool,
        tableName: "sessions",
        createTableIfMissing: true, 
        errorLog: (err) => {
          console.error("Session store error:", err);
        },
      });
      console.log("Using PostgreSQL session store");
    } catch (error) {
      console.warn("Failed to initialize PG session store, using memory store:", error);
    }
  } else {
    console.log("Using memory session store (for Vercel serverless)");
  }

  app.use(session(sessionConfig));
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.session && req.session.user) {
      return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
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

      if (username === DEFAULT_USER.username && password === DEFAULT_USER.password) {
        // Ensure session exists before setting user
        if (!req.session) {
          return res.status(500).json({ message: "Session not initialized" });
        }
        
        req.session.user = {
          id: DEFAULT_USER.id,
          username: DEFAULT_USER.username
        };
        
        return res.json({ 
          user: {
            id: DEFAULT_USER.id,
            username: DEFAULT_USER.username
          }
        });
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
