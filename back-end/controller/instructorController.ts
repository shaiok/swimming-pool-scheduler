import { Request, Response } from "express";
import { InstructorService } from "../services/InstructorService";

export class InstructorController {
  // ✅ Set instructor availability
  static async setAvailability(req: Request, res: Response) {
    try {
      const { instructorId, availability } = req.body;
      const instructor = await InstructorService.setAvailability(instructorId, availability);
      res.status(200).json({ message: "Availability updated", instructor });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  // ✅ Get instructor schedule
  static async getSchedule(req: Request, res: Response) {
    try {
      const { instructorId } = req.params;
      const schedule = await InstructorService.getInstructorSchedule(instructorId);
      res.status(200).json(schedule);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}
