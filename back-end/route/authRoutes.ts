import express, { Request, Response } from "express";
import { check, validationResult } from "express-validator";
import { UserController } from "../controller/userController";
import { authenticateUser } from "../middleware/authMiddleware";

const authRouter = express.Router();

// ✅ Middleware to Validate Request Data
const validateRequest = (req: Request, res: Response, next: Function): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
  } else {
    next();
  }
};

// ✅ Register Route
authRouter.post(
  "/register",
  [
    check("firstName", "First name is required").notEmpty(),
    check("lastName", "Last name is required").notEmpty(),
    check("email", "Please enter a valid email").isEmail(),
    check("phone", "Phone number is required").notEmpty(),
    check("password", "Password must be at least 6 characters").isLength({ min: 6 }),
    check("role", "Role must be swimmer, instructor, or admin").isIn(["swimmer", "instructor", "admin"]),
  ],
  validateRequest, // ✅ Ensure validation errors are handled properly
  UserController.register
);

// ✅ Login Route
authRouter.post(
  "/login",
  [
    check("email", "Please enter a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  validateRequest,
  UserController.login
);

// ✅ Protected Route Example
authRouter.get("/protected", authenticateUser, (req: Request, res: Response) => {
  res.json({ user: (req as any).user }); // ✅ Ensure TypeScript doesn't complain about `req.user`
});

export default authRouter;
