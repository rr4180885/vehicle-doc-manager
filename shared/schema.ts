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

export const drivingLicenses = pgTable("driving_licenses", {
  id: serial("id").primaryKey(),
  applicantName: text("applicant_name").notNull(),
  mobile: text("mobile").default(""),
  issueDate: date("issue_date", { mode: "string" }).notNull(),
  expiryDate: date("expiry_date", { mode: "string" }).notNull(),
  licenseNumber: text("license_number"),
  learnerPdfUrl: text("learner_pdf_url"),
  duesPdfUrl: text("dues_pdf_url"),
  paidPdfUrl: text("paid_pdf_url"),
  totalAmount: integer("total_amount"),
  paidAmount: integer("paid_amount"),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDrivingLicenseSchema = createInsertSchema(drivingLicenses)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    userId: true,
  })
  .extend({
    applicantName: z.string().min(1, "Name is required"),
    mobile: z.preprocess(
      (val) => (val === undefined || val === null ? "" : val),
      z.string().refine(
        (val) => val === "" || val.length >= 10,
        { message: "Mobile number must be at least 10 digits" }
      )
    ),
    issueDate: z.string().min(1, "Issue date is required"),
    expiryDate: z.string().min(1, "Expiry date is required"),
    licenseNumber: z.string().optional(),
    learnerPdfUrl: z.string().optional(),
    totalAmount: z.coerce.number().int().min(0).optional().nullable(),
    paidAmount: z.coerce.number().int().min(0).optional().nullable(),
  })
  .refine(
    (data) => {
      if (!data.issueDate || !data.expiryDate) return true;
      return new Date(data.expiryDate) >= new Date(data.issueDate);
    },
    { message: "Expiry date must be on or after issue date", path: ["expiryDate"] }
  );

export type DrivingLicense = typeof drivingLicenses.$inferSelect;
export type InsertDrivingLicense = z.infer<typeof insertDrivingLicenseSchema>;
export type UpdateDrivingLicenseRequest = Partial<InsertDrivingLicense>;
