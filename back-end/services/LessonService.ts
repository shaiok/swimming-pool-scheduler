import mongoose from "mongoose";
import { Lesson } from "../model/lesson";
import { Instructor } from "../model/instructor";
import { TimeSlot } from "../model/timeSlot";

export class LessonService {
  static async bookLesson(
    swimmerId: string, 
    date: string, 
    startTime: string, // Explicitly define as string
    swimStyle: string, 
    lessonType: "private" | "group"
  )
   {
    console.log("🔹 Searching for available instructors:", { date, startTime, swimStyle });

    // ✅ Step 1: Find an available instructor for the given date and time
    const availableInstructor = await Instructor.findOne({
      [`availability.${new Date(date).toLocaleString('en-US', { weekday: 'long' })}`]: { $exists: true },
      swimmingStyles: swimStyle,
    });

    if (!availableInstructor) {
      throw new Error("No available instructors for this time and swim style");
    }

    console.log("🔹 Found Instructor:", availableInstructor._id);

    // ✅ Step 2: Check if the time slot exists, if not, create one
    let timeSlot = await TimeSlot.findOne({
      date,
      time: startTime,
      instructor: availableInstructor._id,
    });

    if (!timeSlot) {
      console.log("🔹 Creating new TimeSlot");
      timeSlot = new TimeSlot({
        date,
        time: startTime,
        instructor: availableInstructor._id,
        lesson: null,
        isAvailable: true,
        maxCapacity: lessonType === "private" ? 5 : 20,
        currentCapacity: 0,
      });
      await timeSlot.save();
    }

    // ✅ Step 3: Check if there's already a lesson for that time slot
    let lesson = await Lesson.findOne({
      lessonDate: date,
      startTime,
      instructor: availableInstructor._id,
    });

    if (lesson) {
      // ✅ If it's a private lesson and already booked, reject
      if (lesson.lessonType === "private" && lesson.swimmers.length >= 1) {
        throw new Error("This time slot is already booked for a private lesson");
      }
      
      // ✅ If it's a group lesson, check capacity
      if (lesson.lessonType === "group" && lesson.swimmers.length >= 20) {
        throw new Error("Group lesson is full (max 20 swimmers)");
      }
      
      // ✅ Add swimmer to existing group lesson
      lesson.swimmers.push(new mongoose.Types.ObjectId(swimmerId));
      timeSlot.currentCapacity += 1;
      if (timeSlot.currentCapacity >= timeSlot.maxCapacity) {
        timeSlot.isAvailable = false;
      }
      await lesson.save();
      await timeSlot.save();
      return lesson;
    }

    // ✅ Step 4: Create a new lesson if no existing lesson is found
    console.log("🔹 Creating a new lesson");
    const newLesson = new Lesson({
      instructor: availableInstructor._id,
      swimmers: [new mongoose.Types.ObjectId(swimmerId)],
      lessonType,
      swimStyle,
      lessonDate: date,
      startTime,
      endTime: new Date(new Date(`1970-01-01T${startTime}:00Z`).getTime() + 45 * 60000).toISOString().substr(11, 5),
      status: "scheduled",
    });
    
    // ✅ Step 5: Update the time slot to link the lesson
    timeSlot.lesson = newLesson._id as mongoose.Types.ObjectId;
    timeSlot.currentCapacity += 1;
    if (timeSlot.currentCapacity >= timeSlot.maxCapacity) {
      timeSlot.isAvailable = false;
    }

    await newLesson.save();
    await timeSlot.save();
    console.log("🔹 Lesson Booked Successfully:", newLesson);
    return newLesson;
  }
}
