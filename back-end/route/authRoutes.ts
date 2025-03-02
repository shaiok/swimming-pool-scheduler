import express from "express";
import { check } from "express-validator";
import { UserController } from "../controller/userController";
import { authenticateUser } from "../middleware/authMiddleware";

const authRouter = express.Router();

authRouter.post(
  "/register",
  [
    check("firstName", "First name is required").not().isEmpty(),
    check("lastName", "Last name is required").not().isEmpty(),
    check("email", "Please enter a valid email").isEmail(),
    check("phone", "Phone number is required").not().isEmpty(), // ✅ Fix
    check("password", "Password must be at least 6 characters").isLength({ min: 6 }),
    check("role", "Role must be either swimmer or instructor").isIn(["swimmer", "instructor"]),
  ],
  UserController.register
);

authRouter.post(
  "/login",
  [
    check("email", "Please enter a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  UserController.login
);

authRouter.get("/protected", authenticateUser, (req, res) => {
  res.json({ user: req.user });
});

export default authRouter;
