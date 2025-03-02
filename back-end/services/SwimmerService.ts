import { Instructor } from "../model/instructor";
import { Lesson } from "../model/lesson";

export class SwimmerService {
  // ✅ Get available instructors for a swim style
  static async getAvailableInstructors(swimStyle: string) {
    return await Instructor.find({ swimmingStyles: swimStyle }).populate("user");
  }

  // ✅ Get swimmer schedule
  static async getSwimmerSchedule(swimmerId: string) {
    return await Lesson.find({ swimmers: swimmerId }).populate("instructor");
  }
}
