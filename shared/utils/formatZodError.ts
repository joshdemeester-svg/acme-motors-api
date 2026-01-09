import { ZodError } from "zod";

export interface ValidationError {
  path: string;
  message: string;
}

export function formatZodError(error: ZodError): ValidationError[] {
  return error.errors.map((err) => ({
    path: err.path.join(".") || "_root",
    message: err.message,
  }));
}
