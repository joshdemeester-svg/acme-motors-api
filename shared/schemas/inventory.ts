import { z } from "zod";

export const createInventorySchema = z.object({
  vin: z.string().min(11).max(17),
  year: z.number().int().min(1900).max(2100),
  make: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  trim: z.string().nullable().optional(),
  mileage: z.number().int().min(0),
  color: z.string().min(1).max(50),
  price: z.number().int().min(0),
  condition: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  photos: z.array(z.string()).optional(),
  status: z.enum(["available", "pending", "sold"]).optional(),
  featured: z.boolean().optional(),
  soldDate: z.date().nullable().optional(),
  stockNumber: z.string().nullable().optional(),
  consignmentId: z.string().nullable().optional(),
  slug: z.string().nullable().optional(),
}).strict();

export const updateInventorySchema = z.object({
  vin: z.string().min(11).max(17).optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  make: z.string().min(1).max(100).optional(),
  model: z.string().min(1).max(100).optional(),
  trim: z.string().nullable().optional(),
  mileage: z.number().int().min(0).optional(),
  color: z.string().min(1).max(50).optional(),
  price: z.number().int().min(0).optional(),
  condition: z.string().min(1).max(100).optional(),
  description: z.string().nullable().optional(),
  photos: z.array(z.string()).optional(),
  status: z.enum(["available", "pending", "sold"]).optional(),
  featured: z.boolean().optional(),
  soldDate: z.date().nullable().optional(),
  stockNumber: z.string().nullable().optional(),
  consignmentId: z.string().nullable().optional(),
  slug: z.string().nullable().optional(),
}).strict();

export type CreateInventoryPayload = z.infer<typeof createInventorySchema>;
export type UpdateInventoryPayload = z.infer<typeof updateInventorySchema>;
