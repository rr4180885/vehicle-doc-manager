import { pgTable, text, serial, integer, boolean, timestamp, date, varchar, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth.js";

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
  expiryDate: date("expiry_date", { mode: "string" }), // Optional - not required for owner_book
  fileUrl: text("file_url"), // Optional - not required for all doc types
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

const baseDocumentSchema = createInsertSchema(documents).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertDocumentSchema = baseDocumentSchema.refine((doc) => {
  // Owner book: Must have fileUrl, expiryDate is optional
  if (doc.type === "owner_book") {
    return doc.fileUrl && doc.fileUrl.length > 0;
  }
  // All other documents: Must have expiryDate, fileUrl is optional
  return doc.expiryDate && doc.expiryDate.length > 0;
}, (doc) => ({
  message: doc.type === "owner_book" 
    ? "Owner Book requires a document file" 
    : "Expiry date is required for this document type",
  path: [doc.type === "owner_book" ? "fileUrl" : "expiryDate"],
}));

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
    baseDocumentSchema.omit({ vehicleId: true }).refine((doc) => {
      // Owner book: Must have fileUrl, expiryDate is optional
      if (doc.type === "owner_book") {
        return doc.fileUrl && doc.fileUrl.length > 0;
      }
      // All other documents: Must have expiryDate, fileUrl is optional
      return doc.expiryDate && doc.expiryDate.length > 0;
    }, (doc) => ({
      message: doc.type === "owner_book" 
        ? "Owner Book requires a document file" 
        : "Expiry date is required for this document type",
      path: [doc.type === "owner_book" ? "fileUrl" : "expiryDate"],
    }))
  ).optional()
});

export type CreateVehicleWithDocuments = z.infer<typeof createVehicleWithDocumentsSchema>;
