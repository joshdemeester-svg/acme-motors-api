import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertConsignmentSchema, insertInventoryCarSchema } from "@shared/schema";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  registerObjectStorageRoutes(app);

  app.post("/api/consignments", async (req, res) => {
    try {
      const validatedData = insertConsignmentSchema.parse(req.body);
      const submission = await storage.createConsignment(validatedData);
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

  return httpServer;
}
