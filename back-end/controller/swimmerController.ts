import { Request, Response } from "express";
import { SwimmerService } from "../services/SwimmerService";

export class SwimmerController {
  // ✅ Get available instructors for a swim style
  static async getAvailableInstructors(req: Request, res: Response) {
    try {
      const { swimStyle } = req.params;
      const instructors = await SwimmerService.getAvailableInstructors(swimStyle);
      res.status(200).json(instructors);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  // ✅ Get swimmer schedule
  static async getSchedule(req: Request, res: Response) {
    try {
      const { swimmerId } = req.params;
      const schedule = await SwimmerService.getSwimmerSchedule(swimmerId);
      res.status(200).json(schedule);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}
