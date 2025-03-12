import express from "express";
import InstructorController from "../controller/instructorController";

const router = express.Router();

// GET /api/instructors - Retrieve all instructors
router.get("/", InstructorController.getAllInstructors);

// GET /api/instructors/:id - Retrieve a single instructor by ID
router.get("/:id", InstructorController.getInstructorById);

// GET /api/instructors/:id/availability - Get instructor availability (optionally filtered by date)
// Example: /api/instructors/:id/availability?date=2025-06-01
router.get("/:id/availability", InstructorController.getAvailability);

// PUT /api/instructors/:id/availability - Set an instructor's availability for a specific day/time range
router.put("/:id/availability", InstructorController.setAvailability);

// DELETE /api/instructors/:id/availability - Remove instructor availability for a specific date
router.delete("/:id/availability", InstructorController.removeAvailability);

// PUT /api/instructors/:id/swimmingstyles - Update an instructor's swimming styles
router.put("/:id/swimmingstyles", InstructorController.updateSwimmingStyles);

// GET /api/instructors/:id/schedule - Get an instructor's schedule for a specific date
// Example: /api/instructors/:id/schedule?date=2025-06-01
router.get("/:id/schedule", InstructorController.getSchedule);

// GET /api/instructors/available - Get available instructors with filters
// Example: /api/instructors/available?date=2025-06-01&startTime=09:00&endTime=10:00&swimmingStyle=Freestyle
router.get("/available", InstructorController.getAvailableInstructors);

export default router;
