import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false),
  role: text("role").default("admin"), // 'master' or 'admin'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isAdmin: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UserRole = "master" | "admin";

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
  ownershipConfirmed: boolean("ownership_confirmed").notNull(),
  agreementAccepted: boolean("agreement_accepted").notNull(),
  agreementTimestamp: timestamp("agreement_timestamp"),
  termsAccepted: boolean("terms_accepted").notNull(),
  
  status: text("status").notNull().default("pending"),
  
  customPayoutAmount: integer("custom_payout_amount"),
  overrideCommissionRate: integer("override_commission_rate"),
  overrideAvgDaysToFirstInquiry: integer("override_avg_days_to_first_inquiry"),
  overrideAvgDaysToSell: integer("override_avg_days_to_sell"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertConsignmentSchema = createInsertSchema(consignmentSubmissions).omit({
  id: true,
  createdAt: true,
  status: true,
  customPayoutAmount: true,
  overrideCommissionRate: true,
  overrideAvgDaysToFirstInquiry: true,
  overrideAvgDaysToSell: true,
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
  calculatorAccentColor: text("calculator_accent_color").default("#3B82F6"),
  calculatorBgColor: text("calculator_bg_color").default("#1E3A5F"),
  calculatorTextColor: text("calculator_text_color").default("#FFFFFF"),
  calculatorSliderColor: text("calculator_slider_color").default("#3B82F6"),
  footerTagline: text("footer_tagline").default("Luxury automotive consignment services for discerning collectors and enthusiasts."),
  logoUrl: text("logo_url"),
  logoWidth: text("logo_width").default("120"),
  faviconUrl: text("favicon_url"),
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
  commissionRate: integer("commission_rate").default(10),
  avgDaysToFirstInquiry: integer("avg_days_to_first_inquiry").default(5),
  avgDaysToSell: integer("avg_days_to_sell").default(45),
  adminNotifyPhone1: text("admin_notify_phone_1"),
  adminNotifyPhone2: text("admin_notify_phone_2"),
  ghlApiToken: text("ghl_api_token"),
  ghlLocationId: text("ghl_location_id"),
  privacyPolicy: text("privacy_policy"),
  termsOfService: text("terms_of_service"),
  sellerConfirmationSms: text("seller_confirmation_sms").default("Thank you for submitting your {year} {make} {model} to {siteName}! We'll review your submission and contact you within 24 hours."),
  menuLabelHome: text("menu_label_home").default("Home"),
  menuLabelInventory: text("menu_label_inventory").default("Inventory"),
  menuLabelConsign: text("menu_label_consign").default("Consign"),
  menuLabelTradeIn: text("menu_label_trade_in").default("Trade-In"),
  menuLabelAppointments: text("menu_label_appointments").default("Book Appointment"),
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

export const statusHistory = pgTable("status_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  consignmentId: varchar("consignment_id").notNull().references(() => consignmentSubmissions.id),
  status: text("status").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type StatusHistory = typeof statusHistory.$inferSelect;

export const sellerNotes = pgTable("seller_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  consignmentId: varchar("consignment_id").notNull().references(() => consignmentSubmissions.id),
  content: text("content").notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSellerNoteSchema = createInsertSchema(sellerNotes).omit({
  id: true,
  createdAt: true,
});

export type InsertSellerNote = z.infer<typeof insertSellerNoteSchema>;
export type SellerNote = typeof sellerNotes.$inferSelect;

export const sellerDocuments = pgTable("seller_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  consignmentId: varchar("consignment_id").notNull().references(() => consignmentSubmissions.id),
  documentType: text("document_type").notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSellerDocumentSchema = createInsertSchema(sellerDocuments).omit({
  id: true,
  createdAt: true,
  status: true,
});

export type InsertSellerDocument = z.infer<typeof insertSellerDocumentSchema>;
export type SellerDocument = typeof sellerDocuments.$inferSelect;

export const buyerInquiries = pgTable("buyer_inquiries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  inventoryCarId: varchar("inventory_car_id").notNull().references(() => inventoryCars.id),
  
  buyerName: text("buyer_name").notNull(),
  buyerPhone: text("buyer_phone").notNull(),
  buyerEmail: text("buyer_email").notNull(),
  message: text("message"),
  
  interestType: text("interest_type").notNull(),
  
  buyTimeline: text("buy_timeline"),
  hasTradeIn: boolean("has_trade_in"),
  financingPreference: text("financing_preference"),
  
  contactPreference: text("contact_preference"),
  bestTimeToContact: text("best_time_to_contact"),
  
  status: text("status").notNull().default("new"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBuyerInquirySchema = createInsertSchema(buyerInquiries).omit({
  id: true,
  createdAt: true,
  status: true,
});

export type InsertBuyerInquiry = z.infer<typeof insertBuyerInquirySchema>;
export type BuyerInquiry = typeof buyerInquiries.$inferSelect;

export const vehicleAlerts = pgTable("vehicle_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  email: text("email").notNull(),
  phone: text("phone"),
  name: text("name").notNull(),
  
  makes: text("makes").array().default(sql`'{}'::text[]`),
  models: text("models").array().default(sql`'{}'::text[]`),
  minYear: integer("min_year"),
  maxYear: integer("max_year"),
  minPrice: integer("min_price"),
  maxPrice: integer("max_price"),
  
  notifyEmail: boolean("notify_email").default(true),
  notifySms: boolean("notify_sms").default(false),
  
  active: boolean("active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVehicleAlertSchema = createInsertSchema(vehicleAlerts).omit({
  id: true,
  createdAt: true,
  active: true,
});

export type InsertVehicleAlert = z.infer<typeof insertVehicleAlertSchema>;
export type VehicleAlert = typeof vehicleAlerts.$inferSelect;

export const testimonials = pgTable("testimonials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  customerName: text("customer_name").notNull(),
  customerLocation: text("customer_location"),
  vehicleSold: text("vehicle_sold"),
  rating: integer("rating").default(5),
  content: text("content").notNull(),
  
  photoUrl: text("photo_url"),
  
  featured: boolean("featured").default(false),
  approved: boolean("approved").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTestimonialSchema = createInsertSchema(testimonials).omit({
  id: true,
  createdAt: true,
  approved: true,
});

export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type Testimonial = typeof testimonials.$inferSelect;

export const vehicleViews = pgTable("vehicle_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: varchar("vehicle_id").notNull().references(() => inventoryCars.id),
  viewedAt: timestamp("viewed_at").defaultNow(),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
});

export type VehicleView = typeof vehicleViews.$inferSelect;

export const vehicleDocuments = pgTable("vehicle_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: varchar("vehicle_id").notNull().references(() => inventoryCars.id),
  documentType: text("document_type").notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  notes: text("notes"),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVehicleDocumentSchema = createInsertSchema(vehicleDocuments).omit({
  id: true,
  createdAt: true,
});

export type InsertVehicleDocument = z.infer<typeof insertVehicleDocumentSchema>;
export type VehicleDocument = typeof vehicleDocuments.$inferSelect;
