import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertConsignmentSchema, insertInventoryCarSchema, type InsertConsignment } from "@shared/schema";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { z } from "zod";
import crypto from "crypto";

const GHL_API_BASE = "https://services.leadconnectorhq.com";
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
const GHL_API_TOKEN = process.env.GHL_API_TOKEN;

async function createGHLContact(consignment: InsertConsignment & { id: string }): Promise<void> {
  if (!GHL_LOCATION_ID || !GHL_API_TOKEN) {
    console.log("GoHighLevel not configured, skipping contact creation");
    return;
  }

  try {
    const response = await fetch(`${GHL_API_BASE}/contacts/upsert`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GHL_API_TOKEN}`,
        "Version": "2021-07-28",
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        firstName: consignment.firstName,
        lastName: consignment.lastName,
        email: consignment.email,
        phone: consignment.phone,
        locationId: GHL_LOCATION_ID,
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
  if (!GHL_LOCATION_ID || !GHL_API_TOKEN) {
    console.log("[GHL] Not configured, skipping verification contact creation");
    return null;
  }

  try {
    const response = await fetch(`${GHL_API_BASE}/contacts/upsert`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GHL_API_TOKEN}`,
        "Version": "2021-07-28",
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        firstName: firstName || "Customer",
        phone,
        locationId: GHL_LOCATION_ID,
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

async function sendGHLSMS(contactId: string, message: string): Promise<boolean> {
  if (!GHL_LOCATION_ID || !GHL_API_TOKEN) {
    console.log("[GHL] Not configured, skipping SMS send");
    return false;
  }

  try {
    const response = await fetch(`${GHL_API_BASE}/conversations/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GHL_API_TOKEN}`,
        "Version": "2021-07-28",
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        type: "SMS",
        contactId,
        locationId: GHL_LOCATION_ID,
        message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[GHL] Failed to send SMS:`, response.status, errorText);
      return false;
    }

    console.log(`[GHL] SMS sent successfully to contact ${contactId}`);
    return true;
  } catch (error) {
    console.error(`[GHL] Network error sending SMS:`, error);
    return false;
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

      res.json({ user: { id: user.id, username: user.username, isAdmin: user.isAdmin } });
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
      res.json({ authenticated: true, isAdmin: req.session.isAdmin });
    } else {
      res.json({ authenticated: false });
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

      const smsSuccess = await sendGHLSMS(contactId, `Your verification code is: ${code}. This code expires in 10 minutes.`);
      if (!smsSuccess) {
        return res.status(500).json({ error: "Failed to send verification SMS. Please try again." });
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

  app.post("/api/consignments", async (req, res) => {
    try {
      const validatedData = insertConsignmentSchema.parse(req.body);
      
      const normalizedPhone = normalizePhoneNumber(validatedData.phone);
      const isVerified = await storage.isPhoneVerified(normalizedPhone);
      if (!isVerified) {
        return res.status(400).json({ error: "Phone number must be verified before submitting" });
      }
      
      const submission = await storage.createConsignment({
        ...validatedData,
        phone: normalizedPhone,
      });
      
      createGHLContact({ ...validatedData, id: submission.id }).catch((err) => {
        console.error("Background GHL sync failed:", err);
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

  app.patch("/api/consignments/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!status || !["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const updated = await storage.updateConsignmentStatus(req.params.id, status);
      if (!updated) {
        return res.status(404).json({ error: "Consignment not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating consignment status:", error);
      res.status(500).json({ error: "Failed to update consignment status" });
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
      const cars = await storage.getAvailableInventoryCars();
      res.json(cars);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ error: "Failed to fetch inventory" });
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

  app.patch("/api/inventory/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!status || !["available", "pending", "sold"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const updated = await storage.updateInventoryCarStatus(req.params.id, status);
      if (!updated) {
        return res.status(404).json({ error: "Car not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating car status:", error);
      res.status(500).json({ error: "Failed to update car status" });
    }
  });

  app.post("/api/consignments/:id/approve", async (req, res) => {
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

      await storage.updateConsignmentStatus(req.params.id, "approved");

      res.json({ consignment: { ...consignment, status: "approved" }, car });
    } catch (error) {
      console.error("Error approving consignment:", error);
      res.status(500).json({ error: "Failed to approve consignment" });
    }
  });

  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      res.json(settings || { primaryColor: "#D4AF37", siteName: "PRESTIGE", logoUrl: null });
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", requireAdmin, async (req, res) => {
    try {
      const { primaryColor, siteName, logoUrl } = req.body;
      const settings = await storage.updateSiteSettings({ primaryColor, siteName, logoUrl });
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  return httpServer;
}
