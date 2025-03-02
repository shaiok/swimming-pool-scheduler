import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in environment variables");
}

export const JWT_SECRET = process.env.JWT_SECRET;


// **Extend Express Request Type to Include `user`**
declare module "express" {
  interface Request {
    user?: any;
  }
}

// **Middleware to Verify JWT Token**
export const authenticateUser = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.header("Authorization");

  console.log("Received Auth Header:", authHeader); // ✅ Debugging

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ msg: "Access denied, no token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];

  console.log("Extracted Token:", token); // ✅ Debugging

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Decoded Token:", decoded); // ✅ Debugging

    (req as any).user = decoded; // ✅ Attach decoded payload to request
    next();
  } catch (err) {
    console.error("JWT Verification Failed:", err);
    res.status(401).json({ msg: "Invalid token" });
  }
};

// **Middleware for Role-Based Access**
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ msg: "Access forbidden: Insufficient permissions" });
      return; // ✅ Fix: Ensure function exits after sending a response
    }
    next();
  };
};
