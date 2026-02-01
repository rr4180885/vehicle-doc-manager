import type { VercelRequest, VercelResponse } from "@vercel/node";
import express, { type Express } from "express";
import "dotenv/config";
import { registerRoutes } from "../server/routes";
import { createServer } from "http";

let app: Express | null = null;
let isInitializing = false;
let initPromise: Promise<Express> | null = null;

async function getApp() {
  if (app) return app;
  
  // Prevent multiple simultaneous initializations
  if (isInitializing && initPromise) {
    return initPromise;
  }

  isInitializing = true;
  initPromise = (async () => {
    try {
      const newApp = express();
      const httpServer = createServer(newApp);

      // Middleware
      newApp.use(
        express.json({
          verify: (req: any, _res, buf) => {
            req.rawBody = buf;
          },
        })
      );
      newApp.use(express.urlencoded({ extended: false }));

      // Register all routes
      await registerRoutes(httpServer, newApp);

      app = newApp;
      isInitializing = false;
      return newApp;
    } catch (error) {
      isInitializing = false;
      initPromise = null;
      console.error("Failed to initialize app:", error);
      throw error;
    }
  })();

  return initPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await getApp();
    
    // Convert Vercel request to Express request
    return new Promise((resolve, reject) => {
      app(req as any, res as any, (err: any) => {
        if (err) {
          console.error("Express error:", err);
          if (!res.headersSent) {
            res.status(500).json({ 
              message: "Internal server error",
              error: process.env.NODE_ENV === "development" ? err.message : undefined
            });
          }
          reject(err);
        } else {
          resolve(undefined);
        }
      });
    });
  } catch (error: any) {
    console.error("Handler error:", error);
    if (!res.headersSent) {
      res.status(500).json({ 
        message: "Failed to initialize server",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  }
}
