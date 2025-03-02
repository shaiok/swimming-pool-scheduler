import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";

export class UserController {
  static async register(req: Request, res: Response) {
    try {
      const { firstName, lastName, email, phone, password, role } = req.body;
      const result = await AuthService.register(firstName, lastName, email, phone, password, role);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}
