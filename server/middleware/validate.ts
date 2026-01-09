import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodIssue } from "zod";
import { formatZodError } from "@shared/utils/formatZodError";
import { loginSchema } from "@shared/schemas/auth";

function isMissingCredentialIssue(issue: ZodIssue): boolean {
  const path = issue.path[0];
  if (path !== "username" && path !== "password") return false;
  
  if (issue.code === "invalid_type" && (issue as any).received === "undefined") return true;
  if (issue.message === "Required") return true;
  
  return false;
}

export function validateLoginBody() {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      const hasMissingCredential = result.error.issues.some(isMissingCredentialIssue);
      
      if (hasMissingCredential) {
        return res.status(400).json({ error: "Username and password required" });
      }
      
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
