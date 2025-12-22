import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const consignmentSubmissions = pgTable("consignment_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  vin: text("vin").notNull(),
  year: text("year").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  mileage: text("mileage").notNull(),
  color: text("color").notNull(),
  
  condition: text("condition").notNull(),
  accidentHistory: text("accident_history").notNull(),
  description: text("description"),
  
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  
  photos: text("photos").array().default(sql`'{}'::text[]`),
  
  status: text("status").notNull().default("pending"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertConsignmentSchema = createInsertSchema(consignmentSubmissions).omit({
  id: true,
  createdAt: true,
  status: true,
});

export type InsertConsignment = z.infer<typeof insertConsignmentSchema>;
export type ConsignmentSubmission = typeof consignmentSubmissions.$inferSelect;

export const inventoryCars = pgTable("inventory_cars", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  vin: text("vin").notNull(),
  year: integer("year").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  mileage: integer("mileage").notNull(),
  color: text("color").notNull(),
  price: integer("price").notNull(),
  
  condition: text("condition").notNull(),
  description: text("description"),
  
  photos: text("photos").array().default(sql`'{}'::text[]`),
  
  status: text("status").notNull().default("available"),
  
  consignmentId: varchar("consignment_id").references(() => consignmentSubmissions.id),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInventoryCarSchema = createInsertSchema(inventoryCars).omit({
  id: true,
  createdAt: true,
});

export type InsertInventoryCar = z.infer<typeof insertInventoryCarSchema>;
export type InventoryCar = typeof inventoryCars.$inferSelect;
