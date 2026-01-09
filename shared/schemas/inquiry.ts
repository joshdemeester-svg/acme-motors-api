import { z } from "zod";

export const vehicleInquirySchema = z.object({
  vehicleId: z.string().min(1, "Vehicle ID is required"),
  vin: z.string().min(1, "VIN is required"),
  year: z.number().int().min(1900).max(2100),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
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
}).strict();

export type VehicleInquiryPayload = z.infer<typeof vehicleInquirySchema>;
