import { Request, Response } from 'express';
import mongoose from 'mongoose';
import SwimmerService from '../services/SwimmerService';
import { IAuthRequest } from '../middleware/authMiddleware';

/**
 * Controller for swimmer operations
 */
class SwimmerController {
  /**
   * Get swimmer profile
   * GET /api/swimmers/:id
   */
  async getSwimmerProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validate ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid swimmer ID format' 
        });
        return;
      }
      
      // Get the swimmer
      const swimmer = await SwimmerService.getSwimmerById(id);
      
      if (!swimmer) {
        res.status(404).json({ 
          success: false, 
          message: 'Swimmer not found' 
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: swimmer
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve swimmer profile',
        error: errorMessage
      });
    }
  }
  
  /**
   * Update swimmer preferences
   * PUT /api/swimmers/:id/preferences
   */
  async updatePreferences(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { swimmingStyles, preferredLessonType } = req.body;
  
      // Validate ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid swimmer ID format' 
        });
        return;
      }
  
    // Get authenticated user
    const authReq = req as IAuthRequest;
    if (!authReq.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required"
      });
      return;
    }
  
      // Ensure user is updating their own profile
        if (authReq.user.id !== id) {
          res.status(403).json({
            success: false,
            message: "Forbidden: Cannot update another swimmer's preferences"
          });
          return;
        }

        // Call the service to update preferences
    const updatedSwimmer = await SwimmerService.updatePreferences(id, { swimmingStyles, preferredLessonType });
    if (!updatedSwimmer) {
      res.status(404).json({
        success: false,
        message: "Swimmer not found"
      });
      return;
    }
  
      // Send back updated data
      res.status(200).json({
        success: true,
        data: updatedSwimmer
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }
  
  /**
   * Find available time slots
   * GET /api/swimmers/timeslots
   */
  async findAvailableTimeSlots(req: Request, res: Response): Promise<void> {
    try {
      const { date, swimStyle, lessonType } = req.query;
      
      // Find available time slots
      const timeSlots = await SwimmerService.findAvailableTimeSlots(
        date as string | undefined,
        swimStyle as string | undefined,
        lessonType as 'private' | 'group' | undefined
      );
      
      res.status(200).json({
        success: true,
        count: timeSlots.length,
        data: timeSlots
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        success: false,
        message: 'Failed to find available time slots',
        error: errorMessage
      });
    }
  }
  
  /**
   * Book a lesson
   * POST /api/swimmers/:id/lessons
   */
  async bookLesson(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { timeSlotId, swimStyle } = req.body;
      
      // Comprehensive authentication check
      if (!req.user) {
        res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
        return;
      }
  
      // Validate swimmer ID matches authenticated user
      if (req.user.id !== id) {
        res.status(403).json({ 
          success: false, 
          message: 'Unauthorized to book lesson for this swimmer' 
        });
        return;
      }
  
      // Delegate to service with robust error handling
      const lesson = await SwimmerService.bookLesson(id, timeSlotId, swimStyle);
      
      res.status(201).json({
        success: true,
        message: 'Lesson booked successfully',
        data: lesson
      });
    } catch (error) {
      console.error('Lesson booking error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Differentiate error types
      if (errorMessage.includes('capacity')) {
        res.status(400).json({
          success: false,
          message: errorMessage
        });
      } else if (errorMessage.includes('not found')) {
        res.status(404).json({
          success: false,
          message: errorMessage
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to book lesson',
          error: errorMessage
        });
      }
    }
  }
  
  /**
   * Cancel a lesson
   * DELETE /api/swimmers/:id/lessons/:lessonId
   */
  async cancelLesson(req: Request, res: Response): Promise<void> {
    try {
      const { id, lessonId } = req.params;
      
      // Validate IDs
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid swimmer ID format' 
        });
        return;
      }
      
      if (!mongoose.Types.ObjectId.isValid(lessonId)) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid lesson ID format' 
        });
        return;
      }
      
      // Cancel the lesson
      const success = await SwimmerService.cancelLesson(id, lessonId);
      
      if (!success) {
        res.status(404).json({ 
          success: false, 
          message: 'Failed to cancel lesson' 
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
   * Get swimmer lessons
   * GET /api/swimmers/:id/lessons
   */
  async getSwimmerLessons(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validate ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid swimmer ID format' 
        });
        return;
      }
      
      // Get the swimmer's lessons
      const lessons = await SwimmerService.getSwimmerLessons(id);
      
      res.status(200).json({
        success: true,
        count: lessons.length,
        data: lessons
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve swimmer lessons',
        error: errorMessage
      });
    }
  }
}

export default new SwimmerController();