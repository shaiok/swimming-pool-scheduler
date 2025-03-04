import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in environment variables");
}

export const JWT_SECRET = process.env.JWT_SECRET;

// ✅ Define user structure to include "admin"
interface AuthUser {
  id: string;
  role: "swimmer" | "instructor" | "admin"; // ✅ Now includes "admin"
}

// ✅ Extend Express Request to Include `user`
export interface IAuthRequest extends Request {
  user?: AuthUser; // ✅ Now supports "admin"
}

// ✅ Middleware to Verify JWT Token
export const authenticateUser = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Access denied, no token provided" });
      return
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    (req as IAuthRequest).user = decoded; // ✅ Explicitly cast `req` to `IAuthRequest`
    next();
  } catch (err) {
     res.status(401).json({ message: "Invalid or expired token" });
  }
};

// ✅ Middleware for Role-Based Access
export const authorizeRoles = (...allowedRoles: ("swimmer" | "instructor" | "admin")[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as IAuthRequest;

    console.log(`🔍 Checking role for user: ${authReq.user?.role}`);

    // More robust authentication check
    if (!authReq.user) {
      console.log("❌ Access Denied: No authenticated user");
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    // Check if user's role is allowed
    if (!allowedRoles.includes(authReq.user.role)) {
      console.log("❌ Access Denied: Insufficient role permissions");
      res.status(403).json({
        success: false,
        message: "Access forbidden: Insufficient permissions",
      });
      return;
    }

    // Additional check for resource ownership
    const resourceId = req.params.id;
    if (resourceId && authReq.user.id !== resourceId) {
      console.log("❌ Access Denied: Cannot access another user's resource");
      res.status(403).json({
        success: false,
        message: "Forbidden: Cannot modify another user's resources",
      });
      return;
    }

    console.log("✅ Access granted.");
    next();
  };
};