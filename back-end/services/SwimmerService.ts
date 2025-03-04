import mongoose from 'mongoose';
import { IUser, User } from '../model/user';
import { ITimeSlot, TimeSlot } from '../model/timeSlot';
import { ILesson, Lesson } from '../model/lesson';



/**
 * Service for swimmer operations
 */
class SwimmerService {
  /**
   * Get a swimmer by ID
   * @param swimmerId - Swimmer's ID
   * @returns Swimmer data or null if not found
   */
  async getSwimmerById(swimmerId: mongoose.Types.ObjectId | string): Promise<IUser | null> {
    try {
      return await User.findOne({ _id: swimmerId, role: 'swimmer' })
        .select('firstName lastName email phone swimmingStyles preferredLessonType role')
        .lean(); // Ensure role is included
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update swimmer preferences
   * @param swimmerId - Swimmer's ID
   * @param updates - Preferences to update
   * @returns Updated swimmer data or null if not found
   */
  async updatePreferences(
    swimmerId: mongoose.Types.ObjectId | string,
    updates: {
      swimmingStyles?: string[];
      preferredLessonType?: 'private' | 'group' | 'both';
    }
  ): Promise<IUser | null> {
    try {
      // Validate swimming styles if provided
      if (updates.swimmingStyles) {
        this.validateSwimmingStyles(updates.swimmingStyles);
      }

      // Validate lesson type if provided
      if (updates.preferredLessonType && !['private', 'group', 'both'].includes(updates.preferredLessonType)) {
        throw new Error('Invalid preferred lesson type');
      }

      // Update the swimmer
      const updateData: any = {};
      if (updates.swimmingStyles) updateData.swimmingStyles = updates.swimmingStyles;
      if (updates.preferredLessonType) updateData.preferredLessonType = updates.preferredLessonType;

      return await User.findOneAndUpdate(
        { _id: swimmerId, role: 'swimmer' },
        { $set: updateData },
        { new: true }
      ).select('firstName lastName email phone swimmingStyles preferredLessonType');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Book a lesson
   * @param swimmerId - Swimmer's ID
   * @param timeSlotId - Time slot ID
   * @param swimStyle - Swimming style for the lesson
   * @returns The booked lesson
   */
  async bookLesson(
    swimmerId: mongoose.Types.ObjectId | string,
    timeSlotId: mongoose.Types.ObjectId | string,
    swimStyle: string
  ): Promise<ILesson> {
    // Validate inputs thoroughly
    this.validateSwimmingStyle(swimStyle);
  
    // Create the lesson first so we have its _id for the time slot update.
    const lesson = new Lesson({
      // instructorId will be set after fetching the time slot
      students: [swimmerId],
      swimStyle,
      timeSlotId,
      // type will be determined based on the time slot's maxCapacity
    });
  
    // Find the time slot using a field-to-field comparison with $expr
    const timeSlot = await TimeSlot.findOneAndUpdate(
      {
        _id: timeSlotId,
        $expr: { $lt: ['$currentCapacity', '$maxCapacity'] }
      },
      {
        $inc: { currentCapacity: 1 },
        $push: { lessons: lesson._id }
      },
      {
        new: true,
        runValidators: true
      }
    );
  
    if (!timeSlot) {
      throw new Error('Time slot is fully booked or not available');
    }
  
    // Now that we have the timeSlot, update lesson properties accordingly.
    lesson.instructorId = timeSlot.instructorId;
    lesson.type = timeSlot.maxCapacity > 1 ? 'group' : 'private';
  
    // Save the lesson.
    await lesson.save();
  
    return lesson;
  }
  
  
  

  /**
   * Cancel a lesson
   * @param swimmerId - Swimmer's ID
   * @param lessonId - Lesson ID
   * @returns Boolean indicating if the cancellation was successful
   */
  async cancelLesson(
    swimmerId: mongoose.Types.ObjectId | string,
    lessonId: mongoose.Types.ObjectId | string
  ): Promise<boolean> {
    try {
      // Get the lesson
      const lesson = await Lesson.findById(lessonId);
      if (!lesson) {
        throw new Error('Lesson not found');
      }

      // Check if swimmer is in the lesson
      const studentIds = lesson.students.map(id => id.toString());
      if (!studentIds.includes(swimmerId.toString())) {
        throw new Error('Swimmer is not enrolled in this lesson');
      }

      // If it's a private lesson, remove the swimmer and delete the lesson
      if (lesson.type === 'private') {
        // Get the time slot to update its capacity
        const timeSlot = await TimeSlot.findOne({ lessons: lessonId });
        if (timeSlot) {
          // Remove lesson from time slot
          timeSlot.lessons = timeSlot.lessons.filter(id => id.toString() !== lessonId.toString());
          timeSlot.currentCapacity = Math.max(0, timeSlot.currentCapacity - 1);
          await timeSlot.save();
        }

        // Delete the lesson
        await Lesson.findByIdAndDelete(lessonId);
      } else {
        // For group lessons, just remove the swimmer
        lesson.students = lesson.students.filter(id => id.toString() !== swimmerId.toString());
        
        // If no students left, delete the lesson
        if (lesson.students.length === 0) {
          // Get the time slot to update its capacity
          const timeSlot = await TimeSlot.findOne({ lessons: lessonId });
          if (timeSlot) {
            // Remove lesson from time slot
            timeSlot.lessons = timeSlot.lessons.filter(id => id.toString() !== lessonId.toString());
            timeSlot.currentCapacity = Math.max(0, timeSlot.currentCapacity - 1);
            await timeSlot.save();
          }

          // Delete the lesson
          await Lesson.findByIdAndDelete(lessonId);
        } else {
          // Save the updated lesson
          await lesson.save();
          
          // Update time slot capacity
          const timeSlot = await TimeSlot.findOne({ lessons: lessonId });
          if (timeSlot) {
            timeSlot.currentCapacity = Math.max(0, timeSlot.currentCapacity - 1);
            await timeSlot.save();
          }
        }
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all lessons for a swimmer
   * @param swimmerId - Swimmer's ID
   * @returns Array of lessons
   */
  async getSwimmerLessons(swimmerId: mongoose.Types.ObjectId | string): Promise<ILesson[]> {
    try {
      return await Lesson.find({ students: swimmerId })
        .populate('instructorId', 'firstName lastName')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find available time slots for a swimmer
   * @param date - Date to check (optional)
   * @param swimStyle - Swimming style to filter by (optional)
   * @param lessonType - Lesson type preference (optional)
   * @returns Array of available time slots
   */
  async findAvailableTimeSlots(
    date?: string,
    swimStyle?: string,
    lessonType?: 'private' | 'group'
  ): Promise<ITimeSlot[]> {
    try {
      // Build query
      const query: any = {
        currentCapacity: { $lt: '$maxCapacity' } // Only slots with available capacity
      };

      // Add date filter if provided
      if (date) {
        query.date = date;
      }

      // Add lesson type filter if provided
      if (lessonType) {
        if (lessonType === 'private') {
          query.maxCapacity = 1;
        } else {
          query.maxCapacity = { $gt: 1 };
        }
      }

      // Execute query with aggregation to filter by capacity
      const timeSlots = await TimeSlot.aggregate([
        {
          $match: {
            $expr: { $lt: ['$currentCapacity', '$maxCapacity'] },
            ...(date ? { date } : {}),
            ...(lessonType === 'private' ? { maxCapacity: 1 } : {}),
            ...(lessonType === 'group' ? { maxCapacity: { $gt: 1 } } : {})
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'instructorId',
            foreignField: '_id',
            as: 'instructor'
          }
        },
        {
          $unwind: '$instructor'
        },
        ...(swimStyle ? [
          {
            $match: {
              'instructor.swimmingStyles': swimStyle
            }
          }
        ] : []),
        {
          $project: {
            _id: 1,
            date: 1,
            startTime: 1,
            endTime: 1,
            maxCapacity: 1,
            currentCapacity: 1,
            'instructor._id': 1,
            'instructor.firstName': 1,
            'instructor.lastName': 1,
            'instructor.swimmingStyles': 1
          }
        }
      ]);

      return timeSlots;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate swimming styles
   * @param styles - Array of swimming styles to validate
   * @throws Error if styles are invalid
   */
  private validateSwimmingStyles(styles: string[]): void {
    const validStyles = ['Freestyle', 'Backstroke', 'Breaststroke', 'Butterfly'];
    
    if (!Array.isArray(styles)) {
      throw new Error('Swimming styles must be an array');
    }

    for (const style of styles) {
      if (!validStyles.includes(style)) {
        throw new Error(`Invalid swimming style: ${style}`);
      }
    }
  }

  /**
   * Validate a single swimming style
   * @param style - Swimming style to validate
   * @throws Error if style is invalid
   */
  private validateSwimmingStyle(style: string): void {
    const validStyles = ['Freestyle', 'Backstroke', 'Breaststroke', 'Butterfly'];
    
    if (!validStyles.includes(style)) {
      throw new Error(`Invalid swimming style: ${style}`);
    }
  }
}



export default new SwimmerService();