import { Request, Response } from 'express';
import mongoose from 'mongoose';
import InstructorService from '../services/InstructorService';

/**
 * Controller for instructor operations
 */
class InstructorController {
  /**
   * Get all instructors
   * GET /api/instructors
   */
  async getAllInstructors(req: Request, res: Response): Promise<void> {
    try {
      const instructors = await InstructorService.getAllInstructors();
      
      res.status(200).json({
        success: true,
        count: instructors.length,
        data: instructors
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve instructors',
        error: errorMessage
      });
    }
  }
  
  /**
   * Get instructor by ID
   * GET /api/instructors/:id
   */
  async getInstructorById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validate ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid instructor ID format' 
        });
        return;
      }
      
      // Get the instructor
      const instructor = await InstructorService.getInstructorById(id);
      
      if (!instructor) {
        res.status(404).json({ 
          success: false, 
          message: 'Instructor not found' 
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: instructor
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve instructor',
        error: errorMessage
      });
    }
  }
  
  /**
   * Update instructor availability
   * PUT /api/instructors/:id/availability
   */
  async updateAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { availability } = req.body;
      
      // Validate ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid instructor ID format' 
        });
        return;
      }
      
      // Validate availability data
      if (!availability || !Array.isArray(availability)) {
        res.status(400).json({ 
          success: false, 
          message: 'Valid availability array is required' 
        });
        return;
      }
      
      // Update the instructor's availability
      const instructor = await InstructorService.updateAvailability(id, availability);
      
      if (!instructor) {
        res.status(404).json({ 
          success: false, 
          message: 'Instructor not found' 
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Instructor availability updated successfully',
        data: instructor
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        success: false,
        message: 'Failed to update instructor availability',
        error: errorMessage
      });
    }
  }
  
  /**
   * Add a single availability slot
   * POST /api/instructors/:id/availability
   */
  async addAvailabilitySlot(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { date, startTime, endTime } = req.body;
      
      // Validate ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid instructor ID format' 
        });
        return;
      }
      
      // Validate required fields
      if (!date || !startTime || !endTime) {
        res.status(400).json({ 
          success: false, 
          message: 'Date, start time, and end time are required' 
        });
        return;
      }
      
      // Add the availability slot
      const instructor = await InstructorService.addAvailabilitySlot(id, { date, startTime, endTime });
      
      if (!instructor) {
        res.status(404).json({ 
          success: false, 
          message: 'Instructor not found' 
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Availability slot added successfully',
        data: instructor
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        success: false,
        message: 'Failed to add availability slot',
        error: errorMessage
      });
    }
  }
  
  /**
   * Remove an availability slot
   * DELETE /api/instructors/:id/availability
   */
  async removeAvailabilitySlot(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { date, startTime } = req.body;
      
      // Validate ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid instructor ID format' 
        });
        return;
      }
      
      // Validate required fields
      if (!date || !startTime) {
        res.status(400).json({ 
          success: false, 
          message: 'Date and start time are required' 
        });
        return;
      }
      
      // Remove the availability slot
      const instructor = await InstructorService.removeAvailabilitySlot(id, date, startTime);
      
      if (!instructor) {
        res.status(404).json({ 
          success: false, 
          message: 'Instructor not found' 
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Availability slot removed successfully',
        data: instructor
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        success: false,
        message: 'Failed to remove availability slot',
        error: errorMessage
      });
    }
  }
  
  /**
   * Update instructor swimming styles
   * PUT /api/instructors/:id/swimmingstyles
   */
  async updateSwimmingStyles(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { swimmingStyles } = req.body;
      
      // Validate ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid instructor ID format' 
        });
        return;
      }
      
      // Validate swimming styles
      if (!swimmingStyles || !Array.isArray(swimmingStyles)) {
        res.status(400).json({ 
          success: false, 
          message: 'Valid swimming styles array is required' 
        });
        return;
      }
      
      // Update the instructor's swimming styles
      const instructor = await InstructorService.updateSwimmingStyles(id, swimmingStyles);
      
      if (!instructor) {
        res.status(404).json({ 
          success: false, 
          message: 'Instructor not found' 
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Instructor swimming styles updated successfully',
        data: instructor
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        success: false,
        message: 'Failed to update instructor swimming styles',
        error: errorMessage
      });
    }
  }
  
  /**
   * Get available instructors
   * GET /api/instructors/available
   */
  async getAvailableInstructors(req: Request, res: Response): Promise<void> {
    try {
      const { date, startTime, endTime, swimmingStyle } = req.query;
      
      // Validate required query parameters
      if (!date || !startTime) {
        res.status(400).json({ 
          success: false, 
          message: 'Date and start time are required query parameters' 
        });
        return;
      }
      
      // Get available instructors
      const instructors = await InstructorService.getAvailableInstructors(
        date as string,
        startTime as string,
        endTime as string | undefined,
        swimmingStyle as string | undefined
      );
      
      res.status(200).json({
        success: true,
        count: instructors.length,
        data: instructors
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        success: false,
        message: 'Failed to find available instructors',
        error: errorMessage
      });
    }
  }
}

export default new InstructorController();