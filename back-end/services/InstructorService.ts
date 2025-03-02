import { Instructor } from "../model/instructor";
import { Lesson } from "../model/lesson";

export class InstructorService {
  // ✅ Set availability
  static async setAvailability(instructorId: string, availability: Record<string, string[]>) {
    console.log("🔹 Checking Instructor ID in DB:", instructorId); // ✅ Debug ID

    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      throw new Error("Instructor not found");
    }

    console.log("🔹 Before Update - Current Availability:", instructor.availability); // ✅ Debug before update

    instructor.availability = availability; // ✅ Update availability
    await instructor.save();

    // ✅ Ensure availability is saved correctly
    const updatedInstructor = await Instructor.findById(instructorId);
    console.log("🔹 After Update - Saved Availability:", updatedInstructor?.availability); // ✅ Debug MongoDB update

    return updatedInstructor;
  }



  // ✅ Get instructor schedule
  static async getInstructorSchedule(instructorId: string) {
    return await Lesson.find({ instructor: instructorId }).populate("swimmers");
  }
}
