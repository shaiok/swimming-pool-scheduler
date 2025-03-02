import { Request, Response } from "express"; 
import { InstructorService } from "../services/InstructorService";

export class InstructorController {
  // Set Instructor Availability
  static async setAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { instructorId, availability } = req.body;
      
      if (!instructorId || !availability) {
        res.status(400).json({ message: "Instructor ID and availability are required." });
        return;
      }
      
      const result = await InstructorService.setAvailability(instructorId, availability);
      res.status(200).json(result);
    } catch (error) {
      console.error("❌ Error setting availability:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  }
  
  // Get Instructor's Weekly Schedule
  static async getInstructorSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { instructorId, startDate } = req.query;
      
      if (!instructorId) {
        res.status(400).json({ message: "Instructor ID is required." });
        return;
      }
      
      const result = await InstructorService.getInstructorSchedule(
        instructorId as string, 
        startDate as string | undefined
      );
      res.status(200).json(result);
    } catch (error) {
      console.error("❌ Error fetching instructor schedule:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  }

  // Update Instructor Profile
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const { instructorId } = req.params;
      const updateData = req.body;
      
      if (!instructorId) {
        res.status(400).json({ message: "Instructor ID is required." });
        return;
      }
      
      const result = await InstructorService.updateProfile(instructorId, updateData);
      res.status(200).json(result);
    } catch (error) {
      console.error("❌ Error updating instructor profile:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  }

  // Cancel a Lesson (Instructor perspective)
  static async cancelLesson(req: Request, res: Response): Promise<void> {
    try {
      const { instructorId, lessonId } = req.body;
      
      if (!instructorId || !lessonId) {
        res.status(400).json({ message: "Instructor ID and Lesson ID are required." });
        return;
      }
      
      const result = await InstructorService.cancelLesson(instructorId, lessonId);
      res.status(200).json(result);
    } catch (error) {
      console.error("❌ Error canceling lesson:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  }

  // Get Instructor Lessons
  static async getLessons(req: Request, res: Response): Promise<void> {
    try {
      const { instructorId } = req.params;
      const { status, fromDate, toDate } = req.query;
      
      if (!instructorId) {
        res.status(400).json({ message: "Instructor ID is required." });
        return;
      }
      
      const filters: any = {};
      if (status) filters.status = status;
      if (fromDate) filters.fromDate = new Date(fromDate as string);
      if (toDate) filters.toDate = new Date(toDate as string);
      
      const lessons = await InstructorService.getLessons(instructorId, filters);
      res.status(200).json(lessons);
    } catch (error) {
      console.error("❌ Error fetching instructor lessons:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  }

  // Get Instructor Statistics
  static async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { instructorId } = req.params;
      
      if (!instructorId) {
        res.status(400).json({ message: "Instructor ID is required." });
        return;
      }
      
      const statistics = await InstructorService.getStatistics(instructorId);
      res.status(200).json(statistics);
    } catch (error) {
      console.error("❌ Error fetching instructor statistics:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  }

  // Get Instructor Details
  static async getInstructorDetails(req: Request, res: Response): Promise<void> {
    try {
      const { instructorId } = req.params;
      
      if (!instructorId) {
        res.status(400).json({ message: "Instructor ID is required." });
        return;
      }
      
      const details = await InstructorService.getInstructorDetails(instructorId);
      res.status(200).json(details);
    } catch (error) {
      console.error("❌ Error fetching instructor details:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  }
}