import { 
  vehicles, documents, drivingLicenses,
  type Vehicle, type InsertVehicle, type UpdateVehicleRequest,
  type Document, type InsertDocument, type UpdateDocumentRequest,
  type VehicleWithDocuments, type CreateVehicleWithDocuments,
  type DrivingLicense, type InsertDrivingLicense, type UpdateDrivingLicenseRequest
} from "../shared/schema.js";
import type { UserRole } from "../shared/models/auth.js";
import { db } from "./db.js";
import { eq, ilike, and, desc, or } from "drizzle-orm";

export interface IStorage {
  // Vehicles
  getVehicles(userId: string, search?: string): Promise<VehicleWithDocuments[]>;
  getVehicle(id: number): Promise<VehicleWithDocuments | undefined>;
  createVehicle(userId: string, vehicle: InsertVehicle): Promise<Vehicle>;
  createVehicleWithDocuments(userId: string, data: CreateVehicleWithDocuments): Promise<VehicleWithDocuments>;
  updateVehicle(id: number, updates: UpdateVehicleRequest): Promise<Vehicle>;
  deleteVehicle(id: number): Promise<void>;

  // Documents
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, updates: UpdateDocumentRequest): Promise<Document>;
  deleteDocument(id: number): Promise<void>;
  getDocumentsByVehicleId(vehicleId: number): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;

  // Driving Licenses
  getDrivingLicenses(userId: string, role: UserRole, search?: string): Promise<DrivingLicense[]>;
  getDrivingLicense(id: number): Promise<DrivingLicense | undefined>;
  createDrivingLicense(userId: string, data: InsertDrivingLicense): Promise<DrivingLicense>;
  updateDrivingLicense(id: number, updates: UpdateDrivingLicenseRequest): Promise<DrivingLicense>;
  deleteDrivingLicense(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  private checkDb() {
    if (!db) {
      throw new Error("Database not configured. Please set DATABASE_URL environment variable.");
    }
    return db;
  }

  async getVehicles(userId: string, search?: string, role: UserRole = "operator"): Promise<VehicleWithDocuments[]> {
    const database = this.checkDb();
    
    const conditions = role === "admin" ? [] : [eq(vehicles.userId, userId)];
    if (search) {
      conditions.push(ilike(vehicles.registrationNumber, `%${search}%`));
    }
    
    // Fetch all vehicles matching criteria
    const vehiclesList = await database
      .select()
      .from(vehicles)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(vehicles.createdAt));
    
    if (vehiclesList.length === 0) {
      return [];
    }
    
    // Fetch ALL documents for these vehicles in ONE query (fixes N+1 problem)
    // We fetch all documents and filter in-memory since Drizzle ORM's IN clause is complex
    const vehicleIds = new Set(vehiclesList.map(v => v.id));
    const allDocuments = await database.select().from(documents);
    const relevantDocs = allDocuments.filter(doc => vehicleIds.has(doc.vehicleId));
    
    // Group documents by vehicleId in memory (fast)
    const docsByVehicle = new Map<number, Document[]>();
    for (const doc of relevantDocs) {
      if (!docsByVehicle.has(doc.vehicleId)) {
        docsByVehicle.set(doc.vehicleId, []);
      }
      docsByVehicle.get(doc.vehicleId)!.push(doc);
    }
    
    // Combine vehicles with their documents (O(n) instead of O(n²))
    return vehiclesList.map(vehicle => ({
      ...vehicle,
      documents: docsByVehicle.get(vehicle.id) || []
    }));
  }

  async getVehicle(id: number): Promise<VehicleWithDocuments | undefined> {
    const database = this.checkDb();
    const vehicle = await database.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
    if (vehicle.length === 0) return undefined;

    const docs = await database.select().from(documents).where(eq(documents.vehicleId, id));
    return { ...vehicle[0], documents: docs };
  }

  async checkRegistrationNumberExists(registrationNumber: string, excludeId?: number): Promise<boolean> {
    const database = this.checkDb();
    const query = database.select().from(vehicles).where(eq(vehicles.registrationNumber, registrationNumber));
    
    const existing = await query.limit(1);
    
    if (existing.length === 0) return false;
    
    // If excludeId is provided (for updates), check if it's a different vehicle
    if (excludeId !== undefined) {
      return existing[0].id !== excludeId;
    }
    
    return true;
  }

  async createVehicle(userId: string, vehicle: InsertVehicle): Promise<Vehicle> {
    const database = this.checkDb();
    
    // Check for duplicate registration number
    const exists = await this.checkRegistrationNumberExists(vehicle.registrationNumber);
    if (exists) {
      const error: any = new Error("Registration number already exists");
      error.code = "DUPLICATE_REGISTRATION";
      error.field = "registrationNumber";
      throw error;
    }
    
    const [newVehicle] = await database.insert(vehicles).values({ ...vehicle, userId }).returning();
    return newVehicle;
  }

  async createVehicleWithDocuments(userId: string, data: CreateVehicleWithDocuments): Promise<VehicleWithDocuments> {
    const database = this.checkDb();
    const { documents: docs, ...vehicleData } = data;
    
    // Check for duplicate registration number
    const exists = await this.checkRegistrationNumberExists(vehicleData.registrationNumber);
    if (exists) {
      const error: any = new Error("Registration number already exists");
      error.code = "DUPLICATE_REGISTRATION";
      error.field = "registrationNumber";
      throw error;
    }
    
    // Create vehicle first
    const [newVehicle] = await database.insert(vehicles).values({ ...vehicleData, userId }).returning();
    
    // Create documents if provided
    const createdDocuments: Document[] = [];
    if (docs && docs.length > 0) {
      for (const doc of docs) {
        const [newDoc] = await database.insert(documents).values({
          ...doc,
          vehicleId: newVehicle.id
        }).returning();
        createdDocuments.push(newDoc);
      }
    }
    
    return { ...newVehicle, documents: createdDocuments };
  }

  async updateVehicle(id: number, updates: UpdateVehicleRequest): Promise<Vehicle> {
    const database = this.checkDb();
    const [updated] = await database
      .update(vehicles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(vehicles.id, id))
      .returning();
    return updated;
  }

  async deleteVehicle(id: number): Promise<void> {
    const database = this.checkDb();
    // Delete documents first (cascade would handle this if configured, but safe to be explicit)
    await database.delete(documents).where(eq(documents.vehicleId, id));
    await database.delete(vehicles).where(eq(vehicles.id, id));
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const database = this.checkDb();
    const [newDoc] = await database.insert(documents).values(document).returning();
    return newDoc;
  }

  async updateDocument(id: number, updates: UpdateDocumentRequest): Promise<Document> {
    const database = this.checkDb();
    const [updated] = await database
      .update(documents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return updated;
  }

  async deleteDocument(id: number): Promise<void> {
    const database = this.checkDb();
    await database.delete(documents).where(eq(documents.id, id));
  }

  async getDocumentsByVehicleId(vehicleId: number): Promise<Document[]> {
    const database = this.checkDb();
    return await database.select().from(documents).where(eq(documents.vehicleId, vehicleId));
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const database = this.checkDb();
    const [doc] = await database.select().from(documents).where(eq(documents.id, id)).limit(1);
    return doc;
  }

  async getDrivingLicenses(userId: string, role: UserRole, search?: string): Promise<DrivingLicense[]> {
    const database = this.checkDb();
    const conditions = role === "admin" ? [] : [eq(drivingLicenses.userId, userId)];
    if (search) {
      conditions.push(
        or(
          ilike(drivingLicenses.applicantName, `%${search}%`),
          ilike(drivingLicenses.mobile, `%${search}%`),
          ilike(drivingLicenses.licenseNumber, `%${search}%`)
        )!
      );
    }

    return database
      .select()
      .from(drivingLicenses)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(drivingLicenses.createdAt));
  }

  async getDrivingLicense(id: number): Promise<DrivingLicense | undefined> {
    const database = this.checkDb();
    const [license] = await database
      .select()
      .from(drivingLicenses)
      .where(eq(drivingLicenses.id, id))
      .limit(1);
    return license;
  }

  async createDrivingLicense(userId: string, data: InsertDrivingLicense): Promise<DrivingLicense> {
    const database = this.checkDb();
    const [license] = await database
      .insert(drivingLicenses)
      .values({ ...data, userId })
      .returning();
    return license;
  }

  async updateDrivingLicense(id: number, updates: UpdateDrivingLicenseRequest): Promise<DrivingLicense> {
    const database = this.checkDb();
    const [updated] = await database
      .update(drivingLicenses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(drivingLicenses.id, id))
      .returning();
    return updated;
  }

  async deleteDrivingLicense(id: number): Promise<void> {
    const database = this.checkDb();
    await database.delete(drivingLicenses).where(eq(drivingLicenses.id, id));
  }
}

export const storage = new DatabaseStorage();
