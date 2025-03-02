import mongoose from "mongoose";
import { Instructor } from "../model/instructor";
import { Lesson } from "../model/lesson";

export class ScheduleService {
  // Get weekly availability based on all instructors
  async getWeeklyAvailability() {
    // Simple structure to store all available slots
    const weeklySchedule: { [key: string]: any[] } = {
      Sunday: [],
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: []
      // No Saturday (pool closed)
    };

    // Get all instructors with their availability
    const instructors = await Instructor.find().populate("user");

    // Process each instructor's availability
    for (const instructor of instructors) {
      const availability = instructor.availability;
      
      // For each day the instructor is available
      for (const day of Object.keys(availability)) {
        // Skip if day not in our schedule (e.g., Saturday)
        if (!weeklySchedule[day]) continue;
        
        // Process each time range for that day
        for (const timeRange of availability[day]) {
          const [startTime, endTime] = timeRange.split("-");
          
          // Create lesson slots
          await this.generateTimeSlots(
            weeklySchedule, 
            day, 
            startTime, 
            endTime, 
            instructor._id as mongoose.Types.ObjectId,
            instructor.swimmingStyles
          );
        }
      }
    }

    return weeklySchedule;
  }

  // Helper to generate time slots for both private and group lessons
  private async generateTimeSlots(
    schedule: { [key: string]: any[] },
    day: string,
    startTime: string,
    endTime: string,
    instructorId: mongoose.Types.ObjectId,
    swimmingStyles: string[]
  ) {
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    
    // Get instructor name
    const instructorName = await this.getInstructorName(instructorId);
    
    // Generate private lesson slots (45 min)
    for (let time = start; time + 45 <= end; time += 45) {
      schedule[day].push({
        instructorId,
        startTime: this.minutesToTime(time),
        endTime: this.minutesToTime(time + 45),
        type: "private",
        swimmingStyles,
        instructorName
      });
    }
    
    // Generate group lesson slots (60 min)
    for (let time = start; time + 60 <= end; time += 60) {
      schedule[day].push({
        instructorId,
        startTime: this.minutesToTime(time),
        endTime: this.minutesToTime(time + 60),
        type: "group",
        swimmingStyles,
        instructorName
      });
    }
  }

  // Find available time slots based on criteria
  async findAvailableSlots(criteria: {
    swimStyle?: string;
    lessonType?: string;
    preferredDay?: string;
  }) {
    // Get the full weekly schedule
    const weeklySchedule = await this.getWeeklyAvailability();
    
    // Get already booked lessons to exclude those time slots
    const bookedLessons = await Lesson.find({ status: "scheduled" });
    
    // Filter available slots
    let availableSlots: any[] = [];
    
    // Only process days that match criteria
    const daysToProcess = criteria.preferredDay ? 
      [criteria.preferredDay] : 
      Object.keys(weeklySchedule);
    
    for (const day of daysToProcess) {
      if (!weeklySchedule[day]) continue;
      
      let daySlots = weeklySchedule[day];
      
      // Filter by lesson type if specified
      if (criteria.lessonType) {
        daySlots = daySlots.filter(slot => slot.type === criteria.lessonType);
      }
      
      // Filter by swimming style if specified
      if (criteria.swimStyle) {
        daySlots = daySlots.filter(slot => 
          slot.swimmingStyles.includes(criteria.swimStyle)
        );
      }
      
      // Filter out slots that are already booked
      daySlots = daySlots.filter(slot => 
        !this.isSlotBooked(
          bookedLessons, 
          day, 
          slot.startTime, 
          slot.endTime, 
          slot.instructorId.toString()
        )
      );
      
      // Add day information to each slot
      daySlots = daySlots.map(slot => ({
        ...slot,
        day
      }));
      
      availableSlots = [...availableSlots, ...daySlots];
    }
    
    return availableSlots;
  }

  // Book a lesson
  async bookLesson(bookingData: {
    day: string;
    startTime: string;
    endTime: string;
    instructorId: string;
    swimmerId: string;
    swimStyle: string;
    lessonType: string;
  }) {
    // Validate the slot is available
    const availableSlots = await this.findAvailableSlots({
      preferredDay: bookingData.day,
      lessonType: bookingData.lessonType,
      swimStyle: bookingData.swimStyle
    });
    
    const isAvailable = availableSlots.some(slot => 
      slot.day === bookingData.day &&
      slot.startTime === bookingData.startTime &&
      slot.endTime === bookingData.endTime &&
      slot.instructorId.toString() === bookingData.instructorId
    );
    
    if (!isAvailable) {
      throw new Error("The requested time slot is not available");
    }
    
    // Calculate date for the lesson based on day of week
    const lessonDate = this.getDateFromDayOfWeek(bookingData.day);
    
    // Create a new lesson
    const lesson = new Lesson({
      instructor: bookingData.instructorId,
      swimmers: [bookingData.swimmerId],
      lessonType: bookingData.lessonType,
      swimStyle: bookingData.swimStyle,
      lessonDate,
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
      status: "scheduled"
    });
    
    await lesson.save();
    return lesson;
  }

  // Cancel a lesson and free up the time slot
  async cancelLesson(lessonId: string) {
    const lesson = await Lesson.findById(lessonId);
    
    if (!lesson) {
      throw new Error("Lesson not found");
    }
    
    // Update lesson status
    lesson.status = "canceled";
    await lesson.save();
    
    return lesson;
  }

  // Check if a slot is already booked
  public isSlotBooked(
    bookedLessons: any[],
    day: string,
    startTime: string,
    endTime: string,
    instructorId: string
  ) {
    return bookedLessons.some(lesson => {
      const lessonDay = this.getDayName(lesson.lessonDate);
      
      return (
        lessonDay === day &&
        lesson.instructor.toString() === instructorId &&
        lesson.status === "scheduled" &&
        this.isTimeOverlap(
          startTime, 
          endTime, 
          lesson.startTime, 
          lesson.endTime
        )
      );
    });
  }

  // Check if two time periods overlap
  public isTimeOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ) {
    const s1 = this.timeToMinutes(start1);
    const e1 = this.timeToMinutes(end1);
    const s2 = this.timeToMinutes(start2);
    const e2 = this.timeToMinutes(end2);
    
    return (s1 < e2 && e1 > s2);
  }

  // Get weekly schedule (booked lessons)
  async getWeeklySchedule() {
    // Get current week's Sunday
    const startOfWeek = this.getCurrentWeekStart();
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    
    // Get all scheduled lessons for the week
    const lessons = await Lesson.find({
      lessonDate: { $gte: startOfWeek, $lte: endOfWeek },
      status: { $ne: "canceled" }
    }).populate("instructor swimmers");
    
    // Organize by day
    const weeklySchedule: { [key: string]: any[] } = {
      Sunday: [],
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: []
    };
    
    for (const lesson of lessons) {
      const day = this.getDayName(lesson.lessonDate);
      if (weeklySchedule[day]) {
        const instructorName = await this.getInstructorName(lesson.instructor._id);
        weeklySchedule[day].push({
          id: lesson._id,
          startTime: lesson.startTime,
          endTime: lesson.endTime,
          instructor: {
            id: lesson.instructor._id,
            name: instructorName
          },
          swimmers: lesson.swimmers,
          type: lesson.lessonType,
          style: lesson.swimStyle,
          status: lesson.status
        });
      }
    }
    
    return weeklySchedule;
  }

  // Check for scheduling conflicts
  async checkConflicts() {
    const startOfWeek = this.getCurrentWeekStart();
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    
    const lessons = await Lesson.find({
      lessonDate: { $gte: startOfWeek, $lte: endOfWeek },
      status: "scheduled"
    });
    
    const conflicts = [];
    
    // Check for instructor double-bookings
    for (let i = 0; i < lessons.length; i++) {
      for (let j = i + 1; j < lessons.length; j++) {
        if (
          lessons[i].instructor.toString() === lessons[j].instructor.toString() &&
          lessons[i].lessonDate.toDateString() === lessons[j].lessonDate.toDateString() &&
          this.isTimeOverlap(
            lessons[i].startTime,
            lessons[i].endTime,
            lessons[j].startTime,
            lessons[j].endTime
          )
        ) {
          conflicts.push({
            type: "instructor_double_booking",
            instructorId: lessons[i].instructor,
            lessons: [lessons[i]._id, lessons[j]._id]
          });
        }
      }
    }
    
    // Check for swimming style compatibility
    for (const lesson of lessons) {
      const instructor = await Instructor.findById(lesson.instructor);
      if (instructor && !instructor.swimmingStyles.includes(lesson.swimStyle)) {
        conflicts.push({
          type: "style_incompatibility",
          instructorId: instructor._id,
          lessonId: lesson._id,
          style: lesson.swimStyle
        });
      }
    }
    
    return conflicts;
  }

  // Utility functions
  public timeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(":").map(Number);
    return hours * 60 + minutes;
  }
  
  public minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  }
  
  public getCurrentWeekStart(): Date {
    const now = new Date();
    const day = now.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const diff = now.getDate() - day;
    const sunday = new Date(now.setDate(diff));
    sunday.setHours(0, 0, 0, 0);
    return sunday;
  }
  
  public getDayName(date: Date): string {
    return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getDay()];
  }
  
  public getDateFromDayOfWeek(day: string): Date {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayIndex = days.indexOf(day);
    
    const sunday = this.getCurrentWeekStart();
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + dayIndex);
    
    return date;
  }
  
  // Helper to get instructor name
  public async getInstructorName(instructorId: mongoose.Types.ObjectId): Promise<string> {
    const instructor = await Instructor.findById(instructorId).populate<{ user: { firstName: string, lastName: string } }>("user");
    if (!instructor || !instructor.user) return "Unknown";
    return `${instructor.user.firstName} ${instructor.user.lastName}`;
  }
}