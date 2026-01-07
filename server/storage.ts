import { 
  users, 
  consignmentSubmissions, 
  inventoryCars,
  siteSettings,
  phoneVerifications,
  statusHistory,
  sellerNotes,
  sellerDocuments,
  buyerInquiries,
  vehicleAlerts,
  testimonials,
  vehicleViews,
  vehicleDocuments,
  creditApplications,
  leadNotes,
  activityLog,
  priceAlerts,
  type User, 
  type InsertUser,
  type ConsignmentSubmission,
  type InsertConsignment,
  type InventoryCar,
  type InsertInventoryCar,
  type SiteSettings,
  type InsertSiteSettings,
  type PhoneVerification,
  type StatusHistory,
  type SellerNote,
  type InsertSellerNote,
  type SellerDocument,
  type InsertSellerDocument,
  type BuyerInquiry,
  type InsertBuyerInquiry,
  type VehicleAlert,
  type InsertVehicleAlert,
  type Testimonial,
  type InsertTestimonial,
  type VehicleView,
  type VehicleDocument,
  type InsertVehicleDocument,
  type CreditApplication,
  type InsertCreditApplication,
  type LeadNote,
  type InsertLeadNote,
  type ActivityLog,
  type InsertActivityLog,
  type PriceAlert,
  type InsertPriceAlert
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gt, lt } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  setUserAdmin(id: string, isAdmin: boolean): Promise<User | undefined>;
  updateUserPassword(id: string, hashedPassword: string): Promise<User | undefined>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<boolean>;
  countMasterAdmins(): Promise<number>;
  
  createConsignment(data: InsertConsignment): Promise<ConsignmentSubmission>;
  getConsignment(id: string): Promise<ConsignmentSubmission | undefined>;
  getAllConsignments(): Promise<ConsignmentSubmission[]>;
  updateConsignmentStatus(id: string, status: string): Promise<ConsignmentSubmission | undefined>;
  updateConsignmentPhotos(id: string, photos: string[]): Promise<ConsignmentSubmission | undefined>;
  
  createInventoryCar(data: InsertInventoryCar): Promise<InventoryCar>;
  getInventoryCar(id: string): Promise<InventoryCar | undefined>;
  getInventoryCarBySlug(slug: string): Promise<InventoryCar | undefined>;
  getInventoryCarByShortId(shortId: string): Promise<InventoryCar | undefined>;
  getInventoryCarByStockNumber(stockNumber: string): Promise<InventoryCar | undefined>;
  getAllInventoryCarSlugs(): Promise<string[]>;
  getAllInventoryCars(): Promise<InventoryCar[]>;
  getAvailableInventoryCars(): Promise<InventoryCar[]>;
  getFeaturedInventoryCars(): Promise<InventoryCar[]>;
  getSoldInventoryCars(): Promise<InventoryCar[]>;
  updateInventoryCarStatus(id: string, status: string): Promise<InventoryCar | undefined>;
  updateInventoryCar(id: string, data: Partial<InsertInventoryCar>): Promise<InventoryCar | undefined>;
  
  getSiteSettings(): Promise<SiteSettings | undefined>;
  updateSiteSettings(data: InsertSiteSettings): Promise<SiteSettings>;
  
  createPhoneVerification(phone: string, code: string, ghlContactId?: string): Promise<PhoneVerification>;
  getValidPhoneVerification(phone: string, code: string): Promise<PhoneVerification | undefined>;
  markPhoneVerified(id: string): Promise<void>;
  isPhoneVerified(phone: string): Promise<boolean>;
  
  getConsignmentsByPhone(phone: string): Promise<ConsignmentSubmission[]>;
  
  createStatusHistory(consignmentId: string, status: string, note?: string): Promise<StatusHistory>;
  getStatusHistory(consignmentId: string): Promise<StatusHistory[]>;
  
  updateConsignmentOverrides(id: string, overrides: {
    customPayoutAmount?: number | null;
    overrideCommissionRate?: number | null;
    overrideAvgDaysToFirstInquiry?: number | null;
    overrideAvgDaysToSell?: number | null;
  }): Promise<ConsignmentSubmission | undefined>;
  
  createSellerNote(data: InsertSellerNote): Promise<SellerNote>;
  getSellerNotes(consignmentId: string): Promise<SellerNote[]>;
  
  createSellerDocument(data: InsertSellerDocument): Promise<SellerDocument>;
  getSellerDocuments(consignmentId: string): Promise<SellerDocument[]>;
  updateDocumentStatus(id: string, status: string): Promise<SellerDocument | undefined>;
  
  createBuyerInquiry(data: InsertBuyerInquiry): Promise<BuyerInquiry>;
  getAllBuyerInquiries(): Promise<BuyerInquiry[]>;
  getBuyerInquiry(id: string): Promise<BuyerInquiry | undefined>;
  updateBuyerInquiryStatus(id: string, status: string): Promise<BuyerInquiry | undefined>;
  getInquiriesForCar(carId: string): Promise<BuyerInquiry[]>;
  getInquiryCountsPerVehicle(): Promise<Record<string, number>>;
  
  createVehicleAlert(data: InsertVehicleAlert): Promise<VehicleAlert>;
  getAllVehicleAlerts(): Promise<VehicleAlert[]>;
  getActiveVehicleAlerts(): Promise<VehicleAlert[]>;
  updateVehicleAlertStatus(id: string, active: boolean): Promise<VehicleAlert | undefined>;
  deleteVehicleAlert(id: string): Promise<boolean>;
  
  createTestimonial(data: InsertTestimonial): Promise<Testimonial>;
  getAllTestimonials(): Promise<Testimonial[]>;
  getApprovedTestimonials(): Promise<Testimonial[]>;
  getFeaturedTestimonials(): Promise<Testimonial[]>;
  updateTestimonial(id: string, data: Partial<InsertTestimonial & { approved: boolean; featured: boolean }>): Promise<Testimonial | undefined>;
  deleteTestimonial(id: string): Promise<boolean>;
  
  recordVehicleView(vehicleId: string, userAgent?: string, referrer?: string): Promise<VehicleView>;
  getVehicleViewCount(vehicleId: string): Promise<number>;
  getViewsInRange(startDate: Date, endDate: Date): Promise<VehicleView[]>;
  getTotalViewsCount(): Promise<number>;
  getMostViewedVehicles(limit?: number): Promise<{ vehicleId: string; viewCount: number }[]>;
  
  createVehicleDocument(data: InsertVehicleDocument): Promise<VehicleDocument>;
  getVehicleDocuments(vehicleId: string): Promise<VehicleDocument[]>;
  deleteVehicleDocument(id: string): Promise<boolean>;
  
  createCreditApplication(data: InsertCreditApplication): Promise<CreditApplication>;
  getAllCreditApplications(): Promise<CreditApplication[]>;
  getCreditApplication(id: string): Promise<CreditApplication | undefined>;
  updateCreditApplicationStatus(id: string, status: string): Promise<CreditApplication | undefined>;
  updateCreditApplicationNotes(id: string, notes: string): Promise<CreditApplication | undefined>;
  
  createLeadNote(data: InsertLeadNote): Promise<LeadNote>;
  getLeadNotes(leadType: string, leadId: string): Promise<LeadNote[]>;
  updateLeadNote(id: string, content: string): Promise<LeadNote | undefined>;
  deleteLeadNote(id: string): Promise<boolean>;
  
  createActivityLog(data: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogs(leadType: string, leadId: string): Promise<ActivityLog[]>;
  
  updateBuyerInquiryPipeline(id: string, pipelineStage: string): Promise<BuyerInquiry | undefined>;
  updateBuyerInquiryAssignment(id: string, assignedTo: string | null): Promise<BuyerInquiry | undefined>;
  updateCreditApplicationAssignment(id: string, assignedTo: string | null): Promise<CreditApplication | undefined>;
  
  deleteDemoInventory(): Promise<number>;
  deleteDemoBuyerInquiries(): Promise<number>;
  deleteDemoConsignments(): Promise<number>;
  deleteDemoTestimonials(): Promise<number>;
  
  createPriceAlert(data: InsertPriceAlert): Promise<PriceAlert>;
  getPriceAlertsForVehicle(vehicleId: string): Promise<PriceAlert[]>;
  getPriceAlertsByEmail(email: string): Promise<PriceAlert[]>;
  getActivePriceAlerts(): Promise<PriceAlert[]>;
  updatePriceAlertNotified(id: string): Promise<PriceAlert | undefined>;
  deactivatePriceAlert(id: string): Promise<boolean>;
  deletePriceAlert(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async setUserAdmin(id: string, isAdmin: boolean): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ isAdmin })
      .where(eq(users.id, id))
      .returning();
    return updated || undefined;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, id))
      .returning();
    return updated || undefined;
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, id))
      .returning();
    return updated || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  async countMasterAdmins(): Promise<number> {
    const masterAdmins = await db.select().from(users).where(eq(users.role, "master"));
    return masterAdmins.length;
  }

  async createConsignment(data: InsertConsignment): Promise<ConsignmentSubmission> {
    const [submission] = await db.insert(consignmentSubmissions).values(data).returning();
    return submission;
  }

  async getConsignment(id: string): Promise<ConsignmentSubmission | undefined> {
    const [submission] = await db.select().from(consignmentSubmissions).where(eq(consignmentSubmissions.id, id));
    return submission || undefined;
  }

  async getAllConsignments(): Promise<ConsignmentSubmission[]> {
    return db.select().from(consignmentSubmissions).orderBy(desc(consignmentSubmissions.createdAt));
  }

  async updateConsignmentStatus(id: string, status: string): Promise<ConsignmentSubmission | undefined> {
    const [updated] = await db
      .update(consignmentSubmissions)
      .set({ status })
      .where(eq(consignmentSubmissions.id, id))
      .returning();
    return updated || undefined;
  }

  async updateConsignmentPhotos(id: string, photos: string[]): Promise<ConsignmentSubmission | undefined> {
    const [updated] = await db
      .update(consignmentSubmissions)
      .set({ photos })
      .where(eq(consignmentSubmissions.id, id))
      .returning();
    return updated || undefined;
  }

  async createInventoryCar(data: InsertInventoryCar): Promise<InventoryCar> {
    const [car] = await db.insert(inventoryCars).values(data).returning();
    return car;
  }

  async getInventoryCar(id: string): Promise<InventoryCar | undefined> {
    const [car] = await db.select().from(inventoryCars).where(eq(inventoryCars.id, id));
    return car || undefined;
  }

  async getInventoryCarBySlug(slug: string): Promise<InventoryCar | undefined> {
    const [car] = await db.select().from(inventoryCars).where(eq(inventoryCars.slug, slug));
    return car || undefined;
  }

  async getInventoryCarByShortId(shortId: string): Promise<InventoryCar | undefined> {
    // Look up car where ID starts with the short ID prefix
    const allCars = await db.select().from(inventoryCars);
    return allCars.find(car => car.id.startsWith(shortId)) || undefined;
  }

  async getInventoryCarByStockNumber(stockNumber: string): Promise<InventoryCar | undefined> {
    const [car] = await db.select().from(inventoryCars).where(eq(inventoryCars.stockNumber, stockNumber));
    return car || undefined;
  }

  async getAllInventoryCarSlugs(): Promise<string[]> {
    const cars = await db.select({ slug: inventoryCars.slug }).from(inventoryCars);
    return cars.map(c => c.slug).filter((s): s is string => s !== null);
  }

  async getAllInventoryCars(): Promise<InventoryCar[]> {
    return db.select().from(inventoryCars).orderBy(desc(inventoryCars.createdAt));
  }

  async getAvailableInventoryCars(): Promise<InventoryCar[]> {
    return db.select().from(inventoryCars).where(eq(inventoryCars.status, "available")).orderBy(desc(inventoryCars.createdAt));
  }

  async getFeaturedInventoryCars(): Promise<InventoryCar[]> {
    return db.select().from(inventoryCars).where(and(eq(inventoryCars.status, "available"), eq(inventoryCars.featured, true))).orderBy(desc(inventoryCars.createdAt));
  }

  async getSoldInventoryCars(): Promise<InventoryCar[]> {
    return db.select().from(inventoryCars).where(eq(inventoryCars.status, "sold")).orderBy(desc(inventoryCars.createdAt));
  }

  async updateInventoryCarStatus(id: string, status: string): Promise<InventoryCar | undefined> {
    const [updated] = await db
      .update(inventoryCars)
      .set({ status })
      .where(eq(inventoryCars.id, id))
      .returning();
    return updated || undefined;
  }

  async updateInventoryCar(id: string, data: Partial<InsertInventoryCar>): Promise<InventoryCar | undefined> {
    const [updated] = await db
      .update(inventoryCars)
      .set(data)
      .where(eq(inventoryCars.id, id))
      .returning();
    return updated || undefined;
  }

  async getSiteSettings(): Promise<SiteSettings | undefined> {
    const [settings] = await db.select().from(siteSettings).where(eq(siteSettings.id, "default"));
    return settings || undefined;
  }

  async updateSiteSettings(data: InsertSiteSettings): Promise<SiteSettings> {
    const existing = await this.getSiteSettings();
    
    // Filter out undefined values to prevent overwriting existing data with NULL
    const filteredData: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        filteredData[key] = value;
      }
    }
    
    if (existing) {
      const [updated] = await db
        .update(siteSettings)
        .set({ ...filteredData, updatedAt: new Date() })
        .where(eq(siteSettings.id, "default"))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(siteSettings)
        .values({ id: "default", ...filteredData })
        .returning();
      return created;
    }
  }

  async createPhoneVerification(phone: string, code: string, ghlContactId?: string): Promise<PhoneVerification> {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const [verification] = await db
      .insert(phoneVerifications)
      .values({ phone, code, ghlContactId, expiresAt })
      .returning();
    return verification;
  }

  async getValidPhoneVerification(phone: string, code: string): Promise<PhoneVerification | undefined> {
    const [verification] = await db
      .select()
      .from(phoneVerifications)
      .where(
        and(
          eq(phoneVerifications.phone, phone),
          eq(phoneVerifications.code, code),
          eq(phoneVerifications.verified, false),
          gt(phoneVerifications.expiresAt, new Date())
        )
      );
    return verification || undefined;
  }

  async markPhoneVerified(id: string): Promise<void> {
    await db
      .update(phoneVerifications)
      .set({ verified: true })
      .where(eq(phoneVerifications.id, id));
  }

  async isPhoneVerified(phone: string): Promise<boolean> {
    const [verification] = await db
      .select()
      .from(phoneVerifications)
      .where(
        and(
          eq(phoneVerifications.phone, phone),
          eq(phoneVerifications.verified, true),
          gt(phoneVerifications.expiresAt, new Date())
        )
      );
    return !!verification;
  }

  async getConsignmentsByPhone(phone: string): Promise<ConsignmentSubmission[]> {
    return db
      .select()
      .from(consignmentSubmissions)
      .where(eq(consignmentSubmissions.phone, phone))
      .orderBy(desc(consignmentSubmissions.createdAt));
  }

  async createStatusHistory(consignmentId: string, status: string, note?: string): Promise<StatusHistory> {
    const [entry] = await db
      .insert(statusHistory)
      .values({ consignmentId, status, note })
      .returning();
    return entry;
  }

  async getStatusHistory(consignmentId: string): Promise<StatusHistory[]> {
    return db
      .select()
      .from(statusHistory)
      .where(eq(statusHistory.consignmentId, consignmentId))
      .orderBy(desc(statusHistory.createdAt));
  }

  async updateConsignmentOverrides(id: string, overrides: {
    customPayoutAmount?: number | null;
    overrideCommissionRate?: number | null;
    overrideAvgDaysToFirstInquiry?: number | null;
    overrideAvgDaysToSell?: number | null;
  }): Promise<ConsignmentSubmission | undefined> {
    const [updated] = await db
      .update(consignmentSubmissions)
      .set(overrides)
      .where(eq(consignmentSubmissions.id, id))
      .returning();
    return updated || undefined;
  }

  async createSellerNote(data: InsertSellerNote): Promise<SellerNote> {
    const [note] = await db.insert(sellerNotes).values(data).returning();
    return note;
  }

  async getSellerNotes(consignmentId: string): Promise<SellerNote[]> {
    return db
      .select()
      .from(sellerNotes)
      .where(eq(sellerNotes.consignmentId, consignmentId))
      .orderBy(desc(sellerNotes.createdAt));
  }

  async createSellerDocument(data: InsertSellerDocument): Promise<SellerDocument> {
    const [doc] = await db.insert(sellerDocuments).values(data).returning();
    return doc;
  }

  async getSellerDocuments(consignmentId: string): Promise<SellerDocument[]> {
    return db
      .select()
      .from(sellerDocuments)
      .where(eq(sellerDocuments.consignmentId, consignmentId))
      .orderBy(desc(sellerDocuments.createdAt));
  }

  async updateDocumentStatus(id: string, status: string): Promise<SellerDocument | undefined> {
    const [updated] = await db
      .update(sellerDocuments)
      .set({ status })
      .where(eq(sellerDocuments.id, id))
      .returning();
    return updated || undefined;
  }

  async createBuyerInquiry(data: InsertBuyerInquiry): Promise<BuyerInquiry> {
    const [inquiry] = await db.insert(buyerInquiries).values(data).returning();
    return inquiry;
  }

  async getAllBuyerInquiries(): Promise<BuyerInquiry[]> {
    return db.select().from(buyerInquiries).orderBy(desc(buyerInquiries.createdAt));
  }

  async getBuyerInquiry(id: string): Promise<BuyerInquiry | undefined> {
    const [inquiry] = await db.select().from(buyerInquiries).where(eq(buyerInquiries.id, id));
    return inquiry || undefined;
  }

  async updateBuyerInquiryStatus(id: string, status: string): Promise<BuyerInquiry | undefined> {
    const [updated] = await db
      .update(buyerInquiries)
      .set({ status })
      .where(eq(buyerInquiries.id, id))
      .returning();
    return updated || undefined;
  }

  async getInquiriesForCar(carId: string): Promise<BuyerInquiry[]> {
    return db
      .select()
      .from(buyerInquiries)
      .where(eq(buyerInquiries.inventoryCarId, carId))
      .orderBy(desc(buyerInquiries.createdAt));
  }

  async getInquiryCountsPerVehicle(): Promise<Record<string, number>> {
    const inquiries = await db.select().from(buyerInquiries);
    const counts: Record<string, number> = {};
    for (const inquiry of inquiries) {
      counts[inquiry.inventoryCarId] = (counts[inquiry.inventoryCarId] || 0) + 1;
    }
    return counts;
  }

  async createVehicleAlert(data: InsertVehicleAlert): Promise<VehicleAlert> {
    const [alert] = await db.insert(vehicleAlerts).values(data).returning();
    return alert;
  }

  async getAllVehicleAlerts(): Promise<VehicleAlert[]> {
    return db.select().from(vehicleAlerts).orderBy(desc(vehicleAlerts.createdAt));
  }

  async getActiveVehicleAlerts(): Promise<VehicleAlert[]> {
    return db.select().from(vehicleAlerts).where(eq(vehicleAlerts.active, true)).orderBy(desc(vehicleAlerts.createdAt));
  }

  async updateVehicleAlertStatus(id: string, active: boolean): Promise<VehicleAlert | undefined> {
    const [updated] = await db
      .update(vehicleAlerts)
      .set({ active })
      .where(eq(vehicleAlerts.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteVehicleAlert(id: string): Promise<boolean> {
    const result = await db.delete(vehicleAlerts).where(eq(vehicleAlerts.id, id));
    return true;
  }

  async createTestimonial(data: InsertTestimonial): Promise<Testimonial> {
    const [testimonial] = await db.insert(testimonials).values(data).returning();
    return testimonial;
  }

  async getAllTestimonials(): Promise<Testimonial[]> {
    return db.select().from(testimonials).orderBy(desc(testimonials.createdAt));
  }

  async getApprovedTestimonials(): Promise<Testimonial[]> {
    return db.select().from(testimonials).where(eq(testimonials.approved, true)).orderBy(desc(testimonials.createdAt));
  }

  async getFeaturedTestimonials(): Promise<Testimonial[]> {
    return db
      .select()
      .from(testimonials)
      .where(and(eq(testimonials.approved, true), eq(testimonials.featured, true)))
      .orderBy(desc(testimonials.createdAt));
  }

  async updateTestimonial(id: string, data: Partial<InsertTestimonial & { approved: boolean; featured: boolean }>): Promise<Testimonial | undefined> {
    const [updated] = await db
      .update(testimonials)
      .set(data)
      .where(eq(testimonials.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteTestimonial(id: string): Promise<boolean> {
    await db.delete(testimonials).where(eq(testimonials.id, id));
    return true;
  }

  async recordVehicleView(vehicleId: string, userAgent?: string, referrer?: string): Promise<VehicleView> {
    const [view] = await db.insert(vehicleViews).values({
      vehicleId,
      userAgent: userAgent || null,
      referrer: referrer || null,
    }).returning();
    return view;
  }

  async getVehicleViewCount(vehicleId: string): Promise<number> {
    const result = await db.select().from(vehicleViews).where(eq(vehicleViews.vehicleId, vehicleId));
    return result.length;
  }

  async getViewsInRange(startDate: Date, endDate: Date): Promise<VehicleView[]> {
    return db.select().from(vehicleViews)
      .where(and(
        gt(vehicleViews.viewedAt!, startDate),
        lt(vehicleViews.viewedAt!, endDate)
      ))
      .orderBy(desc(vehicleViews.viewedAt));
  }
  
  async getMostViewedVehicles(limit: number = 10): Promise<{ vehicleId: string; viewCount: number }[]> {
    const views = await db.select().from(vehicleViews);
    const countMap = new Map<string, number>();
    for (const view of views) {
      countMap.set(view.vehicleId, (countMap.get(view.vehicleId) || 0) + 1);
    }
    return Array.from(countMap.entries())
      .map(([vehicleId, viewCount]) => ({ vehicleId, viewCount }))
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, limit);
  }

  async getTotalViewsCount(): Promise<number> {
    const result = await db.select().from(vehicleViews);
    return result.length;
  }

  async createVehicleDocument(data: InsertVehicleDocument): Promise<VehicleDocument> {
    const [doc] = await db.insert(vehicleDocuments).values(data).returning();
    return doc;
  }

  async getVehicleDocuments(vehicleId: string): Promise<VehicleDocument[]> {
    return db.select().from(vehicleDocuments)
      .where(eq(vehicleDocuments.vehicleId, vehicleId))
      .orderBy(desc(vehicleDocuments.createdAt));
  }

  async deleteVehicleDocument(id: string): Promise<boolean> {
    await db.delete(vehicleDocuments).where(eq(vehicleDocuments.id, id));
    return true;
  }

  async createCreditApplication(data: InsertCreditApplication): Promise<CreditApplication> {
    const [application] = await db.insert(creditApplications).values(data).returning();
    return application;
  }

  async getAllCreditApplications(): Promise<CreditApplication[]> {
    return db.select().from(creditApplications).orderBy(desc(creditApplications.createdAt));
  }

  async getCreditApplication(id: string): Promise<CreditApplication | undefined> {
    const [application] = await db.select().from(creditApplications).where(eq(creditApplications.id, id));
    return application || undefined;
  }

  async updateCreditApplicationStatus(id: string, status: string): Promise<CreditApplication | undefined> {
    const [updated] = await db
      .update(creditApplications)
      .set({ status })
      .where(eq(creditApplications.id, id))
      .returning();
    return updated || undefined;
  }

  async updateCreditApplicationNotes(id: string, notes: string): Promise<CreditApplication | undefined> {
    const [updated] = await db
      .update(creditApplications)
      .set({ notes })
      .where(eq(creditApplications.id, id))
      .returning();
    return updated || undefined;
  }

  async createLeadNote(data: InsertLeadNote): Promise<LeadNote> {
    const [note] = await db.insert(leadNotes).values(data).returning();
    return note;
  }

  async getLeadNotes(leadType: string, leadId: string): Promise<LeadNote[]> {
    return db.select().from(leadNotes)
      .where(and(eq(leadNotes.leadType, leadType), eq(leadNotes.leadId, leadId)))
      .orderBy(desc(leadNotes.createdAt));
  }

  async updateLeadNote(id: string, content: string): Promise<LeadNote | undefined> {
    const [updated] = await db
      .update(leadNotes)
      .set({ content })
      .where(eq(leadNotes.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteLeadNote(id: string): Promise<boolean> {
    await db.delete(leadNotes).where(eq(leadNotes.id, id));
    return true;
  }

  async createActivityLog(data: InsertActivityLog): Promise<ActivityLog> {
    const [activity] = await db.insert(activityLog).values(data).returning();
    return activity;
  }

  async getActivityLogs(leadType: string, leadId: string): Promise<ActivityLog[]> {
    return db.select().from(activityLog)
      .where(and(eq(activityLog.leadType, leadType), eq(activityLog.leadId, leadId)))
      .orderBy(desc(activityLog.createdAt));
  }

  async updateBuyerInquiryPipeline(id: string, pipelineStage: string): Promise<BuyerInquiry | undefined> {
    const [updated] = await db
      .update(buyerInquiries)
      .set({ pipelineStage })
      .where(eq(buyerInquiries.id, id))
      .returning();
    return updated || undefined;
  }

  async updateBuyerInquiryAssignment(id: string, assignedTo: string | null): Promise<BuyerInquiry | undefined> {
    const [updated] = await db
      .update(buyerInquiries)
      .set({ assignedTo })
      .where(eq(buyerInquiries.id, id))
      .returning();
    return updated || undefined;
  }

  async updateCreditApplicationAssignment(id: string, assignedTo: string | null): Promise<CreditApplication | undefined> {
    const [updated] = await db
      .update(creditApplications)
      .set({ assignedTo })
      .where(eq(creditApplications.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteDemoInventory(): Promise<number> {
    const demoVehicles = await db.select().from(inventoryCars).where(eq(inventoryCars.isDemo, true));
    for (const vehicle of demoVehicles) {
      await db.delete(buyerInquiries).where(eq(buyerInquiries.inventoryCarId, vehicle.id));
      await db.delete(vehicleViews).where(eq(vehicleViews.vehicleId, vehicle.id));
      await db.delete(vehicleDocuments).where(eq(vehicleDocuments.vehicleId, vehicle.id));
    }
    const result = await db.delete(inventoryCars).where(eq(inventoryCars.isDemo, true)).returning();
    return result.length;
  }

  async deleteDemoBuyerInquiries(): Promise<number> {
    const result = await db.delete(buyerInquiries).where(eq(buyerInquiries.isDemo, true)).returning();
    return result.length;
  }

  async deleteDemoConsignments(): Promise<number> {
    const demoConsignments = await db.select().from(consignmentSubmissions).where(eq(consignmentSubmissions.isDemo, true));
    for (const consignment of demoConsignments) {
      await db.delete(sellerNotes).where(eq(sellerNotes.consignmentId, consignment.id));
      await db.delete(sellerDocuments).where(eq(sellerDocuments.consignmentId, consignment.id));
      await db.delete(statusHistory).where(eq(statusHistory.consignmentId, consignment.id));
    }
    const result = await db.delete(consignmentSubmissions).where(eq(consignmentSubmissions.isDemo, true)).returning();
    return result.length;
  }

  async deleteDemoTestimonials(): Promise<number> {
    const result = await db.delete(testimonials).where(eq(testimonials.isDemo, true)).returning();
    return result.length;
  }

  async createPriceAlert(data: InsertPriceAlert): Promise<PriceAlert> {
    const [alert] = await db.insert(priceAlerts).values(data).returning();
    return alert;
  }

  async getPriceAlertsForVehicle(vehicleId: string): Promise<PriceAlert[]> {
    return db.select().from(priceAlerts).where(eq(priceAlerts.vehicleId, vehicleId)).orderBy(desc(priceAlerts.createdAt));
  }

  async getPriceAlertsByEmail(email: string): Promise<PriceAlert[]> {
    return db.select().from(priceAlerts).where(eq(priceAlerts.email, email)).orderBy(desc(priceAlerts.createdAt));
  }

  async getActivePriceAlerts(): Promise<PriceAlert[]> {
    return db.select().from(priceAlerts).where(eq(priceAlerts.active, true)).orderBy(desc(priceAlerts.createdAt));
  }

  async updatePriceAlertNotified(id: string): Promise<PriceAlert | undefined> {
    const [updated] = await db
      .update(priceAlerts)
      .set({ lastNotifiedAt: new Date() })
      .where(eq(priceAlerts.id, id))
      .returning();
    return updated || undefined;
  }

  async deactivatePriceAlert(id: string): Promise<boolean> {
    const result = await db.update(priceAlerts).set({ active: false }).where(eq(priceAlerts.id, id)).returning();
    return result.length > 0;
  }

  async deletePriceAlert(id: string): Promise<boolean> {
    const result = await db.delete(priceAlerts).where(eq(priceAlerts.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
