import { Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db.js";
import { userStorage } from "./userStorage.js";
import { toSessionUser, type SessionUser, type UserRole } from "../shared/models/auth.js";

const PgSession = connectPgSimple(session);

declare module "express-session" {
  interface SessionData {
    user?: SessionUser;
  }
}

export function setupAuth(app: any) {
  app.set("trust proxy", 1);

  const sessionConfig: any = {
    secret: process.env.SESSION_SECRET || "vehicle-doc-manager-secret-key-change-in-production",
    resave: true,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
      path: "/",
    },
  };

  if (pool && process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("your-database-url")) {
    try {
      sessionConfig.store = new PgSession({
        pool: pool,
        tableName: "sessions",
        createTableIfMissing: true,
        pruneSessionInterval: 60 * 15,
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
  if (req.session?.user) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session?.user?.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Admin access required" });
}

export function requireSection(section: "vehicles" | "drivingLicenses") {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.session?.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (user.role === "admin") {
      return next();
    }
    if (section === "vehicles" && user.canAccessVehicles) {
      return next();
    }
    if (section === "drivingLicenses" && user.canAccessDrivingLicenses) {
      return next();
    }
    return res.status(403).json({ message: "You do not have access to this section" });
  };
}

export function canAccessResource(sessionUser: SessionUser, resourceUserId: string): boolean {
  return sessionUser.role === "admin" || sessionUser.id === resourceUserId;
}

export async function initAuth() {
  try {
    await userStorage.ensureAdminUser();
  } catch (error) {
    console.error("Failed to seed admin user:", error);
  }
}

export function registerAuthRoutes(app: any) {
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await userStorage.getUserByUsername(username);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      const valid = await userStorage.verifyPassword(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      if (!req.session) {
        return res.status(500).json({ message: "Session not initialized" });
      }

      req.session.user = toSessionUser(user);

      req.session.save((err) => {
        if (err) {
          console.error("Error saving session:", err);
          return res.status(500).json({ message: "Failed to save session" });
        }
        return res.json({ user: req.session!.user });
      });
    } catch (error) {
      console.error("Error in /api/auth/login:", error);
      return res.status(500).json({ message: "Login failed" });
    }
  });

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

  app.get("/api/auth/user", (req: Request, res: Response) => {
    try {
      if (req.session?.user) {
        return res.json({ user: req.session.user });
      }
      return res.status(401).json({ message: "Not authenticated" });
    } catch (error) {
      console.error("Error in /api/auth/user:", error);
      return res.status(401).json({ message: "Not authenticated" });
    }
  });
}

export type { SessionUser, UserRole };
