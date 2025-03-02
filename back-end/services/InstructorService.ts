import { Instructor } from "../model/instructor";
import { Lesson } from "../model/lesson";
import { User } from "../model/user";
import { ScheduleService } from "./ScheduleService ";
import mongoose from "mongoose";

// Define interfaces for populated documents (similar to SwimmerService)
interface IUserPopulated {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface IInstructorPopulated extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  user: IUserPopulated;
  swimmingStyles: string[];
  availability: Record<string, string[]>;
}

export class InstructorService {
  // Set availability for an instructor
  static async setAvailability(instructorId: string, availability: Record<string, string[]>) {
    console.log("🔹 Checking Instructor ID in DB:", instructorId);

    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      throw new Error("Instructor not found");
    }

    console.log("🔹 Before Update - Current Availability:", instructor.availability);

    instructor.availability = availability;
    await instructor.save();

    // Ensure availability is saved correctly
    const updatedInstructor = await Instructor.findById(instructorId);
    console.log("🔹 After Update - Saved Availability:", updatedInstructor?.availability);

    return updatedInstructor;
  }

  // Get instructor's schedule for a specific week
  static async getInstructorSchedule(instructorId: string, weekStartDate?: string) {
    // Validate instructor exists
    const instructor = await Instructor.findById(instructorId).populate<{ user: IUserPopulated }>("user");
    if (!instructor) {
      throw new Error("Instructor not found");
    }

    const scheduleService = new ScheduleService();
    
    // Get all lessons for this instructor in the specified week
    const startDate = weekStartDate 
      ? new Date(weekStartDate) 
      : scheduleService.getCurrentWeekStart();
      
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const lessons = await Lesson.find({
      instructor: instructorId,
      lessonDate: { $gte: startDate, $lte: endDate },
      status: { $ne: "canceled" }
    }).populate("swimmers");

    // Get weekly availability for this instructor
    const weeklyAvailability = await scheduleService.getWeeklyAvailability();

    // Organize by day
    const weeklySchedule: { [key: string]: any[] } = {
      Sunday: [],
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: []
    };

    // Add booked lessons to the schedule
    for (const lesson of lessons) {
      const day = scheduleService.getDayName(lesson.lessonDate);
      if (weeklySchedule[day]) {
        weeklySchedule[day].push({
          id: lesson._id,
          swimStyle: lesson.swimStyle,
          lessonType: lesson.lessonType,
          startTime: lesson.startTime,
          endTime: lesson.endTime,
          swimmers: lesson.swimmers,
          status: lesson.status,
          isBooked: true
        });
      }
    }

    // Add available slots to the schedule
    for (const day in weeklyAvailability) {
      if (weeklySchedule[day]) {
        // Filter slots for this instructor
        const instructorSlots = weeklyAvailability[day].filter(
          slot => slot.instructorId.toString() === instructorId
        );
        
        // Check if each slot is already booked
        for (const slot of instructorSlots) {
          const isSlotBooked = scheduleService.isSlotBooked(
            lessons,
            day,
            slot.startTime,
            slot.endTime,
            instructorId
          );
          
          if (!isSlotBooked) {
            weeklySchedule[day].push({
              startTime: slot.startTime,
              endTime: slot.endTime,
              type: slot.type,
              swimmingStyles: slot.swimmingStyles,
              isBooked: false,
              isAvailable: true
            });
          }
        }
      }
    }

    // Sort each day's slots by time
    for (const day in weeklySchedule) {
      weeklySchedule[day].sort((a, b) => {
        const timeA = scheduleService.timeToMinutes(a.startTime);
        const timeB = scheduleService.timeToMinutes(b.startTime);
        return timeA - timeB;
      });
    }

    return {
      instructor: {
        id: instructor._id,
        name: `${instructor.user.firstName} ${instructor.user.lastName}`,
        styles: instructor.swimmingStyles,
        availability: instructor.availability
      },
      schedule: weeklySchedule
    };
  }

  // Update instructor profile
  static async updateProfile(instructorId: string, data: {
    swimmingStyles?: string[];
    firstName?: string;
    lastName?: string;
    phone?: string;
  }) {
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      throw new Error("Instructor not found");
    }

    // Update instructor-specific data
    if (data.swimmingStyles) {
      instructor.swimmingStyles = data.swimmingStyles;
    }
    await instructor.save();

    // Update user data if provided
    if (data.firstName || data.lastName || data.phone) {
      const user = await User.findById(instructor.user);
      if (!user) {
        throw new Error("User not found");
      }

      if (data.firstName) user.firstName = data.firstName;
      if (data.lastName) user.lastName = data.lastName;
      if (data.phone) user.phone = data.phone;
      
      await user.save();
    }

    // Return updated instructor with user data
    return await Instructor.findById(instructorId).populate("user");
  }

  // Cancel a lesson (instructor perspective)
  static async cancelLesson(instructorId: string, lessonId: string) {
    const lesson = await Lesson.findOne({
      _id: lessonId,
      instructor: instructorId
    });

    if (!lesson) {
      throw new Error("Lesson not found or not assigned to this instructor");
    }

    // Update lesson status
    lesson.status = "canceled";
    await lesson.save();

    return lesson;
  }

  // Get a list of all lessons for an instructor
  static async getLessons(instructorId: string, filters: {
    status?: string;
    fromDate?: Date;
    toDate?: Date;
  } = {}) {
    let query: any = { instructor: instructorId };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.fromDate || filters.toDate) {
      query.lessonDate = {};
      if (filters.fromDate) query.lessonDate.$gte = filters.fromDate;
      if (filters.toDate) query.lessonDate.$lte = filters.toDate;
    }

    const lessons = await Lesson.find(query)
      .populate("swimmers")
      .sort({ lessonDate: 1, startTime: 1 });

    return lessons;
  }

  // Get instructor statistics
  static async getStatistics(instructorId: string) {
    // Total number of lessons
    const totalLessons = await Lesson.countDocuments({
      instructor: instructorId,
      status: { $in: ["scheduled", "completed"] }
    });

    // Completed lessons
    const completedLessons = await Lesson.countDocuments({
      instructor: instructorId,
      status: "completed"
    });

    // Upcoming lessons
    const upcomingLessons = await Lesson.countDocuments({
      instructor: instructorId,
      status: "scheduled",
      lessonDate: { $gte: new Date() }
    });

    // Lessons by style
    const lessonsByStyle = await Lesson.aggregate([
      { $match: { 
        instructor: new mongoose.Types.ObjectId(instructorId), 
        status: { $in: ["scheduled", "completed"] } 
      }},
      { $group: { _id: "$swimStyle", count: { $sum: 1 } } }
    ]);

    // Lessons by type
    const lessonsByType = await Lesson.aggregate([
      { $match: { 
        instructor: new mongoose.Types.ObjectId(instructorId), 
        status: { $in: ["scheduled", "completed"] } 
      }},
      { $group: { _id: "$lessonType", count: { $sum: 1 } } }
    ]);

    return {
      totalLessons,
      completedLessons,
      upcomingLessons,
      lessonsByStyle: lessonsByStyle.map(item => ({ style: item._id, count: item.count })),
      lessonsByType: lessonsByType.map(item => ({ type: item._id, count: item.count }))
    };
  }

  // Get instructor details with user information
  static async getInstructorDetails(instructorId: string) {
    const instructor = await Instructor.findById(instructorId).populate<{ user: IUserPopulated }>("user");
    
    if (!instructor) {
      throw new Error("Instructor not found");
    }

    return {
      id: instructor._id,
      swimmingStyles: instructor.swimmingStyles,
      availability: instructor.availability,
      user: {
        id: instructor.user._id,
        firstName: instructor.user.firstName,
        lastName: instructor.user.lastName,
        email: instructor.user.email,
        phone: instructor.user.phone
      }
    };
  }
}