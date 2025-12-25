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
  isAdmin: true,
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
  
  salvageTitle: boolean("salvage_title").default(false),
  mechanicalIssues: text("mechanical_issues"),
  lienStatus: boolean("lien_status").default(false),
  ownershipConfirmed: boolean("ownership_confirmed").default(false),
  agreementAccepted: boolean("agreement_accepted").default(false),
  agreementTimestamp: timestamp("agreement_timestamp"),
  termsAccepted: boolean("terms_accepted").default(false),
  
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
  featured: boolean("featured").default(false),
  
  consignmentId: varchar("consignment_id").references(() => consignmentSubmissions.id),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInventoryCarSchema = createInsertSchema(inventoryCars).omit({
  id: true,
  createdAt: true,
});

export type InsertInventoryCar = z.infer<typeof insertInventoryCarSchema>;
export type InventoryCar = typeof inventoryCars.$inferSelect;

export const siteSettings = pgTable("site_settings", {
  id: varchar("id").primaryKey().default(sql`'default'`),
  primaryColor: text("primary_color").default("#D4AF37"),
  backgroundColor: text("background_color").default("#000000"),
  mainMenuColor: text("main_menu_color").default("#D4AF37"),
  mainMenuHoverColor: text("main_menu_hover_color").default("#B8960C"),
  contactButtonColor: text("contact_button_color").default("#D4AF37"),
  contactButtonHoverColor: text("contact_button_hover_color").default("#B8960C"),
  menuFontSize: text("menu_font_size").default("14"),
  bodyFontSize: text("body_font_size").default("16"),
  menuAllCaps: boolean("menu_all_caps").default(true),
  vehicleTitleColor: text("vehicle_title_color").default("#FFFFFF"),
  vehiclePriceColor: text("vehicle_price_color").default("#FFFFFF"),
  stepBgColor: text("step_bg_color").default("#DC2626"),
  stepNumberColor: text("step_number_color").default("#FFFFFF"),
  socialIconBgColor: text("social_icon_bg_color").default("#D4AF37"),
  socialIconHoverColor: text("social_icon_hover_color").default("#B8960C"),
  footerTagline: text("footer_tagline").default("Luxury automotive consignment services for discerning collectors and enthusiasts."),
  logoUrl: text("logo_url"),
  logoWidth: text("logo_width").default("120"),
  siteName: text("site_name").default("PRESTIGE"),
  contactAddress1: text("contact_address_1"),
  contactAddress2: text("contact_address_2"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  twitterUrl: text("twitter_url"),
  youtubeUrl: text("youtube_url"),
  tiktokUrl: text("tiktok_url"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSiteSettingsSchema = createInsertSchema(siteSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertSiteSettings = z.infer<typeof insertSiteSettingsSchema>;
export type SiteSettings = typeof siteSettings.$inferSelect;

export const phoneVerifications = pgTable("phone_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phone: text("phone").notNull(),
  code: text("code").notNull(),
  ghlContactId: text("ghl_contact_id"),
  verified: boolean("verified").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type PhoneVerification = typeof phoneVerifications.$inferSelect;
