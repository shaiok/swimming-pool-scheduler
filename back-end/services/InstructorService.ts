import mongoose, { ObjectId } from 'mongoose';
import { User, IUser } from '../model/user';
import { DateTimeValidator, SwimmingStyleValidator, MongooseValidator } from '../utils/validators';
import { eventBus } from '../utils/eventBus';
import { timeToMinutes, minutesToTime, generateHourlySlots } from '../utils/datehelpers';
import { TimeSlot } from '../model/timeSlot';
import { Lesson } from '../model/lesson';

/**
 * Service for instructor-related operations
 */
class InstructorService {
  /**
   * Retrieves all instructors with their basic information
   * @returns Array of instructors with selected fields
   */
  async getAllInstructors(): Promise<IUser[]> {
    try {
      return await User.find({ role: 'instructor' })
        .select('firstName lastName email phone swimmingStyles')
        .sort({ firstName: 1 });
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Retrieves a single instructor by ID
   * @param instructorId - Instructor's ID
   * @returns Instructor data or null if not found
   */
  async getInstructorById(instructorId: string): Promise<IUser | null> {
    try {
      MongooseValidator.validateObjectId(instructorId);
      
      return await User.findOne({ _id: instructorId, role: 'instructor' })
        .select('firstName lastName email phone swimmingStyles availability');
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Gets instructor availability, optionally filtered by date
   * @param instructorId - Instructor's ID
   * @param date - Optional date filter (YYYY-MM-DD)
   * @returns Instructor with availability data
   */
  async getAvailability(instructorId: string, date?: string): Promise<IUser | null> {
    try {
      MongooseValidator.validateObjectId(instructorId);
      
      const query: any = { _id: instructorId, role: 'instructor' };
      
      if (date) {
        DateTimeValidator.validateDate(date);
        query['availability.date'] = date;
      }
      
      return await User.findOne(query).select('availability');
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Sets an instructor's availability for a specific day and time range
   * @param instructorId - Instructor's ID
   * @param date - Date in YYYY-MM-DD format
   * @param startTime - Start time in HH:MM format
   * @param lessonType - Type of lesson ("private" or "group")
   * @param swimmingStyles - Array of swimming styles offered
   * @returns Updated instructor or null if not found
   */
  async setAvailability(
    instructorId: string,
    date: string,
    startTime: string,
    lessonType: "private" | "group",
    swimmingStyles: string[]  // Standardized parameter name
  ): Promise<IUser | null> {
    try {
      MongooseValidator.validateObjectId(instructorId);
      DateTimeValidator.validateDate(date);
      // Assume startTime is a round hour (e.g., "16:00")
  
      // Determine duration and auto-calculate endTime.
      const duration = lessonType === "group" ? 60 : 45;
      const endTime = minutesToTime(timeToMinutes(startTime) + duration);
  
      // Create a new availability slot object including swimmingStyles.
      const newSlot = { date, startTime, endTime, lessonType, swimmingStyles };
  
      console.log("setAvailability - Received swimmingStyles:", swimmingStyles);
      console.log("setAvailability - New availability slot to add:", newSlot);
  
      // Retrieve current instructor data.
      const instructor = await User.findOne({ _id: instructorId, role: 'instructor' });
      if (!instructor) {
        throw new Error('Instructor not found');
      }
  
      // For simplicity, push the new slot to the availability array.
      const updatedInstructor = await User.findOneAndUpdate(
        { _id: instructorId, role: 'instructor' },
        { $push: { availability: newSlot } },
        { new: true }
      ).select('firstName lastName email phone swimmingStyles availability');
  
      console.log("setAvailability - Updated instructor:", updatedInstructor);
  
      // Publish an event.
      if (updatedInstructor) {
        await eventBus.publish('instructor.availability.updated', {
          instructorId,
          availabilitySlot: newSlot
        });
      }
  
      return updatedInstructor;
    } catch (error) {
      console.error("setAvailability - Error:", error);
      throw error;
    }
  }
  
  /**
   * Removes an instructor's availability slot for a specific date and start time.
   * @param instructorId - Instructor's ID
   * @param date - Date to remove availability for (YYYY-MM-DD)
   * @param startTime - The start time of the slot to remove (HH:MM)
   * @returns Updated instructor or null if not found
   */
  async removeAvailabilitySlot(
    instructorId: string,
    date: string,
    startTime: string
  ): Promise<IUser | null> {
    try {
      MongooseValidator.validateObjectId(instructorId);
      DateTimeValidator.validateDate(date);
      // Optionally, validate startTime format if you have a validator

      const updatedInstructor = await User.findOneAndUpdate(
        { _id: instructorId, role: 'instructor' },
        { $pull: { availability: { date, startTime } } },
        { new: true }
      );

      if (updatedInstructor) {
        await eventBus.publish('instructor.availability.removed', {
          instructorId,
          date,
          startTime
        });
      }

      return updatedInstructor;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Updates an instructor's swimming styles
   * @param instructorId - Instructor's ID
   * @param styles - Array of swimming styles
   * @returns Updated instructor or null if not found
   */
  async updateSwimmingStyles(
    instructorId: string,
    styles: string[]
  ): Promise<IUser | null> {
    try {
      MongooseValidator.validateObjectId(instructorId);
      SwimmingStyleValidator.validateStyles(styles);
      
      const instructor = await User.findOneAndUpdate(
        { _id: instructorId, role: 'instructor' },
        { $set: { swimmingStyles: styles } },
        { new: true }
      ).select('firstName lastName swimmingStyles');
      
      if (instructor) {
        await eventBus.publish('instructor.styles.updated', { 
          instructorId, 
          styles 
        });
      }
      
      return instructor;
    } catch (error) {
      throw error;
    }
  }
  
/**
 * Gets instructor's schedule for a specific date
 * @param instructorId - Instructor's ID
 * @param date - Date to get schedule for (YYYY-MM-DD)
 * @returns Array of time slots with lessons
 */
async getSchedule(instructorId: string, date: string): Promise<any[]> {
  try {
    // Trim any potential whitespace
    console.log("Validating date:", JSON.stringify(date));
    const trimmedDate = date.trim();
    
    // Find the instructor first to get their swimming styles
    const instructor = await User.findOne({ 
      _id: new mongoose.Types.ObjectId(instructorId), 
      role: 'instructor' 
    }).select('firstName lastName swimmingStyles');
    
    console.log("Found instructor data:", instructor);
    
    // Find time slots for this instructor on this date
    const slots = await TimeSlot.find({
      instructorId: new mongoose.Types.ObjectId(instructorId),
      date: trimmedDate
    })
    .select('_id date startTime endTime type maxCapacity currentCapacity swimmingStyles status lessons')
    .sort({ startTime: 1 });
    
    console.log(`Found ${slots.length} time slots for instructor on ${trimmedDate}`);
    
    // Get all lesson IDs from all slots to fetch in one query
    const lessonIds = slots.reduce<ObjectId[]>((ids, slot) => {
      if (slot.lessons && slot.lessons.length > 0) {
        return [...ids, ...slot.lessons];
      }
      return ids;
    }, []);
    
    // Fetch all lessons with student details in one query if there are lessons
    let lessonsMap: { [key: string]: any } = {};
    if (lessonIds.length > 0) {
      const lessons = await Lesson.find({ _id: { $in: lessonIds } })
        .populate('students', 'firstName lastName')
        .lean();
      
      // Create a map of lessons by ID for easy lookup
      lessonsMap = lessons.reduce((map, lesson) => {
        map[lesson._id.toString()] = lesson;
        return map;
      }, {} as { [key: string]: any });
      
      console.log(`Found ${lessons.length} lessons for the time slots`);
    }
    
    // Manually add instructor data and process lessons for each slot
    const enhancedSlots = slots.map(slot => {
      const slotObj = slot.toObject();
      
      // Process lessons for this slot if any
      const processedLessons = slotObj.lessons && slotObj.lessons.length > 0
        ? slotObj.lessons.map(lessonId => {
            const lesson = lessonsMap[lessonId.toString()];
            if (!lesson) return null;
            
            // Map each student to a simpler format
            return {
              lessonId: lesson._id,
              swimStyle: lesson.swimStyle,
              students: lesson.students.map((student: { _id: any; firstName: any; lastName: any; }) => ({
                id: student._id,
                name: `${student.firstName} ${student.lastName}`.trim()
              }))
            };
          }).filter(l => l !== null)
        : [];
      
      // Return a new object that extends slotObj with instructor data and processed lessons
      return {
        ...slotObj, // spread all original properties
        instructor: {
          _id: instructor?._id || instructorId,
          firstName: instructor?.firstName || "מדריך",
          lastName: instructor?.lastName || "",
          swimmingStyles: instructor?.swimmingStyles || []
        },
        processedLessons: processedLessons
      };
    });
    
    return enhancedSlots;
  } catch (error) {
    console.error("Error in getSchedule:", error);
    throw error;
  }
}
  
  /**
   * Gets available instructors for a specific date, time, and optionally swimming style
   * @param date - Date to check (YYYY-MM-DD)
   * @param startTime - Start time to check (HH:MM)
   * @param endTime - Optional end time to check (HH:MM)
   * @param swimStyle - Optional swimming style to filter by
   * @returns Array of available instructors
   */
  async getAvailableInstructors(
    date: string,
    startTime: string,
    endTime?: string,
    swimStyle?: string
  ): Promise<IUser[]> {
    try {
      DateTimeValidator.validateDate(date);
      DateTimeValidator.validateTimeFormat(startTime);
      
      if (endTime) {
        DateTimeValidator.validateTimeFormat(endTime);
      }
      
      if (swimStyle) {
        SwimmingStyleValidator.validateStyle(swimStyle);
      }
      
      // Find instructors with availability on this date and time
      const query: any = {
        role: 'instructor',
        'availability.date': date,
        'availability.startTime': { $lte: startTime }
      };
      
      if (endTime) {
        query['availability.endTime'] = { $gte: endTime };
      }
      
      if (swimStyle) {
        query.swimmingStyles = swimStyle;
      }
      
      // Execute query
      return await User.find(query)
        .select('firstName lastName email swimmingStyles')
        .sort({ firstName: 1 });
    } catch (error) {
      throw error;
    }
  }
}

export default new InstructorService();