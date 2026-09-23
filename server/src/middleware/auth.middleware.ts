import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

interface JwtPayload {
  userId: string;
}

export interface AuthRequest extends Request {
  userId?: string;
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Get Authorization header
    const authHeader = req.headers.authorization;

    // Check whether token exists
    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token missing",
      });
    }

    // Get JWT secret
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return res.status(500).json({
        success: false,
        message: "JWT secret is not configured",
      });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      secret
    ) as JwtPayload;

    // Find user
    const user = await User.findById(
      decoded.userId
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }

    // Attach user ID to request
    req.userId = user._id.toString();

    // Continue to controller
    next();
  } catch (error) {
    console.error(
      "Authentication middleware error:",
      error
    );

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}