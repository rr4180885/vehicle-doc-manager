import { 
  vehicles, documents, 
  type Vehicle, type InsertVehicle, type UpdateVehicleRequest,
  type Document, type InsertDocument, type UpdateDocumentRequest,
  type VehicleWithDocuments, type CreateVehicleWithDocuments
} from "../shared/schema.js";
import { db } from "./db.js";
import { eq, ilike, and, desc } from "drizzle-orm";

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
}

export class DatabaseStorage implements IStorage {
  private checkDb() {
    if (!db) {
      throw new Error("Database not configured. Please set DATABASE_URL environment variable.");
    }
    return db;
  }

  async getVehicles(userId: string, search?: string): Promise<VehicleWithDocuments[]> {
    const database = this.checkDb();
    let query = database.select().from(vehicles).where(eq(vehicles.userId, userId));
    
    if (search) {
      query = database.select().from(vehicles).where(
        and(
          eq(vehicles.userId, userId),
          ilike(vehicles.registrationNumber, `%${search}%`)
        )
      );
    }

    const vehiclesList = await query.orderBy(desc(vehicles.createdAt));
    
    // Fetch documents for each vehicle
    const vehiclesWithDocs: VehicleWithDocuments[] = [];
    for (const vehicle of vehiclesList) {
      const docs = await database.select().from(documents).where(eq(documents.vehicleId, vehicle.id));
      vehiclesWithDocs.push({ ...vehicle, documents: docs });
    }
    
    return vehiclesWithDocs;
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
}

export const storage = new DatabaseStorage();
