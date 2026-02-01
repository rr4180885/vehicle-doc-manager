import { pgTable, text, serial, integer, boolean, timestamp, date, varchar, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

export const documentTypeEnum = pgEnum("document_type", [
  "insurance",
  "pollution",
  "tax",
  "fitness",
  "permit",
  "aadhar",
  "owner_book",
  "other"
]);

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  registrationNumber: text("registration_number").notNull().unique(),
  ownerName: text("owner_name").notNull(),
  ownerMobile: text("owner_mobile").notNull(),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
  type: documentTypeEnum("type").notNull(),
  expiryDate: date("expiry_date", { mode: "string" }).notNull(),
  fileUrl: text("file_url").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const vehiclesRelations = relations(vehicles, ({ many }) => ({
  documents: many(documents),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [documents.vehicleId],
    references: [vehicles.id],
  }),
}));

export const insertVehicleSchema = createInsertSchema(vehicles).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  userId: true // Set on backend
});

export const insertDocumentSchema = createInsertSchema(documents).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type CreateVehicleRequest = InsertVehicle;
export type UpdateVehicleRequest = Partial<InsertVehicle>;
export type CreateDocumentRequest = InsertDocument;
export type UpdateDocumentRequest = Partial<InsertDocument>;

export type VehicleWithDocuments = Vehicle & { documents: Document[] };

// For creating vehicle with documents at once
export const createVehicleWithDocumentsSchema = insertVehicleSchema.extend({
  documents: z.array(
    insertDocumentSchema.omit({ vehicleId: true })
  ).optional()
});

export type CreateVehicleWithDocuments = z.infer<typeof createVehicleWithDocumentsSchema>;
