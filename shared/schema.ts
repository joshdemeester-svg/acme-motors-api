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
  
  isDemo: boolean("is_demo").default(false),
  
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
  slug: text("slug").unique(),
  
  vin: text("vin").notNull(),
  year: integer("year").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  trim: text("trim"),
  mileage: integer("mileage").notNull(),
  color: text("color").notNull(),
  price: integer("price").notNull(),
  
  condition: text("condition").notNull(),
  description: text("description"),
  
  photos: text("photos").array().default(sql`'{}'::text[]`),
  
  status: text("status").notNull().default("available"),
  featured: boolean("featured").default(false),
  soldDate: timestamp("sold_date"),
  stockNumber: text("stock_number"),
  
  consignmentId: varchar("consignment_id").references(() => consignmentSubmissions.id),
  
  isDemo: boolean("is_demo").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export interface VehicleSlugOptions {
  year: number;
  make: string;
  model: string;
  trim?: string | null;
  id: string;
  stockNumber?: string | null;
}

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function matchSlug(slug: string, source: string): boolean {
  return slugify(source) === slug;
}

export function generateVehicleSlug(options: VehicleSlugOptions): string {
  const { year, make, model, trim, id, stockNumber } = options;
  
  const parts: string[] = [];
  
  parts.push(year.toString(), make, model);
  if (trim) parts.push(trim);
  
  if (stockNumber) {
    parts.push(stockNumber);
  } else {
    const shortId = id.split('-')[0] || id.substring(0, 8);
    parts.push(shortId);
  }
  
  return parts.map(p => slugify(p)).filter(Boolean).join('-');
}

export function getCanonicalVehicleUrl(baseUrl: string, slug: string): string {
  return `${baseUrl}/inventory/${slug}`;
}

export function generateVehicleSlugLegacy(year: number, make: string, model: string, existingSlugs: string[] = []): string {
  const baseSlug = `${year}-${make}-${model}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }
  
  let counter = 2;
  while (existingSlugs.includes(`${baseSlug}-${counter}`)) {
    counter++;
  }
  return `${baseSlug}-${counter}`;
}

export function extractIdFromSlug(slug: string): string | null {
  // Try full UUID first (legacy format)
  const fullUuidPattern = /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i;
  const fullMatch = slug.match(fullUuidPattern);
  if (fullMatch) return fullMatch[1];
  
  // Try short ID (8 hex chars at end - new format)
  const shortIdPattern = /-([a-f0-9]{8})$/i;
  const shortMatch = slug.match(shortIdPattern);
  if (shortMatch) return shortMatch[1];
  
  // Try stock number format (stk followed by alphanumeric)
  const stockPattern = /-stk([a-z0-9]+)$/i;
  const stockMatch = slug.match(stockPattern);
  return stockMatch ? `stk:${stockMatch[1]}` : null;
}

export function extractStockFromSlug(slug: string): string | null {
  const stockPattern = /-stk([a-z0-9]+)$/i;
  const stockMatch = slug.match(stockPattern);
  return stockMatch ? stockMatch[1] : null;
}

export const insertInventoryCarSchema = createInsertSchema(inventoryCars).omit({
  id: true,
  createdAt: true,
  isDemo: true,
});

export type InsertInventoryCar = z.infer<typeof insertInventoryCarSchema>;
export type InventoryCar = typeof inventoryCars.$inferSelect;
export type InventoryCarWithMetrics = InventoryCar & {
  daysOnLot: number;
  inquiryCount: number;
};

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
  mobileLogoWidth: text("mobile_logo_width").default("100"),
  footerLogoWidth: text("footer_logo_width").default("120"),
  hideSiteNameWithLogo: boolean("hide_site_name_with_logo").default(false),
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
  inquiryConfirmationSms: text("inquiry_confirmation_sms").default("Thank you for your inquiry about the {year} {make} {model}! We'll be in touch soon."),
  tradeInConfirmationSms: text("trade_in_confirmation_sms").default("Thank you for submitting your {year} {make} {model} for trade-in valuation! We'll contact you within 24 hours."),
  menuLabelHome: text("menu_label_home").default("Home"),
  menuLabelInventory: text("menu_label_inventory").default("Inventory"),
  menuLabelConsign: text("menu_label_consign").default("Consign"),
  menuLabelTradeIn: text("menu_label_trade_in").default("Trade-In"),
  menuLabelAppointments: text("menu_label_appointments").default("Book Appointment"),
  demoModeActive: boolean("demo_mode_active").default(false),
  ogTitle: text("og_title"),
  ogDescription: text("og_description"),
  ogImage: text("og_image"),
  twitterHandle: text("twitter_handle"),
  
  dealerCity: text("dealer_city").default("Navarre"),
  dealerState: text("dealer_state").default("FL"),
  dealerAddress: text("dealer_address"),
  dealerHours: text("dealer_hours"),
  googleMapUrl: text("google_map_url"),
  googlePlaceId: text("google_place_id"),
  baseUrl: text("base_url").default("https://dealerconsign.com"),
  
  seoTitleTemplate: text("seo_title_template").default("{year} {make} {model} {trim} for Sale in {city}, {state} | {dealerName}"),
  seoDescriptionTemplate: text("seo_description_template").default("Shop this {year} {make} {model} with {mileage} miles for ${price}. Located in {city}, {state}. View photos and contact us today!"),
  
  slugIncludeTrim: boolean("slug_include_trim").default(true),
  slugIncludeLocation: boolean("slug_include_location").default(true),
  slugLocationFirst: boolean("slug_location_first").default(false),
  slugIncludeStock: boolean("slug_include_stock").default(false),
  
  soldVehicleBehavior: text("sold_vehicle_behavior").default("keep_live"),
  soldVehicleNoindexDays: integer("sold_vehicle_noindex_days").default(30),
  
  hotListingThreshold: integer("hot_listing_threshold").default(5),
  
  liveChatEnabled: boolean("live_chat_enabled").default(false),
  liveChatWidgetId: text("live_chat_widget_id"),
  
  indexVehiclePages: boolean("index_vehicle_pages").default(true),
  indexInventoryPages: boolean("index_inventory_pages").default(true),
  indexMakePages: boolean("index_make_pages").default(true),
  indexModelPages: boolean("index_model_pages").default(true),
  indexLocationPages: boolean("index_location_pages").default(true),
  
  locationPageTitle: text("location_page_title"),
  locationPageDescription: text("location_page_description"),
  locationPageIntro: text("location_page_intro"),
  inventoryPageTitle: text("inventory_page_title"),
  inventoryPageDescription: text("inventory_page_description"),
  inventoryPageIntro: text("inventory_page_intro"),
  
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
  pipelineStage: text("pipeline_stage").notNull().default("new"),
  assignedTo: varchar("assigned_to").references(() => users.id),
  
  isDemo: boolean("is_demo").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBuyerInquirySchema = createInsertSchema(buyerInquiries).omit({
  id: true,
  createdAt: true,
  status: true,
  isDemo: true,
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
  
  isDemo: boolean("is_demo").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTestimonialSchema = createInsertSchema(testimonials).omit({
  id: true,
  createdAt: true,
  approved: true,
  isDemo: true,
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

export const priceAlerts = pgTable("price_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: varchar("vehicle_id").notNull().references(() => inventoryCars.id),
  email: text("email").notNull(),
  phone: text("phone"),
  name: text("name"),
  priceAtSubscription: integer("price_at_subscription").notNull(),
  notifyEmail: boolean("notify_email").default(true),
  notifySms: boolean("notify_sms").default(false),
  active: boolean("active").default(true),
  lastNotifiedAt: timestamp("last_notified_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPriceAlertSchema = createInsertSchema(priceAlerts).omit({
  id: true,
  createdAt: true,
  active: true,
  lastNotifiedAt: true,
});

export type InsertPriceAlert = z.infer<typeof insertPriceAlertSchema>;
export type PriceAlert = typeof priceAlerts.$inferSelect;

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

export const creditApplications = pgTable("credit_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  
  currentAddress: text("current_address").notNull(),
  currentCity: text("current_city").notNull(),
  currentState: text("current_state").notNull(),
  currentZip: text("current_zip").notNull(),
  currentHowLong: text("current_how_long").notNull(),
  housingStatus: text("housing_status").notNull(),
  monthlyPayment: integer("monthly_payment"),
  
  previousAddress: text("previous_address"),
  previousCity: text("previous_city"),
  previousState: text("previous_state"),
  previousZip: text("previous_zip"),
  previousHowLong: text("previous_how_long"),
  
  employerName: text("employer_name").notNull(),
  employerPhone: text("employer_phone"),
  jobTitle: text("job_title").notNull(),
  employmentLength: text("employment_length").notNull(),
  monthlyIncome: integer("monthly_income").notNull(),
  
  previousEmployer: text("previous_employer"),
  previousJobTitle: text("previous_job_title"),
  previousEmploymentLength: text("previous_employment_length"),
  
  additionalIncome: integer("additional_income"),
  additionalIncomeSource: text("additional_income_source"),
  
  vehicleInterest: text("vehicle_interest"),
  
  tcpaConsent: boolean("tcpa_consent").notNull().default(false),
  
  status: text("status").notNull().default("new"),
  notes: text("notes"),
  assignedTo: varchar("assigned_to").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCreditApplicationSchema = createInsertSchema(creditApplications).omit({
  id: true,
  createdAt: true,
  status: true,
  notes: true,
  assignedTo: true,
});

export type InsertCreditApplication = z.infer<typeof insertCreditApplicationSchema>;
export type CreditApplication = typeof creditApplications.$inferSelect;

export const leadNotes = pgTable("lead_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadType: text("lead_type").notNull(),
  leadId: varchar("lead_id").notNull(),
  content: text("content").notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLeadNoteSchema = createInsertSchema(leadNotes).omit({
  id: true,
  createdAt: true,
});

export type InsertLeadNote = z.infer<typeof insertLeadNoteSchema>;
export type LeadNote = typeof leadNotes.$inferSelect;

export const activityLog = pgTable("activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadType: text("lead_type").notNull(),
  leadId: varchar("lead_id").notNull(),
  activityType: text("activity_type").notNull(),
  description: text("description").notNull(),
  metadata: text("metadata"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertActivityLogSchema = createInsertSchema(activityLog).omit({
  id: true,
  createdAt: true,
});

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLog.$inferSelect;

export const leadPipelineStages = ["new", "contacted", "qualified", "negotiating", "sold", "lost"] as const;
export type LeadPipelineStage = typeof leadPipelineStages[number];

export const targetLocations = pgTable("target_locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  city: text("city").notNull(),
  state: text("state").notNull(),
  slug: text("slug").notNull().unique(),
  headline: text("headline"),
  description: text("description"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  radius: integer("radius").default(50),
  isActive: boolean("is_active").default(true),
  isPrimary: boolean("is_primary").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTargetLocationSchema = createInsertSchema(targetLocations).omit({
  id: true,
  createdAt: true,
});

export type InsertTargetLocation = z.infer<typeof insertTargetLocationSchema>;
export type TargetLocation = typeof targetLocations.$inferSelect;

export const citationDirectories = pgTable("citation_directories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  url: text("url").notNull(),
  category: text("category").notNull(),
  submissionType: text("submission_type").notNull(),
  priority: integer("priority").default(1),
  isAggregator: boolean("is_aggregator").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCitationDirectorySchema = createInsertSchema(citationDirectories).omit({
  id: true,
  createdAt: true,
});

export type InsertCitationDirectory = z.infer<typeof insertCitationDirectorySchema>;
export type CitationDirectory = typeof citationDirectories.$inferSelect;

export const citationSubmissions = pgTable("citation_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  directoryId: varchar("directory_id").references(() => citationDirectories.id),
  directoryName: text("directory_name").notNull(),
  status: text("status").notNull().default("pending"),
  submittedAt: timestamp("submitted_at"),
  confirmedAt: timestamp("confirmed_at"),
  listingUrl: text("listing_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCitationSubmissionSchema = createInsertSchema(citationSubmissions).omit({
  id: true,
  createdAt: true,
});

export type InsertCitationSubmission = z.infer<typeof insertCitationSubmissionSchema>;
export type CitationSubmission = typeof citationSubmissions.$inferSelect;

export const citationStatuses = ["pending", "submitted", "confirmed", "rejected", "needs_update"] as const;
export type CitationStatus = typeof citationStatuses[number];

export const directoryCategories = ["aggregator", "automotive", "local", "business", "review", "social"] as const;
export type DirectoryCategory = typeof directoryCategories[number];

export const submissionTypes = ["automatic", "manual", "api"] as const;
export type SubmissionType = typeof submissionTypes[number];

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  
  preferredMakes: text("preferred_makes").array().default(sql`'{}'::text[]`),
  notifyNewListings: boolean("notify_new_listings").default(true),
  notifyPriceDrops: boolean("notify_price_drops").default(true),
  notifySpecialOffers: boolean("notify_special_offers").default(true),
  notifyHotListings: boolean("notify_hot_listings").default(true),
  
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsed: timestamp("last_used"),
});

export const notificationCategories = ["all", "new_listings", "price_drops", "special_offers", "hot_listings"] as const;
export type NotificationCategory = typeof notificationCategories[number];

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
  id: true,
  createdAt: true,
  lastUsed: true,
});

export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;

export const pushNotifications = pgTable("push_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  body: text("body").notNull(),
  url: text("url"),
  imageUrl: text("image_url"),
  targetType: text("target_type").notNull().default("all"),
  targetCategory: text("target_category").default("all"),
  targetMakes: text("target_makes").array().default(sql`'{}'::text[]`),
  sentCount: integer("sent_count").default(0),
  sentAt: timestamp("sent_at"),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPushNotificationSchema = createInsertSchema(pushNotifications).omit({
  id: true,
  sentCount: true,
  sentAt: true,
  createdAt: true,
});

export type InsertPushNotification = z.infer<typeof insertPushNotificationSchema>;
export type PushNotification = typeof pushNotifications.$inferSelect;

// SMS Messages for two-way communication
export const smsMessages = pgTable("sms_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inquiryId: varchar("inquiry_id").references(() => buyerInquiries.id),
  ghlContactId: text("ghl_contact_id"),
  ghlConversationId: text("ghl_conversation_id"),
  ghlMessageId: text("ghl_message_id"),
  direction: text("direction").notNull(), // 'inbound' or 'outbound'
  body: text("body").notNull(),
  phone: text("phone").notNull(),
  status: text("status").default("delivered"), // 'pending', 'sent', 'delivered', 'failed'
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSmsMessageSchema = createInsertSchema(smsMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertSmsMessage = z.infer<typeof insertSmsMessageSchema>;
export type SmsMessage = typeof smsMessages.$inferSelect;

// SMS Contacts - stores display names and recently viewed info for SMS conversations
export const smsContacts = pgTable("sms_contacts", {
  phone: text("phone").primaryKey(), // Normalized phone number (digits only)
  displayName: text("display_name"),
  lastViewedAt: timestamp("last_viewed_at"),
  lastInboundAt: timestamp("last_inbound_at"),
  lastOutboundAt: timestamp("last_outbound_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSmsContactSchema = createInsertSchema(smsContacts);

export type InsertSmsContact = z.infer<typeof insertSmsContactSchema>;
export type SmsContact = typeof smsContacts.$inferSelect;

// Vehicle Saves - tracks when users save/heart vehicles
export const vehicleSaves = pgTable("vehicle_saves", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: varchar("vehicle_id").notNull().references(() => inventoryCars.id),
  sessionId: text("session_id").notNull(), // Anonymous session or authenticated user identifier
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVehicleSaveSchema = createInsertSchema(vehicleSaves).omit({
  id: true,
  createdAt: true,
});

export type InsertVehicleSave = z.infer<typeof insertVehicleSaveSchema>;
export type VehicleSave = typeof vehicleSaves.$inferSelect;

// Health Checks - stores system health check results
export const healthChecks = pgTable("health_checks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  runAt: timestamp("run_at").notNull().defaultNow(),
  overallStatus: text("overall_status").notNull(), // 'healthy', 'degraded', 'unhealthy'
  results: text("results").notNull(), // JSON string of check results
  duration: integer("duration"), // milliseconds
  triggeredBy: text("triggered_by").default("manual"), // 'manual', 'scheduled', 'startup'
});

export const insertHealthCheckSchema = createInsertSchema(healthChecks).omit({
  id: true,
});

export type InsertHealthCheck = z.infer<typeof insertHealthCheckSchema>;
export type HealthCheck = typeof healthChecks.$inferSelect;

export type HealthCheckResult = {
  name: string;
  category: 'database' | 'api' | 'external' | 'storage';
  status: 'pass' | 'fail' | 'warn';
  message: string;
  duration?: number;
};

// ============================================
// P0 API Request Validation Schemas
// ============================================

// Auth schemas
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});
export type LoginPayload = z.infer<typeof loginSchema>;

// Seller portal auth schemas
export const sellerSendCodeSchema = z.object({
  phone: z.string().min(10, "Valid phone number required"),
});
export type SellerSendCodePayload = z.infer<typeof sellerSendCodeSchema>;

export const sellerVerifySchema = z.object({
  phone: z.string().min(10, "Valid phone number required"),
  code: z.string().length(6, "Verification code must be 6 digits"),
});
export type SellerVerifyPayload = z.infer<typeof sellerVerifySchema>;

// Trade-in form schema
export const tradeInSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number required"),
  year: z.string().min(4, "Year is required"),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  mileage: z.string().min(1, "Mileage is required"),
  condition: z.enum(["excellent", "good", "fair", "poor"]),
  vin: z.string().optional(),
  payoffAmount: z.string().optional(),
  additionalInfo: z.string().optional(),
});
export type TradeInPayload = z.infer<typeof tradeInSchema>;

// Appointment booking schema
export const appointmentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number required"),
  appointmentType: z.enum(["test_drive", "showroom_visit", "inspection"]),
  vehicleId: z.string().optional(),
  preferredDate: z.string().min(1, "Preferred date is required"),
  preferredTime: z.string().min(1, "Preferred time is required"),
  alternateDate: z.string().optional(),
  alternateTime: z.string().optional(),
  notes: z.string().optional(),
});
export type AppointmentPayload = z.infer<typeof appointmentSchema>;

// Inventory car update schema (partial for PATCH)
export const updateInventoryCarSchema = insertInventoryCarSchema.partial();
export type UpdateInventoryCar = z.infer<typeof updateInventoryCarSchema>;

// Consignment status update schema
export const consignmentStatusUpdateSchema = z.object({
  status: z.enum(["pending", "in_review", "approved", "rejected", "converted"]),
  note: z.string().optional(),
});
export type ConsignmentStatusUpdate = z.infer<typeof consignmentStatusUpdateSchema>;

// Common param schemas for route parameters
export const idParamSchema = z.object({
  id: z.string().min(1, "ID is required"),
});
export type IdParam = z.infer<typeof idParamSchema>;
