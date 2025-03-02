// swimmerRoutes.ts
import express from "express";
import { SwimmerController } from "../controller/swimmerController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = express.Router();

// Get available instructors (adjust service method if needed)
router.get("/available-instructors/:swimStyle", authenticateUser, async (req, res) => {
  try {
    const { swimStyle } = req.params;
    
    // The service needs to be updated to include this method or we can call scheduleService
    const scheduleController = require("../controllers/ScheduleController").ScheduleController;
    req.query.swimStyle = swimStyle;
    return scheduleController.findAvailableSlots(req, res);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

// Get swimmer schedule - map to booked lessons
router.get("/schedule/:swimmerId", authenticateUser, async (req, res) => {
  req.params.swimmerId = req.params.swimmerId;
  return SwimmerController.getBookedLessons(req, res);
});

// Book a lesson
router.post("/:swimmerId/book", authenticateUser, SwimmerController.bookLesson);

// Cancel a lesson
router.post("/:swimmerId/cancel", authenticateUser, async (req, res) => {
  req.body.swimmerId = req.params.swimmerId;
  return SwimmerController.cancelLesson(req, res);
});

// Get swimmer details
router.get("/:swimmerId", authenticateUser, SwimmerController.getSwimmerDetails);

// Update swimmer profile
router.put("/:swimmerId", authenticateUser, SwimmerController.updateProfile);

// Get swimmer statistics
router.get("/:swimmerId/statistics", authenticateUser, SwimmerController.getStatistics);

export default router;