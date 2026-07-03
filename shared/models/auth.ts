import { sql } from "drizzle-orm";
import { boolean, index, jsonb, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["admin", "operator"]);
export type UserRole = (typeof userRoleEnum.enumValues)[number];

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique(),
  passwordHash: varchar("password_hash"),
  role: userRoleEnum("role").notNull().default("operator"),
  isActive: boolean("is_active").notNull().default(true),
  name: text("name"),
  email: varchar("email").unique(),
  mobile: text("mobile"),
  profileImageUrl: varchar("profile_image_url"),
  canAccessVehicles: boolean("can_access_vehicles").notNull().default(true),
  canAccessDrivingLicenses: boolean("can_access_driving_licenses").notNull().default(false),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  shopName: text("shop_name"),
  shopLocation: text("shop_location"),
  shopLogoUrl: varchar("shop_logo_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const operatorPermissionsSchema = z
  .object({
    canAccessVehicles: z.boolean(),
    canAccessDrivingLicenses: z.boolean(),
  })
  .refine((data) => data.canAccessVehicles || data.canAccessDrivingLicenses, {
    message: "At least one section must be enabled",
  });

export const createOperatorSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Valid email is required"),
    mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
    userId: z.string().min(3, "User ID must be at least 3 characters").optional(),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
    profileImageUrl: z.string().optional(),
    canAccessVehicles: z.boolean().default(true),
    canAccessDrivingLicenses: z.boolean().default(false),
  })
  .refine((data) => data.canAccessVehicles || data.canAccessDrivingLicenses, {
    message: "At least one section must be enabled",
    path: ["canAccessVehicles"],
  });

export const resetOperatorPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

export const deleteOperatorSchema = z.object({
  adminPassword: z.string().min(1, "Admin password is required"),
});

export const updateOperatorSchema = z
  .object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    mobile: z.string().min(10).optional(),
    profileImageUrl: z.string().nullable().optional(),
    canAccessVehicles: z.boolean().optional(),
    canAccessDrivingLicenses: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.canAccessVehicles === undefined && data.canAccessDrivingLicenses === undefined) {
        return true;
      }
      const vehicles = data.canAccessVehicles ?? true;
      const licenses = data.canAccessDrivingLicenses ?? false;
      return vehicles || licenses;
    },
    { message: "At least one section must be enabled" }
  );

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  passwordHash: true,
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type CreateOperatorRequest = z.infer<typeof createOperatorSchema>;
export type UpdateOperatorRequest = z.infer<typeof updateOperatorSchema>;
export type ResetOperatorPasswordRequest = z.infer<typeof resetOperatorPasswordSchema>;
export type DeleteOperatorRequest = z.infer<typeof deleteOperatorSchema>;

export type OperatorPermissions = {
  canAccessVehicles: boolean;
  canAccessDrivingLicenses: boolean;
};

export type SessionUser = {
  id: string;
  username: string;
  role: UserRole;
  name?: string | null;
  profileImageUrl?: string | null;
  canAccessVehicles: boolean;
  canAccessDrivingLicenses: boolean;
};

export type SafeUser = Omit<User, "passwordHash">;

export type CreateOperatorResponse = SafeUser & { generatedPassword: string };

export type ResetPasswordResponse = {
  userId: string;
  username: string;
  generatedPassword: string;
};

export function toSessionUser(user: User): SessionUser {
  const isAdmin = user.role === "admin";
  return {
    id: user.id,
    username: user.username!,
    role: user.role,
    name: user.name,
    profileImageUrl: user.profileImageUrl,
    canAccessVehicles: isAdmin ? true : user.canAccessVehicles,
    canAccessDrivingLicenses: isAdmin ? true : user.canAccessDrivingLicenses,
  };
}

export function toSafeUser(user: User): SafeUser {
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}
