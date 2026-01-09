import { Request, Response, NextFunction } from "express";
import { ZodError, ZodSchema } from "zod";

export interface ValidationErrorItem {
  path: string;
  message: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: ValidationErrorItem[];
  };
}

function normalizeZodErrors(error: ZodError): ValidationErrorItem[] {
  return error.errors.map((err) => ({
    path: err.path.join(".") || "_root",
    message: err.message,
  }));
}

export function validateBody<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = normalizeZodErrors(error);
        const response: ApiError = {
          error: {
            code: "VALIDATION_ERROR",
            message: "Request body validation failed",
            details,
          },
        };
        return res.status(400).json(response);
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
        const details = normalizeZodErrors(error);
        const response: ApiError = {
          error: {
            code: "VALIDATION_ERROR",
            message: "Query parameter validation failed",
            details,
          },
        };
        return res.status(400).json(response);
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
        const details = normalizeZodErrors(error);
        const response: ApiError = {
          error: {
            code: "VALIDATION_ERROR",
            message: "Route parameter validation failed",
            details,
          },
        };
        return res.status(400).json(response);
      }
      next(error);
    }
  };
}

export function formatError(code: string, message: string, details?: ValidationErrorItem[]): ApiError {
  return {
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: ValidationErrorItem[]
) {
  return res.status(statusCode).json(formatError(code, message, details));
}
