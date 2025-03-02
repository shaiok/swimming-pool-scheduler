// scheduleRoutes.ts
import express from "express";
import { ScheduleController } from "../controller/scheduleController";
import { authenticateUser } from "../middleware/authMiddleware";
import { SwimmerController } from "../controller/swimmerController";

const router = express.Router();

// Generate weekly schedule - Keeping as-is but using controller
router.post("/generate", authenticateUser, ScheduleController.getWeeklyAvailability);

// Get available lessons
router.get("/available", authenticateUser, ScheduleController.findAvailableSlots);

// Book a lesson - Redirect to lesson controller
router.post("/book", authenticateUser, async (req, res): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { id, role } = req.user;
  
  if (role === "swimmer") {
    // Create new params object with swimmerId
    req.params = { ...req.params, swimmerId: id };
    await SwimmerController.bookLesson(req, res);
  } else {
    res.status(403).json({ message: "Only swimmers can book lessons" });
  }
});

// Get weekly schedule
router.get("/weekly", authenticateUser, ScheduleController.getWeeklySchedule);

// Check for schedule conflicts
router.get("/conflicts", authenticateUser, ScheduleController.checkConflicts);

export default router;