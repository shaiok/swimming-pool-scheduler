import express from "express";
import { LessonController } from "../controller/lessonController";
import { authenticateUser } from "../middleware/authMiddleware";

const lessonRouter = express.Router();

// ✅ Book a lesson
lessonRouter.post("/book", authenticateUser, LessonController.bookLesson);

// ✅ Cancel a lesson (Swimmer removes themselves)
lessonRouter.post("/cancel", authenticateUser, LessonController.cancelLesson);

// ✅ Get lessons for an instructor
lessonRouter.get("/instructor/:instructorId", authenticateUser, LessonController.getInstructorLessons);

// ✅ Get lessons for a swimmer
lessonRouter.get("/swimmer/:swimmerId", authenticateUser, LessonController.getSwimmerLessons);

export default lessonRouter;
