import { Instructor } from "../model/instructor";
import { Lesson } from "../model/lesson";
import { Swimmer } from "../model/swimmer";
import { User } from "../model/user";
import { ScheduleService } from "./ScheduleService ";
import mongoose from "mongoose";

// Define interfaces for populated documents
interface IUserPopulated {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface ISwimmerPopulated extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  user: IUserPopulated;
  swimmingStyles: string[];
  lessonPreference: "private" | "group";
}

interface IInstructorPopulated extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  user: IUserPopulated;
  swimmingStyles: string[];
}

export class SwimmerService {
  // Update swimmer profile
  static async updateProfile(swimmerId: string, data: {
    swimmingStyles?: string[];
    lessonPreference?: "private" | "group";
    firstName?: string;
    lastName?: string;
    phone?: string;
  }) {
    const swimmer = await Swimmer.findById(swimmerId);
    if (!swimmer) {
      throw new Error("Swimmer not found");
    }

    // Update swimmer-specific data
    if (data.swimmingStyles) {
      swimmer.swimmingStyles = data.swimmingStyles;
    }
    if (data.lessonPreference) {
      swimmer.lessonPreference = data.lessonPreference;
    }
    await swimmer.save();

    // Update user data if provided
    if (data.firstName || data.lastName || data.phone) {
      const user = await User.findById(swimmer.user);
      if (!user) {
        throw new Error("User not found");
      }

      if (data.firstName) user.firstName = data.firstName;
      if (data.lastName) user.lastName = data.lastName;
      if (data.phone) user.phone = data.phone;
      
      await user.save();
    }

    // Return updated swimmer with user data
    return await Swimmer.findById(swimmerId).populate("user");
  }

  // Book a lesson
  static async bookLesson(swimmerId: string, bookingData: {
    instructorId: string;
    day: string;
    startTime: string;
    endTime: string;
    swimStyle: string;
    lessonType: string;
  }) {
    const swimmer = await Swimmer.findById(swimmerId);
    if (!swimmer) {
      throw new Error("Swimmer not found");
    }

    // Check if the swimmer has a scheduling conflict
    const conflict = await SwimmerService.checkSchedulingConflict(
      swimmerId, 
      bookingData.day, 
      bookingData.startTime, 
      bookingData.endTime
    );

    if (conflict) {
      throw new Error("You already have a lesson scheduled at this time");
    }

    const scheduleService = new ScheduleService();
    
    // Use the bookLesson method from ScheduleService
    const lesson = await scheduleService.bookLesson({
      day: bookingData.day,
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
      instructorId: bookingData.instructorId,
      swimmerId: swimmerId,
      swimStyle: bookingData.swimStyle,
      lessonType: bookingData.lessonType
    });

    return lesson;
  }

  // Cancel a booked lesson
  static async cancelLesson(swimmerId: string, lessonId: string) {
    const lesson = await Lesson.findOne({
      _id: lessonId,
      swimmers: swimmerId,
      status: "scheduled"
    });

    if (!lesson) {
      throw new Error("Lesson not found or already completed/canceled");
    }

    // Check cancellation policy (e.g., can't cancel less than 24h before)
    const now = new Date();
    const lessonDate = new Date(lesson.lessonDate);
    const hoursDifference = (lessonDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDifference < 24) {
      throw new Error("Lessons can only be canceled at least 24 hours in advance");
    }

    // If it's a private lesson, cancel it completely
    if (lesson.lessonType === "private") {
      lesson.status = "canceled";
      await lesson.save();
    } else {
      // For group lessons, just remove the swimmer
      lesson.swimmers = lesson.swimmers.filter(id => id.toString() !== swimmerId);
      
      // If no swimmers left, cancel the lesson
      if (lesson.swimmers.length === 0) {
        lesson.status = "canceled";
      }
      
      await lesson.save();
    }

    return lesson;
  }

  // Get swimmer's booked lessons
  static async getBookedLessons(swimmerId: string) {
    const lessons = await Lesson.find({
      swimmers: swimmerId,
      status: { $in: ["scheduled", "completed"] }
    })
      .populate("instructor")
      .sort({ lessonDate: 1, startTime: 1 });

    return lessons;
  }

  // Find available lessons based on criteria
  static async findAvailableLessons(swimmerId: string, criteria: {
    swimStyle?: string;
    lessonType?: string;
    preferredDay?: string;
  }) {
    const scheduleService = new ScheduleService();
    const availableSlots = await scheduleService.findAvailableSlots(criteria);
    
    // Filter out any slots that conflict with the swimmer's existing lessons
    const swimmer = await Swimmer.findById(swimmerId);
    if (!swimmer) {
      throw new Error("Swimmer not found");
    }
    
    const bookedLessons = await Lesson.find({
      swimmers: swimmerId,
      status: "scheduled"
    });

    // Define a function to check for time conflicts
    const hasTimeConflict = (
      day: string, 
      startTime: string, 
      endTime: string, 
      lessons: any[]
    ) => {
      const scheduleService = new ScheduleService();
      const start = scheduleService.timeToMinutes(startTime);
      const end = scheduleService.timeToMinutes(endTime);
      
      return lessons.some(lesson => {
        const lessonDay = scheduleService.getDayName(lesson.lessonDate);
        if (lessonDay !== day) return false;
        
        const lessonStart = scheduleService.timeToMinutes(lesson.startTime);
        const lessonEnd = scheduleService.timeToMinutes(lesson.endTime);
        
        return (start < lessonEnd && end > lessonStart);
      });
    };
    
    // Filter out slots that conflict with existing bookings
    const availableNonConflictingSlots: typeof availableSlots = availableSlots.filter((slot: { day: string; startTime: string; endTime: string; }) => 
      !hasTimeConflict(slot.day, slot.startTime, slot.endTime, bookedLessons)
    );
    
    return availableNonConflictingSlots;
  }

  // Check if a swimmer has a scheduling conflict
  private static async checkSchedulingConflict(
    swimmerId: string, 
    day: string,
    startTime: string, 
    endTime: string
  ) {
    const scheduleService = new ScheduleService();
    const weekStart = scheduleService.getCurrentWeekStart();
    
    // Convert day name to actual date
    const dayIndex = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(day);
    const lessonDate = new Date(weekStart);
    lessonDate.setDate(lessonDate.getDate() + dayIndex);
    
    const lessons = await Lesson.find({
      swimmers: swimmerId,
      lessonDate: lessonDate,
      status: "scheduled"
    });
    
    // Check for time conflicts
    const start = scheduleService.timeToMinutes(startTime);
    const end = scheduleService.timeToMinutes(endTime);
    
    return lessons.some(lesson => {
      const lessonStart = scheduleService.timeToMinutes(lesson.startTime);
      const lessonEnd = scheduleService.timeToMinutes(lesson.endTime);
      
      return (start < lessonEnd && end > lessonStart);
    });
  }

  // Get swimmer details with user information
  static async getSwimmerDetails(swimmerId: string) {
    const swimmer = await Swimmer.findById(swimmerId).populate<{ user: IUserPopulated }>("user");
    
    if (!swimmer) {
      throw new Error("Swimmer not found");
    }

    return {
      id: swimmer._id,
      swimmingStyles: swimmer.swimmingStyles,
      lessonPreference: swimmer.lessonPreference,
      user: {
        id: swimmer.user._id,
        firstName: swimmer.user.firstName,
        lastName: swimmer.user.lastName,
        email: swimmer.user.email,
        phone: swimmer.user.phone
      }
    };
  }

  // Get swimmer statistics
  static async getSwimmerStatistics(swimmerId: string) {
    // Total number of lessons
    const totalLessons = await Lesson.countDocuments({
      swimmers: swimmerId,
      status: { $in: ["scheduled", "completed"] }
    });

    // Completed lessons
    const completedLessons = await Lesson.countDocuments({
      swimmers: swimmerId,
      status: "completed"
    });

    // Upcoming lessons
    const upcomingLessons = await Lesson.countDocuments({
      swimmers: swimmerId,
      status: "scheduled",
      lessonDate: { $gte: new Date() }
    });

    // Lessons by style
    const lessonsByStyle = await Lesson.aggregate([
      { $match: { swimmers: swimmerId, status: { $in: ["scheduled", "completed"] } } },
      { $group: { _id: "$swimStyle", count: { $sum: 1 } } }
    ]);

    // Lessons by instructor
    const lessonsByInstructor = await Lesson.aggregate([
      { $match: { swimmers: swimmerId, status: { $in: ["scheduled", "completed"] } } },
      { $group: { _id: "$instructor", count: { $sum: 1 } } }
    ]);

    // Get instructor names
    const instructorIds = lessonsByInstructor.map(item => item._id);
    const instructors = await Instructor.find({ 
      _id: { $in: instructorIds } 
    }).populate<{ user: IUserPopulated }>("user");
    
    // Create map of instructor IDs to names
    const instructorMap: Record<string, string> = {};
    instructors.forEach(instructor => {
      if (instructor.user && instructor._id) {
        instructorMap[instructor._id.toString()] = `${instructor.user.firstName} ${instructor.user.lastName}`;
      }
    });

    return {
      totalLessons,
      completedLessons,
      upcomingLessons,
      lessonsByStyle: lessonsByStyle.map(item => ({ style: item._id, count: item.count })),
      lessonsByInstructor: lessonsByInstructor.map(item => ({ 
        instructor: instructorMap[item._id.toString()] || "Unknown",
        instructorId: item._id,
        count: item.count 
      }))
    };
  }
}