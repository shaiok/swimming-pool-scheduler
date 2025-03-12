import mongoose from 'mongoose';
import { TimeSlot, ITimeSlot } from '../model/timeSlot';
import { User } from '../model/user';
import { DateTimeValidator, SwimmingStyleValidator, MongooseValidator } from '../utils/validators';
import { eventBus } from '../utils/eventBus';
import { timeToMinutes, minutesToTime, generateHourlySlots } from '../utils/datehelpers';
import { ValidationError, AppError } from '../utils/error';

/**
 * Service for time slot operations
 */
class TimeSlotService {
  constructor() {
    // Subscribe to instructor availability events
    eventBus.subscribe('instructor.availability.added', this.handleAvailabilityAdded.bind(this));
    eventBus.subscribe('instructor.availability.updated', this.handleAvailabilityUpdated.bind(this));
    eventBus.subscribe('instructor.availability.removed', this.handleAvailabilityRemoved.bind(this));
  }
  
  /**
   * Handles when an instructor adds a new availability slot
   * @param data - Event data containing instructorId and slot
   */
  private async handleAvailabilityAdded(data: any): Promise<void> {
    try {
      await this.generateTimeSlotsFromAvailability(
        data.instructorId,
        data.slot
      );
    } catch (error) {
      console.error('Error handling instructor availability addition:', error);
    }
  }
  
  /**
   * Handles when an instructor updates their availability
   * @param data - Event data containing instructorId and availability array
   */
  private async handleAvailabilityUpdated(data: any): Promise<void> {
    try {
      if (data.availability && Array.isArray(data.availability)) {
        // Process each slot if it's an array
        for (const slot of data.availability) {
          await this.generateTimeSlotsFromAvailability(data.instructorId, slot);
        }
      } else if (data.availabilitySlot) {
        // Process a single availability slot
        await this.generateTimeSlotsFromAvailability(data.instructorId, data.availabilitySlot);
      } else {
        console.warn("No availability data provided in event");
      }
    } catch (error) {
      console.error('Error handling instructor availability update:', error);
    }
  }
  
  
  /**
   * Handles when an instructor removes an availability slot
   * @param data - Event data containing instructorId, date, and startTime
   */
  private async handleAvailabilityRemoved(data: any): Promise<void> {
    try {
      // Find only the time slot(s) on this date with the given startTime.
      const slots = await TimeSlot.find({
        instructorId: data.instructorId,
        date: data.date,
        startTime: data.startTime  // narrow by startTime
      });
      
      // Delete each slot if it has no lessons.
      for (const slot of slots) {
        if (!slot.lessons || slot.lessons.length === 0) {
          await TimeSlot.findByIdAndDelete(slot._id);
        }
      }
    } catch (error) {
      console.error('Error handling instructor availability removal:', error);
    }
  }
  
  
  /**
   * Gets a time slot by ID
   * @param timeSlotId - Time slot ID
   * @param populateDetails - Whether to populate related fields
   * @returns The time slot or null if not found
   */
  async getTimeSlotById(
    timeSlotId: string,
    populateDetails: boolean = false
  ): Promise<ITimeSlot | null> {
    try {
      MongooseValidator.validateObjectId(timeSlotId);
      
      let query = TimeSlot.findById(timeSlotId);
      
      if (populateDetails) {
        query = query
          .populate('instructorId', 'firstName lastName swimmingStyles')
          .populate({
            path: 'lessons',
            populate: {
              path: 'students',
              select: 'firstName lastName'
            }
          });
      }
      
      return await query.exec();
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Gets all time slots with optional filtering
   * @param filters - Optional filters to apply
   * @returns Array of time slots
   */
  async getAllTimeSlots(filters: {
    date?: string;
    instructorId?: string;
    status?: string;
  } = {}): Promise<ITimeSlot[]> {
    try {
      const query: any = {};
      
      if (filters.date) {
        DateTimeValidator.validateDate(filters.date);
        query.date = filters.date;
      }
      
      if (filters.instructorId) {
        MongooseValidator.validateObjectId(filters.instructorId);
        query.instructorId = filters.instructorId;
      }
      
      if (filters.status) {
        query.status = filters.status;
      }
      
      return await TimeSlot.find(query)
        .populate('instructorId', 'firstName lastName')
        .sort({ date: 1, startTime: 1 });
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Cleans up unused time slots for an instructor on a specific date
   * @param instructorId - Instructor's ID
   * @param date - Date to clean up
   */
  private async cleanupUnusedTimeSlots(
    instructorId: string,
    date: string
  ): Promise<void> {
    try {
      // Find slots without lessons
      const unusedSlots = await TimeSlot.find({
        instructorId,
        date,
        $or: [
          { lessons: { $size: 0 } },
          { lessons: { $exists: false } }
        ]
      });
      
      // Delete them
      for (const slot of unusedSlots) {
        await TimeSlot.findByIdAndDelete(slot._id);
      }
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Updates a time slot
   * @param timeSlotId - Time slot ID
   * @param updates - Updates to apply
   * @returns The updated time slot or null if not found
   */
  async updateTimeSlot(
    timeSlotId: string,
    updates: {
      date?: string;
      startTime?: string;
      endTime?: string;
      maxCapacity?: number;
      status?: string;
    }
  ): Promise<ITimeSlot | null> {
    try {
      MongooseValidator.validateObjectId(timeSlotId);
      
      // Get the time slot
      const timeSlot = await TimeSlot.findById(timeSlotId);
      
      if (!timeSlot) {
        return null;
      }
      
      // Validate updates
      if (updates.date) {
        DateTimeValidator.validateDate(updates.date);
      }
      
      if (updates.startTime && updates.endTime) {
        DateTimeValidator.validateTimeRange(updates.startTime, updates.endTime);
      } else if (updates.startTime) {
        DateTimeValidator.validateTimeRange(updates.startTime, timeSlot.endTime);
      } else if (updates.endTime) {
        DateTimeValidator.validateTimeRange(timeSlot.startTime, updates.endTime);
      }
      
      if (updates.maxCapacity !== undefined) {
        if (updates.maxCapacity < timeSlot.currentCapacity) {
          throw new Error('Cannot reduce capacity below current usage');
        }
        
        if (updates.maxCapacity < 1) {
          throw new Error('Maximum capacity must be at least 1');
        }
      }
      
      // Check for overlapping slots if date or time is changing
      if (updates.date || updates.startTime || updates.endTime) {
        const overlappingSlots = await this.findOverlappingTimeSlots(
          timeSlot.instructorId.toString(),
          updates.date || timeSlot.date,
          updates.startTime || timeSlot.startTime,
          updates.endTime || timeSlot.endTime,
          timeSlotId
        );
        
        if (overlappingSlots.length > 0) {
          throw new Error('Updated time slot would overlap with an existing slot');
        }
      }
      
   
      
      // Update the time slot
      const updatedTimeSlot = await TimeSlot.findByIdAndUpdate(
        timeSlotId,
        { $set: updates },
        { new: true }
      ).populate('instructorId', 'firstName lastName');
      
      return updatedTimeSlot;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Deletes a time slot
   * @param timeSlotId - Time slot ID
   * @returns True if deleted, false if not found
   */
  async deleteTimeSlot(timeSlotId: string): Promise<boolean> {
    try {
      MongooseValidator.validateObjectId(timeSlotId);
      
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
   * Finds available time slots for a specific date
   * @param params - Search parameters
   * @returns Array of available time slots
   */

  
  /**
   * Finds overlapping time slots
   * @param instructorId - Instructor ID
   * @param date - Date to check
   * @param startTime - Start time to check
   * @param endTime - End time to check
   * @param excludeTimeSlotId - Optional time slot ID to exclude
   * @returns Array of overlapping time slots
   */
  private async findOverlappingTimeSlots(
    instructorId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeTimeSlotId?: string
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
      
      // Exclude the specified time slot if provided
      if (excludeTimeSlotId) {
        query._id = { $ne: excludeTimeSlotId };
      }
      
      // Execute query
      return await TimeSlot.find(query);
    } catch (error) {
      throw error;
    }
  }
  
  // Modified parts of TimeSlotService.ts - focus on the affected methods

/**
 * Creates a new time slot
 * @param data - Time slot data
 * @returns The created time slot
 */
async createTimeSlot(data: {
  date: string;
  startTime: string;
  endTime: string;
  instructorId: string;
  maxCapacity: number;
  type?: "private" | "group";
  swimmingStyles?: string[]; // Standardized from swimStyles -> swimmingStyles
}): Promise<ITimeSlot> {
  try {
    // Validate inputs
    DateTimeValidator.validateDate(data.date);
    DateTimeValidator.validateTimeRange(data.startTime, data.endTime);
    MongooseValidator.validateObjectId(data.instructorId);

    if (data.maxCapacity < 1) {
      throw new Error('Maximum capacity must be at least 1');
    }

    // Check if instructor exists
    const instructor = await User.findOne({
      _id: data.instructorId,
      role: 'instructor'
    });
    if (!instructor) {
      throw new Error('Instructor not found');
    }

    // Check for overlapping slots
    const overlappingSlots = await this.findOverlappingTimeSlots(
      data.instructorId,
      data.date,
      data.startTime,
      data.endTime
    );
    if (overlappingSlots.length > 0) {
      throw new Error('Time slot overlaps with an existing slot');
    }

    // Determine slot type if not provided
    const slotType = data.type || (data.maxCapacity > 1 ? 'group' : 'private');

    // Debug: Log received swimmingStyles for time slot creation
    console.log("createTimeSlot - Received swimmingStyles:", data.swimmingStyles);

    // Create the time slot using the provided swimmingStyles (in Hebrew)
    const timeSlot = new TimeSlot({
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      instructorId: data.instructorId,
      maxCapacity: data.maxCapacity,
      currentCapacity: 0,
      lessons: [],
      type: slotType,
      status: 'available',
      swimmingStyles: data.swimmingStyles // standardized property name
    });

    await timeSlot.save();
    return timeSlot;
  } catch (error) {
    throw error;
  }
}

/**
 * Generates time slots from an instructor's availability
 * @param instructorId - Instructor's ID
 * @param availabilitySlot - Availability slot data
 * @returns Array of created time slots
 */
async generateTimeSlotsFromAvailability(
  instructorId: string,
  availabilitySlot: { 
    date: string; 
    startTime: string; 
    endTime: string; 
    lessonType: "private" | "group";
    swimmingStyles?: string[];  // Standardized from swimStyles -> swimmingStyles
  }
): Promise<ITimeSlot[]> {
  try {
    MongooseValidator.validateObjectId(instructorId);
    DateTimeValidator.validateDate(availabilitySlot.date);
    DateTimeValidator.validateTimeRange(availabilitySlot.startTime, availabilitySlot.endTime);

    const instructor = await User.findOne({ _id: instructorId, role: 'instructor' });
    if (!instructor) {
      throw new Error('Instructor not found');
    }

    // Round times to ensure consistency.
    const roundToNextHour = (time: string): string => {
      const [hr, min] = time.split(":").map(Number);
      return min > 0 ? `${(hr + 1).toString().padStart(2, "0")}:00` : time;
    };
    const roundToPreviousHour = (time: string): string => {
      const [hr, min] = time.split(":").map(Number);
      return min > 0 ? `${hr.toString().padStart(2, "0")}:00` : time;
    };
    const roundedStart = roundToPreviousHour(availabilitySlot.startTime);
    const roundedEnd = roundToNextHour(availabilitySlot.endTime);

    const startMinutes = timeToMinutes(roundedStart);
    const endMinutes = timeToMinutes(roundedEnd);
    const totalMinutes = endMinutes - startMinutes;
    let duration: number;
    let numberOfSlots: number;
    if (availabilitySlot.lessonType === "group") {
      duration = 60;
      numberOfSlots = Math.floor(totalMinutes / duration);
    } else {
      duration = 45;
      numberOfSlots = totalMinutes < 60 ? 1 : Math.floor(totalMinutes / duration);
    }
    const createdSlots: ITimeSlot[] = [];

    // Map the swimmingStyles from the availabilitySlot
    console.log("Generating time slots with swimmingStyles:", availabilitySlot.swimmingStyles);
    const mappedSwimmingStyles =
      availabilitySlot.swimmingStyles && availabilitySlot.swimmingStyles.length > 0
        ? availabilitySlot.swimmingStyles
        : undefined;

    for (let i = 0; i < numberOfSlots; i++) {
      const slotStart = minutesToTime(startMinutes + i * duration);
      const slotEnd = minutesToTime(timeToMinutes(slotStart) + duration);

      const overlappingSlots = await this.findOverlappingTimeSlots(
        instructorId,
        availabilitySlot.date,
        slotStart,
        slotEnd
      );
      if (overlappingSlots.length > 0) continue;

      // Set maxCapacity: 20 for group, 1 for private.
      const maxCapacity = availabilitySlot.lessonType === "group" ? 20 : 1;

      // Create the timeslot, passing along swimmingStyles.
      const timeSlot = await this.createTimeSlot({
        date: availabilitySlot.date,
        startTime: slotStart,
        endTime: slotEnd,
        instructorId,
        maxCapacity,
        type: availabilitySlot.lessonType,
        swimmingStyles: mappedSwimmingStyles,
      });

      createdSlots.push(timeSlot);
    }

    return createdSlots;
  } catch (error) {
    throw error;
  }
}


/**
 * Finds available time slots for a specific date
 * @param params - Search parameters
 * @returns Array of available time slots
 */
async getAvailableTimeSlots(params: {
  date: string;
  swimStyle?: string;
  lessonType?: 'private' | 'group';
}): Promise<any[]> {
  try {
    // Validate date
    try {
      DateTimeValidator.validateDate(params.date);
    } catch (validationError) {
      throw new ValidationError((validationError as Error).message);
    }
    
    // Validate lesson type if provided
    if (params.lessonType && !['private', 'group'].includes(params.lessonType)) {
      throw new ValidationError('Lesson type must be either "private" or "group"');
    }
    
    // Validate swim style if provided
    if (params.swimStyle) {
      try {
        SwimmingStyleValidator.validateStyle(params.swimStyle);
      } catch (validationError) {
        throw new ValidationError((validationError as Error).message);
      }
    }
    
    // Trim and clean date
    const trimmedDate = params.date.trim();

    // Build query with more flexible style matching
    const query: any = {
      date: trimmedDate,
      status: 'available',
      $expr: { $lt: ['$currentCapacity', '$maxCapacity'] },
    };

    if (params.lessonType) {
      query.type = params.lessonType;
    }
    
    // More flexible swimming style matching for transition period
    if (params.swimStyle) {
      // Try both exact match and array contains
      query.$or = [
        { swimmingStyles: params.swimStyle },
        { swimmingStyles: { $in: [params.swimStyle] } }
      ];
    }

    // Find time slots
    const slots = await TimeSlot.find(query)
      .select('_id date startTime endTime type maxCapacity currentCapacity swimmingStyles status lessons instructorId')
      .sort({ startTime: 1 });
    
    console.log(`Found ${slots.length} available time slots for date ${trimmedDate}`);
    
    // Get instructor data
    const instructorIds = [...new Set(slots.map(slot => slot.instructorId.toString()))];
    const instructors = await User.find({
      _id: { $in: instructorIds }
    }).select('firstName lastName swimmingStyles');

    // Create instructor map
    const instructorMap: { [key: string]: any } = {};
    instructors.forEach(instructor => {
      instructorMap[(instructor._id as mongoose.Types.ObjectId).toString()] = instructor;
    });

    // Enhance time slots with instructor data
    const enhancedSlots = slots.map(slot => {
      const slotObj = slot.toObject();
      const instructor = instructorMap[slotObj.instructorId.toString()] || {};
      return {
        ...slotObj,
        instructor: {
          _id: instructor._id || slotObj.instructorId,
          firstName: instructor.firstName || "מדריך",
          lastName: instructor.lastName || "",
          swimmingStyles: instructor.swimmingStyles || []
        }
      };
    });

    return enhancedSlots;
  } catch (error) {
    // Log and rethrow with appropriate error type
    console.error("Error in getAvailableTimeSlots:", error);
    
    if (error instanceof AppError) {
      throw error;
    }
    
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to retrieve available time slots',
      500
    );
  }
}

}

export default new TimeSlotService();