import express from 'express';
import LessonController from '../controller/lessonController';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @route   POST /api/lessons
 * @desc    Create a new lesson
 * @access  Private (Admin or Instructor)
 * @body    {string} instructorId - ID of the instructor
 * @body    {array} students - Array of student IDs
 * @body    {string} type - Type of lesson ('private' or 'group')
 * @body    {string} swimStyle - Swimming style for the lesson
 * @body    {string} timeSlotId - ID of the time slot
 */
router.post(
  '/',
  authenticateUser,
  authorizeRoles('instructor'),
  LessonController.createLesson
);

/**
 * @route   GET /api/lessons
 * @desc    Get all lessons
 * @access  Private (Admin or Instructor)
 * @query   {string} instructorId - Filter by instructor ID (optional)
 * @query   {string} studentId - Filter by student ID (optional)
 * @query   {string} type - Filter by lesson type (optional)
 * @query   {string} swimStyle - Filter by swimming style (optional)
 */
router.get(
  '/',
  authenticateUser,
  authorizeRoles('instructor'),
  LessonController.getAllLessons
);

/**
 * @route   GET /api/lessons/timeslot/:timeSlotId
 * @desc    Get lessons by time slot
 * @access  Private (Admin or Instructor)
 * @param   {string} timeSlotId - Time slot ID
 */
router.get(
  '/timeslot/:timeSlotId',
  authenticateUser,
  authorizeRoles('instructor'),
  LessonController.getLessonsByTimeSlot
);

/**
 * @route   GET /api/lessons/:id
 * @desc    Get a lesson by ID
 * @access  Private (Admin, Instructor, or Enrolled Student)
 * @param   {string} id - Lesson ID
 * @query   {boolean} populate - Whether to populate related fields (optional)
 */
router.get(
  '/:id',
  authenticateUser,
  LessonController.getLessonById
);

/**
 * @route   POST /api/lessons/:id/students
 * @desc    Add a student to a lesson
 * @access  Private (Admin or Instructor)
 * @param   {string} id - Lesson ID
 * @body    {string} studentId - ID of the student to add
 */
router.post(
  '/:id/students',
  authenticateUser,
  authorizeRoles('instructor'),
  LessonController.addStudentToLesson
);

/**
 * @route   DELETE /api/lessons/:id/students/:studentId
 * @desc    Remove a student from a lesson
 * @access  Private (Admin, Instructor, or the Student)
 * @param   {string} id - Lesson ID
 * @param   {string} studentId - ID of the student to remove
 */
router.delete(
  '/:id/students/:studentId',
  authenticateUser,
  LessonController.removeStudentFromLesson
);

/**
 * @route   DELETE /api/lessons/:id
 * @desc    Cancel a lesson
 * @access  Private (Admin or Instructor)
 * @param   {string} id - Lesson ID
 */
router.delete(
  '/:id',
  authenticateUser,
  authorizeRoles('instructor'),
  LessonController.cancelLesson
);

export default router;