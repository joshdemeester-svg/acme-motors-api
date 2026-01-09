import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { insertConsignmentSchema, insertInventoryCarSchema, insertCreditApplicationSchema, generateVehicleSlug, generateVehicleSlugLegacy, extractIdFromSlug, slugify, type InsertConsignment } from "@shared/schema";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { z } from "zod";
import crypto from "crypto";

// Global WebSocket server for real-time updates
let wss: WebSocketServer | null = null;

function broadcastSmsMessage(data: any) {
  if (!wss) return;
  
  const message = JSON.stringify({ type: 'sms_message', data });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

declare module "express-serve-static-core" {
  interface Request {
    user?: { id: string; username: string; isAdmin: boolean; role?: string };
  }
}

const GHL_API_BASE = "https://services.leadconnectorhq.com";

async function getGHLCredentials(): Promise<{ locationId: string | null; apiToken: string | null; source: 'env' | 'db' | 'none' }> {
  // Priority: Environment secrets first (persist across republishes), then database fallback
  const envToken = process.env.GHL_API_TOKEN || null;
  const envLocationId = process.env.GHL_LOCATION_ID || null;
  
  if (envToken && envLocationId) {
    return { locationId: envLocationId, apiToken: envToken, source: 'env' };
  }
  
  try {
    const settings = await storage.getSiteSettings();
    const dbToken = settings?.ghlApiToken || null;
    const dbLocationId = settings?.ghlLocationId || null;
    
    if (dbToken && dbLocationId) {
      return { locationId: dbLocationId, apiToken: dbToken, source: 'db' };
    }
    
    // Partial credentials - use whatever is available
    const locationId = envLocationId || dbLocationId || null;
    const apiToken = envToken || dbToken || null;
    return { locationId, apiToken, source: locationId && apiToken ? 'db' : 'none' };
  } catch (error) {
    console.error("[GHL] Error fetching credentials from database:", error);
    return { 
      locationId: envLocationId, 
      apiToken: envToken,
      source: envLocationId && envToken ? 'env' : 'none'
    };
  }
}

async function createGHLContact(consignment: InsertConsignment & { id: string }): Promise<void> {
  const { locationId, apiToken } = await getGHLCredentials();
  
  if (!locationId || !apiToken) {
    console.log("GoHighLevel not configured, skipping contact creation");
    return;
  }

  // Validate required consignment fields
  if (!consignment.firstName || !consignment.phone) {
    console.error("[GHL] Invalid consignment data: missing required fields");
    return;
  }

  const vehicleTag = consignment.year && consignment.make && consignment.model 
    ? `${consignment.year} ${consignment.make} ${consignment.model}` 
    : "Vehicle Consignment";

  try {
    const response = await fetch(`${GHL_API_BASE}/contacts/upsert`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Version": "2021-07-28",
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        firstName: consignment.firstName,
        lastName: consignment.lastName || "",
        email: consignment.email || "",
        phone: consignment.phone,
        locationId: locationId,
        tags: ["Consignment Lead", vehicleTag],
        source: "Consignment Website",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[GHL] Failed to sync contact for consignment ${consignment.id}:`, response.status, errorText);
    } else {
      const data = await response.json();
      console.log(`[GHL] Contact synced for consignment ${consignment.id}:`, data.contact?.id || "updated");
    }
  } catch (error) {
    console.error(`[GHL] Network error syncing consignment ${consignment.id}:`, error);
  }
}

async function createGHLContactForVerification(phone: string, firstName: string): Promise<string | null> {
  const { locationId, apiToken } = await getGHLCredentials();
  
  if (!locationId || !apiToken) {
    console.log("[GHL] Not configured, skipping verification contact creation");
    return null;
  }

  try {
    const response = await fetch(`${GHL_API_BASE}/contacts/upsert`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Version": "2021-07-28",
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        firstName: firstName || "Customer",
        phone,
        locationId: locationId,
        tags: ["Phone Verification"],
        source: "Consignment Website - Verification",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[GHL] Failed to create verification contact:`, response.status, errorText);
      return null;
    }

    const data = await response.json();
    return data.contact?.id || null;
  } catch (error) {
    console.error(`[GHL] Network error creating verification contact:`, error);
    return null;
  }
}

type SMSResult = { success: true } | { success: false; error: string; code?: number };
type GHLTestResult = { success: true; locationName?: string } | { success: false; error: string; code?: number };

async function testGHLCredentials(apiToken: string, locationId: string): Promise<GHLTestResult> {
  try {
    const response = await fetch(`${GHL_API_BASE}/locations/${locationId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Version": "2021-07-28",
        "Accept": "application/json",
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log("[GHL] Credentials verified:", data.location?.name || "Connected");
      return { success: true, locationName: data.location?.name };
    }
    
    const errorText = await response.text();
    console.error("[GHL] Credential test failed:", response.status, errorText);
    
    if (response.status === 401) {
      return { success: false, error: "Invalid API Token - please check your token is correct and not expired", code: 401 };
    }
    if (response.status === 403) {
      return { success: false, error: "Access denied - your API token may not have the required permissions", code: 403 };
    }
    if (response.status === 404) {
      return { success: false, error: "Location not found - please verify your Location ID is correct", code: 404 };
    }
    return { success: false, error: `GoHighLevel returned error: ${response.status}`, code: response.status };
  } catch (error) {
    console.error("[GHL] Credential test error:", error);
    return { success: false, error: "Failed to connect to GoHighLevel - network error" };
  }
}

async function sendGHLSMS(contactId: string, message: string): Promise<SMSResult> {
  const { locationId, apiToken } = await getGHLCredentials();
  
  if (!locationId || !apiToken) {
    console.log("[GHL] Not configured, skipping SMS send");
    return { success: false, error: "GoHighLevel is not configured. Please set up your API credentials in Settings → Integrations." };
  }

  try {
    const response = await fetch(`${GHL_API_BASE}/conversations/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Version": "2021-07-28",
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        type: "SMS",
        contactId,
        locationId: locationId,
        message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[GHL] Failed to send SMS:`, response.status, errorText);
      
      if (response.status === 401) {
        return { success: false, error: "Invalid API token. Please check your GoHighLevel credentials in Settings.", code: 401 };
      }
      if (response.status === 403) {
        return { success: false, error: "Access denied. Your API token may not have SMS permissions.", code: 403 };
      }
      if (response.status === 404) {
        return { success: false, error: "Contact or location not found in GoHighLevel.", code: 404 };
      }
      return { success: false, error: `Failed to send SMS (Error ${response.status})`, code: response.status };
    }

    console.log(`[GHL] SMS sent successfully to contact ${contactId}`);
    return { success: true };
  } catch (error) {
    console.error(`[GHL] Network error sending SMS:`, error);
    return { success: false, error: "Network error connecting to GoHighLevel. Please try again." };
  }
}

async function getOrCreateGHLContactByPhone(phone: string, name: string, tag: string = "Owner"): Promise<string | null> {
  const { locationId, apiToken } = await getGHLCredentials();
  
  if (!locationId || !apiToken) {
    console.log("[GHL] Not configured, skipping contact lookup");
    return null;
  }

  try {
    const response = await fetch(`${GHL_API_BASE}/contacts/upsert`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Version": "2021-07-28",
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        phone,
        firstName: name,
        locationId: locationId,
        tags: [tag],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[GHL] Failed to get/create owner contact:`, response.status, errorText);
      return null;
    }

    const data = await response.json();
    return data.contact?.id || null;
  } catch (error) {
    console.error(`[GHL] Network error getting owner contact:`, error);
    return null;
  }
}

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

const SALT_LENGTH = 16;
const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const verifyHash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(verifyHash, "hex"));
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.isAdmin) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

function requireMasterAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.isAdmin || req.session.role !== "master") {
    return res.status(403).json({ error: "Master admin access required" });
  }
  next();
}

async function sendAdminNotificationSMS(message: string): Promise<void> {
  try {
    const settings = await storage.getSiteSettings();
    if (!settings) return;

    const phones = [settings.adminNotifyPhone1, settings.adminNotifyPhone2].filter(Boolean) as string[];
    
    for (const phone of phones) {
      const normalizedPhone = normalizePhoneNumber(phone);
      const contactId = await getOrCreateGHLContactByPhone(normalizedPhone, "Admin", "Admin Notification");
      if (contactId) {
        const result = await sendGHLSMS(contactId, message);
        if (result.success) {
          console.log(`[Notify] Admin SMS sent to ${normalizedPhone}`);
        } else {
          console.error(`[Notify] Failed to send SMS to ${normalizedPhone}:`, result.error);
        }
      }
    }
  } catch (error) {
    console.error("[Notify] Failed to send admin notification:", error);
  }
}

async function sendSellerConfirmationSMS(consignmentData: {
  phone: string;
  firstName: string;
  year: string;
  make: string;
  model: string;
}): Promise<void> {
  try {
    if (!consignmentData.phone) {
      console.log("[Notify] No phone provided, skipping seller SMS");
      return;
    }

    const normalizedPhone = normalizePhoneNumber(consignmentData.phone);
    const digitsOnly = normalizedPhone.replace(/\D/g, "");
    if (!normalizedPhone || normalizedPhone === "+" || digitsOnly.length < 10) {
      console.log("[Notify] Invalid phone number, skipping seller SMS");
      return;
    }

    const settings = await storage.getSiteSettings();
    if (!settings) return;

    const template = settings.sellerConfirmationSms || 
      "Thank you for submitting your {year} {make} {model} to {siteName}! We'll review your submission and contact you within 24 hours.";
    
    const message = template
      .replace(/\{year\}/g, consignmentData.year)
      .replace(/\{make\}/g, consignmentData.make)
      .replace(/\{model\}/g, consignmentData.model)
      .replace(/\{siteName\}/g, settings.siteName || "our dealership")
      .replace(/\{firstName\}/g, consignmentData.firstName);

    const contactId = await getOrCreateGHLContactByPhone(
      normalizedPhone, 
      consignmentData.firstName, 
      "Consignment Seller"
    );
    
    if (contactId) {
      const result = await sendGHLSMS(contactId, message);
      if (result.success) {
        console.log(`[Notify] Seller confirmation SMS sent to ${normalizedPhone}`);
      } else {
        console.error(`[Notify] Failed to send seller SMS to ${normalizedPhone}:`, result.error);
      }
    } else {
      console.error(`[Notify] Could not create/get contact for ${normalizedPhone}`);
    }
  } catch (error) {
    console.error("[Notify] Failed to send seller confirmation:", error);
  }
}

async function sendInquiryConfirmationSMS(inquiryData: {
  phone: string;
  firstName: string;
  year: string | number;
  make: string;
  model: string;
}): Promise<void> {
  try {
    if (!inquiryData.phone) {
      console.log("[Notify] No phone provided, skipping inquiry confirmation SMS");
      return;
    }

    const normalizedPhone = normalizePhoneNumber(inquiryData.phone);
    const digitsOnly = normalizedPhone.replace(/\D/g, "");
    if (!normalizedPhone || normalizedPhone === "+" || digitsOnly.length < 10) {
      console.log("[Notify] Invalid phone number, skipping inquiry confirmation SMS");
      return;
    }

    const settings = await storage.getSiteSettings();
    if (!settings) return;

    const template = settings.inquiryConfirmationSms || 
      "Thank you for your inquiry about the {year} {make} {model}! We'll be in touch soon.";
    
    const message = template
      .replace(/\{year\}/g, String(inquiryData.year))
      .replace(/\{make\}/g, inquiryData.make)
      .replace(/\{model\}/g, inquiryData.model)
      .replace(/\{siteName\}/g, settings.siteName || "our dealership")
      .replace(/\{firstName\}/g, inquiryData.firstName);

    const contactId = await getOrCreateGHLContactByPhone(
      normalizedPhone, 
      inquiryData.firstName, 
      "Buyer Inquiry"
    );
    
    if (contactId) {
      const result = await sendGHLSMS(contactId, message);
      if (result.success) {
        console.log(`[Notify] Inquiry confirmation SMS sent to ${normalizedPhone}`);
      } else {
        console.error(`[Notify] Failed to send inquiry SMS to ${normalizedPhone}:`, result.error);
      }
    } else {
      console.error(`[Notify] Could not create/get contact for ${normalizedPhone}`);
    }
  } catch (error) {
    console.error("[Notify] Failed to send inquiry confirmation:", error);
  }
}

async function sendTradeInConfirmationSMS(tradeInData: {
  phone: string;
  firstName: string;
  year: string;
  make: string;
  model: string;
}): Promise<void> {
  try {
    if (!tradeInData.phone) {
      console.log("[Notify] No phone provided, skipping trade-in confirmation SMS");
      return;
    }

    const normalizedPhone = normalizePhoneNumber(tradeInData.phone);
    const digitsOnly = normalizedPhone.replace(/\D/g, "");
    if (!normalizedPhone || normalizedPhone === "+" || digitsOnly.length < 10) {
      console.log("[Notify] Invalid phone number, skipping trade-in confirmation SMS");
      return;
    }

    const settings = await storage.getSiteSettings();
    if (!settings) return;

    const template = settings.tradeInConfirmationSms || 
      "Thank you for submitting your {year} {make} {model} for trade-in valuation! We'll contact you within 24 hours.";
    
    const message = template
      .replace(/\{year\}/g, tradeInData.year)
      .replace(/\{make\}/g, tradeInData.make)
      .replace(/\{model\}/g, tradeInData.model)
      .replace(/\{siteName\}/g, settings.siteName || "our dealership")
      .replace(/\{firstName\}/g, tradeInData.firstName);

    const contactId = await getOrCreateGHLContactByPhone(
      normalizedPhone, 
      tradeInData.firstName, 
      "Trade-In Request"
    );
    
    if (contactId) {
      const result = await sendGHLSMS(contactId, message);
      if (result.success) {
        console.log(`[Notify] Trade-in confirmation SMS sent to ${normalizedPhone}`);
      } else {
        console.error(`[Notify] Failed to send trade-in SMS to ${normalizedPhone}:`, result.error);
      }
    } else {
      console.error(`[Notify] Could not create/get contact for ${normalizedPhone}`);
    }
  } catch (error) {
    console.error("[Notify] Failed to send trade-in confirmation:", error);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Set up WebSocket server for real-time updates
  wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('[WS] Client connected');
    
    ws.on('close', () => {
      console.log('[WS] Client disconnected');
    });
    
    ws.on('error', (error) => {
      console.error('[WS] Error:', error);
    });
  });
  
  console.log('[WS] WebSocket server initialized on /ws');
  
  registerObjectStorageRoutes(app);

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user || !verifyPassword(password, user.password)) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      if (!user.isAdmin) {
        return res.status(403).json({ error: "Access denied" });
      }

      req.session.userId = user.id;
      req.session.isAdmin = user.isAdmin || false;
      req.session.role = user.role || "admin";

      res.json({ user: { id: user.id, username: user.username, isAdmin: user.isAdmin, role: user.role || "admin" } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/session", (req, res) => {
    if (req.session.userId && req.session.isAdmin) {
      res.json({ authenticated: true, isAdmin: req.session.isAdmin, role: req.session.role || "admin", userId: req.session.userId });
    } else {
      res.json({ authenticated: false });
    }
  });

  // User management endpoints (Master Admin only)
  app.get("/api/users", requireMasterAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const safeUsers = users.map(u => ({
        id: u.id,
        username: u.username,
        role: u.role || "admin",
        isAdmin: u.isAdmin,
        createdAt: u.createdAt
      }));
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireMasterAdmin, async (req, res) => {
    try {
      const { username, password, role } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      if (role && !["master", "admin"].includes(role)) {
        return res.status(400).json({ error: "Invalid role. Must be 'master' or 'admin'" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ error: "Username already exists" });
      }

      const hashedPassword = hashPassword(password);
      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        isAdmin: true,
        role: role || "admin"
      });

      res.json({
        id: newUser.id,
        username: newUser.username,
        role: newUser.role || "admin",
        isAdmin: newUser.isAdmin,
        createdAt: newUser.createdAt
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.delete("/api/users/:id", requireMasterAdmin, async (req, res) => {
    try {
      const { id } = req.params;

      if (id === req.session.userId) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.role === "master") {
        const masterCount = await storage.countMasterAdmins();
        if (masterCount <= 1) {
          return res.status(400).json({ error: "Cannot delete the last master admin" });
        }
      }

      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete user" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.patch("/api/users/:id/role", requireMasterAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role || !["master", "admin"].includes(role)) {
        return res.status(400).json({ error: "Invalid role. Must be 'master' or 'admin'" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.role === "master" && role === "admin") {
        const masterCount = await storage.countMasterAdmins();
        if (masterCount <= 1) {
          return res.status(400).json({ error: "Cannot demote the last master admin" });
        }
      }

      const updatedUser = await storage.updateUserRole(id, role);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role || "admin",
        isAdmin: updatedUser.isAdmin,
        createdAt: updatedUser.createdAt
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  app.patch("/api/users/:id/password", requireMasterAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { password } = req.body;

      if (!password || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const hashedPassword = hashPassword(password);
      const updatedUser = await storage.updateUserPassword(id, hashedPassword);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ success: true, message: `Password updated for ${user.username}` });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // Temporary secured endpoint to create/reset admin in production (POST version for CDN bypass)
  app.post("/api/create-admin-now", async (req, res) => {
    const secretKey = req.body?.key || req.query.key;
    if (secretKey !== "SETUP-PRESTIGE-2024-SECURE") {
      return res.status(403).json({ error: "Unauthorized - invalid key" });
    }
    try {
      console.log("[admin-setup] POST: Checking for existing admin...");
      const hashedPassword = "d7da12f7f0b51ba5ab3e7bb2617161d7:a5d33d043a5bfc73921e861303f31e6a9a6909740dc0368989809ddec3b64526e3f4cab9bd1569dd166d2f4043dc441645c821b0e1582b6547a0ebebeed9e00d";
      const existingAdmin = await storage.getUserByUsername("Josh");
      if (existingAdmin) {
        console.log("[admin-setup] Admin exists, resetting password...");
        await storage.updateUserPassword(existingAdmin.id, hashedPassword);
        return res.json({ success: true, message: "Admin password reset! Login with username 'Josh' and password 'Sunshine2024!'" });
      }
      console.log("[admin-setup] Creating new admin...");
      await storage.createUser({
        username: "Josh",
        password: hashedPassword,
        isAdmin: true,
      });
      console.log("[admin-setup] Admin created successfully");
      res.json({ success: true, message: "Admin user 'Josh' created successfully! You can now login with username 'Josh' and password 'Sunshine2024!'" });
    } catch (error: any) {
      console.error("[admin-setup] Error creating admin:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error creating admin user", 
        error: error?.message || "Unknown error"
      });
    }
  });

  // Temporary secured endpoint to create admin in production (GET version)
  app.get("/api/create-admin-now", async (req, res) => {
    const secretKey = req.query.key;
    if (secretKey !== "SETUP-PRESTIGE-2024-SECURE") {
      return res.status(403).json({ error: "Unauthorized - invalid key" });
    }
    try {
      console.log("[admin-setup] Checking for existing admin...");
      const existingAdmin = await storage.getUserByUsername("Josh");
      if (existingAdmin) {
        console.log("[admin-setup] Admin already exists");
        return res.json({ success: true, message: "Admin user 'Josh' already exists. You can login now!" });
      }
      console.log("[admin-setup] Creating new admin...");
      const hashedPassword = "d7da12f7f0b51ba5ab3e7bb2617161d7:a5d33d043a5bfc73921e861303f31e6a9a6909740dc0368989809ddec3b64526e3f4cab9bd1569dd166d2f4043dc441645c821b0e1582b6547a0ebebeed9e00d";
      await storage.createUser({
        username: "Josh",
        password: hashedPassword,
        isAdmin: true,
      });
      console.log("[admin-setup] Admin created successfully");
      res.json({ success: true, message: "Admin user 'Josh' created successfully! You can now login with username 'Josh' and password 'Sunshine2024!'" });
    } catch (error: any) {
      console.error("[admin-setup] Error creating admin:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error creating admin user", 
        error: error?.message || "Unknown error",
        hint: "Database might not be connected or users table doesn't exist"
      });
    }
  });

  app.post("/api/auth/setup", async (req, res) => {
    try {
      const existingAdmin = await storage.getUserByUsername("admin");
      if (existingAdmin) {
        return res.status(400).json({ error: "Admin account already exists" });
      }

      const { password } = req.body;
      if (!password || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }
      if (!/[A-Z]/.test(password)) {
        return res.status(400).json({ error: "Password must contain at least one uppercase letter" });
      }
      if (!/[a-z]/.test(password)) {
        return res.status(400).json({ error: "Password must contain at least one lowercase letter" });
      }
      if (!/[0-9]/.test(password)) {
        return res.status(400).json({ error: "Password must contain at least one number" });
      }

      const user = await storage.createUser({
        username: "admin",
        password: hashPassword(password),
      });

      await storage.setUserAdmin(user.id, true);

      res.json({ success: true, message: "Admin account created" });
    } catch (error) {
      console.error("Setup error:", error);
      res.status(500).json({ error: "Failed to create admin account" });
    }
  });

  app.get("/api/auth/has-admin", async (req, res) => {
    try {
      const admin = await storage.getUserByUsername("admin");
      res.json({ hasAdmin: !!admin });
    } catch (error) {
      res.json({ hasAdmin: false });
    }
  });

  app.post("/api/verify/send", async (req, res) => {
    try {
      const { phone, firstName } = req.body;
      if (!phone || phone.replace(/\D/g, "").length < 10) {
        return res.status(400).json({ error: "Valid phone number required" });
      }

      const normalizedPhone = normalizePhoneNumber(phone);
      const contactId = await createGHLContactForVerification(normalizedPhone, firstName || "Customer");
      if (!contactId) {
        return res.status(500).json({ error: "Unable to send verification code. Please try again." });
      }

      const code = generateVerificationCode();
      await storage.createPhoneVerification(normalizedPhone, code, contactId);

      const smsResult = await sendGHLSMS(contactId, `Your verification code is: ${code}. This code expires in 10 minutes.`);
      if (!smsResult.success) {
        return res.status(500).json({ error: smsResult.error || "Failed to send verification SMS. Please try again." });
      }

      res.json({ success: true, message: "Verification code sent" });
    } catch (error) {
      console.error("Error sending verification code:", error);
      res.status(500).json({ error: "Failed to send verification code" });
    }
  });

  app.post("/api/verify/check", async (req, res) => {
    try {
      const { phone, code } = req.body;
      if (!phone || !code) {
        return res.status(400).json({ error: "Phone and code are required" });
      }

      const normalizedPhone = normalizePhoneNumber(phone);
      const verification = await storage.getValidPhoneVerification(normalizedPhone, code);
      if (!verification) {
        return res.status(400).json({ error: "Invalid or expired verification code" });
      }

      await storage.markPhoneVerified(verification.id);
      res.json({ success: true, verified: true });
    } catch (error) {
      console.error("Error verifying code:", error);
      res.status(500).json({ error: "Failed to verify code" });
    }
  });

  // Rate limiting for seller code requests (in-memory, resets on server restart)
  const sellerCodeRateLimit = new Map<string, { count: number; resetAt: number }>();
  const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
  const RATE_LIMIT_MAX = 3; // Max 3 requests per window

  // Seller Portal Authentication Routes
  app.post("/api/seller/send-code", async (req, res) => {
    try {
      const { phone } = req.body;
      if (!phone || phone.replace(/\D/g, "").length < 10) {
        return res.status(400).json({ error: "Valid phone number required" });
      }

      const normalizedPhone = normalizePhoneNumber(phone);
      
      // Check rate limit
      const now = Date.now();
      const rateEntry = sellerCodeRateLimit.get(normalizedPhone);
      if (rateEntry) {
        if (now < rateEntry.resetAt) {
          if (rateEntry.count >= RATE_LIMIT_MAX) {
            const waitMinutes = Math.ceil((rateEntry.resetAt - now) / 60000);
            return res.status(429).json({ 
              error: `Too many code requests. Please wait ${waitMinutes} minute${waitMinutes > 1 ? 's' : ''} before trying again.` 
            });
          }
          rateEntry.count++;
        } else {
          sellerCodeRateLimit.set(normalizedPhone, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
        }
      } else {
        sellerCodeRateLimit.set(normalizedPhone, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
      }
      
      // Check if this phone has any consignments - use generic error to prevent enumeration
      const consignments = await storage.getConsignmentsByPhone(normalizedPhone);
      if (consignments.length === 0) {
        // Generic message to prevent phone enumeration attacks
        return res.status(400).json({ error: "Unable to verify phone number. If you have submitted a vehicle, please ensure you're using the same phone number." });
      }

      const contactId = await createGHLContactForVerification(normalizedPhone, consignments[0].firstName);
      if (!contactId) {
        return res.status(500).json({ error: "Unable to send verification code. Please try again." });
      }

      const code = generateVerificationCode();
      await storage.createPhoneVerification(normalizedPhone, code, contactId);

      const smsResult = await sendGHLSMS(contactId, `Your seller portal login code is: ${code}. This code expires in 10 minutes.`);
      if (!smsResult.success) {
        return res.status(500).json({ error: smsResult.error || "Failed to send verification SMS. Please try again." });
      }

      res.json({ success: true, message: "Verification code sent" });
    } catch (error) {
      console.error("Error sending seller verification code:", error);
      res.status(500).json({ error: "Failed to send verification code" });
    }
  });

  app.post("/api/seller/verify", async (req, res) => {
    try {
      const { phone, code } = req.body;
      if (!phone || !code) {
        return res.status(400).json({ error: "Phone and code are required" });
      }

      const normalizedPhone = normalizePhoneNumber(phone);
      const verification = await storage.getValidPhoneVerification(normalizedPhone, code);
      if (!verification) {
        return res.status(400).json({ error: "Invalid or expired verification code" });
      }

      await storage.markPhoneVerified(verification.id);
      
      // Regenerate session to prevent session fixation attacks
      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration failed:", err);
          return res.status(500).json({ error: "Authentication failed. Please try again." });
        }
        
        // Set seller session after regeneration
        req.session.sellerPhone = normalizedPhone;
        req.session.isSeller = true;
        
        res.json({ success: true, verified: true });
      });
    } catch (error) {
      console.error("Error verifying seller code:", error);
      res.status(500).json({ error: "Failed to verify code" });
    }
  });

  app.get("/api/seller/session", (req, res) => {
    if (req.session.sellerPhone && req.session.isSeller) {
      res.json({ authenticated: true, phone: req.session.sellerPhone });
    } else {
      res.json({ authenticated: false });
    }
  });

  app.post("/api/seller/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/seller/consignments", async (req, res) => {
    try {
      if (!req.session.sellerPhone || !req.session.isSeller) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const consignments = await storage.getConsignmentsByPhone(req.session.sellerPhone);
      res.json(consignments);
    } catch (error) {
      console.error("Error fetching seller consignments:", error);
      res.status(500).json({ error: "Failed to fetch consignments" });
    }
  });

  app.get("/api/seller/consignments/:id/history", async (req, res) => {
    try {
      if (!req.session.sellerPhone || !req.session.isSeller) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const consignment = await storage.getConsignment(req.params.id);
      if (!consignment || consignment.phone !== req.session.sellerPhone) {
        return res.status(404).json({ error: "Consignment not found" });
      }

      const history = await storage.getStatusHistory(req.params.id);
      res.json(history);
    } catch (error) {
      console.error("Error fetching seller consignment history:", error);
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  app.get("/api/seller/consignments/:id/notes", async (req, res) => {
    try {
      if (!req.session.sellerPhone || !req.session.isSeller) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const consignment = await storage.getConsignment(req.params.id);
      if (!consignment || consignment.phone !== req.session.sellerPhone) {
        return res.status(404).json({ error: "Consignment not found" });
      }

      const notes = await storage.getSellerNotes(req.params.id);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching seller notes:", error);
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  app.get("/api/seller/consignments/:id/documents", async (req, res) => {
    try {
      if (!req.session.sellerPhone || !req.session.isSeller) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const consignment = await storage.getConsignment(req.params.id);
      if (!consignment || consignment.phone !== req.session.sellerPhone) {
        return res.status(404).json({ error: "Consignment not found" });
      }

      const documents = await storage.getSellerDocuments(req.params.id);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching seller documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.post("/api/seller/consignments/:id/documents", async (req, res) => {
    try {
      if (!req.session.sellerPhone || !req.session.isSeller) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const consignment = await storage.getConsignment(req.params.id);
      if (!consignment || consignment.phone !== req.session.sellerPhone) {
        return res.status(404).json({ error: "Consignment not found" });
      }

      const { documentType, fileName, fileUrl } = req.body;
      if (!documentType || !fileName || !fileUrl) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const document = await storage.createSellerDocument({
        consignmentId: req.params.id,
        documentType,
        fileName,
        fileUrl,
      });
      res.status(201).json(document);
    } catch (error) {
      console.error("Error creating seller document:", error);
      res.status(500).json({ error: "Failed to create document" });
    }
  });

  app.get("/api/seller/consignments/:id/payout", async (req, res) => {
    try {
      if (!req.session.sellerPhone || !req.session.isSeller) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const consignment = await storage.getConsignment(req.params.id);
      if (!consignment || consignment.phone !== req.session.sellerPhone) {
        return res.status(404).json({ error: "Consignment not found" });
      }

      const settings = await storage.getSiteSettings();
      const globalCommissionRate = settings?.commissionRate || 10;
      const globalAvgDaysToFirstInquiry = settings?.avgDaysToFirstInquiry || 5;
      const globalAvgDaysToSell = settings?.avgDaysToSell || 45;

      const effectiveCommissionRate = consignment.overrideCommissionRate ?? globalCommissionRate;
      const effectiveAvgDaysToFirstInquiry = consignment.overrideAvgDaysToFirstInquiry ?? globalAvgDaysToFirstInquiry;
      const effectiveAvgDaysToSell = consignment.overrideAvgDaysToSell ?? globalAvgDaysToSell;

      const cars = await storage.getAllInventoryCars();
      const car = cars.find(c => c.consignmentId === req.params.id);
      
      if (!car) {
        return res.json({ 
          status: consignment.status,
          hasListing: false,
          message: "Vehicle not yet listed",
          avgDaysToFirstInquiry: effectiveAvgDaysToFirstInquiry,
          avgDaysToSell: effectiveAvgDaysToSell,
        });
      }

      const listingPrice = car.price;
      let payout: number;
      let isCustomPayout = false;
      
      if (consignment.customPayoutAmount !== null && consignment.customPayoutAmount !== undefined) {
        payout = consignment.customPayoutAmount;
        isCustomPayout = true;
      } else {
        const commission = Math.round(listingPrice * (effectiveCommissionRate / 100));
        payout = listingPrice - commission;
      }

      res.json({
        status: consignment.status,
        hasListing: true,
        listingPrice,
        commissionRate: effectiveCommissionRate,
        estimatedPayout: payout,
        isCustomPayout,
        avgDaysToFirstInquiry: effectiveAvgDaysToFirstInquiry,
        avgDaysToSell: effectiveAvgDaysToSell,
        hasOverrides: consignment.overrideCommissionRate !== null || 
                     consignment.overrideAvgDaysToFirstInquiry !== null || 
                     consignment.overrideAvgDaysToSell !== null,
      });
    } catch (error) {
      console.error("Error fetching payout info:", error);
      res.status(500).json({ error: "Failed to fetch payout info" });
    }
  });

  app.post("/api/consignments/:id/notes", requireAdmin, async (req, res) => {
    try {
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }

      const note = await storage.createSellerNote({
        consignmentId: req.params.id,
        content,
        createdBy: req.session.userId || null,
      });
      res.status(201).json(note);
    } catch (error) {
      console.error("Error creating seller note:", error);
      res.status(500).json({ error: "Failed to create note" });
    }
  });

  app.get("/api/consignments/:id/notes", requireAdmin, async (req, res) => {
    try {
      const notes = await storage.getSellerNotes(req.params.id);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching seller notes:", error);
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  app.get("/api/consignments/:id/documents", requireAdmin, async (req, res) => {
    try {
      const documents = await storage.getSellerDocuments(req.params.id);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching seller documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.patch("/api/documents/:id/status", requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status || !["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const updated = await storage.updateDocumentStatus(req.params.id, status);
      if (!updated) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating document status:", error);
      res.status(500).json({ error: "Failed to update document status" });
    }
  });

  app.patch("/api/consignments/:id/overrides", requireAdmin, async (req, res) => {
    try {
      const { 
        customPayoutAmount, 
        overrideCommissionRate, 
        overrideAvgDaysToFirstInquiry, 
        overrideAvgDaysToSell 
      } = req.body;
      
      const overrides: {
        customPayoutAmount?: number | null;
        overrideCommissionRate?: number | null;
        overrideAvgDaysToFirstInquiry?: number | null;
        overrideAvgDaysToSell?: number | null;
      } = {};
      
      if (customPayoutAmount !== undefined) {
        overrides.customPayoutAmount = customPayoutAmount === null ? null : parseInt(customPayoutAmount);
      }
      if (overrideCommissionRate !== undefined) {
        overrides.overrideCommissionRate = overrideCommissionRate === null ? null : parseInt(overrideCommissionRate);
      }
      if (overrideAvgDaysToFirstInquiry !== undefined) {
        overrides.overrideAvgDaysToFirstInquiry = overrideAvgDaysToFirstInquiry === null ? null : parseInt(overrideAvgDaysToFirstInquiry);
      }
      if (overrideAvgDaysToSell !== undefined) {
        overrides.overrideAvgDaysToSell = overrideAvgDaysToSell === null ? null : parseInt(overrideAvgDaysToSell);
      }
      
      const updated = await storage.updateConsignmentOverrides(req.params.id, overrides);
      if (!updated) {
        return res.status(404).json({ error: "Consignment not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating overrides:", error);
      res.status(500).json({ error: "Failed to update overrides" });
    }
  });

  app.post("/api/consignments", async (req, res) => {
    try {
      const validatedData = insertConsignmentSchema.parse(req.body);
      
      const normalizedPhone = normalizePhoneNumber(validatedData.phone);
      const isVerified = await storage.isPhoneVerified(normalizedPhone);
      if (!isVerified) {
        return res.status(400).json({ error: "Phone number must be verified before submitting" });
      }
      
      if (!validatedData.ownershipConfirmed) {
        return res.status(400).json({ error: "You must confirm vehicle ownership" });
      }
      if (!validatedData.agreementAccepted) {
        return res.status(400).json({ error: "You must accept the consignment agreement" });
      }
      if (!validatedData.termsAccepted) {
        return res.status(400).json({ error: "You must accept the terms and privacy policy" });
      }
      
      const submission = await storage.createConsignment({
        ...validatedData,
        phone: normalizedPhone,
        agreementTimestamp: new Date(),
      });
      
      await storage.createStatusHistory(submission.id, "pending", "Vehicle submitted for consignment review");
      
      createGHLContact({ ...validatedData, id: submission.id }).catch((err) => {
        console.error("Background GHL sync failed:", err);
      });
      
      // Send admin notification SMS
      const notifyMessage = `New Consignment Submitted!\n\nVehicle: ${validatedData.year} ${validatedData.make} ${validatedData.model}\nOwner: ${validatedData.firstName} ${validatedData.lastName}\nPhone: ${validatedData.phone}\n\nLogin to review and approve.`;
      sendAdminNotificationSMS(notifyMessage).catch((err) => {
        console.error("Admin notification SMS failed:", err);
      });
      
      // Send seller confirmation SMS
      sendSellerConfirmationSMS(validatedData).catch((err) => {
        console.error("Seller confirmation SMS failed:", err);
      });
      
      res.status(201).json(submission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating consignment:", error);
      res.status(500).json({ error: "Failed to create consignment" });
    }
  });

  app.get("/api/consignments", async (req, res) => {
    try {
      const submissions = await storage.getAllConsignments();
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching consignments:", error);
      res.status(500).json({ error: "Failed to fetch consignments" });
    }
  });

  app.get("/api/consignments/:id", async (req, res) => {
    try {
      const submission = await storage.getConsignment(req.params.id);
      if (!submission) {
        return res.status(404).json({ error: "Consignment not found" });
      }
      res.json(submission);
    } catch (error) {
      console.error("Error fetching consignment:", error);
      res.status(500).json({ error: "Failed to fetch consignment" });
    }
  });

  app.patch("/api/consignments/:id/status", requireAdmin, async (req, res) => {
    try {
      const { status, note } = req.body;
      if (!status || !["pending", "approved", "rejected", "listed", "sold"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const updated = await storage.updateConsignmentStatus(req.params.id, status);
      if (!updated) {
        return res.status(404).json({ error: "Consignment not found" });
      }
      
      await storage.createStatusHistory(req.params.id, status, note);
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating consignment status:", error);
      res.status(500).json({ error: "Failed to update consignment status" });
    }
  });

  app.get("/api/consignments/:id/history", requireAdmin, async (req, res) => {
    try {
      const history = await storage.getStatusHistory(req.params.id);
      res.json(history);
    } catch (error) {
      console.error("Error fetching status history:", error);
      res.status(500).json({ error: "Failed to fetch status history" });
    }
  });

  app.patch("/api/consignments/:id/photos", async (req, res) => {
    try {
      const { photos } = req.body;
      if (!Array.isArray(photos)) {
        return res.status(400).json({ error: "Photos must be an array" });
      }
      const updated = await storage.updateConsignmentPhotos(req.params.id, photos);
      if (!updated) {
        return res.status(404).json({ error: "Consignment not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating consignment photos:", error);
      res.status(500).json({ error: "Failed to update consignment photos" });
    }
  });

  app.get("/api/inventory", async (req, res) => {
    try {
      const { featured, includeMetrics } = req.query;
      
      if (featured === "true") {
        const cars = await storage.getFeaturedInventoryCars();
        res.json(cars);
      } else {
        // Get available cars (and pending for "Sale Pending" badge)
        const allCars = await storage.getAllInventoryCars();
        const publicCars = allCars.filter(c => c.status === "available" || c.status === "pending");
        
        if (includeMetrics === "true") {
          const inquiryCounts = await storage.getInquiryCountsPerVehicle();
          const carsWithMetrics = publicCars.map(car => ({
            ...car,
            inquiryCount: inquiryCounts[car.id] || 0,
          }));
          res.json(carsWithMetrics);
        } else {
          res.json(publicCars);
        }
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });

  app.get("/api/inventory/sold", async (req, res) => {
    try {
      const cars = await storage.getSoldInventoryCars();
      res.json(cars);
    } catch (error) {
      console.error("Error fetching sold vehicles:", error);
      res.status(500).json({ error: "Failed to fetch sold vehicles" });
    }
  });

  app.get("/api/vin-decode/:vin", async (req, res) => {
    try {
      const { vin } = req.params;
      if (!vin || vin.length !== 17) {
        return res.status(400).json({ error: "VIN must be exactly 17 characters", valid: false });
      }
      
      // Test VIN for development/testing purposes
      if (vin === "12345678901234567") {
        return res.json({
          valid: true,
          ModelYear: "2025",
          Make: "Toyota",
          Model: "Camry",
          VehicleType: "PASSENGER CAR",
          ExteriorColor: "White"
        });
      }
      
      const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/i;
      if (!vinRegex.test(vin)) {
        return res.status(400).json({ error: "VIN contains invalid characters", valid: false });
      }
      
      const nhtsaUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`;
      const response = await fetch(nhtsaUrl);
      
      if (!response.ok) {
        throw new Error("NHTSA API request failed");
      }
      
      const data = await response.json();
      
      if (data.Results && data.Results.length > 0) {
        const result = data.Results[0];
        
        const errorCode = result.ErrorCode || "";
        const hasSignificantErrors = errorCode.split(",").some((code: string) => {
          const trimmed = code.trim();
          return trimmed !== "0" && trimmed !== "6" && trimmed !== "";
        });
        
        const vehicleType = (result.VehicleType || "").toLowerCase();
        const isPassengerVehicle = vehicleType.includes("passenger") || 
                                    vehicleType.includes("multipurpose") ||
                                    vehicleType.includes("truck") ||
                                    vehicleType === "";
        
        const hasValidMake = result.Make && result.Make.trim() !== "";
        const hasValidModel = result.Model && result.Model.trim() !== "";
        const hasValidYear = result.ModelYear && !isNaN(parseInt(result.ModelYear));
        
        if (hasSignificantErrors || !hasValidMake || !hasValidYear) {
          return res.status(400).json({ 
            error: "VIN not recognized as a valid vehicle", 
            valid: false,
            errorText: result.ErrorText || "Unable to decode VIN"
          });
        }
        
        if (!isPassengerVehicle) {
          return res.status(400).json({ 
            error: "VIN is not for a passenger vehicle", 
            valid: false,
            vehicleType: result.VehicleType
          });
        }
        
        res.json({ ...result, valid: true });
      } else {
        res.status(400).json({ error: "No results found for this VIN", valid: false });
      }
    } catch (error) {
      console.error("Error decoding VIN:", error);
      res.status(500).json({ error: "Failed to decode VIN", valid: false });
    }
  });

  app.get("/api/vehicle-makes", async (req, res) => {
    try {
      const nhtsaUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/passenger%20car?format=json`;
      const response = await fetch(nhtsaUrl);
      
      if (!response.ok) {
        throw new Error("NHTSA API request failed");
      }
      
      const data = await response.json();
      res.json(data.Results || []);
    } catch (error) {
      console.error("Error fetching vehicle makes:", error);
      res.status(500).json({ error: "Failed to fetch vehicle makes" });
    }
  });

  app.get("/api/vehicle-models/:make/:year", async (req, res) => {
    try {
      const { make, year } = req.params;
      const nhtsaUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`;
      const response = await fetch(nhtsaUrl);
      
      if (!response.ok) {
        throw new Error("NHTSA API request failed");
      }
      
      const data = await response.json();
      res.json(data.Results || []);
    } catch (error) {
      console.error("Error fetching vehicle models:", error);
      res.status(500).json({ error: "Failed to fetch vehicle models" });
    }
  });

  app.post("/api/vehicle-inquiry", async (req, res) => {
    try {
      const inquirySchema = z.object({
        vehicleId: z.string(),
        vin: z.string(),
        year: z.number(),
        make: z.string(),
        model: z.string(),
        buyerName: z.string().min(1, "Name is required"),
        buyerPhone: z.string().min(10, "Phone is required"),
        buyerEmail: z.string().email("Valid email is required"),
        message: z.string().optional(),
        interestType: z.string().min(1, "Interest type is required"),
        buyTimeline: z.string().optional(),
        hasTradeIn: z.boolean().optional(),
        financingPreference: z.string().optional(),
        contactPreference: z.string().optional(),
        bestTimeToContact: z.string().optional(),
      });

      const data = inquirySchema.parse(req.body);

      // Save inquiry to database
      const inquiry = await storage.createBuyerInquiry({
        inventoryCarId: data.vehicleId,
        buyerName: data.buyerName,
        buyerPhone: data.buyerPhone,
        buyerEmail: data.buyerEmail,
        message: data.message || null,
        interestType: data.interestType,
        buyTimeline: data.buyTimeline || null,
        hasTradeIn: data.hasTradeIn ?? null,
        financingPreference: data.financingPreference || null,
        contactPreference: data.contactPreference || null,
        bestTimeToContact: data.bestTimeToContact || null,
      });

      console.log(`[Inquiry] Saved inquiry ${inquiry.id} for vehicle ${data.vehicleId}`);

      const settings = await storage.getSiteSettings();
      
      // Build detailed SMS message with new fields
      const interestLabels: Record<string, string> = {
        test_drive: "Schedule Test Drive",
        financing: "Financing Info",
        make_offer: "Make an Offer",
        more_photos: "Request More Photos/Video",
        question: "Ask a Question",
      };
      
      const timelineLabels: Record<string, string> = {
        this_week: "This Week",
        this_month: "This Month",
        just_browsing: "Just Browsing",
      };
      
      const financingLabels: Record<string, string> = {
        cash: "Cash",
        finance: "Finance",
        undecided: "Undecided",
      };
      
      const contactLabels: Record<string, string> = {
        call: "Call",
        text: "Text",
        email: "Email",
      };
      
      const timeLabels: Record<string, string> = {
        morning: "Morning",
        afternoon: "Afternoon",
        evening: "Evening",
      };

      let smsMessage = `New Vehicle Inquiry!\n\nVehicle: ${data.year} ${data.make} ${data.model}\nVIN: ${data.vin}\n\nInterest: ${interestLabels[data.interestType] || data.interestType}\n\nBuyer Info:\nName: ${data.buyerName}\nPhone: ${data.buyerPhone}\nEmail: ${data.buyerEmail}`;
      
      if (data.buyTimeline) {
        smsMessage += `\n\nBuying Timeline: ${timelineLabels[data.buyTimeline] || data.buyTimeline}`;
      }
      if (data.hasTradeIn !== undefined) {
        smsMessage += `\nHas Trade-In: ${data.hasTradeIn ? "Yes" : "No"}`;
      }
      if (data.financingPreference) {
        smsMessage += `\nFinancing: ${financingLabels[data.financingPreference] || data.financingPreference}`;
      }
      if (data.contactPreference) {
        smsMessage += `\n\nPreferred Contact: ${contactLabels[data.contactPreference] || data.contactPreference}`;
      }
      if (data.bestTimeToContact) {
        smsMessage += `\nBest Time: ${timeLabels[data.bestTimeToContact] || data.bestTimeToContact}`;
      }
      if (data.message) {
        smsMessage += `\n\nMessage: ${data.message}`;
      }

      // Send notification to admin phones only (avoids duplicate if contactPhone matches admin phone)
      sendAdminNotificationSMS(smsMessage).catch((err) => {
        console.error("Admin notification SMS failed:", err);
      });

      // Send confirmation SMS to buyer
      const firstName = data.buyerName.split(" ")[0];
      sendInquiryConfirmationSMS({
        phone: data.buyerPhone,
        firstName,
        year: data.year,
        make: data.make,
        model: data.model,
      }).catch((err) => {
        console.error("Inquiry confirmation SMS failed:", err);
      });
      
      res.json({ success: true, message: "Your inquiry has been sent! We'll be in touch soon." });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error sending vehicle inquiry:", error);
      res.status(500).json({ error: "Failed to send inquiry" });
    }
  });

  // Get all buyer inquiries (admin only)
  app.get("/api/inquiries", requireAdmin, async (req, res) => {
    try {
      const inquiries = await storage.getAllBuyerInquiries();
      res.json(inquiries);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      res.status(500).json({ error: "Failed to fetch inquiries" });
    }
  });

  // Get inquiry count for a specific vehicle (public - returns only count for badges)
  app.get("/api/inquiries/vehicle/:vehicleId", async (req, res) => {
    try {
      const inquiries = await storage.getInquiriesForCar(req.params.vehicleId);
      // Return only IDs for privacy, frontend just needs the count
      res.json(inquiries.map(i => ({ id: i.id })));
    } catch (error) {
      console.error("Error fetching vehicle inquiries:", error);
      res.status(500).json({ error: "Failed to fetch inquiries" });
    }
  });

  // Update inquiry status (admin only)
  app.patch("/api/inquiries/:id/status", requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status || !["new", "contacted", "qualified", "closed"].includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be: new, contacted, qualified, or closed" });
      }
      const updated = await storage.updateBuyerInquiryStatus(req.params.id, status);
      if (!updated) {
        return res.status(404).json({ error: "Inquiry not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating inquiry status:", error);
      res.status(500).json({ error: "Failed to update inquiry status" });
    }
  });

  // Trade-in value submission
  const tradeInSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(10),
    year: z.string().min(4),
    make: z.string().min(1),
    model: z.string().min(1),
    mileage: z.string().min(1),
    condition: z.enum(["excellent", "good", "fair", "poor"]),
    vin: z.string().optional(),
    payoffAmount: z.string().optional(),
    additionalInfo: z.string().optional(),
  });

  app.post("/api/trade-in", async (req, res) => {
    try {
      const data = tradeInSchema.parse(req.body);
      const { locationId, apiToken } = await getGHLCredentials();

      if (locationId && apiToken) {
        // Create contact in GoHighLevel
        const response = await fetch(`${GHL_API_BASE}/contacts/upsert`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiToken}`,
            "Version": "2021-07-28",
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            locationId: locationId,
            tags: ["Trade-In Lead", `${data.year} ${data.make} ${data.model}`],
            source: "Website - Trade-In Form",
            customFields: [
              { key: "trade_in_year", value: data.year },
              { key: "trade_in_make", value: data.make },
              { key: "trade_in_model", value: data.model },
              { key: "trade_in_mileage", value: data.mileage },
              { key: "trade_in_condition", value: data.condition },
              { key: "trade_in_vin", value: data.vin || "Not provided" },
              { key: "trade_in_payoff", value: data.payoffAmount || "None" },
            ],
          }),
        });

        if (!response.ok) {
          console.error("[GHL] Failed to create trade-in contact:", await response.text());
        } else {
          console.log("[GHL] Trade-in contact created successfully");
        }

        // Send admin SMS notification
        const smsMessage = `NEW TRADE-IN REQUEST\n\nVehicle: ${data.year} ${data.make} ${data.model}\nCondition: ${data.condition}\nMileage: ${data.mileage}\n\nCustomer: ${data.firstName} ${data.lastName}\nPhone: ${data.phone}\nEmail: ${data.email}`;
        sendAdminNotificationSMS(smsMessage).catch((err) => {
          console.error("Admin notification SMS failed:", err);
        });

        // Send confirmation SMS to customer
        sendTradeInConfirmationSMS({
          phone: data.phone,
          firstName: data.firstName,
          year: data.year,
          make: data.make,
          model: data.model,
        }).catch((err) => {
          console.error("Trade-in confirmation SMS failed:", err);
        });
      }

      res.json({ success: true, message: "Trade-in request submitted successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error submitting trade-in:", error);
      res.status(500).json({ error: "Failed to submit trade-in request" });
    }
  });

  // Appointment booking
  const appointmentSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(10),
    appointmentType: z.enum(["test_drive", "showroom_visit", "inspection"]),
    vehicleId: z.string().optional(),
    preferredDate: z.string().min(1),
    preferredTime: z.string().min(1),
    alternateDate: z.string().optional(),
    alternateTime: z.string().optional(),
    notes: z.string().optional(),
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      const data = appointmentSchema.parse(req.body);
      const { locationId, apiToken } = await getGHLCredentials();

      // Get vehicle details if provided
      let vehicleInfo = "";
      if (data.vehicleId) {
        const car = await storage.getInventoryCar(data.vehicleId);
        if (car) {
          vehicleInfo = `${car.year} ${car.make} ${car.model}`;
        }
      }

      const appointmentTypeLabel = data.appointmentType === "test_drive" 
        ? "Test Drive" 
        : data.appointmentType === "showroom_visit" 
          ? "Showroom Visit" 
          : "Vehicle Inspection";

      if (locationId && apiToken) {
        // Create contact in GoHighLevel
        const response = await fetch(`${GHL_API_BASE}/contacts/upsert`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiToken}`,
            "Version": "2021-07-28",
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            locationId: locationId,
            tags: ["Appointment Request", appointmentTypeLabel, vehicleInfo].filter(Boolean),
            source: "Website - Appointment Booking",
          }),
        });

        if (!response.ok) {
          console.error("[GHL] Failed to create appointment contact:", await response.text());
        } else {
          console.log("[GHL] Appointment contact created successfully");
        }

        // Send admin SMS notification
        let smsMessage = `NEW APPOINTMENT REQUEST\n\nType: ${appointmentTypeLabel}`;
        if (vehicleInfo) {
          smsMessage += `\nVehicle: ${vehicleInfo}`;
        }
        smsMessage += `\nDate: ${data.preferredDate} at ${data.preferredTime}`;
        if (data.alternateDate && data.alternateTime) {
          smsMessage += `\nAlternate: ${data.alternateDate} at ${data.alternateTime}`;
        }
        smsMessage += `\n\nCustomer: ${data.firstName} ${data.lastName}\nPhone: ${data.phone}`;
        
        sendAdminNotificationSMS(smsMessage).catch((err) => {
          console.error("Admin notification SMS failed:", err);
        });
      }

      res.json({ success: true, message: "Appointment request submitted successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error submitting appointment:", error);
      res.status(500).json({ error: "Failed to submit appointment request" });
    }
  });

  // Credit Application Routes
  app.post("/api/credit-applications", async (req, res) => {
    try {
      const validatedData = insertCreditApplicationSchema.parse(req.body);
      const application = await storage.createCreditApplication(validatedData);

      // Get site settings for GHL integration
      const settings = await storage.getSiteSettings();
      const locationId = settings?.ghlLocationId || process.env.GHL_LOCATION_ID;
      const apiToken = settings?.ghlApiToken || process.env.GHL_API_TOKEN;

      if (locationId && apiToken) {
        // Create contact in GoHighLevel tagged as Credit Interest
        const response = await fetch(`${GHL_API_BASE}/contacts/upsert`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiToken}`,
            "Version": "2021-07-28",
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            email: validatedData.email,
            phone: validatedData.phone,
            locationId: locationId,
            tags: ["Credit Interest", "Pre-Qualification Lead"],
            source: "Website - Credit Application",
            customFields: [
              { key: "housing_status", field_value: validatedData.housingStatus },
              { key: "monthly_income", field_value: String(validatedData.monthlyIncome) },
              { key: "employer", field_value: validatedData.employerName },
            ],
          }),
        });

        if (!response.ok) {
          console.error("[GHL] Failed to create credit app contact:", await response.text());
        } else {
          console.log("[GHL] Credit application contact created successfully");
        }

        // Send admin SMS notification
        const smsMessage = `NEW CREDIT APPLICATION\n\nApplicant: ${validatedData.firstName} ${validatedData.lastName}\nPhone: ${validatedData.phone}\nEmail: ${validatedData.email}\nMonthly Income: $${validatedData.monthlyIncome}\nHousing: ${validatedData.housingStatus}`;
        
        sendAdminNotificationSMS(smsMessage).catch((err) => {
          console.error("Admin notification SMS failed:", err);
        });
      }

      res.status(201).json({ success: true, id: application.id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating credit application:", error);
      res.status(500).json({ error: "Failed to submit credit application" });
    }
  });

  app.get("/api/credit-applications", requireAdmin, async (req, res) => {
    try {
      const applications = await storage.getAllCreditApplications();
      res.json(applications);
    } catch (error) {
      console.error("Error fetching credit applications:", error);
      res.status(500).json({ error: "Failed to fetch credit applications" });
    }
  });

  app.get("/api/credit-applications/:id", requireAdmin, async (req, res) => {
    try {
      const application = await storage.getCreditApplication(req.params.id);
      if (!application) {
        return res.status(404).json({ error: "Credit application not found" });
      }
      res.json(application);
    } catch (error) {
      console.error("Error fetching credit application:", error);
      res.status(500).json({ error: "Failed to fetch credit application" });
    }
  });

  app.patch("/api/credit-applications/:id/status", requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status || !["new", "contacted", "qualified", "approved", "declined"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const updated = await storage.updateCreditApplicationStatus(req.params.id, status);
      if (!updated) {
        return res.status(404).json({ error: "Credit application not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating credit application status:", error);
      res.status(500).json({ error: "Failed to update credit application status" });
    }
  });

  app.patch("/api/credit-applications/:id/notes", requireAdmin, async (req, res) => {
    try {
      const { notes } = req.body;
      const updated = await storage.updateCreditApplicationNotes(req.params.id, notes || "");
      if (!updated) {
        return res.status(404).json({ error: "Credit application not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating credit application notes:", error);
      res.status(500).json({ error: "Failed to update notes" });
    }
  });

  app.patch("/api/credit-applications/:id/assignment", requireAdmin, async (req, res) => {
    try {
      const { assignedTo } = req.body;
      const updated = await storage.updateCreditApplicationAssignment(req.params.id, assignedTo || null);
      if (!updated) {
        return res.status(404).json({ error: "Credit application not found" });
      }
      
      await storage.createActivityLog({
        leadType: "credit_application",
        leadId: req.params.id,
        activityType: "assignment",
        description: assignedTo ? `Assigned to salesperson` : `Unassigned`,
        createdBy: req.user?.id,
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating credit application assignment:", error);
      res.status(500).json({ error: "Failed to update assignment" });
    }
  });

  app.post("/api/leads/:type/:id/notes", requireAdmin, async (req, res) => {
    try {
      const { type, id } = req.params;
      const { content } = req.body;
      
      if (!["inquiry", "credit_application"].includes(type)) {
        return res.status(400).json({ error: "Invalid lead type" });
      }
      if (!content?.trim()) {
        return res.status(400).json({ error: "Note content is required" });
      }
      
      const note = await storage.createLeadNote({
        leadType: type,
        leadId: id,
        content: content.trim(),
        createdBy: req.user?.id,
      });
      
      await storage.createActivityLog({
        leadType: type,
        leadId: id,
        activityType: "note_added",
        description: `Note added: ${content.substring(0, 100)}${content.length > 100 ? "..." : ""}`,
        createdBy: req.user?.id,
      });
      
      res.status(201).json(note);
    } catch (error) {
      console.error("Error creating lead note:", error);
      res.status(500).json({ error: "Failed to create note" });
    }
  });

  app.get("/api/leads/:type/:id/notes", requireAdmin, async (req, res) => {
    try {
      const { type, id } = req.params;
      if (!["inquiry", "credit_application"].includes(type)) {
        return res.status(400).json({ error: "Invalid lead type" });
      }
      const notes = await storage.getLeadNotes(type, id);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching lead notes:", error);
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  app.patch("/api/leads/notes/:noteId", requireAdmin, async (req, res) => {
    try {
      const { content } = req.body;
      if (!content?.trim()) {
        return res.status(400).json({ error: "Note content is required" });
      }
      const updated = await storage.updateLeadNote(req.params.noteId, content.trim());
      if (!updated) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating lead note:", error);
      res.status(500).json({ error: "Failed to update note" });
    }
  });

  app.delete("/api/leads/notes/:noteId", requireAdmin, async (req, res) => {
    try {
      await storage.deleteLeadNote(req.params.noteId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting lead note:", error);
      res.status(500).json({ error: "Failed to delete note" });
    }
  });

  app.get("/api/leads/:type/:id/activity", requireAdmin, async (req, res) => {
    try {
      const { type, id } = req.params;
      if (!["inquiry", "credit_application"].includes(type)) {
        return res.status(400).json({ error: "Invalid lead type" });
      }
      const activities = await storage.getActivityLogs(type, id);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activity log:", error);
      res.status(500).json({ error: "Failed to fetch activity log" });
    }
  });

  app.patch("/api/inquiries/:id/pipeline", requireAdmin, async (req, res) => {
    try {
      const { pipelineStage } = req.body;
      const validStages = ["new", "contacted", "qualified", "negotiating", "sold", "lost"];
      if (!pipelineStage || !validStages.includes(pipelineStage)) {
        return res.status(400).json({ error: "Invalid pipeline stage" });
      }
      
      const inquiry = await storage.getBuyerInquiry(req.params.id);
      if (!inquiry) {
        return res.status(404).json({ error: "Inquiry not found" });
      }
      
      const updated = await storage.updateBuyerInquiryPipeline(req.params.id, pipelineStage);
      if (!updated) {
        return res.status(404).json({ error: "Inquiry not found" });
      }
      
      // Update vehicle status based on pipeline stage
      // After any stage change, re-evaluate vehicle status based on ALL inquiries for this vehicle
      const allInquiriesForCar = await storage.getInquiriesForCar(inquiry.inventoryCarId);
      
      // Check for the highest priority stage among all inquiries
      const hasSoldInquiry = allInquiriesForCar.some(i => i.pipelineStage === "sold");
      const hasNegotiatingInquiry = allInquiriesForCar.some(i => i.pipelineStage === "negotiating");
      
      const vehicle = await storage.getInventoryCar(inquiry.inventoryCarId);
      if (vehicle) {
        if (hasSoldInquiry) {
          // If any inquiry is sold, vehicle is sold
          await storage.updateInventoryCarStatus(inquiry.inventoryCarId, "sold");
        } else if (hasNegotiatingInquiry) {
          // If any inquiry is negotiating, vehicle is pending
          await storage.updateInventoryCarStatus(inquiry.inventoryCarId, "pending");
        } else if (vehicle.status !== "sold") {
          // No active negotiations or sales, return to available (unless manually marked sold)
          await storage.updateInventoryCarStatus(inquiry.inventoryCarId, "available");
        }
      }
      
      await storage.createActivityLog({
        leadType: "inquiry",
        leadId: req.params.id,
        activityType: "pipeline_change",
        description: `Pipeline stage changed to ${pipelineStage}`,
        createdBy: req.user?.id,
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating inquiry pipeline:", error);
      res.status(500).json({ error: "Failed to update pipeline stage" });
    }
  });

  app.patch("/api/inquiries/:id/assignment", requireAdmin, async (req, res) => {
    try {
      const { assignedTo } = req.body;
      const updated = await storage.updateBuyerInquiryAssignment(req.params.id, assignedTo || null);
      if (!updated) {
        return res.status(404).json({ error: "Inquiry not found" });
      }
      
      await storage.createActivityLog({
        leadType: "inquiry",
        leadId: req.params.id,
        activityType: "assignment",
        description: assignedTo ? `Assigned to salesperson` : `Unassigned`,
        createdBy: req.user?.id,
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating inquiry assignment:", error);
      res.status(500).json({ error: "Failed to update assignment" });
    }
  });

  app.get("/api/inventory/all", async (req, res) => {
    try {
      const cars = await storage.getAllInventoryCars();
      const inquiries = await storage.getAllBuyerInquiries();
      
      const carsWithMetrics = cars.map(car => {
        const carInquiries = inquiries.filter(i => i.inventoryCarId === car.id);
        const daysOnLot = car.createdAt 
          ? Math.floor((Date.now() - new Date(car.createdAt).getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        
        return {
          ...car,
          daysOnLot,
          inquiryCount: carInquiries.length,
        };
      });
      
      res.json(carsWithMetrics);
    } catch (error) {
      console.error("Error fetching all inventory:", error);
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });

  // Get vehicle by slug (SEO-friendly URL)
  app.get("/api/inventory/by-slug/:slug", async (req, res) => {
    try {
      const car = await storage.getInventoryCarBySlug(req.params.slug);
      if (!car) {
        return res.status(404).json({ error: "Car not found" });
      }
      res.json(car);
    } catch (error) {
      console.error("Error fetching car by slug:", error);
      res.status(500).json({ error: "Failed to fetch car" });
    }
  });

  app.get("/api/inventory/:id", async (req, res) => {
    try {
      const car = await storage.getInventoryCar(req.params.id);
      if (!car) {
        return res.status(404).json({ error: "Car not found" });
      }
      res.json(car);
    } catch (error) {
      console.error("Error fetching car:", error);
      res.status(500).json({ error: "Failed to fetch car" });
    }
  });

  app.post("/api/inventory", async (req, res) => {
    try {
      const validatedData = insertInventoryCarSchema.parse(req.body);
      
      // Generate slug for new vehicle using entity-based format (no location)
      const settings = await storage.getSiteSettings();
      const car = await storage.createInventoryCar(validatedData);
      
      // Generate canonical slug with ID, respecting admin settings
      const slug = generateVehicleSlug({
        year: validatedData.year,
        make: validatedData.make,
        model: validatedData.model,
        trim: settings?.slugIncludeTrim !== false ? (validatedData.trim || null) : null,
        id: car.id,
        stockNumber: settings?.slugIncludeStock ? (validatedData.stockNumber || null) : null,
      });
      
      // Update car with slug
      await storage.updateInventoryCar(car.id, { slug });
      const updatedCar = await storage.getInventoryCar(car.id);
      
      res.status(201).json(updatedCar);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating inventory car:", error);
      res.status(500).json({ error: "Failed to create inventory car" });
    }
  });

  // Backfill slugs for existing vehicles without slugs or with old-format slugs
  app.post("/api/inventory/backfill-slugs", requireAdmin, async (req, res) => {
    try {
      const allCars = await storage.getAllInventoryCars();
      const settings = await storage.getSiteSettings();
      
      let updated = 0;
      for (const car of allCars) {
        // Generate new canonical slug with ID (entity-based, no location)
        const slug = generateVehicleSlug({
          year: car.year,
          make: car.make,
          model: car.model,
          trim: settings?.slugIncludeTrim !== false ? (car.trim || null) : null,
          id: car.id,
          stockNumber: settings?.slugIncludeStock ? (car.stockNumber || null) : null,
        });
        
        // Only update if slug changed
        if (car.slug !== slug) {
          await storage.updateInventoryCar(car.id, { slug });
          updated++;
        }
      }
      
      res.json({ message: `Updated ${updated} vehicles with canonical slugs` });
    } catch (error) {
      console.error("Error backfilling slugs:", error);
      res.status(500).json({ error: "Failed to backfill slugs" });
    }
  });

  app.post("/api/inventory/bulk", requireAdmin, async (req, res) => {
    try {
      const { vehicles } = req.body;
      if (!Array.isArray(vehicles) || vehicles.length === 0) {
        return res.status(400).json({ error: "No vehicles provided" });
      }
      
      const settings = await storage.getSiteSettings();
      const createdCars = [];
      const errors = [];
      
      for (const vehicle of vehicles) {
        try {
          const validatedData = insertInventoryCarSchema.parse({
            vin: vehicle.vin,
            year: vehicle.year,
            make: vehicle.make,
            model: vehicle.model,
            trim: vehicle.trim || null,
            mileage: vehicle.mileage,
            color: vehicle.color,
            price: vehicle.price,
            condition: vehicle.condition,
            description: vehicle.description || null,
            photos: [],
            status: "available",
            featured: false,
          });
          const car = await storage.createInventoryCar(validatedData);
          
          // Generate canonical slug with ID (entity-based, no location)
          const slug = generateVehicleSlug({
            year: vehicle.year,
            make: vehicle.make,
            model: vehicle.model,
            trim: settings?.slugIncludeTrim !== false ? (vehicle.trim || null) : null,
            id: car.id,
            stockNumber: settings?.slugIncludeStock ? (vehicle.stockNumber || null) : null,
          });
          await storage.updateInventoryCar(car.id, { slug });
          createdCars.push({ ...car, slug });
        } catch (error) {
          errors.push({ vehicle, error: error instanceof Error ? error.message : "Unknown error" });
        }
      }
      
      res.status(201).json({ 
        count: createdCars.length, 
        cars: createdCars,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("Error bulk creating inventory:", error);
      res.status(500).json({ error: "Failed to bulk create inventory" });
    }
  });

  app.patch("/api/inventory/:id/status", requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status || !["available", "pending", "sold"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const updated = await storage.updateInventoryCarStatus(req.params.id, status);
      if (!updated) {
        return res.status(404).json({ error: "Car not found" });
      }
      
      // Update consignment status when inventory is marked as sold
      if (status === "sold" && updated.consignmentId) {
        await storage.updateConsignmentStatus(updated.consignmentId, "sold");
        await storage.createStatusHistory(updated.consignmentId, "sold", "Vehicle sold");
      } else if (status === "available" && updated.consignmentId) {
        await storage.updateConsignmentStatus(updated.consignmentId, "listed");
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating car status:", error);
      res.status(500).json({ error: "Failed to update car status" });
    }
  });

  app.patch("/api/inventory/:id", requireAdmin, async (req, res) => {
    try {
      const updateSchema = z.object({
        vin: z.string().min(11).max(17).optional(),
        year: z.number().int().min(1900).max(2100).optional(),
        make: z.string().min(1).max(100).optional(),
        model: z.string().min(1).max(100).optional(),
        mileage: z.number().int().min(0).optional(),
        color: z.string().min(1).max(50).optional(),
        price: z.number().int().min(0).optional(),
        featured: z.boolean().optional(),
        status: z.enum(["available", "pending", "sold"]).optional(),
        condition: z.string().min(1).max(100).optional(),
        description: z.string().nullable().optional(),
        photos: z.array(z.string()).optional(),
      });

      const validatedData = updateSchema.parse(req.body);

      if (Object.keys(validatedData).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      const updated = await storage.updateInventoryCar(req.params.id, validatedData);
      if (!updated) {
        return res.status(404).json({ error: "Car not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error updating inventory car:", error);
      res.status(500).json({ error: "Failed to update car" });
    }
  });

  app.delete("/api/inventory/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteInventoryCar(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Car not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting inventory car:", error);
      res.status(500).json({ error: "Failed to delete car" });
    }
  });

  app.post("/api/consignments/:id/approve", requireAdmin, async (req, res) => {
    try {
      const { price } = req.body;
      if (!price || typeof price !== "number") {
        return res.status(400).json({ error: "Price is required" });
      }
      
      const consignment = await storage.getConsignment(req.params.id);
      if (!consignment) {
        return res.status(404).json({ error: "Consignment not found" });
      }

      const car = await storage.createInventoryCar({
        vin: consignment.vin,
        year: parseInt(consignment.year),
        make: consignment.make,
        model: consignment.model,
        mileage: parseInt(consignment.mileage.replace(/,/g, "")),
        color: consignment.color,
        price,
        condition: consignment.condition,
        description: consignment.description || "",
        photos: consignment.photos || [],
        status: "available",
        consignmentId: consignment.id,
      });

      await storage.updateConsignmentStatus(req.params.id, "listed");
      await storage.createStatusHistory(req.params.id, "approved", "Vehicle approved and added to inventory");
      await storage.createStatusHistory(req.params.id, "listed", "Vehicle listed for sale");

      res.json({ consignment: { ...consignment, status: "listed" }, car });
    } catch (error) {
      console.error("Error approving consignment:", error);
      res.status(500).json({ error: "Failed to approve consignment" });
    }
  });

  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      const ghlCreds = await getGHLCredentials();
      const ghlConfigured = !!(ghlCreds.apiToken && ghlCreds.locationId);
      const ghlSource = ghlCreds.source; // 'env', 'db', or 'none'
      
      if (settings) {
        const { ghlApiToken, ...safeSettings } = settings;
        res.json({
          ...safeSettings,
          ghlConfigured,
          ghlSource,
          ghlLocationId: ghlCreds.locationId || settings.ghlLocationId || null
        });
      } else {
        res.json({ 
          primaryColor: "#D4AF37", 
          backgroundColor: "#000000",
          mainMenuColor: "#D4AF37",
          mainMenuHoverColor: "#B8960C",
          contactButtonColor: "#D4AF37",
          contactButtonHoverColor: "#B8960C",
          menuFontSize: "14",
          bodyFontSize: "16",
          menuAllCaps: true,
          vehicleTitleColor: "#FFFFFF",
          vehiclePriceColor: "#FFFFFF",
          stepBgColor: "#DC2626",
          stepNumberColor: "#FFFFFF",
          socialIconBgColor: "#D4AF37",
          socialIconHoverColor: "#B8960C",
          footerTagline: "Luxury automotive consignment services for discerning collectors and enthusiasts.",
          siteName: "PRESTIGE", 
          logoUrl: null,
          logoWidth: "120",
          faviconUrl: null,
          contactAddress1: null,
          contactAddress2: null,
          contactPhone: null,
          contactEmail: null,
          facebookUrl: null,
          instagramUrl: null,
          twitterUrl: null,
          youtubeUrl: null,
          tiktokUrl: null,
          ghlConfigured,
          ghlSource,
          ghlLocationId: ghlCreds.locationId || null
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", requireAdmin, async (req, res) => {
    try {
      const { 
        primaryColor,
        backgroundColor,
        mainMenuColor,
        mainMenuHoverColor,
        contactButtonColor,
        contactButtonHoverColor,
        menuFontSize,
        bodyFontSize,
        menuAllCaps,
        vehicleTitleColor,
        vehiclePriceColor,
        stepBgColor,
        stepNumberColor,
        socialIconBgColor,
        socialIconHoverColor,
        footerTagline,
        siteName, 
        logoUrl,
        logoWidth,
        mobileLogoWidth,
        faviconUrl,
        contactAddress1,
        contactAddress2,
        contactPhone,
        contactEmail,
        facebookUrl,
        instagramUrl,
        twitterUrl,
        youtubeUrl,
        tiktokUrl,
        adminNotifyPhone1,
        adminNotifyPhone2,
        ghlApiToken,
        ghlLocationId,
        sellerConfirmationSms,
        inquiryConfirmationSms,
        tradeInConfirmationSms,
        menuLabelHome,
        menuLabelInventory,
        menuLabelConsign,
        menuLabelTradeIn,
        menuLabelAppointments,
        // SEO fields
        ogTitle,
        ogDescription,
        ogImage,
        twitterHandle,
        dealerCity,
        dealerState,
        dealerAddress,
        dealerHours,
        googleMapUrl,
        googlePlaceId,
        baseUrl,
        seoTitleTemplate,
        seoDescriptionTemplate,
        slugIncludeTrim,
        slugIncludeLocation,
        soldVehicleBehavior,
        soldVehicleNoindexDays,
        indexVehiclePages,
        indexInventoryPages,
        indexMakePages,
        indexModelPages,
        indexLocationPages,
        locationPageTitle,
        locationPageDescription,
        locationPageIntro,
        inventoryPageTitle,
        inventoryPageDescription,
        inventoryPageIntro,
        // Business settings
        commissionRate,
        avgDaysToFirstInquiry,
        avgDaysToSell,
        hotListingThreshold,
        hideSiteNameWithLogo,
        liveChatEnabled,
        liveChatWidgetId
      } = req.body;
      
      console.log("[settings] PATCH received - liveChatEnabled:", liveChatEnabled, "liveChatWidgetId:", liveChatWidgetId);
      
      const updateData: Record<string, any> = {
        primaryColor, 
        backgroundColor,
        mainMenuColor,
        mainMenuHoverColor,
        contactButtonColor,
        contactButtonHoverColor,
        menuFontSize,
        bodyFontSize,
        menuAllCaps,
        vehicleTitleColor,
        vehiclePriceColor,
        stepBgColor,
        stepNumberColor,
        socialIconBgColor,
        socialIconHoverColor,
        footerTagline,
        siteName, 
        logoUrl,
        logoWidth,
        mobileLogoWidth,
        faviconUrl,
        contactAddress1,
        contactAddress2,
        contactPhone,
        contactEmail,
        facebookUrl,
        instagramUrl,
        twitterUrl,
        youtubeUrl,
        tiktokUrl,
        adminNotifyPhone1,
        adminNotifyPhone2,
        ghlLocationId,
        sellerConfirmationSms,
        inquiryConfirmationSms,
        tradeInConfirmationSms,
        menuLabelHome,
        menuLabelInventory,
        menuLabelConsign,
        menuLabelTradeIn,
        menuLabelAppointments,
        // SEO fields
        ogTitle,
        ogDescription,
        ogImage,
        twitterHandle,
        dealerCity,
        dealerState,
        dealerAddress,
        dealerHours,
        googleMapUrl,
        googlePlaceId,
        baseUrl,
        seoTitleTemplate,
        seoDescriptionTemplate,
        slugIncludeTrim,
        slugIncludeLocation,
        soldVehicleBehavior,
        soldVehicleNoindexDays,
        indexVehiclePages,
        indexInventoryPages,
        indexMakePages,
        indexModelPages,
        indexLocationPages,
        locationPageTitle,
        locationPageDescription,
        locationPageIntro,
        inventoryPageTitle,
        inventoryPageDescription,
        inventoryPageIntro,
        // Business settings
        commissionRate,
        avgDaysToFirstInquiry,
        avgDaysToSell,
        hotListingThreshold,
        hideSiteNameWithLogo,
        liveChatEnabled,
        liveChatWidgetId
      };
      
      // Validate GHL credentials only when explicitly changing them
      const currentSettings = await storage.getSiteSettings();
      const newToken = ghlApiToken && ghlApiToken.trim().length > 0 ? ghlApiToken : null;
      const isChangingGhlLocation = ghlLocationId !== undefined && ghlLocationId !== currentSettings?.ghlLocationId;
      
      // Only validate if explicitly adding/changing GHL credentials
      if (newToken || isChangingGhlLocation) {
        const effectiveToken = newToken || currentSettings?.ghlApiToken;
        const effectiveLocation = ghlLocationId !== undefined ? ghlLocationId : currentSettings?.ghlLocationId;
        
        if (effectiveToken && effectiveLocation) {
          const testResult = await testGHLCredentials(effectiveToken, effectiveLocation);
          if (!testResult.success) {
            return res.status(400).json({ 
              error: `GoHighLevel credentials invalid: ${testResult.error}`,
              ghlError: true
            });
          }
        }
      }
      
      if (newToken) {
        updateData.ghlApiToken = ghlApiToken;
      }
      
      const settings = await storage.updateSiteSettings(updateData);
      const { ghlApiToken: _token, ...safeSettings } = settings;
      res.json({
        ...safeSettings,
        ghlConfigured: !!(settings.ghlApiToken && settings.ghlLocationId)
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Test GoHighLevel connection
  app.post("/api/settings/test-ghl", requireAdmin, async (req, res) => {
    try {
      const { apiToken, locationId } = req.body;
      
      // Use provided values or fall back to stored values
      const settings = await storage.getSiteSettings();
      const testToken = apiToken || settings?.ghlApiToken;
      const testLocationId = locationId || settings?.ghlLocationId;
      
      if (!testToken || !testLocationId) {
        return res.status(400).json({ 
          success: false, 
          error: "API Token and Location ID are required" 
        });
      }
      
      const testResult = await testGHLCredentials(testToken, testLocationId);
      
      if (testResult.success) {
        return res.json({ 
          success: true, 
          message: `Connected to ${testResult.locationName || "GoHighLevel"}` 
        });
      }
      
      return res.status(testResult.code || 400).json({ 
        success: false, 
        error: testResult.error 
      });
    } catch (error) {
      console.error("[GHL] Connection test error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to connect to GoHighLevel - network error" 
      });
    }
  });

  // Diagnostic endpoint to check database schema (admin only)
  app.get("/api/admin/db-schema-check", requireAdmin, async (req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'site_settings' 
        ORDER BY ordinal_position
      `);
      
      const columns = result.rows.map((row: any) => ({
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable
      }));
      
      const liveChatColumns = columns.filter((c: any) => 
        c.name.includes('live_chat')
      );
      
      res.json({
        environment: process.env.NODE_ENV,
        totalColumns: columns.length,
        liveChatColumns,
        hasLiveChatEnabled: columns.some((c: any) => c.name === 'live_chat_enabled'),
        hasLiveChatWidgetId: columns.some((c: any) => c.name === 'live_chat_widget_id'),
        allColumns: columns
      });
    } catch (error) {
      console.error("Error checking schema:", error);
      res.status(500).json({ error: "Failed to check schema", details: String(error) });
    }
  });

  // Force resync settings from seed data (admin only)
  app.post("/api/settings/resync", requireAdmin, async (req, res) => {
    try {
      const { seedSettings } = await import("./seed-data");
      
      const currentSettings = await storage.getSiteSettings();
      const preservedSettings = currentSettings ? {
        ghlApiToken: currentSettings.ghlApiToken,
        ghlLocationId: currentSettings.ghlLocationId,
        demoModeActive: currentSettings.demoModeActive,
        privacyPolicy: currentSettings.privacyPolicy,
        termsOfService: currentSettings.termsOfService,
      } : {};
      
      await storage.updateSiteSettings({
        primaryColor: seedSettings.primaryColor,
        backgroundColor: seedSettings.backgroundColor,
        mainMenuColor: seedSettings.mainMenuColor,
        mainMenuHoverColor: seedSettings.mainMenuHoverColor,
        contactButtonColor: seedSettings.contactButtonColor,
        contactButtonHoverColor: seedSettings.contactButtonHoverColor,
        menuFontSize: seedSettings.menuFontSize,
        bodyFontSize: seedSettings.bodyFontSize,
        menuAllCaps: seedSettings.menuAllCaps,
        vehicleTitleColor: seedSettings.vehicleTitleColor,
        vehiclePriceColor: seedSettings.vehiclePriceColor,
        stepBgColor: seedSettings.stepBgColor,
        stepNumberColor: seedSettings.stepNumberColor,
        socialIconBgColor: seedSettings.socialIconBgColor,
        socialIconHoverColor: seedSettings.socialIconHoverColor,
        footerTagline: seedSettings.footerTagline,
        logoUrl: seedSettings.logoUrl,
        logoWidth: seedSettings.logoWidth,
        siteName: seedSettings.siteName,
        contactAddress1: seedSettings.contactAddress1,
        contactAddress2: seedSettings.contactAddress2,
        contactPhone: seedSettings.contactPhone,
        contactEmail: seedSettings.contactEmail,
        facebookUrl: seedSettings.facebookUrl,
        instagramUrl: seedSettings.instagramUrl,
        twitterUrl: seedSettings.twitterUrl,
        youtubeUrl: seedSettings.youtubeUrl,
        tiktokUrl: seedSettings.tiktokUrl,
        commissionRate: seedSettings.commissionRate,
        avgDaysToFirstInquiry: seedSettings.avgDaysToFirstInquiry,
        avgDaysToSell: seedSettings.avgDaysToSell,
        ...preservedSettings,
      });
      
      console.log("[settings] Force resync from seed data completed");
      res.json({ success: true, message: "Settings resynced from configuration" });
    } catch (error) {
      console.error("Error resyncing settings:", error);
      res.status(500).json({ error: "Failed to resync settings" });
    }
  });

  // Demo Mode - Enable (master admin only)
  app.post("/api/demo/enable", requireMasterAdmin, async (req, res) => {
    try {
      const { demoVehicles, demoConsignments, demoTestimonials, demoBuyerInquiries } = await import("./demoData");
      
      const settings = await storage.getSiteSettings();
      if (settings?.demoModeActive) {
        return res.status(400).json({ error: "Demo mode is already active" });
      }
      
      const allVehicles = await storage.getAllInventoryCars();
      const vehicleIds: string[] = [];
      
      for (const vehicle of demoVehicles) {
        const created = await storage.createInventoryCar(vehicle);
        vehicleIds.push(created.id);
      }
      
      for (const inquiry of demoBuyerInquiries) {
        if (vehicleIds.length > 0) {
          const { targetVehicleIndex, ...inquiryData } = inquiry as any;
          const vehicleIndex = typeof targetVehicleIndex === 'number' 
            ? targetVehicleIndex 
            : demoBuyerInquiries.indexOf(inquiry) % vehicleIds.length;
          await storage.createBuyerInquiry({
            ...inquiryData,
            inventoryCarId: vehicleIds[vehicleIndex],
          });
        }
      }
      
      for (const consignment of demoConsignments) {
        await storage.createConsignment(consignment as any);
      }
      
      for (const testimonial of demoTestimonials) {
        await storage.createTestimonial(testimonial);
      }
      
      await storage.updateSiteSettings({ demoModeActive: true });
      
      console.log("[demo] Demo mode enabled - sample data created");
      res.json({ 
        success: true, 
        message: "Demo mode enabled", 
        created: {
          vehicles: demoVehicles.length,
          inquiries: demoBuyerInquiries.length,
          consignments: demoConsignments.length,
          testimonials: demoTestimonials.length,
        }
      });
    } catch (error) {
      console.error("[demo] Error enabling demo mode:", error);
      res.status(500).json({ error: "Failed to enable demo mode" });
    }
  });

  // Demo Mode - Disable (master admin only)
  app.post("/api/demo/disable", requireMasterAdmin, async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      if (!settings?.demoModeActive) {
        return res.status(400).json({ error: "Demo mode is not active" });
      }
      
      const deletedVehicles = await storage.deleteDemoInventory();
      const deletedInquiries = await storage.deleteDemoBuyerInquiries();
      const deletedConsignments = await storage.deleteDemoConsignments();
      const deletedTestimonials = await storage.deleteDemoTestimonials();
      
      await storage.updateSiteSettings({ demoModeActive: false });
      
      console.log("[demo] Demo mode disabled - sample data removed");
      res.json({ 
        success: true, 
        message: "Demo mode disabled", 
        deleted: {
          vehicles: deletedVehicles,
          inquiries: deletedInquiries,
          consignments: deletedConsignments,
          testimonials: deletedTestimonials,
        }
      });
    } catch (error) {
      console.error("[demo] Error disabling demo mode:", error);
      res.status(500).json({ error: "Failed to disable demo mode" });
    }
  });

  // Vehicle Alerts - Public create, Admin manage
  app.post("/api/vehicle-alerts", async (req, res) => {
    try {
      console.log("[vehicle-alerts] Received alert creation request:", JSON.stringify(req.body, null, 2));
      
      const { name, email, phone, makes, models, minYear, maxYear, minPrice, maxPrice, notifyEmail, notifySms } = req.body;
      
      if (!name || !email) {
        console.log("[vehicle-alerts] Validation failed - missing name or email:", { name: !!name, email: !!email });
        return res.status(400).json({ error: "Name and email are required" });
      }
      
      const alertData = {
        name,
        email,
        phone: phone || null,
        makes: makes || [],
        models: models || [],
        minYear: minYear || null,
        maxYear: maxYear || null,
        minPrice: minPrice || null,
        maxPrice: maxPrice || null,
        notifyEmail: notifyEmail !== false,
        notifySms: notifySms || false,
      };
      
      console.log("[vehicle-alerts] Creating alert with data:", JSON.stringify(alertData, null, 2));
      
      const alert = await storage.createVehicleAlert(alertData);
      
      console.log("[vehicle-alerts] SUCCESS - Alert created with ID:", alert.id);
      res.status(201).json(alert);
    } catch (error: any) {
      console.error("[vehicle-alerts] ERROR creating alert:", error.message, error.stack);
      res.status(500).json({ error: "Failed to create vehicle alert: " + error.message });
    }
  });

  app.get("/api/vehicle-alerts", requireAdmin, async (req, res) => {
    try {
      const alerts = await storage.getAllVehicleAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching vehicle alerts:", error);
      res.status(500).json({ error: "Failed to fetch vehicle alerts" });
    }
  });

  app.patch("/api/vehicle-alerts/:id/status", requireAdmin, async (req, res) => {
    try {
      const { active } = req.body;
      const alert = await storage.updateVehicleAlertStatus(req.params.id, active);
      if (!alert) {
        return res.status(404).json({ error: "Vehicle alert not found" });
      }
      res.json(alert);
    } catch (error) {
      console.error("Error updating vehicle alert:", error);
      res.status(500).json({ error: "Failed to update vehicle alert" });
    }
  });

  app.delete("/api/vehicle-alerts/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteVehicleAlert(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting vehicle alert:", error);
      res.status(500).json({ error: "Failed to delete vehicle alert" });
    }
  });

  // Price Alerts - for specific vehicles (price drop notifications)
  app.post("/api/price-alerts", async (req, res) => {
    try {
      console.log("[price-alerts] Received price alert request:", JSON.stringify(req.body, null, 2));
      
      const { vehicleId, email, phone, name, priceAtSubscription, notifyEmail, notifySms } = req.body;
      
      if (!vehicleId || !email || !priceAtSubscription) {
        console.log("[price-alerts] Validation failed:", { vehicleId: !!vehicleId, email: !!email, priceAtSubscription: !!priceAtSubscription });
        return res.status(400).json({ error: "Vehicle ID, email, and current price are required" });
      }
      
      // Check if vehicle exists
      const vehicle = await storage.getInventoryCar(vehicleId);
      if (!vehicle) {
        console.log("[price-alerts] Vehicle not found:", vehicleId);
        return res.status(404).json({ error: "Vehicle not found" });
      }
      
      const alertData = {
        vehicleId,
        email,
        phone: phone || null,
        name: name || null,
        priceAtSubscription,
        notifyEmail: notifyEmail !== false,
        notifySms: notifySms || false,
      };
      
      console.log("[price-alerts] Creating price alert for vehicle:", vehicle.year, vehicle.make, vehicle.model);
      
      const alert = await storage.createPriceAlert(alertData);
      
      console.log("[price-alerts] SUCCESS - Price alert created with ID:", alert.id);
      res.status(201).json(alert);
    } catch (error: any) {
      console.error("[price-alerts] ERROR creating alert:", error.message, error.stack);
      res.status(500).json({ error: "Failed to create price alert: " + error.message });
    }
  });

  app.get("/api/price-alerts/vehicle/:vehicleId", requireAdmin, async (req, res) => {
    try {
      const alerts = await storage.getPriceAlertsForVehicle(req.params.vehicleId);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching price alerts:", error);
      res.status(500).json({ error: "Failed to fetch price alerts" });
    }
  });

  app.get("/api/price-alerts/my", async (req, res) => {
    try {
      const { email } = req.query;
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: "Email is required" });
      }
      const alerts = await storage.getPriceAlertsByEmail(email);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching price alerts:", error);
      res.status(500).json({ error: "Failed to fetch price alerts" });
    }
  });

  app.delete("/api/price-alerts/:id", async (req, res) => {
    try {
      await storage.deletePriceAlert(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting price alert:", error);
      res.status(500).json({ error: "Failed to delete price alert" });
    }
  });

  // Testimonials - Public view, Admin manage
  app.get("/api/testimonials", async (req, res) => {
    try {
      const testimonials = await storage.getApprovedTestimonials();
      res.json(testimonials);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      res.status(500).json({ error: "Failed to fetch testimonials" });
    }
  });

  app.get("/api/testimonials/featured", async (req, res) => {
    try {
      const testimonials = await storage.getFeaturedTestimonials();
      res.json(testimonials);
    } catch (error) {
      console.error("Error fetching featured testimonials:", error);
      res.status(500).json({ error: "Failed to fetch featured testimonials" });
    }
  });

  app.get("/api/testimonials/all", requireAdmin, async (req, res) => {
    try {
      const testimonials = await storage.getAllTestimonials();
      res.json(testimonials);
    } catch (error) {
      console.error("Error fetching all testimonials:", error);
      res.status(500).json({ error: "Failed to fetch testimonials" });
    }
  });

  app.post("/api/testimonials", requireAdmin, async (req, res) => {
    try {
      const { customerName, customerLocation, vehicleSold, rating, content, photoUrl, featured } = req.body;
      
      if (!customerName || !content) {
        return res.status(400).json({ error: "Customer name and content are required" });
      }
      
      const testimonial = await storage.createTestimonial({
        customerName,
        customerLocation: customerLocation || null,
        vehicleSold: vehicleSold || null,
        rating: rating || 5,
        content,
        photoUrl: photoUrl || null,
        featured: featured || false,
      });
      
      res.status(201).json(testimonial);
    } catch (error) {
      console.error("Error creating testimonial:", error);
      res.status(500).json({ error: "Failed to create testimonial" });
    }
  });

  app.patch("/api/testimonials/:id", requireAdmin, async (req, res) => {
    try {
      const testimonial = await storage.updateTestimonial(req.params.id, req.body);
      if (!testimonial) {
        return res.status(404).json({ error: "Testimonial not found" });
      }
      res.json(testimonial);
    } catch (error) {
      console.error("Error updating testimonial:", error);
      res.status(500).json({ error: "Failed to update testimonial" });
    }
  });

  app.delete("/api/testimonials/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteTestimonial(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      res.status(500).json({ error: "Failed to delete testimonial" });
    }
  });

  // Vehicle Documents
  app.get("/api/vehicles/:id/documents", requireAdmin, async (req, res) => {
    try {
      const docs = await storage.getVehicleDocuments(req.params.id);
      res.json(docs);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.post("/api/vehicles/:id/documents", requireAdmin, async (req, res) => {
    try {
      const { documentType, fileName, fileUrl, notes } = req.body;
      const userId = (req.session as any).userId;
      
      const doc = await storage.createVehicleDocument({
        vehicleId: req.params.id,
        documentType,
        fileName,
        fileUrl,
        notes: notes || null,
        uploadedBy: userId || null,
      });
      res.json(doc);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ error: "Failed to create document" });
    }
  });

  app.delete("/api/documents/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteVehicleDocument(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Vehicle View Tracking
  app.post("/api/vehicles/:id/view", async (req, res) => {
    try {
      const vehicleId = req.params.id;
      const userAgent = req.headers["user-agent"] || undefined;
      const referrer = req.headers["referer"] || undefined;
      
      await storage.recordVehicleView(vehicleId, userAgent, referrer);
      res.json({ success: true });
    } catch (error) {
      console.error("Error recording view:", error);
      res.status(500).json({ error: "Failed to record view" });
    }
  });

  app.get("/api/vehicles/:id/views", requireAdmin, async (req, res) => {
    try {
      const count = await storage.getVehicleViewCount(req.params.id);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching view count:", error);
      res.status(500).json({ error: "Failed to fetch view count" });
    }
  });

  // Vehicle Save Toggle (for tracking favorites)
  app.post("/api/vehicles/:id/save", async (req, res) => {
    try {
      const vehicleId = req.params.id;
      // Use session ID if authenticated, otherwise generate/use anonymous session
      let sessionId = (req.session as any)?.sessionId;
      if (!sessionId) {
        // Use a session-based identifier or generate one from request
        sessionId = req.headers['x-session-id'] as string || 
          `anon-${req.ip}-${req.headers['user-agent']?.slice(0, 50) || 'unknown'}`;
      }
      
      const isSaved = await storage.toggleVehicleSave(vehicleId, sessionId);
      res.json({ success: true, saved: isSaved });
    } catch (error) {
      console.error("Error toggling vehicle save:", error);
      res.status(500).json({ error: "Failed to toggle save" });
    }
  });

  // Get saved vehicles for session
  app.get("/api/saved-vehicles", async (req, res) => {
    try {
      let sessionId = (req.session as any)?.sessionId;
      if (!sessionId) {
        sessionId = req.headers['x-session-id'] as string || 
          `anon-${req.ip}-${req.headers['user-agent']?.slice(0, 50) || 'unknown'}`;
      }
      
      const saves = await storage.getVehicleSavesBySession(sessionId);
      res.json({ vehicleIds: saves.map(s => s.vehicleId) });
    } catch (error) {
      console.error("Error fetching saved vehicles:", error);
      res.status(500).json({ error: "Failed to fetch saved vehicles" });
    }
  });

  // SMS Blast
  app.post("/api/sms/blast", requireAdmin, async (req, res) => {
    try {
      const { message, targetGroup } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }
      
      const { locationId, apiToken } = await getGHLCredentials();
      if (!locationId || !apiToken) {
        return res.status(400).json({ error: "GoHighLevel not configured" });
      }
      
      let phoneNumbers: string[] = [];
      
      if (targetGroup === "inquiries") {
        const inquiries = await storage.getAllBuyerInquiries();
        phoneNumbers = inquiries.filter(i => i.buyerPhone).map(i => i.buyerPhone);
      } else if (targetGroup === "consignments") {
        const consignments = await storage.getAllConsignments();
        phoneNumbers = consignments.filter(c => c.phone).map(c => c.phone);
      } else if (targetGroup === "alerts") {
        const alerts = await storage.getAllVehicleAlerts();
        phoneNumbers = alerts.filter(a => a.phone && a.notifySms).map(a => a.phone!);
      } else {
        return res.status(400).json({ error: "Invalid target group" });
      }
      
      const uniquePhones = Array.from(new Set(phoneNumbers.filter(Boolean)));
      
      if (uniquePhones.length === 0) {
        return res.status(400).json({ error: "No phone numbers found for selected group" });
      }
      
      let successCount = 0;
      let failCount = 0;
      
      for (const phone of uniquePhones) {
        try {
          const response = await fetch(`${GHL_API_BASE}/conversations/messages`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiToken}`,
              "Content-Type": "application/json",
              "Version": "2021-07-28",
            },
            body: JSON.stringify({
              type: "SMS",
              locationId,
              phone,
              message,
            }),
          });
          
          if (response.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (e) {
          failCount++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      res.json({
        success: true,
        sent: successCount,
        failed: failCount,
        total: uniquePhones.length,
      });
    } catch (error) {
      console.error("Error sending SMS blast:", error);
      res.status(500).json({ error: "Failed to send SMS blast" });
    }
  });

  // Analytics Dashboard
  app.get("/api/analytics", requireAdmin, async (req, res) => {
    try {
      const totalViews = await storage.getTotalViewsCount();
      const totalSaves = await storage.getTotalSavesCount();
      const inventory = await storage.getAllInventoryCars();
      const inquiries = await storage.getAllBuyerInquiries();
      const consignments = await storage.getAllConsignments();
      const alerts = await storage.getAllVehicleAlerts();
      const mostViewed = await storage.getMostViewedVehicles(10);
      const topSaved = await storage.getTopSavedVehicles(10);
      
      const availableCount = inventory.filter(c => c.status === "available").length;
      const soldCount = inventory.filter(c => c.status === "sold").length;
      const pendingConsignments = consignments.filter(c => c.status === "pending").length;
      const newInquiries = inquiries.filter(i => i.status === "new").length;
      const activeAlerts = alerts.filter(a => a.active).length;
      
      const mostViewedWithDetails = mostViewed.map(mv => {
        const vehicle = inventory.find(v => v.id === mv.vehicleId);
        return {
          ...mv,
          vehicle: vehicle ? {
            id: vehicle.id,
            year: vehicle.year,
            make: vehicle.make,
            model: vehicle.model,
            status: vehicle.status,
            price: vehicle.price,
            photo: vehicle.photos?.[0] || null,
          } : null
        };
      }).filter(mv => mv.vehicle);
      
      const topSavedWithDetails = topSaved.map(ts => {
        const vehicle = inventory.find(v => v.id === ts.vehicleId);
        return {
          ...ts,
          vehicle: vehicle ? {
            id: vehicle.id,
            year: vehicle.year,
            make: vehicle.make,
            model: vehicle.model,
            status: vehicle.status,
            price: vehicle.price,
            photo: vehicle.photos?.[0] || null,
          } : null
        };
      }).filter(ts => ts.vehicle);
      
      // Conversion tracking: calculate inquiry-to-sale rates
      const vehiclesWithInquiries = inventory.filter(v => 
        inquiries.some(i => i.inventoryCarId === v.id)
      );
      const soldWithInquiries = vehiclesWithInquiries.filter(v => v.status === "sold");
      const overallConversionRate = vehiclesWithInquiries.length > 0 
        ? (soldWithInquiries.length / vehiclesWithInquiries.length) * 100 
        : 0;
      
      // Per-vehicle conversion data (top 10 by inquiry count)
      // Conversion rate = 1/inquiryCount * 100 if sold, showing efficiency
      // (How many inquiries it took to close the deal - lower inquiry count = higher efficiency)
      const vehicleConversions = inventory.map(vehicle => {
        const vehicleInquiries = inquiries.filter(i => i.inventoryCarId === vehicle.id);
        const sold = vehicle.status === "sold";
        const converted = sold && vehicleInquiries.length > 0;
        // Efficiency rate: if sold, shows 1/inquiryCount as percentage (higher = fewer inquiries needed)
        // For sold vehicles: 1 inquiry = 100%, 2 inquiries = 50%, 5 inquiries = 20%, etc.
        const efficiencyRate = sold && vehicleInquiries.length > 0 
          ? Math.round((1 / vehicleInquiries.length) * 100) 
          : (vehicleInquiries.length > 0 ? 0 : null);
        return {
          vehicleId: vehicle.id,
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          status: vehicle.status,
          price: vehicle.price,
          photo: vehicle.photos?.[0] || null,
          inquiryCount: vehicleInquiries.length,
          sold,
          converted,
          efficiencyRate,
        };
      })
        .filter(v => v.inquiryCount > 0)
        .sort((a, b) => b.inquiryCount - a.inquiryCount)
        .slice(0, 10);
      
      res.json({
        totalViews,
        totalSaves,
        inventory: {
          total: inventory.length,
          available: availableCount,
          sold: soldCount,
        },
        inquiries: {
          total: inquiries.length,
          new: newInquiries,
        },
        consignments: {
          total: consignments.length,
          pending: pendingConsignments,
        },
        alerts: {
          total: alerts.length,
          active: activeAlerts,
        },
        mostViewed: mostViewedWithDetails,
        topSaved: topSavedWithDetails,
        conversions: {
          vehiclesWithInquiries: vehiclesWithInquiries.length,
          soldWithInquiries: soldWithInquiries.length,
          overallConversionRate: Math.round(overallConversionRate * 10) / 10,
          topVehicles: vehicleConversions,
        },
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // ====================== TARGET LOCATIONS ======================
  
  app.get("/api/locations", async (req, res) => {
    try {
      const locations = await storage.getAllTargetLocations();
      res.json(locations);
    } catch (error) {
      console.error("Error fetching locations:", error);
      res.status(500).json({ error: "Failed to fetch locations" });
    }
  });

  app.get("/api/locations/active", async (req, res) => {
    try {
      const locations = await storage.getActiveTargetLocations();
      res.json(locations);
    } catch (error) {
      console.error("Error fetching active locations:", error);
      res.status(500).json({ error: "Failed to fetch active locations" });
    }
  });

  app.get("/api/locations/:slug", async (req, res) => {
    try {
      const location = await storage.getTargetLocationBySlug(req.params.slug);
      if (!location) {
        return res.status(404).json({ error: "Location not found" });
      }
      res.json(location);
    } catch (error) {
      console.error("Error fetching location:", error);
      res.status(500).json({ error: "Failed to fetch location" });
    }
  });

  app.post("/api/locations", requireAdmin, async (req, res) => {
    try {
      const { city, state, headline, description, metaTitle, metaDescription, radius, isActive, isPrimary, sortOrder } = req.body;
      const slug = slugify(`${city}-${state}`);
      const location = await storage.createTargetLocation({
        city,
        state,
        slug,
        headline,
        description,
        metaTitle,
        metaDescription,
        radius: radius || 50,
        isActive: isActive ?? true,
        isPrimary: isPrimary ?? false,
        sortOrder: sortOrder || 0,
      });
      res.status(201).json(location);
    } catch (error) {
      console.error("Error creating location:", error);
      res.status(500).json({ error: "Failed to create location" });
    }
  });

  app.put("/api/locations/:id", requireAdmin, async (req, res) => {
    try {
      const { city, state, headline, description, metaTitle, metaDescription, radius, isActive, isPrimary, sortOrder } = req.body;
      const updates: any = { headline, description, metaTitle, metaDescription, radius, isActive, isPrimary, sortOrder };
      if (city && state) {
        updates.city = city;
        updates.state = state;
        updates.slug = slugify(`${city}-${state}`);
      }
      const location = await storage.updateTargetLocation(req.params.id, updates);
      if (!location) {
        return res.status(404).json({ error: "Location not found" });
      }
      res.json(location);
    } catch (error) {
      console.error("Error updating location:", error);
      res.status(500).json({ error: "Failed to update location" });
    }
  });

  app.delete("/api/locations/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteTargetLocation(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Location not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting location:", error);
      res.status(500).json({ error: "Failed to delete location" });
    }
  });

  // ====================== CITATIONS ======================
  
  app.get("/api/citations/directories", async (req, res) => {
    try {
      const directories = await storage.getAllCitationDirectories();
      res.json(directories);
    } catch (error) {
      console.error("Error fetching directories:", error);
      res.status(500).json({ error: "Failed to fetch directories" });
    }
  });

  app.get("/api/citations/directories/aggregators", async (req, res) => {
    try {
      const aggregators = await storage.getAggregatorDirectories();
      res.json(aggregators);
    } catch (error) {
      console.error("Error fetching aggregators:", error);
      res.status(500).json({ error: "Failed to fetch aggregators" });
    }
  });

  app.get("/api/citations/submissions", requireAdmin, async (req, res) => {
    try {
      const submissions = await storage.getAllCitationSubmissions();
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  app.get("/api/citations/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getCitationStats();
      const directories = await storage.getAllCitationDirectories();
      res.json({ ...stats, totalDirectories: directories.length });
    } catch (error) {
      console.error("Error fetching citation stats:", error);
      res.status(500).json({ error: "Failed to fetch citation stats" });
    }
  });

  app.post("/api/citations/submissions", requireAdmin, async (req, res) => {
    try {
      const { directoryId, directoryName, status, listingUrl, notes } = req.body;
      const submission = await storage.createCitationSubmission({
        directoryId,
        directoryName,
        status: status || "pending",
        listingUrl,
        notes,
        submittedAt: status === "submitted" ? new Date() : null,
      });
      res.status(201).json(submission);
    } catch (error) {
      console.error("Error creating submission:", error);
      res.status(500).json({ error: "Failed to create submission" });
    }
  });

  app.put("/api/citations/submissions/:id", requireAdmin, async (req, res) => {
    try {
      const { status, listingUrl, notes } = req.body;
      const updates: any = { status, listingUrl, notes };
      if (status === "submitted" && !req.body.submittedAt) {
        updates.submittedAt = new Date();
      }
      if (status === "confirmed" && !req.body.confirmedAt) {
        updates.confirmedAt = new Date();
      }
      const submission = await storage.updateCitationSubmission(req.params.id, updates);
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }
      res.json(submission);
    } catch (error) {
      console.error("Error updating submission:", error);
      res.status(500).json({ error: "Failed to update submission" });
    }
  });

  // NAP Consistency Check
  app.get("/api/citations/nap-check", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      const issues: string[] = [];
      
      if (!settings?.siteName) issues.push("Business name is not set");
      if (!settings?.dealerAddress) issues.push("Street address is not set");
      if (!settings?.dealerCity) issues.push("City is not set");
      if (!settings?.dealerState) issues.push("State is not set");
      if (!settings?.contactPhone) issues.push("Phone number is not set");
      if (!settings?.contactEmail) issues.push("Email is not set");
      if (!settings?.baseUrl) issues.push("Website URL is not set");
      
      const napData = {
        name: settings?.siteName || "",
        address: settings?.dealerAddress || "",
        city: settings?.dealerCity || "",
        state: settings?.dealerState || "",
        phone: settings?.contactPhone || "",
        email: settings?.contactEmail || "",
        website: settings?.baseUrl || "",
        hours: settings?.dealerHours || "",
        googleMapUrl: settings?.googleMapUrl || "",
      };
      
      res.json({
        isComplete: issues.length === 0,
        issues,
        napData,
      });
    } catch (error) {
      console.error("Error checking NAP:", error);
      res.status(500).json({ error: "Failed to check NAP consistency" });
    }
  });

  // Citation Export
  app.get("/api/citations/export", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      const format = req.query.format || "json";
      
      const napData = {
        businessName: settings?.siteName || "",
        streetAddress: settings?.dealerAddress || "",
        city: settings?.dealerCity || "",
        state: settings?.dealerState || "",
        zipCode: "",
        phone: settings?.contactPhone || "",
        email: settings?.contactEmail || "",
        website: settings?.baseUrl || "",
        hours: settings?.dealerHours || "",
        description: settings?.ogDescription || "",
        categories: "Automotive Dealer, Used Car Dealer, Luxury Car Dealer, Car Consignment",
      };
      
      if (format === "csv") {
        const csv = Object.entries(napData).map(([key, value]) => `"${key}","${value}"`).join("\n");
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=nap-data.csv");
        res.send(csv);
      } else {
        res.json(napData);
      }
    } catch (error) {
      console.error("Error exporting citations:", error);
      res.status(500).json({ error: "Failed to export citation data" });
    }
  });

  // ====================== PUSH NOTIFICATIONS ======================
  
  // Get VAPID public key for client subscription
  app.get("/api/push/vapid-key", (req, res) => {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    if (!publicKey) {
      return res.status(500).json({ error: "VAPID key not configured" });
    }
    res.send(publicKey);
  });

  // Subscribe to push notifications
  app.post("/api/push/subscribe", async (req, res) => {
    try {
      const { subscription, preferences } = req.body;
      
      console.log("[push] Subscribe request received:", { 
        hasEndpoint: !!subscription?.endpoint, 
        hasKeys: !!subscription?.keys,
        preferences 
      });
      
      if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
        console.log("[push] Invalid subscription - missing fields:", {
          hasEndpoint: !!subscription?.endpoint,
          hasP256dh: !!subscription?.keys?.p256dh,
          hasAuth: !!subscription?.keys?.auth
        });
        return res.status(400).json({ error: "Invalid subscription data - missing required fields" });
      }

      // Check if already subscribed
      const existing = await storage.getPushSubscriptionByEndpoint(subscription.endpoint);
      if (existing) {
        console.log("[push] Updating existing subscription:", existing.id);
        await storage.updatePushSubscription(existing.id, {
          preferredMakes: preferences?.preferredMakes || [],
          notifyNewListings: preferences?.notifyNewListings ?? true,
          notifyPriceDrops: preferences?.notifyPriceDrops ?? true,
          notifySpecialOffers: preferences?.notifySpecialOffers ?? true,
        });
        return res.json({ success: true, message: "Preferences updated" });
      }

      const newSub = await storage.createPushSubscription({
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        preferredMakes: preferences?.preferredMakes || [],
        notifyNewListings: preferences?.notifyNewListings ?? true,
        notifyPriceDrops: preferences?.notifyPriceDrops ?? true,
        notifySpecialOffers: preferences?.notifySpecialOffers ?? true,
        userAgent: req.get('user-agent') || null,
      });

      console.log("[push] New subscription created:", newSub.id);
      res.status(201).json({ success: true, message: "Subscribed to notifications" });
    } catch (error: any) {
      console.error("[push] Subscription error:", error.message, error.stack);
      res.status(500).json({ error: "Failed to subscribe: " + error.message });
    }
  });

  // Unsubscribe from push notifications
  app.post("/api/push/unsubscribe", async (req, res) => {
    try {
      const { endpoint } = req.body;
      if (!endpoint) {
        return res.status(400).json({ error: "Endpoint required" });
      }
      await storage.deletePushSubscription(endpoint);
      res.json({ success: true });
    } catch (error) {
      console.error("Error unsubscribing:", error);
      res.status(500).json({ error: "Failed to unsubscribe" });
    }
  });

  // Get subscription count (admin)
  app.get("/api/push/stats", requireAdmin, async (req, res) => {
    try {
      const count = await storage.getPushSubscriptionCount();
      const notifications = await storage.getAllPushNotifications();
      
      // Get counts by category
      const categoryCounts = {
        all: count,
        new_listings: await storage.getPushSubscriptionCountByCategory("new_listings"),
        price_drops: await storage.getPushSubscriptionCountByCategory("price_drops"),
        special_offers: await storage.getPushSubscriptionCountByCategory("special_offers"),
        hot_listings: await storage.getPushSubscriptionCountByCategory("hot_listings"),
      };
      
      res.json({ 
        subscriberCount: count,
        categoryCounts,
        notificationsSent: notifications.length,
        lastNotification: notifications[0] || null,
      });
    } catch (error) {
      console.error("Error fetching push stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Get all subscriptions (admin)
  app.get("/api/push/subscriptions", requireAdmin, async (req, res) => {
    try {
      const subscriptions = await storage.getAllPushSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  // Get notification history (admin)
  app.get("/api/push/notifications", requireAdmin, async (req, res) => {
    try {
      const notifications = await storage.getAllPushNotifications();
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Send push notification (admin)
  app.post("/api/push/send", requireAdmin, async (req, res) => {
    try {
      const { title, body, url, imageUrl, targetType, targetMakes, targetCategory } = req.body;
      
      console.log("[push] Send request:", { title, body, url, targetCategory });
      
      if (!title || !body) {
        return res.status(400).json({ error: "Title and body required" });
      }

      // Import web-push dynamically
      const webpush = await import('web-push');
      
      const publicKey = process.env.VAPID_PUBLIC_KEY;
      const privateKey = process.env.VAPID_PRIVATE_KEY;
      
      console.log("[push] VAPID keys present:", { hasPublic: !!publicKey, hasPrivate: !!privateKey });
      
      if (!publicKey || !privateKey) {
        console.error("[push] VAPID keys not configured!");
        return res.status(500).json({ error: "VAPID keys not configured - check environment variables" });
      }

      const settings = await storage.getSiteSettings();
      webpush.setVapidDetails(
        `mailto:${settings?.contactEmail || 'admin@example.com'}`,
        publicKey,
        privateKey
      );

      // Get subscriptions based on category preference
      const category = targetCategory || 'all';
      let subscriptions = await storage.getPushSubscriptionsByCategory(category);
      console.log("[push] Found subscriptions for category", category, ":", subscriptions.length);
      
      // Further filter by make if specified
      if (targetType === 'make' && targetMakes?.length > 0) {
        subscriptions = subscriptions.filter(sub => 
          !sub.preferredMakes || sub.preferredMakes.length === 0 ||
          sub.preferredMakes.some((m: string) => targetMakes.includes(m))
        );
      }

      // Save notification record
      const notification = await storage.createPushNotification({
        title,
        body,
        url,
        imageUrl,
        targetType: targetType || 'all',
        targetCategory: category,
        targetMakes: targetMakes || [],
        createdBy: req.user?.id,
      });

      // Send to all subscriptions
      const payload = JSON.stringify({
        title,
        body,
        url: url || '/',
        image: imageUrl,
        tag: notification.id,
      });

      let successCount = 0;
      let failedEndpoints: string[] = [];

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
          }, payload);
          successCount++;
        } catch (error: any) {
          console.error("[push] Failed to send to subscription:", sub.id, error.statusCode, error.body);
          if (error.statusCode === 410) {
            // Subscription expired, remove it
            console.log("[push] Removing expired subscription:", sub.id);
            await storage.deletePushSubscription(sub.endpoint);
          }
          failedEndpoints.push(sub.endpoint);
        }
      }
      
      console.log("[push] Send complete:", { successCount, failed: failedEndpoints.length });

      await storage.updatePushNotificationSentCount(notification.id, successCount);

      res.json({ 
        success: true, 
        sent: successCount, 
        failed: failedEndpoints.length,
        notificationId: notification.id,
      });
    } catch (error) {
      console.error("Error sending push notification:", error);
      res.status(500).json({ error: "Failed to send notifications" });
    }
  });

  // Send test push notification to a specific subscription (admin)
  app.post("/api/push/test", requireAdmin, async (req, res) => {
    try {
      const { endpoint } = req.body;
      
      console.log("[push] Test notification request for endpoint");
      
      if (!endpoint) {
        return res.status(400).json({ error: "Subscription endpoint required" });
      }

      // Find the subscription
      const subscription = await storage.getPushSubscriptionByEndpoint(endpoint);
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      // Import web-push dynamically
      const webpush = await import('web-push');
      
      const publicKey = process.env.VAPID_PUBLIC_KEY;
      const privateKey = process.env.VAPID_PRIVATE_KEY;
      
      if (!publicKey || !privateKey) {
        return res.status(500).json({ error: "VAPID keys not configured" });
      }

      const settings = await storage.getSiteSettings();
      webpush.setVapidDetails(
        `mailto:${settings?.contactEmail || 'admin@example.com'}`,
        publicKey,
        privateKey
      );

      const payload = JSON.stringify({
        title: "Test Notification",
        body: "This is a test notification from the admin panel. Push notifications are working!",
        url: "/admin/notifications",
        tag: "test-" + Date.now(),
      });

      try {
        await webpush.sendNotification({
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth }
        }, payload);
        
        console.log("[push] Test notification sent successfully");
        res.json({ success: true, message: "Test notification sent!" });
      } catch (error: any) {
        console.error("[push] Test notification failed:", error.statusCode, error.body);
        if (error.statusCode === 410) {
          await storage.deletePushSubscription(subscription.endpoint);
          return res.status(410).json({ error: "Subscription expired - please re-subscribe" });
        }
        throw error;
      }
    } catch (error: any) {
      console.error("Error sending test notification:", error);
      res.status(500).json({ error: "Failed to send test: " + error.message });
    }
  });

  // ====================== SEO ENDPOINTS ======================
  
  // robots.txt - dynamic based on settings
  app.get("/robots.txt", async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      const baseUrl = settings?.baseUrl || `https://${req.get('host')}`;
      
      const robotsTxt = `# Prestige Auto Consignment robots.txt
User-agent: *
Allow: /
Allow: /vehicle/
Allow: /inventory/
Allow: /inventory/*

Disallow: /admin
Disallow: /admin/*
Disallow: /api/
Disallow: /api/*

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml
`;
      res.type('text/plain').send(robotsTxt);
    } catch (error) {
      console.error("Error generating robots.txt:", error);
      res.status(500).send("Error generating robots.txt");
    }
  });

  // sitemap.xml - dynamic based on inventory
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      const baseUrl = settings?.baseUrl || `https://${req.get('host')}`;
      const inventory = await storage.getAllInventoryCars();
      
      const urls: string[] = [];
      
      // Static pages
      urls.push(`
    <url>
      <loc>${baseUrl}/</loc>
      <changefreq>daily</changefreq>
      <priority>1.0</priority>
    </url>`);
      
      urls.push(`
    <url>
      <loc>${baseUrl}/inventory</loc>
      <changefreq>daily</changefreq>
      <priority>0.9</priority>
    </url>`);
      
      urls.push(`
    <url>
      <loc>${baseUrl}/consign</loc>
      <changefreq>weekly</changefreq>
      <priority>0.7</priority>
    </url>`);
      
      urls.push(`
    <url>
      <loc>${baseUrl}/trade-in</loc>
      <changefreq>weekly</changefreq>
      <priority>0.6</priority>
    </url>`);
      
      // Target Location Pages
      const targetLocations = await storage.getActiveTargetLocations();
      for (const location of targetLocations) {
        urls.push(`
    <url>
      <loc>${baseUrl}/location/${location.slug}</loc>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>`);
        
        // Inventory by location
        urls.push(`
    <url>
      <loc>${baseUrl}/inventory/location/${location.slug}</loc>
      <changefreq>daily</changefreq>
      <priority>0.8</priority>
    </url>`);
      }
      
      // Primary dealer location (fallback if no target locations)
      if (targetLocations.length === 0 && settings?.dealerCity && settings?.dealerState) {
        const locationSlug = slugify(`${settings.dealerCity}-${settings.dealerState}`);
        urls.push(`
    <url>
      <loc>${baseUrl}/location/${locationSlug}</loc>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>`);
      }
      
      // Vehicle pages
      const availableCars = inventory.filter(car => car.status === "available" || car.status === "pending");
      for (const car of availableCars) {
        // Generate slug on-the-fly if not stored (entity-based, no location)
        const vehicleSlug = car.slug || generateVehicleSlug({
          year: car.year,
          make: car.make,
          model: car.model,
          trim: settings?.slugIncludeTrim !== false ? (car.trim || null) : null,
          id: car.id,
          stockNumber: settings?.slugIncludeStock ? (car.stockNumber || null) : null,
        });
        urls.push(`
    <url>
      <loc>${baseUrl}/inventory/${vehicleSlug}</loc>
      <lastmod>${car.createdAt ? new Date(car.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>`);
      }
      
      // Make pages
      const makes = Array.from(new Set(availableCars.map(c => c.make)));
      for (const make of makes) {
        const makeSlug = slugify(make);
        urls.push(`
    <url>
      <loc>${baseUrl}/inventory/make/${makeSlug}</loc>
      <changefreq>weekly</changefreq>
      <priority>0.7</priority>
    </url>`);
        
        // Model pages for each make
        const modelsForMake = Array.from(new Set(availableCars.filter(c => c.make === make).map(c => c.model)));
        for (const model of modelsForMake) {
          const modelSlug = slugify(model);
          urls.push(`
    <url>
      <loc>${baseUrl}/inventory/make/${makeSlug}/model/${modelSlug}</loc>
      <changefreq>weekly</changefreq>
      <priority>0.6</priority>
    </url>`);
        }
      }
      
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('')}
</urlset>`;
      
      res.type('application/xml').send(sitemap);
    } catch (error) {
      console.error("Error generating sitemap.xml:", error);
      res.status(500).send("Error generating sitemap.xml");
    }
  });

  // Get canonical URL for a vehicle
  app.get("/api/vehicle/canonical/:idOrSlug", async (req, res) => {
    try {
      const { idOrSlug } = req.params;
      const settings = await storage.getSiteSettings();
      const baseUrl = settings?.baseUrl || `https://${req.get('host')}`;
      
      // Try to find vehicle by slug or ID
      let car = await storage.getInventoryCarBySlug(idOrSlug);
      if (!car) {
        car = await storage.getInventoryCar(idOrSlug);
      }
      
      // Also try extracting UUID/short ID/stock number from slug and looking up
      if (!car) {
        const extractedId = extractIdFromSlug(idOrSlug);
        if (extractedId) {
          // Check if it's a stock number reference
          if (extractedId.startsWith('stk:')) {
            const stockNum = extractedId.substring(4);
            car = await storage.getInventoryCarByStockNumber(stockNum);
          } else if (extractedId.length === 8) {
            // Short ID format
            car = await storage.getInventoryCarByShortId(extractedId);
          } else {
            // Full UUID format
            car = await storage.getInventoryCar(extractedId);
          }
        }
      }
      
      if (!car) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      
      // Generate canonical slug if needed (entity-based, no location)
      let canonicalSlug = car.slug;
      if (!canonicalSlug) {
        canonicalSlug = generateVehicleSlug({
          year: car.year,
          make: car.make,
          model: car.model,
          trim: settings?.slugIncludeTrim ? (car.trim || null) : null,
          id: car.id,
          stockNumber: settings?.slugIncludeStock ? (car.stockNumber || null) : null,
        });
      }
      
      res.json({
        id: car.id,
        slug: canonicalSlug,
        canonicalUrl: `${baseUrl}/inventory/${canonicalSlug}`,
        needsRedirect: idOrSlug !== canonicalSlug,
      });
    } catch (error) {
      console.error("Error getting canonical URL:", error);
      res.status(500).json({ error: "Failed to get canonical URL" });
    }
  });

  // ====================== SMS CONVERSATIONS ======================

  // Get all SMS conversations
  app.get("/api/sms/conversations", requireAdmin, async (req, res) => {
    try {
      const conversations = await storage.getAllSmsConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching SMS conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Send SMS reply
  app.post("/api/sms/send", requireAdmin, async (req, res) => {
    try {
      const { phone, body, inquiryId } = req.body;
      
      if (!phone || !body) {
        return res.status(400).json({ error: "Phone and message body are required" });
      }

      // Get GHL credentials
      const { locationId, apiToken } = await getGHLCredentials();
      
      if (!locationId || !apiToken) {
        return res.status(400).json({ error: "GoHighLevel not configured" });
      }

      // Normalize phone number for reliable search
      const normalizedPhone = normalizePhoneNumber(phone);
      const digitsOnly = normalizedPhone.replace(/\D/g, '');
      
      console.log("[SMS Send] Sending to phone:", normalizedPhone, "digits:", digitsOnly);

      // Send SMS via GHL
      // First, find or create contact
      let ghlContactId: string | undefined;
      
      try {
        // Search for contact by phone - try multiple formats
        const searchQueries = [normalizedPhone, digitsOnly, phone];
        
        for (const query of searchQueries) {
          const searchRes = await fetch(
            `https://services.leadconnectorhq.com/contacts/search?locationId=${locationId}&query=${encodeURIComponent(query)}`,
            {
              headers: {
                "Authorization": `Bearer ${apiToken}`,
                "Version": "2021-07-28",
                "Content-Type": "application/json",
              },
            }
          );
          
          if (searchRes.ok) {
            const searchData = await searchRes.json();
            if (searchData.contacts && searchData.contacts.length > 0) {
              ghlContactId = searchData.contacts[0].id;
              console.log("[SMS Send] Found contact in GHL:", ghlContactId);
              break;
            }
          }
        }
      } catch (e) {
        console.error("Error searching GHL contact:", e);
      }

      // If contact not found, create one
      if (!ghlContactId) {
        console.log("[SMS Send] Contact not found, creating new contact");
        try {
          const createRes = await fetch(
            `https://services.leadconnectorhq.com/contacts/upsert`,
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${apiToken}`,
                "Version": "2021-07-28",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                phone: normalizedPhone,
                locationId,
                firstName: "Customer",
                source: "Admin SMS Panel",
                tags: ["SMS Contact"],
              }),
            }
          );
          
          if (createRes.ok) {
            const createData = await createRes.json();
            ghlContactId = createData.contact?.id;
            if (ghlContactId) {
              console.log("[SMS Send] Created contact in GHL:", ghlContactId);
            } else {
              console.error("[SMS Send] Contact created but no ID returned:", JSON.stringify(createData));
              return res.status(500).json({ 
                error: "GoHighLevel returned success but no contact ID - please check your API permissions" 
              });
            }
          } else {
            const errText = await createRes.text();
            console.error("[SMS Send] Failed to create contact:", createRes.status, errText);
            let errorMessage = "Failed to create contact in GoHighLevel";
            try {
              const errData = JSON.parse(errText);
              errorMessage = errData.message || errData.error || errorMessage;
            } catch (e) {}
            return res.status(createRes.status === 401 ? 401 : 500).json({ 
              error: `GoHighLevel error: ${errorMessage}` 
            });
          }
        } catch (e: any) {
          console.error("Error creating GHL contact:", e);
          return res.status(500).json({ error: `Network error contacting GoHighLevel: ${e.message}` });
        }
      }

      if (!ghlContactId) {
        return res.status(400).json({ error: "Could not find or create contact in GoHighLevel" });
      }

      // Send message via GHL Conversations API
      const sendRes = await fetch(
        `https://services.leadconnectorhq.com/conversations/messages`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiToken}`,
            "Version": "2021-04-15",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "SMS",
            contactId: ghlContactId,
            message: body,
          }),
        }
      );

      if (!sendRes.ok) {
        const errText = await sendRes.text();
        console.error("GHL send error:", errText);
        return res.status(500).json({ error: "Failed to send SMS via GoHighLevel" });
      }

      const sendData = await sendRes.json();

      // Store the outbound message
      const message = await storage.createSmsMessage({
        inquiryId: inquiryId || null,
        ghlContactId,
        ghlMessageId: sendData.messageId,
        direction: "outbound",
        body,
        phone,
        status: "sent",
        isRead: true,
      });

      // Track last outbound timestamp for recent contacts
      await storage.updateSmsContactLastOutbound(digitsOnly);

      res.json({ success: true, message });
    } catch (error) {
      console.error("Error sending SMS:", error);
      res.status(500).json({ error: "Failed to send SMS" });
    }
  });

  // Webhook for incoming SMS from GoHighLevel
  app.post("/api/webhooks/ghl/sms", async (req, res) => {
    try {
      // Validate webhook token for security
      const token = req.query.token || req.headers['x-webhook-token'];
      const expectedToken = process.env.SMS_WEBHOOK_TOKEN;
      
      if (!expectedToken) {
        console.log("[SMS Webhook] SMS_WEBHOOK_TOKEN not configured - rejecting request");
        return res.status(200).json({ received: true, error: "Webhook not configured" });
      }
      
      if (token !== expectedToken) {
        console.log("[SMS Webhook] Invalid or missing token - rejecting request");
        return res.status(200).json({ received: true, error: "Invalid token" });
      }
      
      const payload = req.body;
      
      console.log("[SMS Webhook] Received GHL SMS webhook:", JSON.stringify(payload, null, 2));

      // GHL webhook payload structure for inbound messages
      const contactId = payload.contactId || payload.contact_id;
      let messageBody = payload.body || payload.message || payload.text;
      const phone = payload.phone || payload.from || payload.contactPhone;
      const messageId = payload.messageId || payload.message_id;
      const conversationId = payload.conversationId || payload.conversation_id;
      const contactName = payload.contactName || payload.contact_name || payload.name;

      // Parse JSON payloads - GHL sometimes sends {"type":2,"body":"Hey"} format
      if (messageBody && typeof messageBody === 'string') {
        try {
          if (messageBody.trim().startsWith('{')) {
            const parsed = JSON.parse(messageBody);
            if (parsed.body) {
              messageBody = parsed.body;
              console.log("[SMS Webhook] Extracted message body from JSON:", messageBody);
            }
          }
        } catch (e) {
          // Not JSON, use as-is
        }
      }

      if (!messageBody || !phone) {
        console.log("[SMS Webhook] Incomplete SMS webhook payload");
        return res.status(200).json({ received: true });
      }

      const normalizedPhone = phone.replace(/\D/g, '');

      // Try to match to an existing inquiry by phone
      const inquiries = await storage.getAllBuyerInquiries();
      const matchingInquiry = inquiries.find(i => 
        i.buyerPhone.replace(/\D/g, '') === normalizedPhone
      );

      // Try to find sender's name from consignment submissions if not provided by GHL
      let senderName = contactName;
      if (!senderName) {
        // Check buyer inquiries first
        if (matchingInquiry) {
          senderName = matchingInquiry.buyerName;
        }
        
        // Check consignment submissions
        if (!senderName) {
          const consignments = await storage.getAllConsignments();
          const matchingConsignment = consignments.find((c: { phone?: string | null }) => 
            c.phone?.replace(/\D/g, '') === normalizedPhone
          );
          if (matchingConsignment) {
            senderName = `${matchingConsignment.firstName} ${matchingConsignment.lastName}`.trim();
          }
        }
      }

      console.log("[SMS Webhook] Sender name resolved to:", senderName || "Unknown");

      // Store the inbound message
      const smsMessage = await storage.createSmsMessage({
        inquiryId: matchingInquiry?.id || null,
        ghlContactId: contactId,
        ghlConversationId: conversationId,
        ghlMessageId: messageId,
        direction: "inbound",
        body: messageBody,
        phone: normalizedPhone,
        status: "delivered",
        isRead: false,
      });

      // Track last inbound timestamp for recent contacts
      await storage.updateSmsContactLastInbound(normalizedPhone);

      // Broadcast real-time update to connected admin clients
      broadcastSmsMessage({
        ...smsMessage,
        senderName: senderName || null,
      });
      console.log("[SMS Webhook] Broadcasted message to WebSocket clients");

      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Error processing SMS webhook:", error);
      res.status(200).json({ received: true }); // Always return 200 to prevent retries
    }
  });

  // Mark messages as read
  app.post("/api/sms/mark-read", requireAdmin, async (req, res) => {
    try {
      const { phone } = req.body;
      if (!phone) {
        return res.status(400).json({ error: "Phone number required" });
      }
      await storage.markSmsMessagesAsRead(phone);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ error: "Failed to mark messages as read" });
    }
  });

  // Get recently viewed SMS contacts
  app.get("/api/sms/recent", requireAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const contacts = await storage.getRecentSmsContacts(limit);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching recent contacts:", error);
      res.status(500).json({ error: "Failed to fetch recent contacts" });
    }
  });

  // Update/set contact display name
  app.put("/api/sms/contacts/:phone/name", requireAdmin, async (req, res) => {
    try {
      const { phone } = req.params;
      const { displayName } = req.body;
      
      if (!displayName || typeof displayName !== 'string') {
        return res.status(400).json({ error: "Display name is required" });
      }
      
      const contact = await storage.upsertSmsContactName(phone, displayName.trim());
      res.json(contact);
    } catch (error) {
      console.error("Error updating contact name:", error);
      res.status(500).json({ error: "Failed to update contact name" });
    }
  });

  // Mark contact as viewed (for recently viewed tracking)
  app.post("/api/sms/contacts/:phone/view", requireAdmin, async (req, res) => {
    try {
      const { phone } = req.params;
      await storage.updateSmsContactLastViewed(phone);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating contact view:", error);
      res.status(500).json({ error: "Failed to update contact view" });
    }
  });

  // Get contact info
  app.get("/api/sms/contacts/:phone", requireAdmin, async (req, res) => {
    try {
      const { phone } = req.params;
      const contact = await storage.getSmsContact(phone);
      res.json(contact || { phone, displayName: null });
    } catch (error) {
      console.error("Error fetching contact:", error);
      res.status(500).json({ error: "Failed to fetch contact" });
    }
  });

  // ====================== SYSTEM CHECK (Master Admin Only) ======================
  
  app.get("/api/system-check", requireMasterAdmin, async (req, res) => {
    const checks: { name: string; status: "pass" | "fail" | "warning"; message: string; details?: any }[] = [];
    
    // 1. Database connectivity
    try {
      const settings = await storage.getSiteSettings();
      checks.push({
        name: "Database Connection",
        status: "pass",
        message: "PostgreSQL database is connected and responsive",
      });
    } catch (error: any) {
      checks.push({
        name: "Database Connection",
        status: "fail",
        message: `Database connection failed: ${error.message}`,
      });
    }

    // 2. Site Settings configured
    try {
      const settings = await storage.getSiteSettings();
      const requiredFields = ["siteName", "contactPhone", "contactEmail"];
      const missingFields = requiredFields.filter(f => !settings?.[f as keyof typeof settings]);
      
      if (missingFields.length === 0) {
        checks.push({
          name: "Site Settings",
          status: "pass",
          message: "Required site settings are configured",
        });
      } else {
        checks.push({
          name: "Site Settings",
          status: "warning",
          message: `Missing settings: ${missingFields.join(", ")}`,
          details: { missingFields },
        });
      }
    } catch (error: any) {
      checks.push({
        name: "Site Settings",
        status: "fail",
        message: error.message,
      });
    }

    // 3. VAPID Keys for Push Notifications
    const vapidPublic = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
    if (vapidPublic && vapidPrivate) {
      checks.push({
        name: "Push Notification Keys",
        status: "pass",
        message: "VAPID keys are configured",
      });
    } else {
      checks.push({
        name: "Push Notification Keys",
        status: "warning",
        message: "VAPID keys not configured - push notifications won't work",
        details: { publicKey: !!vapidPublic, privateKey: !!vapidPrivate },
      });
    }

    // 4. GoHighLevel Integration
    try {
      const { locationId, apiToken, source } = await getGHLCredentials();
      if (locationId && apiToken) {
        const testResult = await testGHLCredentials(apiToken, locationId);
        if (testResult.success) {
          checks.push({
            name: "GoHighLevel CRM",
            status: "pass",
            message: `Connected to ${testResult.locationName || "GoHighLevel"} (via ${source})`,
          });
        } else {
          checks.push({
            name: "GoHighLevel CRM",
            status: "fail",
            message: `GHL configured but connection failed: ${testResult.error}`,
          });
        }
      } else {
        checks.push({
          name: "GoHighLevel CRM",
          status: "warning",
          message: "GoHighLevel not configured - SMS notifications won't work",
        });
      }
    } catch (error: any) {
      checks.push({
        name: "GoHighLevel CRM",
        status: "fail",
        message: `GHL check failed: ${error.message}`,
      });
    }

    // 5. Object Storage
    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (bucketId) {
      checks.push({
        name: "Object Storage",
        status: "pass",
        message: "Object storage bucket is configured",
      });
    } else {
      checks.push({
        name: "Object Storage",
        status: "warning",
        message: "Object storage not configured - file uploads may not persist",
      });
    }

    // 6. Inventory count
    try {
      const inventory = await storage.getAllInventoryCars();
      const total = inventory.length;
      const available = inventory.filter(c => c.status === "available").length;
      const sold = inventory.filter(c => c.status === "sold").length;
      checks.push({
        name: "Inventory Data",
        status: total > 0 ? "pass" : "warning",
        message: `${total} vehicles (${available} available, ${sold} sold)`,
      });
    } catch (error: any) {
      checks.push({
        name: "Inventory Data",
        status: "fail",
        message: error.message,
      });
    }

    // 7. Admin users
    try {
      const users = await storage.getAllUsers();
      const masterCount = users.filter(u => u.role === "master").length;
      const adminCount = users.filter(u => u.role === "admin").length;
      checks.push({
        name: "Admin Users",
        status: masterCount > 0 ? "pass" : "fail",
        message: `${masterCount} master admin(s), ${adminCount} regular admin(s)`,
      });
    } catch (error: any) {
      checks.push({
        name: "Admin Users",
        status: "fail",
        message: error.message,
      });
    }

    // 8. Push Notification Subscribers
    try {
      const count = await storage.getPushSubscriptionCount();
      checks.push({
        name: "Push Subscribers",
        status: "pass",
        message: `${count} active subscriber(s)`,
      });
    } catch (error: any) {
      checks.push({
        name: "Push Subscribers",
        status: "warning",
        message: `Could not fetch subscriber count: ${error.message}`,
      });
    }

    // 9. SEO Configuration
    try {
      const settings = await storage.getSiteSettings();
      const seoFields = ["baseUrl", "dealerCity", "dealerState"];
      const configured = seoFields.filter(f => settings?.[f as keyof typeof settings]);
      
      if (configured.length === seoFields.length) {
        checks.push({
          name: "SEO Configuration",
          status: "pass",
          message: "Local SEO settings are configured",
        });
      } else {
        const missing = seoFields.filter(f => !settings?.[f as keyof typeof settings]);
        checks.push({
          name: "SEO Configuration",
          status: "warning",
          message: `Missing SEO settings: ${missing.join(", ")}`,
          details: { missing },
        });
      }
    } catch (error: any) {
      checks.push({
        name: "SEO Configuration",
        status: "fail",
        message: error.message,
      });
    }

    // Summary
    const passed = checks.filter(c => c.status === "pass").length;
    const warnings = checks.filter(c => c.status === "warning").length;
    const failed = checks.filter(c => c.status === "fail").length;
    const overall = failed > 0 ? "fail" : warnings > 0 ? "warning" : "pass";
    const overallStatus = overall === "fail" ? "unhealthy" : overall === "warning" ? "degraded" : "healthy";

    // Save to database for history tracking
    try {
      await storage.createHealthCheck({
        runAt: new Date(),
        overallStatus,
        results: JSON.stringify(checks),
        duration: undefined,
        triggeredBy: "manual"
      });
    } catch (saveError) {
      console.error("[system-check] Failed to save health check:", saveError);
    }

    res.json({
      timestamp: new Date().toISOString(),
      summary: {
        total: checks.length,
        passed,
        warnings,
        failed,
        overall,
      },
      checks,
    });
  });
  
  // Get system check history
  app.get("/api/system-check/history", requireMasterAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const history = await storage.getHealthCheckHistory(limit);
      res.json(history.map(h => ({
        id: h.id,
        runAt: h.runAt,
        overallStatus: h.overallStatus,
        checks: JSON.parse(h.results),
        triggeredBy: h.triggeredBy
      })));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}

export async function initializeDefaultAdmin(): Promise<void> {
  console.log("[auth] Initializing default admin account...");
  try {
    const existingAdmin = await storage.getUserByUsername("Josh");
    if (existingAdmin) {
      console.log(`[auth] Default admin user 'Josh' found with role: '${existingAdmin.role}'`);
      // ALWAYS ensure Josh has master role - hardcoded requirement
      if (existingAdmin.role !== "master") {
        console.log("[auth] Upgrading 'Josh' to master role...");
        const updated = await storage.updateUserRole(existingAdmin.id, "master");
        if (updated) {
          console.log("[auth] 'Josh' successfully upgraded to master role");
        } else {
          console.error("[auth] Failed to upgrade 'Josh' to master role");
        }
      } else {
        console.log("[auth] 'Josh' already has master role - verified");
      }
      // Also ensure Josh is marked as admin
      if (!existingAdmin.isAdmin) {
        console.log("[auth] Ensuring 'Josh' is marked as admin...");
        await storage.setUserAdmin(existingAdmin.id, true);
      }
    } else {
      const hashedPassword = "d7da12f7f0b51ba5ab3e7bb2617161d7:a5d33d043a5bfc73921e861303f31e6a9a6909740dc0368989809ddec3b64526e3f4cab9bd1569dd166d2f4043dc441645c821b0e1582b6547a0ebebeed9e00d";
      await storage.createUser({
        username: "Josh",
        password: hashedPassword,
        isAdmin: true,
        role: "master",
      });
      console.log("[auth] Default admin user 'Josh' created successfully with master role");
    }
  } catch (error) {
    console.error("[auth] Error initializing default admin:", error);
  }
}

export async function seedDatabaseFromConfig(): Promise<void> {
  console.log("[seed] Checking if database needs seeding...");
  try {
    const { seedSettings, seedAdmin, getHashedAdminPassword } = await import("./seed-data");
    
    const currentSettings = await storage.getSiteSettings();
    const needsSeeding = !currentSettings || !currentSettings.siteName || currentSettings.siteName === "Your Company Name";
    
    if (needsSeeding) {
      console.log("[seed] Seeding site settings from configuration...");
      
      const existingAdmin = await storage.getUserByUsername(seedAdmin.username);
      if (!existingAdmin) {
        console.log(`[seed] Creating admin user '${seedAdmin.username}'...`);
        const hashedPassword = await getHashedAdminPassword();
        await storage.createUser({
          username: seedAdmin.username,
          password: hashedPassword,
          isAdmin: true,
          role: "master",
        });
        console.log(`[seed] Admin user '${seedAdmin.username}' created`);
      }
      
      const preservedSettings = currentSettings ? {
        ghlApiToken: currentSettings.ghlApiToken,
        ghlLocationId: currentSettings.ghlLocationId,
        demoModeActive: currentSettings.demoModeActive,
      } : {};
      
      await storage.updateSiteSettings({
        primaryColor: seedSettings.primaryColor,
        backgroundColor: seedSettings.backgroundColor,
        mainMenuColor: seedSettings.mainMenuColor,
        mainMenuHoverColor: seedSettings.mainMenuHoverColor,
        contactButtonColor: seedSettings.contactButtonColor,
        contactButtonHoverColor: seedSettings.contactButtonHoverColor,
        menuFontSize: seedSettings.menuFontSize,
        bodyFontSize: seedSettings.bodyFontSize,
        menuAllCaps: seedSettings.menuAllCaps,
        vehicleTitleColor: seedSettings.vehicleTitleColor,
        vehiclePriceColor: seedSettings.vehiclePriceColor,
        stepBgColor: seedSettings.stepBgColor,
        stepNumberColor: seedSettings.stepNumberColor,
        socialIconBgColor: seedSettings.socialIconBgColor,
        socialIconHoverColor: seedSettings.socialIconHoverColor,
        footerTagline: seedSettings.footerTagline,
        logoUrl: seedSettings.logoUrl,
        logoWidth: seedSettings.logoWidth,
        siteName: seedSettings.siteName,
        contactAddress1: seedSettings.contactAddress1,
        contactAddress2: seedSettings.contactAddress2,
        contactPhone: seedSettings.contactPhone,
        contactEmail: seedSettings.contactEmail,
        facebookUrl: seedSettings.facebookUrl,
        instagramUrl: seedSettings.instagramUrl,
        twitterUrl: seedSettings.twitterUrl,
        youtubeUrl: seedSettings.youtubeUrl,
        tiktokUrl: seedSettings.tiktokUrl,
        commissionRate: seedSettings.commissionRate,
        avgDaysToFirstInquiry: seedSettings.avgDaysToFirstInquiry,
        avgDaysToSell: seedSettings.avgDaysToSell,
        ...preservedSettings,
      });
      console.log("[seed] Site settings seeded successfully");
    } else {
      console.log("[seed] Site settings already configured, skipping seed");
    }
    
    // Seed citation directories if none exist
    const existingDirectories = await storage.getAllCitationDirectories();
    if (existingDirectories.length === 0) {
      console.log("[seed] Seeding citation directories...");
      
      const citationDirectorySeedData = [
        // Data Aggregators (submit to these first - they distribute to 100+ sites)
        { name: "Data Axle", url: "https://www.data-axle.com", category: "Data Aggregator", submissionType: "paid", priority: 1, isAggregator: true, notes: "Major aggregator that feeds Yelp, YP, Superpages, and 100+ directories. Paid service but highest coverage." },
        { name: "Neustar Localeze", url: "https://www.neustarlocaleze.biz", category: "Data Aggregator", submissionType: "paid", priority: 2, isAggregator: true, notes: "Second largest aggregator. Feeds GPS systems, 411 directories, and search engines." },
        { name: "Foursquare", url: "https://business.foursquare.com", category: "Data Aggregator", submissionType: "free", priority: 3, isAggregator: true, notes: "Free listing that feeds Apple Maps, Uber, Snapchat, and many apps." },
        { name: "Factual (Now part of Foursquare)", url: "https://foursquare.com/products/places", category: "Data Aggregator", submissionType: "free", priority: 4, isAggregator: true, notes: "Merged with Foursquare. Data powers Bing, Apple, and Facebook." },
        
        // Core Directories (highest priority manual submissions)
        { name: "Google Business Profile", url: "https://business.google.com", category: "Core", submissionType: "free", priority: 1, isAggregator: false, notes: "Most important! Verify your listing immediately. Affects Google Search and Maps." },
        { name: "Yelp", url: "https://biz.yelp.com", category: "Core", submissionType: "free", priority: 2, isAggregator: false, notes: "High authority. Claim and complete your profile with photos." },
        { name: "Facebook Business", url: "https://www.facebook.com/business/pages/set-up", category: "Core", submissionType: "free", priority: 3, isAggregator: false, notes: "Create a Business Page. Enable reviews and keep info current." },
        { name: "Apple Maps", url: "https://mapsconnect.apple.com", category: "Core", submissionType: "free", priority: 4, isAggregator: false, notes: "Important for iPhone users. Verify through Apple Business Connect." },
        { name: "Bing Places", url: "https://www.bingplaces.com", category: "Core", submissionType: "free", priority: 5, isAggregator: false, notes: "Second largest search engine. Import from Google Business Profile." },
        
        // Business Directories
        { name: "Better Business Bureau", url: "https://www.bbb.org/get-accredited", category: "Business", submissionType: "paid", priority: 6, isAggregator: false, notes: "Accreditation builds trust. High authority backlink." },
        { name: "Chamber of Commerce", url: "https://www.uschamber.com/co/chambers", category: "Business", submissionType: "paid", priority: 7, isAggregator: false, notes: "Join your local chamber for a quality citation and networking." },
        { name: "Yellow Pages", url: "https://www.yellowpages.com/advertise", category: "Business", submissionType: "free", priority: 8, isAggregator: false, notes: "Still relevant for local search. Free basic listing available." },
        
        // Automotive-Specific
        { name: "Cars.com Dealer", url: "https://www.cars.com/sell/", category: "Automotive", submissionType: "paid", priority: 9, isAggregator: false, notes: "Major auto marketplace. Paid dealer subscriptions available." },
        { name: "Autotrader Dealer", url: "https://www.autotrader.com/dealers", category: "Automotive", submissionType: "paid", priority: 10, isAggregator: false, notes: "Premium auto marketplace. High-quality leads for dealers." },
        { name: "CarGurus Dealer", url: "https://www.cargurus.com/Cars/forsale", category: "Automotive", submissionType: "paid", priority: 11, isAggregator: false, notes: "Growing platform. Good for price transparency and reviews." },
        { name: "Edmunds Dealer", url: "https://dealers.edmunds.com", category: "Automotive", submissionType: "paid", priority: 12, isAggregator: false, notes: "Premium auto research site. Dealer program available." },
        { name: "DealerRater", url: "https://www.dealerrater.com/dealers", category: "Automotive", submissionType: "free", priority: 13, isAggregator: false, notes: "Automotive review site. Claim your free listing." },
        
        // Social/Review Sites
        { name: "LinkedIn Company Page", url: "https://www.linkedin.com/company/setup/new", category: "Social", submissionType: "free", priority: 14, isAggregator: false, notes: "Professional presence. Good for B2B and recruiting." },
        { name: "Nextdoor Business", url: "https://business.nextdoor.com", category: "Social", submissionType: "free", priority: 15, isAggregator: false, notes: "Hyperlocal community. Great for neighborhood visibility." },
        { name: "Angi (formerly Angie's List)", url: "https://www.angi.com/pro", category: "Review", submissionType: "free", priority: 16, isAggregator: false, notes: "Service-focused reviews. Relevant if offering maintenance/repairs." },
      ];
      
      for (const dir of citationDirectorySeedData) {
        await storage.createCitationDirectory(dir);
      }
      console.log(`[seed] Created ${citationDirectorySeedData.length} citation directories`);
    }
  } catch (error) {
    console.error("[seed] Error seeding database:", error);
  }
}

export async function createAdminIfNotExists(): Promise<{ created: boolean; message: string }> {
  try {
    const existingAdmin = await storage.getUserByUsername("Josh");
    if (existingAdmin) {
      return { created: false, message: "Admin user 'Josh' already exists" };
    }
    const hashedPassword = "d7da12f7f0b51ba5ab3e7bb2617161d7:a5d33d043a5bfc73921e861303f31e6a9a6909740dc0368989809ddec3b64526e3f4cab9bd1569dd166d2f4043dc441645c821b0e1582b6547a0ebebeed9e00d";
    await storage.createUser({
      username: "Josh",
      password: hashedPassword,
      isAdmin: true,
    });
    return { created: true, message: "Admin user 'Josh' created successfully" };
  } catch (error) {
    console.error("[auth] Error creating admin:", error);
    return { created: false, message: "Error creating admin user" };
  }
}

export async function autoBackfillSlugs(): Promise<void> {
  console.log("[seo] Checking for vehicles without SEO slugs...");
  try {
    const allCars = await storage.getAllInventoryCars();
    const settings = await storage.getSiteSettings();
    
    // Only process cars without any slug (never overwrite existing)
    const carsNeedingSlugs = allCars.filter(car => !car.slug);
    
    if (carsNeedingSlugs.length === 0) {
      console.log("[seo] All vehicles have slugs - no backfill needed");
      return;
    }
    
    console.log(`[seo] Backfilling slugs for ${carsNeedingSlugs.length} vehicles...`);
    
    // Collect existing slugs to avoid collisions
    const existingSlugs = new Set(allCars.map(car => car.slug).filter(Boolean));
    
    for (const car of carsNeedingSlugs) {
      let slug = generateVehicleSlug({
        year: car.year,
        make: car.make,
        model: car.model,
        trim: settings?.slugIncludeTrim !== false ? (car.trim || null) : null,
        id: car.id,
        stockNumber: settings?.slugIncludeStock ? (car.stockNumber || null) : null,
      });
      
      // Handle collision by appending more of the ID if needed
      if (existingSlugs.has(slug)) {
        slug = slug + '-' + car.id.substring(9, 13);
      }
      
      existingSlugs.add(slug);
      await storage.updateInventoryCar(car.id, { slug });
    }
    
    console.log(`[seo] Successfully backfilled ${carsNeedingSlugs.length} vehicle slugs`);
  } catch (error) {
    console.error("[seo] Error auto-backfilling slugs:", error);
  }
}
