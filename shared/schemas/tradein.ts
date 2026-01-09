import { z } from "zod";

export const tradeInSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number required"),
  year: z.string().min(4, "Year is required"),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  mileage: z.string().min(1, "Mileage is required"),
  condition: z.enum(["excellent", "good", "fair", "poor"]),
  vin: z.string().optional(),
  payoffAmount: z.string().optional(),
  additionalInfo: z.string().optional(),
}).strict();

export type TradeInPayload = z.infer<typeof tradeInSchema>;
