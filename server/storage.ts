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
  type InsertCreditApplication
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gt } from "drizzle-orm";

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
  
  createVehicleDocument(data: InsertVehicleDocument): Promise<VehicleDocument>;
  getVehicleDocuments(vehicleId: string): Promise<VehicleDocument[]>;
  deleteVehicleDocument(id: string): Promise<boolean>;
  
  createCreditApplication(data: InsertCreditApplication): Promise<CreditApplication>;
  getAllCreditApplications(): Promise<CreditApplication[]>;
  getCreditApplication(id: string): Promise<CreditApplication | undefined>;
  updateCreditApplicationStatus(id: string, status: string): Promise<CreditApplication | undefined>;
  updateCreditApplicationNotes(id: string, notes: string): Promise<CreditApplication | undefined>;
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
    if (existing) {
      const [updated] = await db
        .update(siteSettings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(siteSettings.id, "default"))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(siteSettings)
        .values({ id: "default", ...data })
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
        gt(vehicleViews.viewedAt, startDate),
        gt(endDate, vehicleViews.viewedAt!)
      ))
      .orderBy(desc(vehicleViews.viewedAt));
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
}

export const storage = new DatabaseStorage();
