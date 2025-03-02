import { Request, Response } from "express";
import { LessonService } from "../services/LessonService";

export class LessonController {
  // Get Lesson by ID
  static async getLesson(req: Request, res: Response): Promise<void> {
    try {
      const { lessonId } = req.params;
      
      if (!lessonId) {
        res.status(400).json({ message: "Lesson ID is required." });
        return;
      }
      
      const lesson = await LessonService.getLesson(lessonId);
      res.status(200).json(lesson);
    } catch (error) {
      console.error("❌ Error fetching lesson:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  }

  // Get Lessons with Filters
  static async getLessons(req: Request, res: Response): Promise<void> {
    try {
      const { 
        status, swimStyle, instructorId, swimmerId, 
        fromDate, toDate, lessonType 
      } = req.query;
      
      const filters: any = {};
      if (status) filters.status = status;
      if (swimStyle) filters.swimStyle = swimStyle;
      if (instructorId) filters.instructorId = instructorId;
      if (swimmerId) filters.swimmerId = swimmerId;
      if (lessonType) filters.lessonType = lessonType;
      if (fromDate) filters.fromDate = new Date(fromDate as string);
      if (toDate) filters.toDate = new Date(toDate as string);
      
      const lessons = await LessonService.getLessons(filters);
      res.status(200).json(lessons);
    } catch (error) {
      console.error("❌ Error fetching lessons:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  }

  // Update Lesson Status
  static async updateLessonStatus(req: Request, res: Response): Promise<void> {
    try {
      const { lessonId } = req.params;
      const { status } = req.body;
      
      if (!lessonId || !status) {
        res.status(400).json({ message: "Lesson ID and status are required." });
        return;
      }
      
      if (!["scheduled", "completed", "canceled"].includes(status)) {
        res.status(400).json({ message: "Invalid status value." });
        return;
      }
      
      const lesson = await LessonService.updateLessonStatus(
        lessonId, 
        status as "scheduled" | "completed" | "canceled"
      );
      res.status(200).json(lesson);
    } catch (error) {
      console.error("❌ Error updating lesson status:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  }

  // Add Swimmer to Group Lesson
  static async addSwimmerToLesson(req: Request, res: Response): Promise<void> {
    try {
      const { lessonId } = req.params;
      const { swimmerId } = req.body;
      
      if (!lessonId || !swimmerId) {
        res.status(400).json({ message: "Lesson ID and Swimmer ID are required." });
        return;
      }
      
      const lesson = await LessonService.addSwimmerToLesson(lessonId, swimmerId);
      res.status(200).json(lesson);
    } catch (error) {
      console.error("❌ Error adding swimmer to lesson:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  }

  // Remove Swimmer from Lesson
  static async removeSwimmerFromLesson(req: Request, res: Response): Promise<void> {
    try {
      const { lessonId } = req.params;
      const { swimmerId } = req.body;
      
      if (!lessonId || !swimmerId) {
        res.status(400).json({ message: "Lesson ID and Swimmer ID are required." });
        return;
      }
      
      const lesson = await LessonService.removeSwimmerFromLesson(lessonId, swimmerId);
      res.status(200).json(lesson);
    } catch (error) {
      console.error("❌ Error removing swimmer from lesson:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  }

  // Get Weekly Lesson Statistics
  static async getWeeklyStatistics(req: Request, res: Response): Promise<void> {
    try {
      const statistics = await LessonService.getWeeklyStatistics();
      res.status(200).json(statistics);
    } catch (error) {
      console.error("❌ Error fetching weekly statistics:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  }

  // Check for Lesson Conflicts
  static async checkLessonConflicts(req: Request, res: Response): Promise<void> {
    try {
      const { lessonId } = req.params;
      
      if (!lessonId) {
        res.status(400).json({ message: "Lesson ID is required." });
        return;
      }
      
      const conflicts = await LessonService.checkLessonConflicts(lessonId);
      
      if (!conflicts) {
        res.status(200).json({ hasConflicts: false, message: "No conflicts found." });
      } else {
        res.status(200).json({ 
          hasConflicts: true, 
          message: "Conflicts detected.", 
          conflicts 
        });
      }
    } catch (error) {
      console.error("❌ Error checking lesson conflicts:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  }
}