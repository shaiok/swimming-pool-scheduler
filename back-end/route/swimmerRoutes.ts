import express from 'express';
import SwimmerController from '../controller/swimmerController';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @route   GET /api/swimmers/timeslots
 * @desc    Find available time slots
 * @access  Public
 * @query   {string} date - Date to check (optional)
 * @query   {string} swimStyle - Swimming style to filter by (optional)
 * @query   {string} lessonType - Lesson type preference (optional, 'private' or 'group')
 */
router.get('/timeslots', SwimmerController.findAvailableTimeSlots);

/**
 * @route   GET /api/swimmers/:id
 * @desc    Get swimmer profile
 * @access  Private (Swimmer or Admin)
 * @param   {string} id - Swimmer ID
 */
router.get(
  '/:id',
  authenticateUser,
  authorizeRoles('swimmer'),
  SwimmerController.getSwimmerProfile
);

/**
 * @route   PUT /api/swimmers/:id/preferences
 * @desc    Update swimmer preferences
 * @access  Private (Swimmer only)
 * @param   {string} id - Swimmer ID
 * @body    {array} swimmingStyles - Array of swimming styles (optional)
 * @body    {string} preferredLessonType - Preferred lesson type (optional, 'private', 'group', or 'both')
 */
router.put(
  '/:id/preferences',
  authenticateUser,
  authorizeRoles('swimmer'),
  SwimmerController.updatePreferences
);

/**
 * @route   POST /api/swimmers/:id/lessons
 * @desc    Book a lesson
 * @access  Private (Swimmer only)
 * @param   {string} id - Swimmer ID
 * @body    {string} timeSlotId - Time slot ID
 * @body    {string} swimStyle - Swimming style for the lesson
 */
router.post(
  '/:id/lessons',
  authorizeRoles('swimmer'),
  SwimmerController.bookLesson
);

/**
 * @route   DELETE /api/swimmers/:id/lessons/:lessonId
 * @desc    Cancel a lesson
 * @access  Private (Swimmer only)
 * @param   {string} id - Swimmer ID
 * @param   {string} lessonId - Lesson ID
 */
router.delete(
  '/:id/lessons/:lessonId',
  authenticateUser,
  authorizeRoles('swimmer'),
  SwimmerController.cancelLesson
);

/**
 * @route   GET /api/swimmers/:id/lessons
 * @desc    Get swimmer lessons
 * @access  Private (Swimmer or Admin)
 * @param   {string} id - Swimmer ID
 */
router.get(
  '/:id/lessons',
  authenticateUser,
  authorizeRoles('swimmer'),
  SwimmerController.getSwimmerLessons
);

export default router;