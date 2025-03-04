import mongoose from 'mongoose';
import { WeeklySchedule, IWeeklySchedule } from '../model/scheduleManager';

/**
 * Service for managing weekly schedules
 */
class WeeklyScheduleService {
  /**
   * Create a new weekly schedule
   * @param startDate - Start date of the schedule (YYYY-MM-DD)
   * @param endDate - End date of the schedule (YYYY-MM-DD)
   * @returns The created weekly schedule
   */
  async createWeeklySchedule(startDate: string, endDate: string): Promise<IWeeklySchedule> {
    try {
      // Validate dates
      this.validateDates(startDate, endDate);
      
      // Create a new schedule
      const newSchedule = new WeeklySchedule({
        startDate,
        endDate,
        timeSlots: []
      });
      
      // Save to database
      await newSchedule.save();
      
      return newSchedule;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get a weekly schedule by ID
   * @param scheduleId - The ID of the schedule to retrieve
   * @param populateTimeSlots - Whether to populate the time slots (default: false)
   * @returns The weekly schedule or null if not found
   */
  async getWeeklyScheduleById(
    scheduleId: mongoose.Types.ObjectId | string,
    populateTimeSlots: boolean = false
  ): Promise<IWeeklySchedule | null> {
    try {
      // Create query
      let query = WeeklySchedule.findById(scheduleId);
      
      // Populate time slots if requested
      if (populateTimeSlots) {
        query = query.populate('timeSlots');
      }
      
      // Execute query
      const schedule = await query.exec();
      
      return schedule;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get all weekly schedules
   * @param populateTimeSlots - Whether to populate the time slots (default: false)
   * @returns Array of weekly schedules
   */
  async getAllWeeklySchedules(populateTimeSlots: boolean = false): Promise<IWeeklySchedule[]> {
    try {
      // Create query
      let query = WeeklySchedule.find();
      
      // Populate time slots if requested
      if (populateTimeSlots) {
        query = query.populate('timeSlots');
      }
      
      // Execute query
      const schedules = await query.exec();
      
      return schedules;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get current active weekly schedule
   * @param date - The date to check (default: current date)
   * @param populateTimeSlots - Whether to populate the time slots (default: false)
   * @returns The current active weekly schedule or null if not found
   */
  async getCurrentWeeklySchedule(
    date: string = new Date().toISOString().split('T')[0],
    populateTimeSlots: boolean = false
  ): Promise<IWeeklySchedule | null> {
    try {
      // Create query to find a schedule that includes the given date
      let query = WeeklySchedule.findOne({
        startDate: { $lte: date },
        endDate: { $gte: date }
      });
      
      // Populate time slots if requested
      if (populateTimeSlots) {
        query = query.populate('timeSlots');
      }
      
      // Execute query
      const schedule = await query.exec();
      
      return schedule;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Update a weekly schedule
   * @param scheduleId - The ID of the schedule to update
   * @param updates - The updates to apply
   * @returns The updated weekly schedule or null if not found
   */
  async updateWeeklySchedule(
    scheduleId: mongoose.Types.ObjectId | string,
    updates: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<IWeeklySchedule | null> {
    try {
      // Validate dates if provided
      if (updates.startDate && updates.endDate) {
        this.validateDates(updates.startDate, updates.endDate);
      } else if (updates.startDate) {
        // If only start date is provided, get the current schedule to check against end date
        const currentSchedule = await this.getWeeklyScheduleById(scheduleId);
        if (currentSchedule) {
          this.validateDates(updates.startDate, currentSchedule.endDate);
        }
      } else if (updates.endDate) {
        // If only end date is provided, get the current schedule to check against start date
        const currentSchedule = await this.getWeeklyScheduleById(scheduleId);
        if (currentSchedule) {
          this.validateDates(currentSchedule.startDate, updates.endDate);
        }
      }
      
      // Update the schedule
      const updatedSchedule = await WeeklySchedule.findByIdAndUpdate(
        scheduleId,
        { $set: updates },
        { new: true } // Return the updated document
      );
      
      return updatedSchedule;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Add time slots to a weekly schedule
   * @param scheduleId - The ID of the schedule to update
   * @param timeSlotIds - Array of time slot IDs to add
   * @returns The updated weekly schedule or null if not found
   */
  async addTimeSlotsToSchedule(
    scheduleId: mongoose.Types.ObjectId | string,
    timeSlotIds: (mongoose.Types.ObjectId | string)[]
  ): Promise<IWeeklySchedule | null> {
    try {
      // Update the schedule
      const updatedSchedule = await WeeklySchedule.findByIdAndUpdate(
        scheduleId,
        { $addToSet: { timeSlots: { $each: timeSlotIds } } }, // Add unique time slots only
        { new: true } // Return the updated document
      );
      
      return updatedSchedule;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Remove time slots from a weekly schedule
   * @param scheduleId - The ID of the schedule to update
   * @param timeSlotIds - Array of time slot IDs to remove
   * @returns The updated weekly schedule or null if not found
   */
  async removeTimeSlotsFromSchedule(
    scheduleId: mongoose.Types.ObjectId | string,
    timeSlotIds: (mongoose.Types.ObjectId | string)[]
  ): Promise<IWeeklySchedule | null> {
    try {
      // Update the schedule
      const updatedSchedule = await WeeklySchedule.findByIdAndUpdate(
        scheduleId,
        { $pullAll: { timeSlots: timeSlotIds } },
        { new: true } // Return the updated document
      );
      
      return updatedSchedule;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Delete a weekly schedule
   * @param scheduleId - The ID of the schedule to delete
   * @returns True if deleted, false if not found
   */
  async deleteWeeklySchedule(scheduleId: mongoose.Types.ObjectId | string): Promise<boolean> {
    try {
      const result = await WeeklySchedule.findByIdAndDelete(scheduleId);
      
      return result !== null;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Check if there's an overlap between two schedules
   * @param startDate1 - Start date of first schedule
   * @param endDate1 - End date of first schedule
   * @param startDate2 - Start date of second schedule
   * @param endDate2 - End date of second schedule
   * @returns True if there's an overlap, false otherwise
   */
  isOverlapping(
    startDate1: string,
    endDate1: string,
    startDate2: string,
    endDate2: string
  ): boolean {
    return (
      (startDate1 <= endDate2 && startDate2 <= endDate1) ||
      (startDate2 <= endDate1 && startDate1 <= endDate2)
    );
  }
  
  /**
   * Find schedules that overlap with a given date range
   * @param startDate - Start date to check
   * @param endDate - End date to check
   * @returns Array of overlapping schedules
   */
  async findOverlappingSchedules(startDate: string, endDate: string): Promise<IWeeklySchedule[]> {
    try {
      // Validate dates
      this.validateDates(startDate, endDate);
      
      // Find schedules that overlap with the given date range
      const overlappingSchedules = await WeeklySchedule.find({
        $or: [
          // Schedule starts during our range
          {
            startDate: { $gte: startDate, $lte: endDate },
          },
          // Schedule ends during our range
          {
            endDate: { $gte: startDate, $lte: endDate },
          },
          // Schedule completely encompasses our range
          {
            startDate: { $lte: startDate },
            endDate: { $gte: endDate },
          },
        ],
      });
      
      return overlappingSchedules;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate dates for a weekly schedule
   * @param startDate - Start date to validate
   * @param endDate - End date to validate
   * @throws Error if dates are invalid
   */
  private validateDates(startDate: string, endDate: string): void {
    // Check date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      throw new Error('Dates must be in YYYY-MM-DD format');
    }
    
    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format');
    }
    
    // Check if start date is before end date
    if (start > end) {
      throw new Error('Start date must be before end date');
    }
  }
}

export default new WeeklyScheduleService();