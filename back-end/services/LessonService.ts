import mongoose from "mongoose";
import { Lesson } from "../model/lesson";
import { Instructor } from "../model/instructor";
import { Swimmer } from "../model/swimmer";
import { ScheduleService } from "./ScheduleService ";

export class LessonService {
  // Get a lesson by ID
  static async getLesson(lessonId: string) {
    const lesson = await Lesson.findById(lessonId)
      .populate("instructor swimmers");
      
    if (!lesson) {
      throw new Error("Lesson not found");
    }
    
    return lesson;
  }
  
  // Get all lessons with various filters
  static async getLessons(filters: {
    status?: string;
    swimStyle?: string;
    instructorId?: string;
    swimmerId?: string;
    fromDate?: Date;
    toDate?: Date;
    lessonType?: string;
  } = {}) {
    let query: any = {};
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.swimStyle) {
      query.swimStyle = filters.swimStyle;
    }
    
    if (filters.instructorId) {
      query.instructor = filters.instructorId;
    }
    
    if (filters.swimmerId) {
      query.swimmers = filters.swimmerId;
    }
    
    if (filters.lessonType) {
      query.lessonType = filters.lessonType;
    }
    
    if (filters.fromDate || filters.toDate) {
      query.lessonDate = {};
      if (filters.fromDate) query.lessonDate.$gte = filters.fromDate;
      if (filters.toDate) query.lessonDate.$lte = filters.toDate;
    }
    
    const lessons = await Lesson.find(query)
      .populate("instructor swimmers")
      .sort({ lessonDate: 1, startTime: 1 });
      
    return lessons;
  }
  
  // Update lesson status
  static async updateLessonStatus(lessonId: string, status: "scheduled" | "completed" | "canceled") {
    const lesson = await Lesson.findById(lessonId);
    
    if (!lesson) {
      throw new Error("Lesson not found");
    }
    
    lesson.status = status;
    await lesson.save();
    
    return lesson;
  }
  
  // Add a swimmer to a group lesson
  static async addSwimmerToLesson(lessonId: string, swimmerId: string) {
    const lesson = await Lesson.findById(lessonId);
    
    if (!lesson) {
      throw new Error("Lesson not found");
    }
    
    if (lesson.lessonType !== "group") {
      throw new Error("Cannot add swimmers to a private lesson");
    }
    
    // Check if the lesson is already full (max 4 swimmers)
    if (lesson.swimmers.length >= 4) {
      throw new Error("Lesson is already at maximum capacity");
    }
    
    // Check if swimmer is already in the lesson
    if (lesson.swimmers.some(id => id.toString() === swimmerId)) {
      throw new Error("Swimmer is already enrolled in this lesson");
    }
    
    // Add the swimmer
    lesson.swimmers.push(new mongoose.Types.ObjectId(swimmerId));
    await lesson.save();
    
    return lesson;
  }
  
  // Remove a swimmer from a lesson
  static async removeSwimmerFromLesson(lessonId: string, swimmerId: string) {
    const lesson = await Lesson.findById(lessonId);
    
    if (!lesson) {
      throw new Error("Lesson not found");
    }
    
    // Remove the swimmer
    lesson.swimmers = lesson.swimmers.filter(id => id.toString() !== swimmerId);
    
    // If group lesson has no swimmers, cancel it
    if (lesson.swimmers.length === 0) {
      lesson.status = "canceled";
    }
    
    await lesson.save();
    
    return lesson;
  }
  
  // Get weekly lesson statistics
  static async getWeeklyStatistics() {
    const scheduleService = new ScheduleService();
    const startDate = scheduleService.getCurrentWeekStart();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    // Total lessons this week
    const totalLessons = await Lesson.countDocuments({
      lessonDate: { $gte: startDate, $lte: endDate },
      status: { $ne: "canceled" }
    });
    
    // Lessons by type
    const lessonsByType = await Lesson.aggregate([
      { $match: { 
        lessonDate: { $gte: startDate, $lte: endDate },
        status: { $ne: "canceled" }
      }},
      { $group: { _id: "$lessonType", count: { $sum: 1 } } }
    ]);
    
    // Lessons by style
    const lessonsByStyle = await Lesson.aggregate([
      { $match: { 
        lessonDate: { $gte: startDate, $lte: endDate },
        status: { $ne: "canceled" }
      }},
      { $group: { _id: "$swimStyle", count: { $sum: 1 } } }
    ]);
    
    // Lessons by day
    const lessonsByDay = await Lesson.aggregate([
      { $match: { 
        lessonDate: { $gte: startDate, $lte: endDate },
        status: { $ne: "canceled" }
      }},
      { $group: { 
        _id: { $dayOfWeek: "$lessonDate" }, 
        count: { $sum: 1 } 
      }}
    ]);
    
    // Map day numbers to names
    const dayMap: Record<string, string> = {
      "1": "Sunday", "2": "Monday", "3": "Tuesday", 
      "4": "Wednesday", "5": "Thursday", "6": "Friday", "7": "Saturday"
    };
    
    return {
      totalLessons,
      lessonsByType: lessonsByType.map(item => ({ 
        type: item._id, 
        count: item.count 
      })),
      lessonsByStyle: lessonsByStyle.map(item => ({ 
        style: item._id, 
        count: item.count 
      })),
      lessonsByDay: lessonsByDay.map(item => ({ 
        day: dayMap[item._id.toString()], 
        count: item.count 
      }))
    };
  }
  
  // Check for scheduling conflicts
  static async checkLessonConflicts(lessonId: string) {
    const lesson = await Lesson.findById(lessonId);
    
    if (!lesson) {
      throw new Error("Lesson not found");
    }
    
    const scheduleService = new ScheduleService();
    
    // Get all lessons for the same instructor on the same day
    const sameDayLessons = await Lesson.find({
      instructor: lesson.instructor,
      lessonDate: lesson.lessonDate,
      _id: { $ne: lesson._id },
      status: "scheduled"
    });
    
    // Check for time conflicts
    const conflicts = sameDayLessons.filter(otherLesson => 
      scheduleService.isTimeOverlap(
        lesson.startTime,
        lesson.endTime,
        otherLesson.startTime,
        otherLesson.endTime
      )
    );
    
    return conflicts.length > 0 ? conflicts : null;
  }
}