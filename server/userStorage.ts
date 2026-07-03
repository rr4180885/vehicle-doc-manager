import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { eq, and } from "drizzle-orm";
import {
  users,
  type User,
  type UserRole,
  type CreateOperatorRequest,
  type UpdateOperatorRequest,
  type SafeUser,
  type CreateOperatorResponse,
  type ResetPasswordResponse,
  toSafeUser,
} from "../shared/models/auth.js";
import { db } from "./db.js";
import { storage } from "./storage.js";

const SALT_ROUNDS = 10;

function generatePassword(length = 10): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(length);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export class UserStorage {
  private checkDb() {
    if (!db) {
      throw new Error("Database not configured. Please set DATABASE_URL environment variable.");
    }
    return db;
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const database = this.checkDb();
    const [user] = await database
      .select()
      .from(users)
      .where(and(eq(users.username, username), eq(users.isActive, true)))
      .limit(1);
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const database = this.checkDb();
    const [user] = await database.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async getShopInfo(): Promise<{ shopName: string | null; shopLocation: string | null; shopLogoUrl: string | null }> {
    const database = this.checkDb();
    const [admin] = await database
      .select({
        shopName: users.shopName,
        shopLocation: users.shopLocation,
        shopLogoUrl: users.shopLogoUrl,
      })
      .from(users)
      .where(eq(users.role, "admin"))
      .limit(1);
    return admin || { shopName: null, shopLocation: null, shopLogoUrl: null };
  }

  async listOperators(): Promise<SafeUser[]> {
    const database = this.checkDb();
    const operators = await database
      .select()
      .from(users)
      .where(eq(users.role, "operator"))
      .orderBy(users.createdAt);
    return operators.map(toSafeUser);
  }

  private async generateUniqueUserId(name: string): Promise<string> {
    const base =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 8) || "op";

    for (let i = 0; i < 20; i++) {
      const suffix = Math.floor(100 + Math.random() * 9000);
      const candidate = `${base}${suffix}`;
      const existing = await this.getUserByUsername(candidate);
      if (!existing) return candidate;
    }

    return `op${Date.now().toString(36)}`;
  }

  async createOperator(data: CreateOperatorRequest): Promise<CreateOperatorResponse> {
    const database = this.checkDb();
    const userId = data.userId?.trim() || (await this.generateUniqueUserId(data.name));

    const existing = await this.getUserByUsername(userId);
    if (existing) {
      const error: any = new Error("User ID already exists");
      error.code = "DUPLICATE_USERNAME";
      error.field = "userId";
      throw error;
    }

    const generatedPassword = data.password?.trim() || generatePassword();
    const passwordHash = await this.hashPassword(generatedPassword);

    const [user] = await database
      .insert(users)
      .values({
        id: userId,
        username: userId,
        passwordHash,
        role: "operator",
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        profileImageUrl: data.profileImageUrl || null,
        canAccessVehicles: data.canAccessVehicles,
        canAccessDrivingLicenses: data.canAccessDrivingLicenses,
      })
      .returning();

    return { ...toSafeUser(user), generatedPassword };
  }

  async updateOperator(userId: string, data: UpdateOperatorRequest): Promise<SafeUser> {
    const database = this.checkDb();
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    if (user.role !== "operator") {
      throw new Error("Can only update operator users");
    }

    const [updated] = await database
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return toSafeUser(updated);
  }

  async resetPassword(userId: string, newPassword?: string): Promise<ResetPasswordResponse> {
    const database = this.checkDb();
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    if (user.role !== "operator") {
      throw new Error("Can only reset password for operator users");
    }

    const generatedPassword = newPassword?.trim() || generatePassword();
    const passwordHash = await this.hashPassword(generatedPassword);
    await database
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return {
      userId: user.id,
      username: user.username!,
      generatedPassword,
    };
  }

  async deleteOperator(adminId: string, operatorId: string, adminPassword: string): Promise<void> {
    const database = this.checkDb();
    const admin = await this.getUserById(adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Admin access required");
    }
    if (!admin.passwordHash) {
      throw new Error("Admin password not set");
    }

    const valid = await this.verifyPassword(adminPassword, admin.passwordHash);
    if (!valid) {
      throw new Error("Admin password is incorrect");
    }

    const operator = await this.getUserById(operatorId);
    if (!operator) {
      throw new Error("User not found");
    }
    if (operator.role !== "operator") {
      throw new Error("Can only delete operator users");
    }

    const operatorVehicles = await storage.getVehicles(operatorId);
    for (const vehicle of operatorVehicles) {
      await storage.deleteVehicle(vehicle.id);
    }

    const operatorLicenses = await storage.getDrivingLicenses(operatorId);
    for (const license of operatorLicenses) {
      await storage.deleteDrivingLicense(license.id);
    }

    await database.delete(users).where(eq(users.id, operatorId));
  }

  async updateProfile(
    userId: string,
    data: {
      name?: string;
      email?: string;
      mobile?: string;
      profileImageUrl?: string | null;
      shopName?: string | null;
      shopLocation?: string | null;
      shopLogoUrl?: string | null;
    }
  ): Promise<SafeUser> {
    const database = this.checkDb();
    const [updated] = await database
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return toSafeUser(updated);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const database = this.checkDb();
    const user = await this.getUserById(userId);
    if (!user) throw new Error("User not found");
    if (!user.passwordHash) throw new Error("No password set for this user");

    const valid = await this.verifyPassword(currentPassword, user.passwordHash);
    if (!valid) throw new Error("Current password is incorrect");

    const passwordHash = await this.hashPassword(newPassword);
    await database
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async changeUsername(userId: string, newUsername: string): Promise<SafeUser> {
    const database = this.checkDb();
    const existing = await this.getUserByUsername(newUsername);
    if (existing && existing.id !== userId) {
      const err: any = new Error("Username already taken");
      err.field = "username";
      throw err;
    }
    const [updated] = await database
      .update(users)
      .set({ username: newUsername, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return toSafeUser(updated);
  }

  async ensureAdminUser(): Promise<void> {
    if (!db) return;

    const adminUsername = process.env.ADMIN_USERNAME || "kisun01";
    const adminPassword = process.env.ADMIN_PASSWORD || "Kisun@7257";

    const existing = await this.getUserByUsername(adminUsername);
    if (existing) return;

    const passwordHash = await this.hashPassword(adminPassword);
    await db.insert(users).values({
      id: adminUsername,
      username: adminUsername,
      passwordHash,
      role: "admin" as UserRole,
      name: "Administrator",
      canAccessVehicles: true,
      canAccessDrivingLicenses: true,
    });
    console.log(`✓ Seeded admin user: ${adminUsername}`);
  }
}

export const userStorage = new UserStorage();
