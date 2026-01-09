import { z } from "zod";

export const consignmentSchema = z.object({
  vin: z.string().min(1, "VIN is required"),
  year: z.string().min(1, "Year is required"),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  mileage: z.string().min(1, "Mileage is required"),
  color: z.string().min(1, "Color is required"),
  condition: z.string().min(1, "Condition is required"),
  accidentHistory: z.string().min(1, "Accident history is required"),
  description: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number required"),
  photos: z.array(z.string()).optional(),
  salvageTitle: z.boolean().optional(),
  mechanicalIssues: z.string().optional(),
  lienStatus: z.boolean().optional(),
  ownershipConfirmed: z.boolean(),
  agreementAccepted: z.boolean(),
  agreementTimestamp: z.string().optional(),
  termsAccepted: z.boolean(),
  isDemo: z.boolean().optional(),
}).strict();

export const consignmentStatusUpdateSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "listed", "sold"]),
  note: z.string().optional(),
}).strict();

export type ConsignmentPayload = z.infer<typeof consignmentSchema>;
export type ConsignmentStatusUpdate = z.infer<typeof consignmentStatusUpdateSchema>;
