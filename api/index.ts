import type { VercelRequest, VercelResponse } from "@vercel/node";
import express, { type Express } from "express";
import "dotenv/config";
import { registerRoutes } from "../server/routes";
import { createServer } from "http";

let app: Express | null = null;

async function getApp() {
  if (app) return app;

  app = express();
  const httpServer = createServer(app);

  // Middleware
  app.use(
    express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: false }));

  // Register all routes
  await registerRoutes(httpServer, app);

  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await getApp();
  
  // Convert Vercel request to Express request
  return new Promise((resolve, reject) => {
    app(req as any, res as any, (err: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(undefined);
      }
    });
  });
}
