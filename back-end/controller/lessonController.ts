import { Request, Response } from "express";
import { LessonService } from "../services/LessonService";

export class LessonController {
  // ✅ Book a lesson
  static async bookLesson(req: Request, res: Response) {
    try {
      const { instructorId, swimmerId, timeSlot, lessonType } = req.body;
      const lesson = await LessonService.bookLesson(instructorId, swimmerId, timeSlot, lessonType);
      res.status(201).json({ message: "Lesson booked successfully", lesson });
    } catch (error) {
      console.error("❌ Booking Error:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  }

  // ✅ Cancel a lesson
  static async cancelLesson(req: Request, res: Response) {
    try {
      const { swimmerId, lessonId } = req.body;
      const updatedLesson = await LessonService.cancelLesson(swimmerId, lessonId);
      res.status(200).json({ message: "Lesson canceled successfully", lesson: updatedLesson });
    } catch (error) {
      console.error("❌ Cancellation Error:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  }

  // ✅ Get all lessons for an instructor
  static async getInstructorLessons(req: Request, res: Response) {
    try {
      const { instructorId } = req.params;
      const lessons = await LessonService.getLessonsByInstructor(instructorId);
      res.status(200).json(lessons);
    } catch (error) {
      console.error("❌ Error Fetching Instructor Lessons:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  }

  // ✅ Get all lessons for a swimmer
  static async getSwimmerLessons(req: Request, res: Response) {
    try {
      const { swimmerId } = req.params;
      const lessons = await LessonService.getLessonsBySwimmer(swimmerId);
      res.status(200).json(lessons);
    } catch (error) {
      console.error("❌ Error Fetching Swimmer Lessons:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  }
}
