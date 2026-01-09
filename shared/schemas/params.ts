import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().min(1, "ID is required"),
}).strict();

export type IdParam = z.infer<typeof idParamSchema>;
