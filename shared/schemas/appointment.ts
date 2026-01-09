import { z } from "zod";

export const appointmentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number required"),
  appointmentType: z.enum(["test_drive", "showroom_visit", "inspection"]),
  vehicleId: z.string().optional(),
  preferredDate: z.string().min(1, "Preferred date is required"),
  preferredTime: z.string().min(1, "Preferred time is required"),
  alternateDate: z.string().optional(),
  alternateTime: z.string().optional(),
  notes: z.string().optional(),
}).strict();

export type AppointmentPayload = z.infer<typeof appointmentSchema>;
