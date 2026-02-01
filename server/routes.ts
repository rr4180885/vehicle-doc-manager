import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage.js";
import { api } from "../shared/routes.js";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./auth.js";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage/index.js";
import { createVehicleWithDocumentsSchema } from "../shared/schema.js";
import { upload, getFileUrl, uploadToVercelBlob, isUsingVercelBlob } from "./upload.js";
import express from "express";
import path from "path";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth setup
  setupAuth(app);
  registerAuthRoutes(app);

  // Object Storage routes (fallback for Replit)
  registerObjectStorageRoutes(app);

  // Serve uploaded files statically
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Simple file upload endpoint (supports both local and Vercel Blob)
  app.post("/api/upload", isAuthenticated, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      let fileUrl: string;
      let filename: string;

      // If on Vercel, upload to Vercel Blob
      if (isUsingVercelBlob()) {
        const blobResult = await uploadToVercelBlob(req.file);
        fileUrl = blobResult.url;
        filename = blobResult.filename;
      } else {
        // Local file system
        filename = req.file.filename;
        fileUrl = getFileUrl(filename);
      }

      res.json({
        fileUrl,
        filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Debug endpoint to check all vehicles (TEMPORARY - remove in production)
  app.get("/api/debug/vehicles", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.user!.id;
      console.log("Current logged in userId:", userId);
      
      // Get vehicles for current user
      const userVehicles = await storage.getVehicles(userId);
      
      return res.json({
        currentUserId: userId,
        vehicleCount: userVehicles.length,
        vehicles: userVehicles,
        message: `Found ${userVehicles.length} vehicles for userId: ${userId}`
      });
    } catch (error) {
      console.error("Debug error:", error);
      return res.status(500).json({ error: String(error) });
    }
  });

  // Vehicle Routes
  app.get(api.vehicles.list.path, isAuthenticated, async (req, res) => {
    const userId = req.session.user!.id;
    console.log("Fetching vehicles for userId:", userId);
    const search = req.query.search as string | undefined;
    const vehicles = await storage.getVehicles(userId, search);
    console.log("Found vehicles:", vehicles.length);
    res.json(vehicles);
  });

  app.get(api.vehicles.get.path, isAuthenticated, async (req, res) => {
    const userId = req.session.user!.id;
    const vehicle = await storage.getVehicle(Number(req.params.id));
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    if (vehicle.userId !== userId) {
      return res.status(401).json({ message: 'Unauthorized access to this vehicle' });
    }

    res.json(vehicle);
  });

  // Create vehicle with documents
  app.post("/api/vehicles/with-documents", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.user!.id;
      const input = createVehicleWithDocumentsSchema.parse(req.body);
      const vehicle = await storage.createVehicleWithDocuments(userId, input);
      res.status(201).json(vehicle);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      if (err.code === 'DUPLICATE_REGISTRATION') {
        return res.status(400).json({
          message: err.message,
          field: err.field,
        });
      }
      throw err;
    }
  });

  app.post(api.vehicles.create.path, isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.user!.id;
      const input = api.vehicles.create.input.parse(req.body);
      const vehicle = await storage.createVehicle(userId, input);
      res.status(201).json(vehicle);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.vehicles.update.path, isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.user!.id;
      const id = Number(req.params.id);
      
      // Check ownership
      const existing = await storage.getVehicle(id);
      if (!existing) return res.status(404).json({ message: 'Vehicle not found' });
      if (existing.userId !== userId) return res.status(401).json({ message: 'Unauthorized' });

      const input = api.vehicles.update.input.parse(req.body);
      const updated = await storage.updateVehicle(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.vehicles.delete.path, isAuthenticated, async (req, res) => {
    const userId = req.session.user!.id;
    const id = Number(req.params.id);

    const existing = await storage.getVehicle(id);
    if (!existing) return res.status(404).json({ message: 'Vehicle not found' });
    if (existing.userId !== userId) return res.status(401).json({ message: 'Unauthorized' });

    await storage.deleteVehicle(id);
    res.status(204).send();
  });

  // Document Routes
  app.post(api.documents.create.path, isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.user!.id;
      const input = api.documents.create.input.parse(req.body);

      // Verify vehicle ownership
      const vehicle = await storage.getVehicle(input.vehicleId);
      if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
      if (vehicle.userId !== userId) return res.status(401).json({ message: 'Unauthorized' });

      const doc = await storage.createDocument(input);
      res.status(201).json(doc);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.documents.update.path, isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.user!.id;
      const id = Number(req.params.id);
      
      // Check document ownership via vehicle
      const doc = await storage.getDocument(id);
      if (!doc) return res.status(404).json({ message: 'Document not found' });
      
      const vehicle = await storage.getVehicle(doc.vehicleId);
      if (!vehicle || vehicle.userId !== userId) return res.status(401).json({ message: 'Unauthorized' });

      const input = api.documents.update.input.parse(req.body);
      const updated = await storage.updateDocument(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.documents.delete.path, isAuthenticated, async (req, res) => {
    const userId = req.session.user!.id;
    const id = Number(req.params.id);
    
    // Check document ownership via vehicle
    const doc = await storage.getDocument(id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    
    const vehicle = await storage.getVehicle(doc.vehicleId);
    if (!vehicle || vehicle.userId !== userId) return res.status(401).json({ message: 'Unauthorized' });
    
    await storage.deleteDocument(id);
    res.status(204).send();
  });

  return httpServer;
}
