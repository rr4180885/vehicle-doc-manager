import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage.js";
import { api } from "../shared/routes.js";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated, requireAdmin, requireSection, canAccessResource, initAuth } from "./auth.js";
import { userStorage } from "./userStorage.js";
import { createVehicleWithDocumentsSchema, insertDrivingLicenseSchema } from "../shared/schema.js";
import { createOperatorSchema, updateOperatorSchema, resetOperatorPasswordSchema } from "../shared/models/auth.js";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage/index.js";
import { upload, getFileUrl, uploadToVercelBlob, isUsingVercelBlob } from "./upload.js";
import { extractLearnerPdfData } from "./learnerPdfParser.js";
import express from "express";
import path from "path";
import fs from "fs";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth setup
  setupAuth(app);
  registerAuthRoutes(app);
  await initAuth();

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

  // Admin: User management
  app.get("/api/users", isAuthenticated, requireAdmin, async (_req, res) => {
    try {
      const operators = await userStorage.listOperators();
      res.json(operators);
    } catch (error) {
      console.error("List users error:", error);
      res.status(500).json({ message: "Failed to list users" });
    }
  });

  app.post("/api/users", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const input = createOperatorSchema.parse(req.body);
      const result = await userStorage.createOperator(input);
      res.status(201).json(result);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      if (err.code === "DUPLICATE_USERNAME") {
        return res.status(400).json({ message: err.message, field: err.field });
      }
      throw err;
    }
  });

  app.put("/api/users/:id", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const input = updateOperatorSchema.parse(req.body);
      const user = await userStorage.updateOperator(String(req.params.id), input);
      res.json(user);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      if (err.message === "User not found") {
        return res.status(404).json({ message: err.message });
      }
      if (err.message === "Can only update operator users") {
        return res.status(400).json({ message: err.message });
      }
      throw err;
    }
  });

  app.put("/api/users/:id/reset-password", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const input = resetOperatorPasswordSchema.parse(req.body ?? {});
      const result = await userStorage.resetPassword(String(req.params.id), input.password);
      res.json(result);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      if (err.message === "User not found") {
        return res.status(404).json({ message: err.message });
      }
      if (err.message === "Can only reset password for operator users") {
        return res.status(400).json({ message: err.message });
      }
      throw err;
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
  app.get(api.vehicles.list.path, isAuthenticated, requireSection("vehicles"), async (req, res) => {
    const sessionUser = req.session.user!;
    const search = req.query.search as string | undefined;
    const vehicles = await storage.getVehicles(sessionUser.id, search);
    res.json(vehicles);
  });

  app.get(api.vehicles.get.path, isAuthenticated, requireSection("vehicles"), async (req, res) => {
    const sessionUser = req.session.user!;
    const vehicle = await storage.getVehicle(Number(req.params.id));
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    if (!canAccessResource(sessionUser, vehicle.userId)) {
      return res.status(401).json({ message: 'Unauthorized access to this vehicle' });
    }

    res.json(vehicle);
  });

  // Create vehicle with documents
  app.post("/api/vehicles/with-documents", isAuthenticated, requireSection("vehicles"), async (req, res) => {
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

  app.post(api.vehicles.create.path, isAuthenticated, requireSection("vehicles"), async (req, res) => {
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

  app.put(api.vehicles.update.path, isAuthenticated, requireSection("vehicles"), async (req, res) => {
    try {
      const sessionUser = req.session.user!;
      const id = Number(req.params.id);
      
      const existing = await storage.getVehicle(id);
      if (!existing) return res.status(404).json({ message: 'Vehicle not found' });
      if (!canAccessResource(sessionUser, existing.userId)) return res.status(401).json({ message: 'Unauthorized' });

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

  app.delete(api.vehicles.delete.path, isAuthenticated, requireSection("vehicles"), async (req, res) => {
    const sessionUser = req.session.user!;
    const id = Number(req.params.id);

    const existing = await storage.getVehicle(id);
    if (!existing) return res.status(404).json({ message: 'Vehicle not found' });
    if (!canAccessResource(sessionUser, existing.userId)) return res.status(401).json({ message: 'Unauthorized' });

    await storage.deleteVehicle(id);
    res.status(204).send();
  });

  // Document Routes
  app.post(api.documents.create.path, isAuthenticated, requireSection("vehicles"), async (req, res) => {
    try {
      const sessionUser = req.session.user!;
      const input = api.documents.create.input.parse(req.body);

      const vehicle = await storage.getVehicle(input.vehicleId);
      if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
      if (!canAccessResource(sessionUser, vehicle.userId)) return res.status(401).json({ message: 'Unauthorized' });

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

  app.put(api.documents.update.path, isAuthenticated, requireSection("vehicles"), async (req, res) => {
    try {
      const sessionUser = req.session.user!;
      const id = Number(req.params.id);
      
      const doc = await storage.getDocument(id);
      if (!doc) return res.status(404).json({ message: 'Document not found' });
      
      const vehicle = await storage.getVehicle(doc.vehicleId);
      if (!vehicle || !canAccessResource(sessionUser, vehicle.userId)) return res.status(401).json({ message: 'Unauthorized' });

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

  app.delete(api.documents.delete.path, isAuthenticated, requireSection("vehicles"), async (req, res) => {
    const sessionUser = req.session.user!;
    const id = Number(req.params.id);
    
    const doc = await storage.getDocument(id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    
    const vehicle = await storage.getVehicle(doc.vehicleId);
    if (!vehicle || !canAccessResource(sessionUser, vehicle.userId)) return res.status(401).json({ message: 'Unauthorized' });
    
    await storage.deleteDocument(id);
    res.status(204).send();
  });

  // Driving License Routes
  app.post(
    "/api/driving-licenses/parse-pdf",
    isAuthenticated,
    requireSection("drivingLicenses"),
    upload.single("file"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No PDF file uploaded" });
        }

        let fileUrl: string;
        if (isUsingVercelBlob()) {
          const blobResult = await uploadToVercelBlob(req.file);
          fileUrl = blobResult.url;
        } else {
          fileUrl = getFileUrl(req.file.filename);
        }

        const fileBuffer = req.file.buffer ?? fs.readFileSync(req.file.path);
        const { extracted, text } = await extractLearnerPdfData(fileBuffer);

        res.json({
          fileUrl,
          extracted,
          hasText: text.trim().length > 0,
          message:
            Object.keys(extracted).length > 0
              ? "Some details were detected — please verify before saving"
              : "PDF uploaded. Please enter details manually (auto-fill works best with text-based PDFs).",
        });
      } catch (error) {
        console.error("Parse PDF error:", error);
        res.status(500).json({ message: "Failed to read learner PDF" });
      }
    }
  );

  app.get("/api/driving-licenses", isAuthenticated, requireSection("drivingLicenses"), async (req, res) => {
    const sessionUser = req.session.user!;
    const search = req.query.search as string | undefined;
    const licenses = await storage.getDrivingLicenses(sessionUser.id, search);
    res.json(licenses);
  });

  app.get("/api/driving-licenses/:id", isAuthenticated, requireSection("drivingLicenses"), async (req, res) => {
    const sessionUser = req.session.user!;
    const license = await storage.getDrivingLicense(Number(req.params.id));

    if (!license) {
      return res.status(404).json({ message: "Driving license not found" });
    }

    if (!canAccessResource(sessionUser, license.userId)) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    res.json(license);
  });

  app.post("/api/driving-licenses", isAuthenticated, requireSection("drivingLicenses"), async (req, res) => {
    try {
      const sessionUser = req.session.user!;
      const input = insertDrivingLicenseSchema.parse(req.body);
      const license = await storage.createDrivingLicense(sessionUser.id, input);
      res.status(201).json(license);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.put("/api/driving-licenses/:id", isAuthenticated, requireSection("drivingLicenses"), async (req, res) => {
    try {
      const sessionUser = req.session.user!;
      const id = Number(req.params.id);

      const existing = await storage.getDrivingLicense(id);
      if (!existing) return res.status(404).json({ message: "Driving license not found" });
      if (!canAccessResource(sessionUser, existing.userId)) return res.status(401).json({ message: "Unauthorized" });

      const input = insertDrivingLicenseSchema.partial().parse(req.body);
      const updated = await storage.updateDrivingLicense(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.delete("/api/driving-licenses/:id", isAuthenticated, requireSection("drivingLicenses"), async (req, res) => {
    const sessionUser = req.session.user!;
    const id = Number(req.params.id);

    const existing = await storage.getDrivingLicense(id);
    if (!existing) return res.status(404).json({ message: "Driving license not found" });
    if (!canAccessResource(sessionUser, existing.userId)) return res.status(401).json({ message: "Unauthorized" });

    await storage.deleteDrivingLicense(id);
    res.status(204).send();
  });

  // Public — used on the login page before authentication
  app.get("/api/shop-info", async (_req, res) => {
    try {
      const info = await userStorage.getShopInfo();
      res.json(info);
    } catch {
      res.json({ shopName: null, shopLocation: null, shopLogoUrl: null });
    }
  });

  // ---------------------------------------------------------------------------
  // Profile routes (any authenticated user)
  // ---------------------------------------------------------------------------

  app.get("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const user = await userStorage.getUserById(req.session.user!.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      const { passwordHash: _, ...safe } = user;
      res.json(safe);
    } catch {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const schema = z.object({
        name: z.string().min(1, "Name is required").optional(),
        email: z.string().email("Invalid email").optional().or(z.literal("")),
        mobile: z.string().optional(),
        profileImageUrl: z.string().nullable().optional(),
        shopName: z.string().nullable().optional(),
        shopLocation: z.string().nullable().optional(),
        shopLogoUrl: z.string().nullable().optional(),
      });
      const data = schema.parse(req.body);
      const updated = await userStorage.updateProfile(req.session.user!.id, data);
      // Refresh session name/photo
      req.session.user!.name = updated.name ?? req.session.user!.name;
      req.session.user!.profileImageUrl = updated.profileImageUrl ?? null;
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.put("/api/profile/change-password", isAuthenticated, async (req, res) => {
    try {
      const schema = z.object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z.string().min(6, "New password must be at least 6 characters"),
      });
      const { currentPassword, newPassword } = schema.parse(req.body);
      await userStorage.changePassword(req.session.user!.id, currentPassword, newPassword);
      res.json({ message: "Password changed successfully" });
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message });
      if (err instanceof Error)
        return res.status(400).json({ message: err.message });
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  app.put("/api/profile/change-username", isAuthenticated, async (req, res) => {
    try {
      const schema = z.object({
        username: z.string().min(3, "Username must be at least 3 characters"),
      });
      const { username } = schema.parse(req.body);
      const updated = await userStorage.changeUsername(req.session.user!.id, username);
      req.session.user!.username = updated.username!;
      res.json(updated);
    } catch (err: any) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message });
      return res.status(400).json({ message: err.message || "Failed to change username" });
    }
  });

  return httpServer;
}
