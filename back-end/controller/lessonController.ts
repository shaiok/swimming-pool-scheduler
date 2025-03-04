import { Request, Response } from 'express';
import mongoose from 'mongoose';
import LessonService from '../services/LessonService';

/**
 * Controller for lesson operations
 */
class LessonController {
  /**
   * Create a new lesson
   * POST /api/lessons
   */
  async createLesson(req: Request, res: Response): Promise<void> {
    try {
      const { instructorId, students, type, swimStyle, timeSlotId } = req.body;
      
      // Validate required fields
      if (!instructorId || !students || !type || !swimStyle || !timeSlotId) {
        res.status(400).json({ 
          success: false, 
          message: 'All fields (instructorId, students, type, swimStyle, timeSlotId) are required' 
        });
        return;
      }
      
      // Validate instructor ID
      if (!mongoose.Types.ObjectId.isValid(instructorId)) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid instructor ID format' 
        });
        return;
      }
      
      // Validate time slot ID
      if (!mongoose.Types.ObjectId.isValid(timeSlotId)) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid time slot ID format' 
        });
        return;
      }
      
      // Validate students array
      if (!Array.isArray(students) || students.length === 0) {
        res.status(400).json({ 
          success: false, 
          message: 'Students must be a non-empty array' 
        });
        return;
      }
      
      // Create the lesson
      const lesson = await LessonService.createLesson({
        instructorId,
        students,
        type,
        swimStyle,
        timeSlotId
      });
      
      res.status(201).json({
        success: true,
        message: 'Lesson created successfully',
        data: lesson
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        success: false,
        message: 'Failed to create lesson',
        error: errorMessage
      });
    }
  }
  
  /**
   * Get a lesson by ID
   * GET /api/lessons/:id
   */
  async getLessonById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const populate = req.query.populate === 'true';
      
      // Validate ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid lesson ID format' 
        });
        return;
      }
      
      // Get the lesson
      const lesson = await LessonService.getLessonById(id, populate);
      
      if (!lesson) {
        res.status(404).json({ 
          success: false, 
          message: 'Lesson not found' 
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: lesson
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve lesson',
        error: errorMessage
      });
    }
  }
  
  /**
   * Get all lessons
   * GET /api/lessons
   */
  async getAllLessons(req: Request, res: Response): Promise<void> {
    try {
      const { instructorId, studentId, type, swimStyle } = req.query;
      
      // Build filters
      const filters: any = {};
      
      if (instructorId) {
        // Validate instructor ID
        if (!mongoose.Types.ObjectId.isValid(instructorId as string)) {
          res.status(400).json({ 
            success: false, 
            message: 'Invalid instructor ID format' 
          });
          return;
        }
        
        filters.instructorId = instructorId;
      }
      
      if (studentId) {
        // Validate student ID
        if (!mongoose.Types.ObjectId.isValid(studentId as string)) {
          res.status(400).json({ 
            success: false, 
            message: 'Invalid student ID format' 
          });
          return;
        }
        
        filters.studentId = studentId;
      }
      
      if (type) {
        // Validate lesson type
        if (type !== 'private' && type !== 'group') {
          res.status(400).json({ 
            success: false, 
            message: 'Lesson type must be either "private" or "group"' 
          });
          return;
        }
        
        filters.type = type;
      }
      
      if (swimStyle) {
        filters.swimStyle = swimStyle;
      }
      
      // Get the lessons
      const lessons = await LessonService.getAllLessons(filters);
      
      res.status(200).json({
        success: true,
        count: lessons.length,
        data: lessons
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve lessons',
        error: errorMessage
      });
    }
  }
  
  /**
   * Add a student to a lesson
   * POST /api/lessons/:id/students
   */
  async addStudentToLesson(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { studentId } = req.body;
      
      // Validate ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid lesson ID format' 
        });
        return;
      }
      
      // Validate student ID
      if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
        res.status(400).json({ 
          success: false, 
          message: 'Valid student ID is required' 
        });
        return;
      }
      
      // Add the student to the lesson
      const lesson = await LessonService.addStudentToLesson(id, studentId);
      
      if (!lesson) {
        res.status(404).json({ 
          success: false, 
          message: 'Lesson not found' 
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Student added to lesson successfully',
        data: lesson
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        success: false,
        message: 'Failed to add student to lesson',
        error: errorMessage
      });
    }
  }
  
  /**
   * Remove a student from a lesson
   * DELETE /api/lessons/:id/students/:studentId
   */
  async removeStudentFromLesson(req: Request, res: Response): Promise<void> {
    try {
      const { id, studentId } = req.params;
      
      // Validate IDs
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid lesson ID format' 
        });
        return;
      }
      
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid student ID format' 
        });
        return;
      }
      
      // Remove the student from the lesson
      const lesson = await LessonService.removeStudentFromLesson(id, studentId);
      
      // If lesson is null, it means the lesson was deleted because there are no more students
      if (lesson === null) {
        res.status(200).json({
          success: true,
          message: 'Student removed and lesson deleted (no more students)'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Student removed from lesson successfully',
        data: lesson
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        success: false,
        message: 'Failed to remove student from lesson',
        error: errorMessage
      });
    }
  }
  
  /**
   * Cancel a lesson
   * DELETE /api/lessons/:id
   */
  async cancelLesson(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validate ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid lesson ID format' 
        });
        return;
      }
      
      // Cancel the lesson
      const cancelled = await LessonService.cancelLesson(id);
      
      if (!cancelled) {
        res.status(404).json({ 
          success: false, 
          message: 'Lesson not found' 
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Lesson cancelled successfully'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        success: false,
        message: 'Failed to cancel lesson',
        error: errorMessage
      });
    }
  }
  
  /**
   * Get lessons by time slot
   * GET /api/lessons/timeslot/:timeSlotId
   */
  async getLessonsByTimeSlot(req: Request, res: Response): Promise<void> {
    try {
      const { timeSlotId } = req.params;
      
      // Validate time slot ID
      if (!mongoose.Types.ObjectId.isValid(timeSlotId)) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid time slot ID format' 
        });
        return;
      }
      
      // Get the lessons
      const lessons = await LessonService.getLessonsByTimeSlot(timeSlotId);
      
      res.status(200).json({
        success: true,
        count: lessons.length,
        data: lessons
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve lessons',
        error: errorMessage
      });
    }
  }
}

export default new LessonController();