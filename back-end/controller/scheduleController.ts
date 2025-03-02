import { Request, Response } from "express";
import { ScheduleService } from "../services/ScheduleService ";

export class ScheduleController {
  // Get Weekly Availability
  static async getWeeklyAvailability(req: Request, res: Response): Promise<void> {
    try {
      const scheduleService = new ScheduleService();
      const weeklyAvailability = await scheduleService.getWeeklyAvailability();
      res.status(200).json(weeklyAvailability);
    } catch (error) {
      console.error("❌ Error fetching weekly availability:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  }

  // Find Available Slots
  static async findAvailableSlots(req: Request, res: Response): Promise<void> {
    try {
      const { swimStyle, lessonType, preferredDay } = req.query;
      
      const criteria: any = {};
      if (swimStyle) criteria.swimStyle = swimStyle;
      if (lessonType) criteria.lessonType = lessonType;
      if (preferredDay) criteria.preferredDay = preferredDay;
      
      const scheduleService = new ScheduleService();
      const availableSlots = await scheduleService.findAvailableSlots(criteria);
      res.status(200).json(availableSlots);
    } catch (error) {
      console.error("❌ Error finding available slots:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  }

  // Get Weekly Schedule
  static async getWeeklySchedule(req: Request, res: Response): Promise<void> {
    try {
      const scheduleService = new ScheduleService();
      const weeklySchedule = await scheduleService.getWeeklySchedule();
      res.status(200).json(weeklySchedule);
    } catch (error) {
      console.error("❌ Error fetching weekly schedule:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  }

  // Check for Schedule Conflicts
  static async checkConflicts(req: Request, res: Response): Promise<void> {
    try {
      const scheduleService = new ScheduleService();
      const conflicts = await scheduleService.checkConflicts();
      
      if (conflicts.length === 0) {
        res.status(200).json({ hasConflicts: false, message: "No conflicts found." });
      } else {
        res.status(200).json({ 
          hasConflicts: true, 
          message: "Conflicts detected.", 
          conflicts 
        });
      }
    } catch (error) {
      console.error("❌ Error checking conflicts:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  }
}