import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertConsignmentSchema, insertInventoryCarSchema, type InsertConsignment } from "@shared/schema";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { z } from "zod";
import crypto from "crypto";

const GHL_API_BASE = "https://services.leadconnectorhq.com";

async function getGHLCredentials(): Promise<{ locationId: string | null; apiToken: string | null }> {
  try {
    const settings = await storage.getSiteSettings();
    const locationId = settings?.ghlLocationId || process.env.GHL_LOCATION_ID || null;
    const apiToken = settings?.ghlApiToken || process.env.GHL_API_TOKEN || null;
    return { locationId, apiToken };
  } catch (error) {
    console.error("[GHL] Error fetching credentials from database:", error);
    return { 
      locationId: process.env.GHL_LOCATION_ID || null, 
      apiToken: process.env.GHL_API_TOKEN || null 
    };
  }
}

async function createGHLContact(consignment: InsertConsignment & { id: string }): Promise<void> {
  const { locationId, apiToken } = await getGHLCredentials();
  
  if (!locationId || !apiToken) {
    console.log("GoHighLevel not configured, skipping contact creation");
    return;
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
        firstName: consignment.firstName,
        lastName: consignment.lastName,
        email: consignment.email,
        phone: consignment.phone,
        locationId: locationId,
        tags: ["Consignment Lead", `${consignment.year} ${consignment.make} ${consignment.model}`],
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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
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
      const { featured } = req.query;
      if (featured === "true") {
        const cars = await storage.getFeaturedInventoryCars();
        res.json(cars);
      } else {
        const cars = await storage.getAvailableInventoryCars();
        res.json(cars);
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ error: "Failed to fetch inventory" });
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
      });

      const data = inquirySchema.parse(req.body);

      const settings = await storage.getSiteSettings();
      if (!settings?.contactPhone) {
        return res.status(400).json({ error: "Owner contact phone not configured" });
      }

      const ownerPhone = normalizePhoneNumber(settings.contactPhone);
      const contactId = await getOrCreateGHLContactByPhone(ownerPhone, "Owner");

      if (!contactId) {
        return res.status(500).json({ error: "Failed to connect to messaging service" });
      }

      const smsMessage = `New Vehicle Inquiry!\n\nVehicle: ${data.year} ${data.make} ${data.model}\nVIN: ${data.vin}\n\nBuyer Info:\nName: ${data.buyerName}\nPhone: ${data.buyerPhone}\nEmail: ${data.buyerEmail}${data.message ? `\n\nMessage: ${data.message}` : ""}`;

      const smsResult = await sendGHLSMS(contactId, smsMessage);

      if (!smsResult.success) {
        return res.status(500).json({ error: smsResult.error || "Failed to send inquiry message" });
      }

      console.log(`[Inquiry] Vehicle inquiry sent for ${data.vin} from ${data.buyerName}`);
      
      // Also send notification to admin phones
      const adminMessage = `New Buyer Inquiry!\n\nVehicle: ${data.year} ${data.make} ${data.model}\nVIN: ${data.vin}\n\nBuyer: ${data.buyerName}\nPhone: ${data.buyerPhone}\nEmail: ${data.buyerEmail}${data.message ? `\n\nMessage: ${data.message}` : ""}`;
      sendAdminNotificationSMS(adminMessage).catch((err) => {
        console.error("Admin notification SMS failed:", err);
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

  app.get("/api/inventory/all", async (req, res) => {
    try {
      const cars = await storage.getAllInventoryCars();
      res.json(cars);
    } catch (error) {
      console.error("Error fetching all inventory:", error);
      res.status(500).json({ error: "Failed to fetch inventory" });
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
      const car = await storage.createInventoryCar(validatedData);
      res.status(201).json(car);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating inventory car:", error);
      res.status(500).json({ error: "Failed to create inventory car" });
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
        condition: z.string().min(1).max(100).optional(),
        description: z.string().max(2000).optional(),
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

  // SEO: Robots.txt
  app.get("/robots.txt", (req, res) => {
    const protocol = req.protocol || "https";
    const baseUrl = `${protocol}://${req.get("host")}`;
    const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /seller-portal
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`;
    res.type("text/plain").send(robotsTxt);
  });

  // SEO: Dynamic XML Sitemap
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const protocol = req.protocol || "https";
      const baseUrl = `${protocol}://${req.get("host")}`;
      const inventory = await storage.getAllInventoryCars();
      const availableCars = inventory.filter(car => car.status === "available");

      const staticPages: Array<{ loc: string; priority: string; changefreq: string; lastmod?: string }> = [
        { loc: "/", priority: "1.0", changefreq: "daily" },
        { loc: "/inventory", priority: "0.9", changefreq: "daily" },
        { loc: "/consign", priority: "0.8", changefreq: "weekly" },
      ];

      const vehiclePages: Array<{ loc: string; priority: string; changefreq: string; lastmod?: string }> = availableCars.map(car => ({
        loc: `/vehicle/${car.id}`,
        priority: "0.7",
        changefreq: "weekly",
        lastmod: car.createdAt ? new Date(car.createdAt).toISOString().split("T")[0] : undefined,
      }));

      const allPages = [...staticPages, ...vehiclePages];

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${baseUrl}${page.loc}</loc>
    <priority>${page.priority}</priority>
    <changefreq>${page.changefreq}</changefreq>${page.lastmod ? `
    <lastmod>${page.lastmod}</lastmod>` : ""}
  </url>`).join("\n")}
</urlset>`;

      res.type("application/xml").send(sitemap);
    } catch (error) {
      console.error("Error generating sitemap:", error);
      res.status(500).send("Error generating sitemap");
    }
  });

  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      if (settings) {
        const { ghlApiToken, ...safeSettings } = settings;
        res.json({
          ...safeSettings,
          ghlConfigured: !!(ghlApiToken && settings.ghlLocationId)
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
          ghlConfigured: false,
          ghlLocationId: null
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
        ghlLocationId
      } = req.body;
      
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
        ghlLocationId
      };
      
      // Validate GHL credentials whenever both token and location exist
      const currentSettings = await storage.getSiteSettings();
      const newToken = ghlApiToken && ghlApiToken.trim().length > 0 ? ghlApiToken : null;
      const effectiveToken = newToken || currentSettings?.ghlApiToken;
      const effectiveLocation = ghlLocationId !== undefined ? ghlLocationId : currentSettings?.ghlLocationId;
      
      // Always validate if both credentials exist (catches expired tokens)
      let ghlValidated = false;
      if (effectiveToken && effectiveLocation) {
        const testResult = await testGHLCredentials(effectiveToken, effectiveLocation);
        if (!testResult.success) {
          return res.status(400).json({ 
            error: `GoHighLevel credentials invalid: ${testResult.error}`,
            ghlError: true
          });
        }
        ghlValidated = true;
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

  // Force resync settings from seed data (admin only)
  app.post("/api/settings/resync", requireAdmin, async (req, res) => {
    try {
      const { seedSettings } = await import("./seed-data");
      
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
      });
      
      console.log("[settings] Force resync from seed data completed");
      res.json({ success: true, message: "Settings resynced from configuration" });
    } catch (error) {
      console.error("Error resyncing settings:", error);
      res.status(500).json({ error: "Failed to resync settings" });
    }
  });

  return httpServer;
}

export async function initializeDefaultAdmin(): Promise<void> {
  console.log("[auth] Initializing default admin account...");
  try {
    const existingAdmin = await storage.getUserByUsername("Josh");
    if (existingAdmin) {
      console.log("[auth] Default admin user 'Josh' already exists");
    } else {
      const hashedPassword = "d7da12f7f0b51ba5ab3e7bb2617161d7:a5d33d043a5bfc73921e861303f31e6a9a6909740dc0368989809ddec3b64526e3f4cab9bd1569dd166d2f4043dc441645c821b0e1582b6547a0ebebeed9e00d";
      await storage.createUser({
        username: "Josh",
        password: hashedPassword,
        isAdmin: true,
      });
      console.log("[auth] Default admin user 'Josh' created successfully");
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
        });
        console.log(`[seed] Admin user '${seedAdmin.username}' created`);
      }
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
      });
      console.log("[seed] Site settings seeded successfully");
    } else {
      console.log("[seed] Site settings already configured, skipping seed");
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
