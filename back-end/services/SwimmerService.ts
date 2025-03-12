import mongoose from 'mongoose';
import { IUser, User } from '../model/user';
import { ITimeSlot, TimeSlot } from '../model/timeSlot';
import { ILesson, Lesson } from '../model/lesson';
import { MongooseValidator, SwimmingStyleValidator } from '../utils/validators';
import { eventBus } from '../utils/eventBus';
import { AppError, NotFoundError, ValidationError } from '../utils/error';


/**
 * Service for swimmer operations
 */
class SwimmerService {
  /**
   * Get a swimmer by ID
   * @param swimmerId - Swimmer's ID
   * @returns Swimmer data or null if not found
   */
  async getSwimmerById(swimmerId: string): Promise<IUser | null> {
    MongooseValidator.validateObjectId(swimmerId);
    
    return User.findOne({ _id: swimmerId, role: 'swimmer' })
      .select('firstName lastName email phone swimmingStyles preferredLessonType')
      .lean();
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
      // Validate the swimmer ID.
      MongooseValidator.validateObjectId(swimmerId);
  
      // Validate swimming styles if provided.
      if (updates.swimmingStyles) {
        SwimmingStyleValidator.validateStyles(updates.swimmingStyles);
      }
  
      // Validate lesson type if provided.
      if (updates.preferredLessonType) {
        // 'both' is not supported by SwimmingStyleValidator.validateLessonType,
        // so we only validate if it's not 'both'.
        if (updates.preferredLessonType !== 'both') {
          SwimmingStyleValidator.validateLessonType(updates.preferredLessonType);
        }
      }
  
      // Update the swimmer.
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
  try {
    // Validate inputs using validators
    try {
      MongooseValidator.validateObjectId(swimmerId);
      MongooseValidator.validateObjectId(timeSlotId);
      SwimmingStyleValidator.validateStyle(swimStyle);
    } catch (validationError) {
      throw new ValidationError((validationError as Error).message);
    }
    
    // Enhanced debugging
    console.log(`Booking attempt - SwimmerId: ${swimmerId}, TimeSlotId: ${timeSlotId}, SwimStyle: ${swimStyle}`);
    
    // Find student with detailed error handling
    const student = await User.findOne({ _id: swimmerId, role: 'swimmer' });
    if (!student) {
      console.error(`Student not found - ID: ${swimmerId}`);
      throw new NotFoundError("תלמיד לא נמצא");
    }
    
    // Log student swimming styles for debugging
    console.log(`Student styles: ${JSON.stringify(student.swimmingStyles)}, Requested style: ${swimStyle}`);
    
    // Check if the student has any swimming styles
    if (!student.swimmingStyles || student.swimmingStyles.length === 0) {
      console.error(`Student has no swimming styles - ID: ${swimmerId}`);
      throw new ValidationError("התלמיד אינו מוגדר לאף סגנון שחייה. אנא עדכן את הפרופיל שלך תחילה.");
    }
    
    // Check if the student has the requested style
    if (!student.swimmingStyles.includes(swimStyle)) {
      console.error(`Style mismatch - Student styles: [${student.swimmingStyles}], Requested: ${swimStyle}`);
      throw new ValidationError(`התלמיד אינו מתאמן בסגנון ${swimStyle}. סגנונות זמינים: ${student.swimmingStyles.join(', ')}`);
    }
    
    // Create the lesson
    const lesson = new Lesson({
      students: [swimmerId],
      swimStyle,
      timeSlotId,
    });
  
    // Find and update time slot
    const timeSlot = await TimeSlot.findOneAndUpdate(
      {
        _id: timeSlotId,
        $expr: { $lt: ['$currentCapacity', '$maxCapacity'] },
      },
      {
        $inc: { currentCapacity: 1 },
        $push: { lessons: lesson._id },
      },
      {
        new: true,
        runValidators: true,
      }
    );
  
    if (!timeSlot) {
      throw new ValidationError('חלון הזמן מלא או אינו זמין');
    }
    
    // Check if the time slot supports this swimming style
    if (!timeSlot.swimmingStyles.includes(swimStyle)) {
      console.error(`Time slot doesn't support style - TimeSlot styles: [${timeSlot.swimmingStyles}], Requested: ${swimStyle}`);
      throw new ValidationError(`סגנון השחייה ${swimStyle} אינו מוצע בחלון זמן זה`);
    }
  
    // Set lesson properties
    lesson.instructorId = timeSlot.instructorId;
    lesson.type = timeSlot.maxCapacity > 1 ? 'group' : 'private';
  
    await lesson.save();
  
    // Publish event
    await eventBus.publish('lessonBooked', {
      lessonId: lesson._id,
      swimmerId,
      timeSlotId,
      swimStyle,
      lessonType: lesson.type,
    });
  
    return lesson;
  } catch (error) {
    // Rethrow AppErrors as is, wrap others in AppError
    if (error instanceof AppError) {
      throw error;
    }
    console.error(`Error booking lesson: ${error}`);
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to book lesson',
      500
    );
  }
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
    MongooseValidator.validateObjectId(swimmerId);
    MongooseValidator.validateObjectId(lessonId);
  
    try {
      // Retrieve the lesson.
      const lesson = await Lesson.findById(lessonId);
      if (!lesson) {
        throw new Error('Lesson not found');
      }
  
      // Check if the swimmer is enrolled.
      const studentIds = lesson.students.map(id => id.toString());
      if (!studentIds.includes(swimmerId.toString())) {
        throw new Error('Swimmer is not enrolled in this lesson');
      }
  
      // Helper function: Update the time slot capacity.
      const updateTimeSlotCapacity = async () => {
        const timeSlot = await TimeSlot.findOne({ lessons: lessonId });
        if (timeSlot) {
          timeSlot.lessons = timeSlot.lessons.filter(
            id => id.toString() !== lessonId.toString()
          );
          timeSlot.currentCapacity = Math.max(0, timeSlot.currentCapacity - 1);
          await timeSlot.save();
        }
      };
  
      const eventPayload: any = { lessonId, swimmerId };
  
      if (lesson.type === 'private') {
        // For a private lesson, update the time slot and delete the lesson.
        await updateTimeSlotCapacity();
        await Lesson.findByIdAndDelete(lessonId);
        eventPayload.action = 'deleted';
      } else {
        // For group lessons, remove the swimmer.
        lesson.students = lesson.students.filter(
          id => id.toString() !== swimmerId.toString()
        );
  
        if (lesson.students.length === 0) {
          // If no students remain, update capacity and delete the lesson.
          await updateTimeSlotCapacity();
          await Lesson.findByIdAndDelete(lessonId);
          eventPayload.action = 'deleted';
        } else {
          // Otherwise, save the updated lesson and adjust capacity.
          await lesson.save();
          const timeSlot = await TimeSlot.findOne({ lessons: lessonId });
          if (timeSlot) {
            timeSlot.currentCapacity = Math.max(0, timeSlot.currentCapacity - 1);
            await timeSlot.save();
          }
          eventPayload.action = 'updated';
        }
      }
  
      // Publish the cancellation event.
      await eventBus.publish('lessonCanceled', eventPayload);
  
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
/**
 * Retrieve the lessons for a swimmer with full time slot details.
 */
// In LessonService.ts, add a method for fetching swimmer lessons:
async getSwimmerLessons(swimmerId: string): Promise<ILesson[]> {
  try {
    // Build query to filter lessons for the swimmer
    const query = { students: swimmerId };
    // IMPORTANT: Populate timeSlotId to include its fields, especially swimmingStyles
    return await Lesson.find(query)
      .populate('instructorId', 'firstName lastName')
      .populate('students', 'firstName lastName')
      .populate('timeSlotId', 'date startTime endTime swimmingStyles maxCapacity currentCapacity')
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
  swimStyle?: string,  // Keep parameter name as is for backward compatibility
  lessonType?: 'private' | 'group'
): Promise<ITimeSlot[]> {
  try {
    const trimmedDate = date ? date.trim() : undefined;

    // Build match conditions without using $dateToString, since date is stored as string.
    const matchConditions: any = {
      $expr: { $lt: ['$currentCapacity', '$maxCapacity'] },
      ...(trimmedDate ? { date: trimmedDate } : {})
    };

    // Add lesson type filter if provided.
    if (lessonType === 'private') {
      matchConditions.maxCapacity = 1;
    } else if (lessonType === 'group') {
      matchConditions.maxCapacity = { $gt: 1 };
    }

    const pipeline = [
      { $match: matchConditions },
      {
        $lookup: {
          from: 'users',
          localField: 'instructorId',
          foreignField: '_id',
          as: 'instructor',
        },
      },
      { $unwind: '$instructor' },
      ...(swimStyle
        ? [
            {
              // Use standardized field name inside the query
              $match: { 'swimmingStyles': swimStyle },
            },
          ]
        : []),
      {
        $project: {
          _id: 1,
          date: 1,
          startTime: 1,
          endTime: 1,
          maxCapacity: 1,
          currentCapacity: 1,
          swimmingStyles: 1, // Use standardized field name
          'instructor._id': 1,
          'instructor.firstName': 1,
          'instructor.lastName': 1,
          'instructor.swimmingStyles': 1,
        },
      },
    ];

    const timeSlots = await TimeSlot.aggregate(pipeline);
    return timeSlots;
  } catch (error) {
    throw error;
  }
}
  
  
}



export default new SwimmerService();