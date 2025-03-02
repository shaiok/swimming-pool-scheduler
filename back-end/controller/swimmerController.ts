import { Request, Response } from "express";
import { SwimmerService } from "../services/SwimmerService";

export class SwimmerController {
  // Book a Lesson
  static async bookLesson(req: Request, res: Response): Promise<void> {
    try {
      const { swimmerId } = req.params;
      const bookingData = req.body;
      
      if (!swimmerId || !bookingData) {
        res.status(400).json({ message: "Swimmer ID and booking data are required." });
        return;
      }
      
      const lesson = await SwimmerService.bookLesson(swimmerId, bookingData);
      res.status(201).json({ message: "Lesson booked successfully", lesson });
    } catch (error) {
      console.error("❌ Booking Error:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  }

  // Cancel a Lesson
  static async cancelLesson(req: Request, res: Response): Promise<void> {
    try {
      const { swimmerId, lessonId } = req.body;
      
      if (!swimmerId || !lessonId) {
        res.status(400).json({ message: "Swimmer ID and Lesson ID are required." });
        return;
      }
      
      const result = await SwimmerService.cancelLesson(swimmerId, lessonId);
      res.status(200).json(result);
    } catch (error) {
      console.error("❌ Cancel Lesson Error:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  }

  // Get Swimmer's Booked Lessons
  static async getBookedLessons(req: Request, res: Response): Promise<void> {
    try {
      const { swimmerId } = req.params;
      
      if (!swimmerId) {
        res.status(400).json({ message: "Swimmer ID is required." });
        return;
      }
      
      const lessons = await SwimmerService.getBookedLessons(swimmerId);
      res.status(200).json(lessons);
    } catch (error) {
      console.error("❌ Error fetching booked lessons:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  }

  // Find Available Lessons
  static async findAvailableLessons(req: Request, res: Response): Promise<void> {
    try {
      const { swimmerId } = req.params;
      const { swimStyle, lessonType, preferredDay } = req.query;
      
      if (!swimmerId) {
        res.status(400).json({ message: "Swimmer ID is required." });
        return;
      }
      
      const criteria: any = {};
      if (swimStyle) criteria.swimStyle = swimStyle;
      if (lessonType) criteria.lessonType = lessonType;
      if (preferredDay) criteria.preferredDay = preferredDay;
      
      const availableLessons = await SwimmerService.findAvailableLessons(swimmerId, criteria);
      res.status(200).json(availableLessons);
    } catch (error) {
      console.error("❌ Error finding available lessons:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  }

  // Update Swimmer Profile
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const { swimmerId } = req.params;
      const updateData = req.body;
      
      if (!swimmerId) {
        res.status(400).json({ message: "Swimmer ID is required." });
        return;
      }
      
      const result = await SwimmerService.updateProfile(swimmerId, updateData);
      res.status(200).json(result);
    } catch (error) {
      console.error("❌ Error updating swimmer profile:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  }

  // Get Swimmer Details
  static async getSwimmerDetails(req: Request, res: Response): Promise<void> {
    try {
      const { swimmerId } = req.params;
      
      if (!swimmerId) {
        res.status(400).json({ message: "Swimmer ID is required." });
        return;
      }
      
      const details = await SwimmerService.getSwimmerDetails(swimmerId);
      res.status(200).json(details);
    } catch (error) {
      console.error("❌ Error fetching swimmer details:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  }

  // Get Swimmer Statistics
  static async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { swimmerId } = req.params;
      
      if (!swimmerId) {
        res.status(400).json({ message: "Swimmer ID is required." });
        return;
      }
      
      const statistics = await SwimmerService.getSwimmerStatistics(swimmerId);
      res.status(200).json(statistics);
    } catch (error) {
      console.error("❌ Error fetching swimmer statistics:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  }
}