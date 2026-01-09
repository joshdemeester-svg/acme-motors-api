import { z } from "zod";

export const sellerSendCodeSchema = z.object({
  phone: z.string().min(10, "Valid phone number required"),
});

export const sellerVerifySchema = z.object({
  phone: z.string().min(10, "Valid phone number required"),
  code: z.string().length(6, "Verification code must be 6 digits"),
});

export type SellerSendCodePayload = z.infer<typeof sellerSendCodeSchema>;
export type SellerVerifyPayload = z.infer<typeof sellerVerifySchema>;
