import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

// Custom HTTP Error class
export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "HttpError";
  }
}

// Factory functions for common errors
export const createBadRequest = (message: string, details?: unknown) =>
  new HttpError(400, message, details);

export const createUnauthorized = (message = "Unauthorized") =>
  new HttpError(401, message);

export const createForbidden = (message = "Forbidden") =>
  new HttpError(403, message);

export const createNotFound = (message = "Resource not found") =>
  new HttpError(404, message);

export const createConflict = (message: string) =>
  new HttpError(409, message);

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error("[Error]:", err.message);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation Error",
      message: "Invalid request data",
      details: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message
      }))
    });
  }

  // Handle custom HTTP errors
  if (err instanceof HttpError) {
    const response: { error: string; details?: unknown } = {
      error: err.message
    };
    if (err.details) {
      response.details = err.details;
    }
    return res.status(err.statusCode).json(response);
  }

  // Handle Supabase auth errors
  if (err.message.includes("Invalid login credentials")) {
    return res.status(401).json({
      error: "Authentication Failed",
      message: "Invalid email or password"
    });
  }

  if (err.message.includes("User already registered")) {
    return res.status(409).json({
      error: "Conflict",
      message: "An account with this email already exists"
    });
  }

  // Default error response (hide internal details in production)
  const isProduction = process.env.NODE_ENV === "production";

  return res.status(500).json({
    error: "Internal Server Error",
    message: isProduction ? "Something went wrong" : err.message
  });
};
