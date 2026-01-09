import { Request, Response, NextFunction } from "express";
import { ZodError, ZodSchema } from "zod";
import { formatZodError } from "@shared/utils/formatZodError";

export function validateBody<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Request body validation failed",
            details: formatZodError(error),
          },
        });
      }
      next(error);
    }
  };
}

export function validateParams<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Route parameter validation failed",
            details: formatZodError(error),
          },
        });
      }
      next(error);
    }
  };
}

export function validateQuery<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Query parameter validation failed",
            details: formatZodError(error),
          },
        });
      }
      next(error);
    }
  };
}
