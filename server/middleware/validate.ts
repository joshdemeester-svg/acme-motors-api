import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { formatZodError } from "@shared/utils/formatZodError";

export function validateBody<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request",
          details: formatZodError(result.error),
        },
      });
    }
    req.body = result.data;
    next();
  };
}

export function validateParams<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request",
          details: formatZodError(result.error),
        },
      });
    }
    req.params = result.data as typeof req.params;
    next();
  };
}

export function validateQuery<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request",
          details: formatZodError(result.error),
        },
      });
    }
    req.query = result.data as typeof req.query;
    next();
  };
}
