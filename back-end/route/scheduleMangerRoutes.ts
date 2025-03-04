import express from "express";
import WeeklyScheduleController from "../controller/scheduleController";
import { authenticateUser, authorizeRoles } from "../middleware/authMiddleware";

const router = express.Router();

/**
 * @route   GET /api/schedules
 * @desc    Get all weekly schedules
 * @access  Public
 */
router.get("/", WeeklyScheduleController.getAllWeeklySchedules);

/**
 * @route   GET /api/schedules/current
 * @desc    Get current active weekly schedule
 * @access  Public
 */
router.get("/current", WeeklyScheduleController.getCurrentWeeklySchedule);

/**
 * @route   GET /api/schedules/overlapping
 * @desc    Find overlapping schedules
 * @access  Public
 */
router.get("/overlapping", WeeklyScheduleController.findOverlappingSchedules);

/**
 * @route   GET /api/schedules/:id
 * @desc    Get a weekly schedule by ID
 * @access  Public
 */
router.get("/:id", WeeklyScheduleController.getWeeklyScheduleById);

/**
 * @route   POST /api/schedules
 * @desc    Create a new weekly schedule
 * @access  Private (Admin only)
 */
router.post(
  "/",
  authenticateUser,
  authorizeRoles("admin"),
  WeeklyScheduleController.createWeeklySchedule
);

/**
 * @route   PUT /api/schedules/:id
 * @desc    Update a weekly schedule
 * @access  Private (Admin only)
 */
router.put(
  "/:id",
  authenticateUser,
  authorizeRoles("admin"),
  WeeklyScheduleController.updateWeeklySchedule
);

/**
 * @route   POST /api/schedules/:id/timeslots
 * @desc    Add time slots to a weekly schedule
 * @access  Private (Admin only)
 */
router.post(
  "/:id/timeslots",
  authenticateUser,
  authorizeRoles("admin"),
  WeeklyScheduleController.addTimeSlotsToSchedule
);

/**
 * @route   DELETE /api/schedules/:id/timeslots
 * @desc    Remove time slots from a weekly schedule
 * @access  Private (Admin only)
 */
router.delete(
  "/:id/timeslots",
  authenticateUser,
  authorizeRoles("admin"),
  WeeklyScheduleController.removeTimeSlotsFromSchedule
);

/**
 * @route   DELETE /api/schedules/:id
 * @desc    Delete a weekly schedule
 * @access  Private (Admin only)
 */
router.delete(
  "/:id",
  authenticateUser,
  authorizeRoles("admin"),
  WeeklyScheduleController.deleteWeeklySchedule
);

export default router;
