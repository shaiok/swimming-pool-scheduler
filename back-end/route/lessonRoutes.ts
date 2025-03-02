// lessonRoutes.ts
import express from "express";
import { LessonController } from "../controller/lessonController";
import { SwimmerController } from "../controller/swimmerController";
import { InstructorController } from "../controller/instructorController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = express.Router();

// Book a Lesson - Use SwimmerController because that's where booking logic is
router.post("/book", authenticateUser, async (req, res): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { id, role } = req.user;
  
  if (role === "swimmer") {
    req.params.swimmerId = id;
    await SwimmerController.bookLesson(req, res);
  } else {
    res.status(403).json({ message: "Only swimmers can book lessons" });
  }
});

// Cancel a Lesson - Use appropriate controller based on role
router.post("/cancel", authenticateUser, async (req, res): Promise<void> => {

  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  
  const { userId, role } = req.user; // From auth middleware
  
  if (role === "swimmer") {
    req.body.swimmerId = userId;
    await SwimmerController.cancelLesson(req, res);
  } else if (role === "instructor") {
    req.body.instructorId = userId;
    await InstructorController.cancelLesson(req, res);
  } else {
    res.status(403).json({ message: "Unauthorized to cancel lessons" });
  }
  res.end();
});

// Get Lessons by Instructor
router.get("/instructor/:instructorId", authenticateUser, async (req, res) => {
  // Use the getLessons method which accepts filters
  req.params.instructorId = req.params.instructorId;
  return InstructorController.getLessons(req, res);
});

// Get Lessons by Swimmer
router.get("/swimmer/:swimmerId", authenticateUser, async (req, res) => {
  req.params.swimmerId = req.params.swimmerId;
  return SwimmerController.getBookedLessons(req, res);
});

// Get lesson by ID
router.get("/:lessonId", authenticateUser, LessonController.getLesson);

// Update lesson status
router.put("/:lessonId/status", authenticateUser, LessonController.updateLessonStatus);

// Add swimmer to group lesson
router.post("/:lessonId/swimmers", authenticateUser, LessonController.addSwimmerToLesson);

// Remove swimmer from lesson
router.delete("/:lessonId/swimmers", authenticateUser, LessonController.removeSwimmerFromLesson);

// Get weekly statistics
router.get("/statistics/weekly", authenticateUser, LessonController.getWeeklyStatistics);

export default router;