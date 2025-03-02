// instructorRoutes.ts
import express from "express";
import { InstructorController } from "../controller/instructorController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = express.Router();

// Set instructor availability
router.post("/availability", authenticateUser, InstructorController.setAvailability);

// Get instructor schedule
router.get("/:instructorId/schedule", authenticateUser, InstructorController.getInstructorSchedule);

// Update instructor profile
router.put("/:instructorId", authenticateUser, InstructorController.updateProfile);

// Cancel a lesson
router.post("/cancel-lesson", authenticateUser, InstructorController.cancelLesson);

// Get instructor lessons
router.get("/:instructorId/lessons", authenticateUser, InstructorController.getLessons);

// Get instructor statistics
router.get("/:instructorId/statistics", authenticateUser, InstructorController.getStatistics);

// Get instructor details
router.get("/:instructorId", authenticateUser, InstructorController.getInstructorDetails);

export default router;