import mongoose from 'mongoose';
import { ILesson } from '../model/lesson';
import { ITimeSlot } from '../model/timeSlot';
import { IUser } from '../model/user';
import{ SwimmingStyleValidator} from '../utils/validators';

// Get models
const Lesson = mongoose.model<ILesson>('Lesson');
const TimeSlot = mongoose.model<ITimeSlot>('TimeSlot');
const User = mongoose.model<IUser>('User');

/**
 * Service for lesson operations
 */
class LessonService {
  /**
   * Create a new lesson
   * @param lessonData - Lesson data
   * @returns The created lesson
   */
  async createLesson(lessonData: {
    instructorId: mongoose.Types.ObjectId | string;
    students: (mongoose.Types.ObjectId | string)[];
    type: "private" | "group";
    swimStyle: string;
    timeSlotId: mongoose.Types.ObjectId | string;
  }): Promise<ILesson> {
    // (Validation logic is assumed to have been done already)
    const lesson = new Lesson({
      instructorId: lessonData.instructorId,
      students: lessonData.students,
      type: lessonData.type,
      swimStyle: lessonData.swimStyle,
      timeSlotId: lessonData.timeSlotId,
      status: "scheduled", // Default status
    });

    await lesson.save();

    // Update the time slot: push the lesson ID and update capacity
    await TimeSlot.findByIdAndUpdate(lessonData.timeSlotId, {
      $push: { lessons: lesson._id },
      $inc: { currentCapacity: lessonData.students.length },
    });

    return lesson;
  }
  
  /**
   * Get a lesson by ID
   * @param lessonId - Lesson ID
   * @param populate - Whether to populate related fields (default: false)
   * @returns The lesson or null if not found
   */
  async getLessonById(
    lessonId: mongoose.Types.ObjectId | string,
    populate: boolean = false
  ): Promise<ILesson | null> {
    try {
      // Create query
      let query = Lesson.findById(lessonId);
      
      // Populate related fields if requested
      if (populate) {
        query = query
          .populate('instructorId', 'firstName lastName')
          .populate('students', 'firstName lastName');
      }
      
      // Execute query
      return await query.exec();
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get all lessons with optional filtering
   * @param filters - Optional filters
   * @returns Array of lessons
   */
  async getAllLessons(filters: {
    instructorId?: mongoose.Types.ObjectId | string;
    studentId?: mongoose.Types.ObjectId | string;
    type?: 'private' | 'group';
    swimStyle?: string;
  } = {}): Promise<ILesson[]> {
    try {
      console.log('DEBUG: Received filters for getAllLessons:', filters);
  
      // Build query
      const query: any = {};
      
      if (filters.instructorId) {
        query.instructorId = filters.instructorId;
      }
      
      if (filters.studentId) {
        // Assuming lessons store enrolled student IDs in an array field named "students"
        query.students = filters.studentId;
      }
      
      if (filters.type) {
        query.type = filters.type;
      }
      
      if (filters.swimStyle) {
        query.swimStyle = filters.swimStyle;
      }
      
      console.log('DEBUG: Built query object for Lesson.find:', query);
      
      // Execute query with additional population of timeSlotId
      const lessons = await Lesson.find(query)
        .populate('instructorId', 'firstName lastName')
        .populate('students', 'firstName lastName')
        .populate('timeSlotId') // <-- populate time slot data
        .sort({ createdAt: -1 });
        
      console.log(`DEBUG: Found ${lessons.length} ${lessons} lessons.`);
      return lessons;
    } catch (error) {
      console.error('ERROR in getAllLessons:', error);
      throw error;
    }
  }
  
  /**
   * Add a student to a lesson
   * @param lessonId - Lesson ID
   * @param studentId - Student ID
   * @returns The updated lesson or null if not found
   */
  async addStudentToLesson(
    lessonId: mongoose.Types.ObjectId | string,
    studentId: mongoose.Types.ObjectId | string
  ): Promise<ILesson | null> {
    try {
      // Get the lesson
      const lesson = await Lesson.findById(lessonId);
      
      if (!lesson) {
        return null;
      }
      
      // Check if this is a private lesson
      if (lesson.type === 'private' && lesson.students.length > 0) {
        throw new Error('Cannot add more students to a private lesson');
      }
      
      // Check if student is already in the lesson
      if (lesson.students.some(id => id.toString() === studentId.toString())) {
        throw new Error('Student is already in the lesson');
      }
      
      // Find the time slot associated with this lesson
      const timeSlot = await TimeSlot.findOne({ lessons: lessonId });
      
      if (!timeSlot) {
        throw new Error('Time slot not found for this lesson');
      }
      
      // Check if time slot has capacity
      if (timeSlot.currentCapacity >= timeSlot.maxCapacity) {
        throw new Error('Time slot is at maximum capacity');
      }
      
      // Add the student to the lesson
      lesson.students.push(studentId as any);
      await lesson.save();
      
      // Update the time slot capacity
      timeSlot.currentCapacity += 1;
      await timeSlot.save();
      
      // Return the updated lesson
      return await Lesson.findById(lessonId)
        .populate('instructorId', 'firstName lastName')
        .populate('students', 'firstName lastName');
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Remove a student from a lesson
   * @param lessonId - Lesson ID
   * @param studentId - Student ID
   * @returns The updated lesson or null if not found
   */
  async removeStudentFromLesson(
    lessonId: mongoose.Types.ObjectId | string,
    studentId: mongoose.Types.ObjectId | string
  ): Promise<ILesson | null> {
    try {
      // Get the lesson
      const lesson = await Lesson.findById(lessonId);
      
      if (!lesson) {
        return null;
      }
      
      // Check if student is in the lesson
      if (!lesson.students.some(id => id.toString() === studentId.toString())) {
        throw new Error('Student is not in the lesson');
      }
      
      // Find the time slot associated with this lesson
      const timeSlot = await TimeSlot.findOne({ lessons: lessonId });
      
      // Remove the student from the lesson
      lesson.students = lesson.students.filter(id => id.toString() !== studentId.toString());
      
      // If no students left, delete the lesson
      if (lesson.students.length === 0) {
        await Lesson.findByIdAndDelete(lessonId);
        
        // Update the time slot
        if (timeSlot) {
          timeSlot.lessons = timeSlot.lessons.filter(id => id.toString() !== lessonId.toString());
          timeSlot.currentCapacity = Math.max(0, timeSlot.currentCapacity - 1);
          await timeSlot.save();
        }
        
        return null;
      }
      
      // Save the updated lesson
      await lesson.save();
      
      // Update the time slot capacity
      if (timeSlot) {
        timeSlot.currentCapacity = Math.max(0, timeSlot.currentCapacity - 1);
        await timeSlot.save();
      }
      
      // Return the updated lesson
      return await Lesson.findById(lessonId)
        .populate('instructorId', 'firstName lastName')
        .populate('students', 'firstName lastName');
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Cancel a lesson
   * @param lessonId - Lesson ID
   * @returns True if cancelled successfully, false if not found
   */
  async cancelLesson(lessonId: mongoose.Types.ObjectId | string): Promise<boolean> {
    try {
      // Get the lesson
      const lesson = await Lesson.findById(lessonId);
      
      if (!lesson) {
        return false;
      }
      
      // Find the time slot associated with this lesson
      const timeSlot = await TimeSlot.findOne({ lessons: lessonId });
      
      // Delete the lesson
      await Lesson.findByIdAndDelete(lessonId);
      
      // Update the time slot
      if (timeSlot) {
        timeSlot.lessons = timeSlot.lessons.filter(id => id.toString() !== lessonId.toString());
        timeSlot.currentCapacity = Math.max(0, timeSlot.currentCapacity - lesson.students.length);
        await timeSlot.save();
      }
      
      return true;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get lessons by time slot
   * @param timeSlotId - Time slot ID
   * @returns Array of lessons
   */
  async getLessonsByTimeSlot(timeSlotId: mongoose.Types.ObjectId | string): Promise<ILesson[]> {
    try {
      // Get the time slot
      const timeSlot = await TimeSlot.findById(timeSlotId);
      
      if (!timeSlot) {
        throw new Error('Time slot not found');
      }
      
      // Get the lessons
      return await Lesson.find({ _id: { $in: timeSlot.lessons } })
        .populate('instructorId', 'firstName lastName')
        .populate('students', 'firstName lastName');
    } catch (error) {
      throw error;
    }
  }
  
/**
   * Validate lesson data
   * @param data - Lesson data to validate
   * @throws Error if data is invalid
   */
private async validateLessonData(data: {
  instructorId: mongoose.Types.ObjectId | string;
  students: (mongoose.Types.ObjectId | string)[];
  type: 'private' | 'group';
  swimStyle: string;  // Note: Keep as swimStyle for existing method parameters
  timeSlotId: mongoose.Types.ObjectId | string;
}): Promise<void> {
  // Validate instructor ID
  if (!mongoose.Types.ObjectId.isValid(data.instructorId)) {
    throw new Error('Invalid instructor ID format');
  }
  
  // Check if instructor exists
  const instructor = await User.findOne({ 
    _id: data.instructorId,
    role: 'instructor'
  });
  
  if (!instructor) {
    throw new Error('Instructor not found');
  }
  
  // Validate swimming style
  SwimmingStyleValidator.validateStyle(data.swimStyle);
  
  // Check if instructor teaches this style
  // Note: Use swimmingStyles (instructor property) consistently
  if (!instructor || !Array.isArray(instructor.swimmingStyles) || !instructor.swimmingStyles.includes(data.swimStyle)) {
    throw new Error(`Instructor does not teach ${data.swimStyle}`);
  }

  // Validate students
  if (!Array.isArray(data.students) || data.students.length === 0) {
    throw new Error('At least one student is required');
  }
  
  // Validate each student ID and check if they are swimmers
  for (const studentId of data.students) {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new Error(`Invalid student ID format: ${studentId}`);
    }
    
    const student = await User.findOne({ 
      _id: studentId,
      role: 'swimmer'
    });
    
    if (!student) {
      throw new Error(`Student not found or is not a swimmer: ${studentId}`);
    }
  }
  
  // Validate lesson type
  if (data.type !== 'private' && data.type !== 'group') {
    throw new Error('Lesson type must be either "private" or "group"');
  }
  
  // For private lessons, only one student is allowed
  if (data.type === 'private' && data.students.length > 1) {
    throw new Error('Private lessons can have only one student');
  }
  
  // Validate time slot ID
  if (!mongoose.Types.ObjectId.isValid(data.timeSlotId)) {
    throw new Error('Invalid time slot ID format');
  }
  
  // Check if time slot exists
  const timeSlot = await TimeSlot.findById(data.timeSlotId);
  
  if (!timeSlot) {
    throw new Error('Time slot not found');
  }
  
  // Check if time slot has capacity
  if (timeSlot.currentCapacity + data.students.length > timeSlot.maxCapacity) {
    throw new Error('Time slot does not have enough capacity');
  }
  
  // Check if time slot is associated with the instructor
  if (timeSlot.instructorId.toString() !== data.instructorId.toString()) {
    throw new Error('Time slot is not associated with the instructor');
  }
  
  // Check if the requested swimming style is offered in this time slot
  if (!timeSlot.swimmingStyles.includes(data.swimStyle)) {
    throw new Error(`The requested swimming style ${data.swimStyle} is not offered in this time slot`);
  }
}
  
  /**
   * Validate a swimming style
   * @param style - Swimming style to validate
   * @throws Error if style is invalid
   */
 
}

export default new LessonService();