import mongoose from 'mongoose';
import { ITimeSlot } from '../model/timeSlot';
import { IUser } from '../model/user';

// Get models
const TimeSlot = mongoose.model<ITimeSlot>('TimeSlot');
const User = mongoose.model<IUser>('User');

/**
 * Service for time slot operations
 */
class TimeSlotService {
  /**
   * Create a new time slot
   * @param timeSlotData - Time slot data
   * @returns The created time slot
   */
  async createTimeSlot(timeSlotData: {
    date: string;
    startTime: string;
    endTime: string;
    instructorId: mongoose.Types.ObjectId | string;
    maxCapacity: number;
    type?: "private" | "group";  // Made optional with default in the function
    swimStyles?: string[];       // Made optional with default in the function
  }): Promise<ITimeSlot> {
    try {
      // Validate the data
      this.validateTimeSlotData(timeSlotData);
      
      // Check if instructor exists and is an instructor
      const instructor = await User.findOne({ 
        _id: timeSlotData.instructorId,
        role: 'instructor'
      });
      
      if (!instructor) {
        throw new Error('Instructor not found');
      }
      
      // Check if instructor is available at this time
      const isAvailable = this.isInstructorAvailable(
        instructor,
        timeSlotData.date,
        timeSlotData.startTime,
        timeSlotData.endTime
      );
      
      if (!isAvailable) {
        throw new Error('Instructor is not available at this time');
      }
      
      // Check for overlapping time slots
      const overlappingSlots = await this.findOverlappingTimeSlots(
        timeSlotData.instructorId,
        timeSlotData.date,
        timeSlotData.startTime,
        timeSlotData.endTime
      );
      
      if (overlappingSlots.length > 0) {
        throw new Error('Time slot overlaps with an existing slot');
      }
      
      // Set default values for required fields if not provided
      const type = timeSlotData.type || (timeSlotData.maxCapacity > 1 ? 'group' : 'private');
      const swimStyles = timeSlotData.swimStyles || 
        (instructor.swimmingStyles && instructor.swimmingStyles.length > 0 
          ? instructor.swimmingStyles 
          : ['Freestyle']);
      
      // Create the time slot
      const timeSlot = new TimeSlot({
        date: timeSlotData.date,
        startTime: timeSlotData.startTime,
        endTime: timeSlotData.endTime,
        instructorId: timeSlotData.instructorId,
        maxCapacity: timeSlotData.maxCapacity,
        currentCapacity: 0,
        lessons: [],
        type: type,
        swimStyles: swimStyles,
        status: 'available'
      });
      
      await timeSlot.save();
      
      return timeSlot;
    } catch (error) {
      throw error;
    }
  }
  
  async generateTimeSlotsFromAvailability(
    instructorId: mongoose.Types.ObjectId | string,
    availabilitySlot: { date: string; startTime: string; endTime: string },
    lessonDuration: number = 45,
    gap: number = 15
  ): Promise<ITimeSlot[]> {
    try {
      // Validate the availability slot
      this.validateTimeSlotData({
        date: availabilitySlot.date,
        startTime: availabilitySlot.startTime,
        endTime: availabilitySlot.endTime,
        instructorId,
        maxCapacity: 1 // Doesn't matter for validation
      });
      
      // Get the instructor
      const instructor = await User.findOne({ 
        _id: instructorId,
        role: 'instructor'
      });
      
      if (!instructor) {
        throw new Error('Instructor not found');
      }
      
      // Parse times
      const startParts = availabilitySlot.startTime.split(':').map(Number);
      const endParts = availabilitySlot.endTime.split(':').map(Number);
      
      const startDate = new Date();
      startDate.setHours(startParts[0], startParts[1], 0, 0);
      
      const endDate = new Date();
      endDate.setHours(endParts[0], endParts[1], 0, 0);
      
      // Calculate total available time in minutes
      const totalMinutes = (endDate.getTime() - startDate.getTime()) / (60 * 1000);
      
      // Calculate how many slots can be created
      const slotDuration = lessonDuration + gap;
      const numSlots = Math.floor(totalMinutes / slotDuration);
      
      // Create time slots
      const timeSlots: ITimeSlot[] = [];
      
      for (let i = 0; i < numSlots; i++) {
        const slotStart = new Date(startDate.getTime() + i * slotDuration * 60 * 1000);
        const slotEnd = new Date(slotStart.getTime() + lessonDuration * 60 * 1000);
        
        // Format times
        const slotStartTime = `${slotStart.getHours().toString().padStart(2, '0')}:${slotStart.getMinutes().toString().padStart(2, '0')}`;
        const slotEndTime = `${slotEnd.getHours().toString().padStart(2, '0')}:${slotEnd.getMinutes().toString().padStart(2, '0')}`;
        
        // Check for overlapping time slots
        const overlappingSlots = await this.findOverlappingTimeSlots(
          instructorId,
          availabilitySlot.date,
          slotStartTime,
          slotEndTime
        );
        
        if (overlappingSlots.length === 0) {
          // Create the time slot
          const timeSlot = await this.createTimeSlot({
            date: availabilitySlot.date,
            startTime: slotStartTime,
            endTime: slotEndTime,
            instructorId,
            maxCapacity: 1, // Private lesson
            type: 'private', // Explicitly set type for a private lesson
            swimStyles: instructor.swimmingStyles && instructor.swimmingStyles.length > 0 
              ? instructor.swimmingStyles 
              : ['Freestyle']
          });
          
          timeSlots.push(timeSlot);
        }
      }
      
      return timeSlots;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get a time slot by ID
   * @param timeSlotId - Time slot ID
   * @param populateLessons - Whether to populate lessons (default: false)
   * @returns The time slot or null if not found
   */
  async getTimeSlotById(
    timeSlotId: mongoose.Types.ObjectId | string,
    populateLessons: boolean = false
  ): Promise<ITimeSlot | null> {
    try {
      // Create query
      let query = TimeSlot.findById(timeSlotId);
      
      // Populate lessons if requested
      if (populateLessons) {
        query = query.populate('lessons');
      }
      
      // Execute query
      return await query.exec();
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get all time slots with optional filtering
   * @param filters - Optional filters
   * @returns Array of time slots
   */
  async getAllTimeSlots(filters: {
    date?: string;
    instructorId?: mongoose.Types.ObjectId | string;
    minCapacity?: number;
  } = {}): Promise<ITimeSlot[]> {
    try {
      // Build query
      const query: any = {};
      
      // Add filters if provided
      if (filters.date) {
        query.date = filters.date;
      }
      
      if (filters.instructorId) {
        query.instructorId = filters.instructorId;
      }
      
      if (filters.minCapacity) {
        query.maxCapacity = { $gte: filters.minCapacity };
      }
      
      // Execute query
      return await TimeSlot.find(query)
        .populate('instructorId', 'firstName lastName')
        .sort({ date: 1, startTime: 1 });
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Update a time slot
   * @param timeSlotId - Time slot ID
   * @param updates - Updates to apply
   * @returns The updated time slot or null if not found
   */
  async updateTimeSlot(
    timeSlotId: mongoose.Types.ObjectId | string,
    updates: {
      date?: string;
      startTime?: string;
      endTime?: string;
      maxCapacity?: number;
    }
  ): Promise<ITimeSlot | null> {
    try {
      // Get the time slot
      const timeSlot = await TimeSlot.findById(timeSlotId);
  
      if (!timeSlot) {
        return null;
      }
  
      // Validate updates
      if (updates.date) {
        this.validateDate(updates.date);
      }
  
      if (updates.startTime && updates.endTime) {
        this.validateTimeRange(updates.startTime, updates.endTime);
      } else if (updates.startTime) {
        this.validateTimeRange(updates.startTime, timeSlot.endTime);
      } else if (updates.endTime) {
        this.validateTimeRange(timeSlot.startTime, updates.endTime);
      }
  
      if (updates.maxCapacity !== undefined) {
        if (updates.maxCapacity < timeSlot.currentCapacity) {
          throw new Error("Cannot reduce capacity below current usage");
        }
  
        if (updates.maxCapacity < 1) {
          throw new Error("Maximum capacity must be at least 1");
        }
      }
  
      // Check for overlapping time slots if date or time is changing
      if (updates.date || updates.startTime || updates.endTime) {
        const overlappingSlots = await this.findOverlappingTimeSlots(
          timeSlot.instructorId.toString(), // ✅ Convert ObjectId to string
          updates.date || timeSlot.date,
          updates.startTime || timeSlot.startTime,
          updates.endTime || timeSlot.endTime,
          timeSlotId
        );
  
        if (overlappingSlots.length > 0) {
          throw new Error("Updated time slot would overlap with an existing slot");
        }
      }
  
      // Update the time slot
      const updatedTimeSlot = await TimeSlot.findByIdAndUpdate(
        timeSlotId,
        { $set: updates },
        { new: true }
      );
  
      return updatedTimeSlot;
    } catch (error) {
      throw error;
    }
  }
  
  
  /**
   * Delete a time slot
   * @param timeSlotId - Time slot ID
   * @returns True if deleted, false if not found
   */
  async deleteTimeSlot(timeSlotId: mongoose.Types.ObjectId | string): Promise<boolean> {
    try {
      // Get the time slot
      const timeSlot = await TimeSlot.findById(timeSlotId);
      
      if (!timeSlot) {
        return false;
      }
      
      // Check if time slot has lessons
      if (timeSlot.lessons && timeSlot.lessons.length > 0) {
        throw new Error('Cannot delete time slot with active lessons');
      }
      
      // Delete the time slot
      await TimeSlot.findByIdAndDelete(timeSlotId);
      
      return true;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Find time slots by weekly schedule
   * @param weeklyScheduleId - Weekly schedule ID
   * @returns Array of time slots
   */
  async findTimeSlotsBySchedule(weeklyScheduleId: mongoose.Types.ObjectId | string): Promise<ITimeSlot[]> {
    try {
      // Get the weekly schedule
      const WeeklySchedule = mongoose.model('WeeklySchedule');
      const schedule = await WeeklySchedule.findById(weeklyScheduleId);
      
      if (!schedule) {
        throw new Error('Weekly schedule not found');
      }
      
      // Get the time slots
      return await TimeSlot.find({ _id: { $in: schedule.timeSlots } })
        .populate('instructorId', 'firstName lastName')
        .sort({ date: 1, startTime: 1 });
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Generate time slots for instructor availability
   * @param instructorId - Instructor ID
   * @param availabilitySlot - Availability slot
   * @param lessonDuration - Duration of each lesson in minutes (default: 45)
   * @param gap - Gap between lessons in minutes (default: 15)
   * @returns Array of created time slots
   */

  
  /**
   * Find overlapping time slots
   * @param instructorId - Instructor ID
   * @param date - Date to check
   * @param startTime - Start time to check
   * @param endTime - End time to check
   * @param excludeTimeSlotId - Time slot ID to exclude (optional)
   * @returns Array of overlapping time slots
   */
  private async findOverlappingTimeSlots(
    instructorId: mongoose.Types.ObjectId | string,
    date: string,
    startTime: string,
    endTime: string,
    excludeTimeSlotId?: mongoose.Types.ObjectId | string
  ): Promise<ITimeSlot[]> {
    try {
      // Build query
      const query: any = {
        instructorId,
        date,
        $or: [
          // Case 1: New slot starts during an existing slot
          {
            startTime: { $lte: startTime },
            endTime: { $gt: startTime }
          },
          // Case 2: New slot ends during an existing slot
          {
            startTime: { $lt: endTime },
            endTime: { $gte: endTime }
          },
          // Case 3: New slot completely contains an existing slot
          {
            startTime: { $gte: startTime },
            endTime: { $lte: endTime }
          }
        ]
      };
      
      // Exclude the time slot if provided
      if (excludeTimeSlotId) {
        query._id = { $ne: excludeTimeSlotId };
      }
      
      // Execute query
      return await TimeSlot.find(query);
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Check if an instructor is available at a specific time
   * @param instructor - Instructor object
   * @param date - Date to check
   * @param startTime - Start time to check
   * @param endTime - End time to check
   * @returns True if instructor is available, false otherwise
   */
  private isInstructorAvailable(
    instructor: IUser,
    date: string,
    startTime: string,
    endTime: string
  ): boolean {
    // If instructor has no availability, they're not available
    if (!instructor.availability || instructor.availability.length === 0) {
      return false;
    }
    
    // Find an availability slot that covers this time range
    return instructor.availability.some(slot => {
      return (
        slot.date === date &&
        slot.startTime <= startTime &&
        slot.endTime >= endTime
      );
    });
  }
  
  /**
   * Validate time slot data
   * @param data - Time slot data to validate
   * @throws Error if data is invalid
   */
  private validateTimeSlotData(data: {
    date: string;
    startTime: string;
    endTime: string;
    instructorId: mongoose.Types.ObjectId | string;
    maxCapacity: number;
  }): void {
    // Validate date
    this.validateDate(data.date);
    
    // Validate time range
    this.validateTimeRange(data.startTime, data.endTime);
    
    // Validate instructor ID
    if (!mongoose.Types.ObjectId.isValid(data.instructorId)) {
      throw new Error('Invalid instructor ID format');
    }
    
    // Validate max capacity
    if (data.maxCapacity < 1) {
      throw new Error('Maximum capacity must be at least 1');
    }
  }
  
  /**
   * Validate a date
   * @param date - Date to validate
   * @throws Error if date is invalid
   */
  private validateDate(date: string): void {
    // Check date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw new Error('Date must be in YYYY-MM-DD format');
    }
    
    // Check if date is valid
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new Error('Invalid date');
    }
  }
  
  /**
   * Validate a time range
   * @param startTime - Start time to validate
   * @param endTime - End time to validate
   * @throws Error if time range is invalid
   */
  private validateTimeRange(startTime: string, endTime: string): void {
    // Check time format (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      throw new Error('Times must be in HH:MM format');
    }
    
    // Check if start time is before end time
    if (startTime >= endTime) {
      throw new Error('Start time must be before end time');
    }
  }
}

export default new TimeSlotService();