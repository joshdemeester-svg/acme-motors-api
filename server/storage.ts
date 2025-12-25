import { 
  users, 
  consignmentSubmissions, 
  inventoryCars,
  siteSettings,
  phoneVerifications,
  statusHistory,
  sellerNotes,
  sellerDocuments,
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
  type InsertSellerDocument
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gt } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  setUserAdmin(id: string, isAdmin: boolean): Promise<User | undefined>;
  
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
}

export const storage = new DatabaseStorage();
