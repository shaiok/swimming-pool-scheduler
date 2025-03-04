import express from "express";
import TimeSlotController from "../controller/timeSlotController";
import { authenticateUser, authorizeRoles } from "../middleware/authMiddleware";

const router = express.Router();

/**
 * @route   POST /api/timeslots
 * @desc    Create a new time slot
 * @access  Private (Instructor only)
 */
router.post(
  "/",
  authenticateUser,
  authorizeRoles("instructor"),
  TimeSlotController.createTimeSlot
);

/**
 * @route   GET /api/timeslots
 * @desc    Get all time slots
 * @access  Public
 */
router.get("/", TimeSlotController.getAllTimeSlots);

/**
 * @route   GET /api/timeslots/:id
 * @desc    Get a time slot by ID
 * @access  Public
 */
router.get("/:id", TimeSlotController.getTimeSlotById);

/**
 * @route   PUT /api/timeslots/:id
 * @desc    Update a time slot
 * @access  Private (Instructor only)
 */
router.put(
  "/:id",
  authenticateUser,
  authorizeRoles("instructor"),
  TimeSlotController.updateTimeSlot
);

/**
 * @route   DELETE /api/timeslots/:id
 * @desc    Delete a time slot
 * @access  Private (Instructor only)
 */
router.delete(
  "/:id",
  authenticateUser,
  authorizeRoles("instructor"),
  TimeSlotController.deleteTimeSlot
);

/**
 * @route   GET /api/timeslots/schedule/:scheduleId
 * @desc    Get time slots by weekly schedule
 * @access  Public
 */
router.get("/schedule/:scheduleId", TimeSlotController.findTimeSlotsBySchedule);

/**
 * @route   POST /api/timeslots/generate
 * @desc    Generate time slots from instructor availability
 * @access  Private (Instructor only)
 */
router.post(
  "/generate",
  authenticateUser,
  authorizeRoles("instructor"),
  TimeSlotController.generateTimeSlots
);

export default router;
