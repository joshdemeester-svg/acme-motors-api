import { 
  users, 
  consignmentSubmissions, 
  inventoryCars,
  type User, 
  type InsertUser,
  type ConsignmentSubmission,
  type InsertConsignment,
  type InventoryCar,
  type InsertInventoryCar
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createConsignment(data: InsertConsignment): Promise<ConsignmentSubmission>;
  getConsignment(id: string): Promise<ConsignmentSubmission | undefined>;
  getAllConsignments(): Promise<ConsignmentSubmission[]>;
  updateConsignmentStatus(id: string, status: string): Promise<ConsignmentSubmission | undefined>;
  updateConsignmentPhotos(id: string, photos: string[]): Promise<ConsignmentSubmission | undefined>;
  
  createInventoryCar(data: InsertInventoryCar): Promise<InventoryCar>;
  getInventoryCar(id: string): Promise<InventoryCar | undefined>;
  getAllInventoryCars(): Promise<InventoryCar[]>;
  getAvailableInventoryCars(): Promise<InventoryCar[]>;
  updateInventoryCarStatus(id: string, status: string): Promise<InventoryCar | undefined>;
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

  async updateInventoryCarStatus(id: string, status: string): Promise<InventoryCar | undefined> {
    const [updated] = await db
      .update(inventoryCars)
      .set({ status })
      .where(eq(inventoryCars.id, id))
      .returning();
    return updated || undefined;
  }
}

export const storage = new DatabaseStorage();
