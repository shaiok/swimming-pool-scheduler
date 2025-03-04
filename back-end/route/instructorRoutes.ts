import express from 'express';
import InstructorController from '../controller/instructorController';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @route   GET /api/instructors
 * @desc    Get all instructors
 * @access  Public
 */
router.get('/', InstructorController.getAllInstructors);

/**
 * @route   GET /api/instructors/available
 * @desc    Get available instructors
 * @access  Public
 * @query   {string} date - Date to check
 * @query   {string} startTime - Start time to check
 * @query   {string} endTime - End time to check (optional)
 * @query   {string} swimmingStyle - Swimming style to filter by (optional)
 */
router.get('/available', InstructorController.getAvailableInstructors);

/**
 * @route   GET /api/instructors/:id
 * @desc    Get instructor by ID
 * @access  Public
 * @param   {string} id - Instructor ID
 */
router.get('/:id', InstructorController.getInstructorById);

/**
 * @route   PUT /api/instructors/:id/availability
 * @desc    Update instructor availability
 * @access  Private (Instructor only)
 * @param   {string} id - Instructor ID
 * @body    {array} availability - Array of availability slots
 */
router.put(
  '/:id/availability',
  authenticateUser,
  authorizeRoles('instructor'),
  InstructorController.updateAvailability
);

/**
 * @route   POST /api/instructors/:id/availability
 * @desc    Add an availability slot
 * @access  Private (Instructor only)
 * @param   {string} id - Instructor ID
 * @body    {string} date - Date of the slot
 * @body    {string} startTime - Start time of the slot
 * @body    {string} endTime - End time of the slot
 */
router.post(
  '/:id/availability',
  authenticateUser,
  authorizeRoles('instructor'),
  InstructorController.addAvailabilitySlot
);

/**
 * @route   DELETE /api/instructors/:id/availability
 * @desc    Remove an availability slot
 * @access  Private (Instructor only)
 * @param   {string} id - Instructor ID
 * @body    {string} date - Date of the slot to remove
 * @body    {string} startTime - Start time of the slot to remove
 */
router.delete(
  '/:id/availability',
  authenticateUser,
  authorizeRoles('instructor'),
  InstructorController.removeAvailabilitySlot
);

/**
 * @route   PUT /api/instructors/:id/swimmingstyles
 * @desc    Update instructor swimming styles
 * @access  Private (Instructor only)
 * @param   {string} id - Instructor ID
 * @body    {array} swimmingStyles - Array of swimming styles
 */
router.put(
  '/:id/swimmingstyles',
  authenticateUser,
  authorizeRoles('instructor'),
  InstructorController.updateSwimmingStyles
);

export default router;