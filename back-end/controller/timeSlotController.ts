import { Request, Response } from 'express';
import mongoose from 'mongoose';
import TimeSlotService from '../services/TimeSlotService';

/**
 * Controller for time slot operations
 */
class TimeSlotController {
  /**
   * Create a new time slot
   * POST /api/timeslots
   */
 /**
 * Create a new time slot
 * POST /api/timeslots
 */
async createTimeSlot(req: Request, res: Response): Promise<void> {
  try {
    const { date, startTime, endTime, instructorId, maxCapacity, type, swimStyles } = req.body;
    
    // Validate required fields
    if (!date || !startTime || !endTime || !instructorId || !maxCapacity) {
      res.status(400).json({ 
        success: false, 
        message: 'All fields (date, startTime, endTime, instructorId, maxCapacity) are required' 
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
    
    // Optional validation for type if provided
    if (type && type !== 'private' && type !== 'group') {
      res.status(400).json({
        success: false,
        message: 'Type must be either "private" or "group"'
      });
      return;
    }
    
    // Create the time slot
    const timeSlot = await TimeSlotService.createTimeSlot({
      date,
      startTime,
      endTime,
      instructorId,
      maxCapacity: Number(maxCapacity),
      type,               // Pass type if provided
      swimStyles          // Pass swimStyles if provided
    });
    
    res.status(201).json({
      success: true,
      message: 'Time slot created successfully',
      data: timeSlot
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({
      success: false,
      message: 'Failed to create time slot',
      error: errorMessage
    });
  }
}
  
  /**
   * Get a time slot by ID
   * GET /api/timeslots/:id
   */
  async getTimeSlotById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const populate = req.query.populate === 'true';
      
      // Validate ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid time slot ID format' 
        });
        return;
      }
      
      // Get the time slot
      const timeSlot = await TimeSlotService.getTimeSlotById(id, populate);
      
      if (!timeSlot) {
        res.status(404).json({ 
          success: false, 
          message: 'Time slot not found' 
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: timeSlot
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve time slot',
        error: errorMessage
      });
    }
  }
  
  /**
   * Get all time slots
   * GET /api/timeslots
   */
  async getAllTimeSlots(req: Request, res: Response): Promise<void> {
    try {
      const { date, instructorId, minCapacity } = req.query;
      
      // Build filters
      const filters: any = {};
      
      if (date) {
        filters.date = date as string;
      }
      
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
      
      if (minCapacity) {
        filters.minCapacity = Number(minCapacity);
      }
      
      // Get the time slots
      const timeSlots = await TimeSlotService.getAllTimeSlots(filters);
      
      res.status(200).json({
        success: true,
        count: timeSlots.length,
        data: timeSlots
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve time slots',
        error: errorMessage
      });
    }
  }
  
  /**
   * Update a time slot
   * PUT /api/timeslots/:id
   */
  async updateTimeSlot(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { date, startTime, endTime, maxCapacity } = req.body;
      
      // Validate ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid time slot ID format' 
        });
        return;
      }
      
      // Validate that at least one field is provided
      if (!date && !startTime && !endTime && maxCapacity === undefined) {
        res.status(400).json({ 
          success: false, 
          message: 'At least one field (date, startTime, endTime, maxCapacity) is required' 
        });
        return;
      }
      
      // Update the time slot
      const timeSlot = await TimeSlotService.updateTimeSlot(id, { 
        date, 
        startTime, 
        endTime, 
        maxCapacity: maxCapacity !== undefined ? Number(maxCapacity) : undefined 
      });
      
      if (!timeSlot) {
        res.status(404).json({ 
          success: false, 
          message: 'Time slot not found' 
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Time slot updated successfully',
        data: timeSlot
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        success: false,
        message: 'Failed to update time slot',
        error: errorMessage
      });
    }
  }
  
  /**
   * Delete a time slot
   * DELETE /api/timeslots/:id
   */
  async deleteTimeSlot(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validate ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid time slot ID format' 
        });
        return;
      }
      
      // Delete the time slot
      const deleted = await TimeSlotService.deleteTimeSlot(id);
      
      if (!deleted) {
        res.status(404).json({ 
          success: false, 
          message: 'Time slot not found' 
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Time slot deleted successfully'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        success: false,
        message: 'Failed to delete time slot',
        error: errorMessage
      });
    }
  }
  
  /**
   * Find time slots by weekly schedule
   * GET /api/timeslots/schedule/:scheduleId
   */
  async findTimeSlotsBySchedule(req: Request, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;
      
      // Validate schedule ID
      if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid schedule ID format' 
        });
        return;
      }
      
      // Get the time slots
      const timeSlots = await TimeSlotService.findTimeSlotsBySchedule(scheduleId);
      
      res.status(200).json({
        success: true,
        count: timeSlots.length,
        data: timeSlots
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve time slots',
        error: errorMessage
      });
    }
  }
  
  /**
   * Generate time slots from instructor availability
   * POST /api/timeslots/generate
   */
  async generateTimeSlots(req: Request, res: Response): Promise<void> {
    try {
      const { instructorId, availabilitySlot, lessonDuration, gap } = req.body;
      
      // Validate required fields
      if (!instructorId || !availabilitySlot) {
        res.status(400).json({ 
          success: false, 
          message: 'Instructor ID and availability slot are required' 
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
      
      // Validate availability slot
      if (!availabilitySlot.date || !availabilitySlot.startTime || !availabilitySlot.endTime) {
        res.status(400).json({ 
          success: false, 
          message: 'Availability slot must have date, startTime, and endTime' 
        });
        return;
      }
      
      // Generate the time slots
      const timeSlots = await TimeSlotService.generateTimeSlotsFromAvailability(
        instructorId,
        availabilitySlot,
        lessonDuration ? Number(lessonDuration) : undefined,
        gap ? Number(gap) : undefined
      );
      
      res.status(201).json({
        success: true,
        message: `Generated ${timeSlots.length} time slots`,
        data: timeSlots
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({
        success: false,
        message: 'Failed to generate time slots',
        error: errorMessage
      });
    }
  }
}

export default new TimeSlotController();