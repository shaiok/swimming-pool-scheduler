import { Request, Response } from 'express';
import mongoose from 'mongoose';
import WeeklyScheduleService from '../services/ScheduleService ';

/**
 * Controller for weekly schedule operations
 */
class WeeklyScheduleController {
  /**
   * Create a new weekly schedule
   * POST /api/schedules
   */
  async createWeeklySchedule(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.body;
      
      // Validate required fields
      if (!startDate || !endDate) {
        res.status(400).json({ 
          success: false, 
          message: 'Start date and end date are required' 
        });
        return;
      }
      
      // Create the schedule
      const schedule = await WeeklyScheduleService.createWeeklySchedule(startDate, endDate);
      
      res.status(201).json({
        success: true,
        message: 'Weekly schedule created successfully',
        data: schedule
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        success: false,
        message: 'Failed to create weekly schedule',
        error: errorMessage
      });
    }
  }
  
  /**
   * Get a weekly schedule by ID
   * GET /api/schedules/:id
   */
  async getWeeklyScheduleById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const populate = req.query.populate === 'true';
      
      // Validate ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid schedule ID format' 
        });
        return;
      }
      
      // Get the schedule
      const schedule = await WeeklyScheduleService.getWeeklyScheduleById(id, populate);
      
      if (!schedule) {
        res.status(404).json({ 
          success: false, 
          message: 'Weekly schedule not found' 
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: schedule
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve weekly schedule',
        error: errorMessage
      });
    }
  }
  
  /**
   * Get all weekly schedules
   * GET /api/schedules
   */
  async getAllWeeklySchedules(req: Request, res: Response): Promise<void> {
    try {
      const populate = req.query.populate === 'true';
      
      // Get all schedules
      const schedules = await WeeklyScheduleService.getAllWeeklySchedules(populate);
      
      res.status(200).json({
        success: true,
        count: schedules.length,
        data: schedules
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve weekly schedules',
        error: errorMessage
      });
    }
  }
  
  /**
   * Get current active weekly schedule
   * GET /api/schedules/current
   */
  async getCurrentWeeklySchedule(req: Request, res: Response): Promise<void> {
    try {
      const date = req.query.date as string || undefined;
      const populate = req.query.populate === 'true';
      
      // Get the current schedule
      const schedule = await WeeklyScheduleService.getCurrentWeeklySchedule(date, populate);
      
      if (!schedule) {
        res.status(404).json({ 
          success: false, 
          message: 'No active weekly schedule found for the specified date' 
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: schedule
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve current weekly schedule',
        error: errorMessage
      });
    }
  }
  
  /**
   * Update a weekly schedule
   * PUT /api/schedules/:id
   */
  async updateWeeklySchedule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.body;
      
      // Validate ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid schedule ID format' 
        });
        return;
      }
      
      // Validate that at least one field is provided
      if (!startDate && !endDate) {
        res.status(400).json({ 
          success: false, 
          message: 'At least one field (startDate or endDate) is required' 
        });
        return;
      }
      
      // Update the schedule
      const schedule = await WeeklyScheduleService.updateWeeklySchedule(id, { startDate, endDate });
      
      if (!schedule) {
        res.status(404).json({ 
          success: false, 
          message: 'Weekly schedule not found' 
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Weekly schedule updated successfully',
        data: schedule
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        success: false,
        message: 'Failed to update weekly schedule',
        error: errorMessage
      });
    }
  }
  
  /**
   * Add time slots to a weekly schedule
   * POST /api/schedules/:id/timeslots
   */
  async addTimeSlotsToSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { timeSlotIds } = req.body;
      
      // Validate ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid schedule ID format' 
        });
        return;
      }
      
      // Validate time slot IDs
      if (!timeSlotIds || !Array.isArray(timeSlotIds) || timeSlotIds.length === 0) {
        res.status(400).json({ 
          success: false, 
          message: 'Time slot IDs array is required and must not be empty' 
        });
        return;
      }
      
      // Validate all time slot IDs are valid ObjectIDs
      for (const timeSlotId of timeSlotIds) {
        if (!mongoose.Types.ObjectId.isValid(timeSlotId)) {
          res.status(400).json({ 
            success: false, 
            message: `Invalid time slot ID format: ${timeSlotId}` 
          });
          return;
        }
      }
      
      // Add time slots to the schedule
      const schedule = await WeeklyScheduleService.addTimeSlotsToSchedule(id, timeSlotIds);
      
      if (!schedule) {
        res.status(404).json({ 
          success: false, 
          message: 'Weekly schedule not found' 
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Time slots added to weekly schedule successfully',
        data: schedule
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        success: false,
        message: 'Failed to add time slots to weekly schedule',
        error: errorMessage
      });
    }
  }
  
  /**
   * Remove time slots from a weekly schedule
   * DELETE /api/schedules/:id/timeslots
   */
  async removeTimeSlotsFromSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { timeSlotIds } = req.body;
      
      // Validate ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid schedule ID format' 
        });
        return;
      }
      
      // Validate time slot IDs
      if (!timeSlotIds || !Array.isArray(timeSlotIds) || timeSlotIds.length === 0) {
        res.status(400).json({ 
          success: false, 
          message: 'Time slot IDs array is required and must not be empty' 
        });
        return;
      }
      
      // Validate all time slot IDs are valid ObjectIDs
      for (const timeSlotId of timeSlotIds) {
        if (!mongoose.Types.ObjectId.isValid(timeSlotId)) {
          res.status(400).json({ 
            success: false, 
            message: `Invalid time slot ID format: ${timeSlotId}` 
          });
          return;
        }
      }
      
      // Remove time slots from the schedule
      const schedule = await WeeklyScheduleService.removeTimeSlotsFromSchedule(id, timeSlotIds);
      
      if (!schedule) {
        res.status(404).json({ 
          success: false, 
          message: 'Weekly schedule not found' 
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Time slots removed from weekly schedule successfully',
        data: schedule
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        success: false,
        message: 'Failed to remove time slots from weekly schedule',
        error: errorMessage
      });
    }
  }
  
  /**
   * Delete a weekly schedule
   * DELETE /api/schedules/:id
   */
  async deleteWeeklySchedule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validate ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid schedule ID format' 
        });
        return;
      }
      
      // Delete the schedule
      const deleted = await WeeklyScheduleService.deleteWeeklySchedule(id);
      
      if (!deleted) {
        res.status(404).json({ 
          success: false, 
          message: 'Weekly schedule not found' 
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Weekly schedule deleted successfully'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        success: false,
        message: 'Failed to delete weekly schedule',
        error: errorMessage
      });
    }
  }
  
  /**
   * Find overlapping schedules
   * GET /api/schedules/overlapping
   */
  async findOverlappingSchedules(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      
      // Validate required query parameters
      if (!startDate || !endDate) {
        res.status(400).json({ 
          success: false, 
          message: 'Start date and end date are required query parameters' 
        });
        return;
      }
      
      // Find overlapping schedules
      const schedules = await WeeklyScheduleService.findOverlappingSchedules(
        startDate as string,
        endDate as string
      );
      
      res.status(200).json({
        success: true,
        count: schedules.length,
        data: schedules
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        success: false,
        message: 'Failed to find overlapping schedules',
        error: errorMessage
      });
    }
  }
}

export default new WeeklyScheduleController();