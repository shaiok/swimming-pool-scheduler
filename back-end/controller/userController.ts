import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";
import { User } from "../model/user";

export class UserController {
  // 🔹 Register a new user
  static async register(req: Request, res: Response) {
    try {
      const { firstName, lastName, email, phone, password, role, swimmingStyles, preferredLessonType } = req.body;
  
      // ✅ Ensure preferredLessonType is passed
      const result = await AuthService.register(firstName, lastName, email, phone, password, role, swimmingStyles, preferredLessonType);
  
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }
  

  // 🔹 User Login
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  // 🔹 Fetch User Profile
  static async getProfile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await User.findById(req.user.id).select("-password"); // Exclude password
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Error fetching profile" });
    }
  }
}
