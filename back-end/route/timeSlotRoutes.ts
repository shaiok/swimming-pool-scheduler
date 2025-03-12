import express from "express";
import TimeSlotController from "../controller/timeSlotController";

const router = express.Router();

// POST /api/timeslots - Create a new time slot
router.post("/", TimeSlotController.createTimeSlot);

// GET /api/timeslots/available - Retrieve available time slots with filters
// Example: /api/timeslots/available?date=2025-06-01&swimStyle=Freestyle&lessonType=private
router.get("/available", TimeSlotController.getAvailableTimeSlots);

// GET /api/timeslots/:id - Retrieve a specific time slot by ID
router.get("/:id", TimeSlotController.getTimeSlotById);

// GET /api/timeslots - Retrieve all time slots with optional filters (e.g., date, instructorId, status)
router.get("/", TimeSlotController.getAllTimeSlots);

// PUT /api/timeslots/:id - Update a time slot
router.put("/:id", TimeSlotController.updateTimeSlot);

// DELETE /api/timeslots/:id - Delete a time slot
router.delete("/:id", TimeSlotController.deleteTimeSlot);

// POST /api/timeslots/generate - Generate time slots from an instructor's availability slot
router.post("/generate", TimeSlotController.generateTimeSlots);

export default router;
