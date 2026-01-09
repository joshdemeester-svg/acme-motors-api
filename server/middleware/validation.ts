import { Request, Response, NextFunction } from "express";
import { z, ZodError, ZodSchema } from "zod";
import { fromZodError } from "zod-validation-error";

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export function validateBody<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        const details: Record<string, string[]> = {};
        
        error.errors.forEach((err) => {
          const path = err.path.join(".");
          if (!details[path]) {
            details[path] = [];
          }
          details[path].push(err.message);
        });

        const response: ApiError = {
          error: {
            code: "VALIDATION_ERROR",
            message: validationError.message,
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
        const validationError = fromZodError(error);
        const response: ApiError = {
          error: {
            code: "VALIDATION_ERROR",
            message: validationError.message,
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
        const validationError = fromZodError(error);
        const response: ApiError = {
          error: {
            code: "VALIDATION_ERROR",
            message: validationError.message,
          },
        };
        return res.status(400).json(response);
      }
      next(error);
    }
  };
}

export function formatError(code: string, message: string, details?: Record<string, string[]>): ApiError {
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
  details?: Record<string, string[]>
) {
  return res.status(statusCode).json(formatError(code, message, details));
}
