// controllers/InstructorController.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import InstructorService from "../services/InstructorService";

class InstructorController {
  /**
   * GET /api/instructors
   * Retrieves all instructors with basic information.
   */
  async getAllInstructors(req: Request, res: Response): Promise<void> {
    try {
      const instructors = await InstructorService.getAllInstructors();
      res.status(200).json({
        success: true,
        count: instructors.length,
        data: instructors,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve instructors",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * GET /api/instructors/:id
   * Retrieves a single instructor by ID.
   */
  async getInstructorById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const instructor = await InstructorService.getInstructorById(id);
      if (!instructor) {
        res.status(404).json({ success: false, message: "Instructor not found" });
        return;
      }
      res.status(200).json({ success: true, data: instructor });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve instructor",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * GET /api/instructors/:id/availability
   * Retrieves instructor availability, optionally filtered by date.
   * Query parameter: date (YYYY-MM-DD)
   */
  async getAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { date } = req.query;
      const availability = await InstructorService.getAvailability(id, date as string);
      if (!availability) {
        res.status(404).json({ success: false, message: "Instructor not found" });
        return;
      }
      res.status(200).json({ success: true, data: availability });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get availability",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * PUT /api/instructors/:id/availability
   * Sets an instructor's availability for a specific day and time range.
   * Expected body: { date: string, startTime: string, lessonType: string, swimmingStyles: string[] }
   */
  async setAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      // Use consistent parameter naming (swimmingStyles)
      const { date, startTime, lessonType, swimmingStyles } = req.body;
      // Call the instructor service with standardized parameter names
      const updatedInstructor = await InstructorService.setAvailability(
        id,
        date,
        startTime,
        lessonType,
        swimmingStyles // consistently named parameter
      );
      if (!updatedInstructor) {
        res.status(404).json({ success: false, message: "Instructor not found" });
        return;
      }
      res.status(200).json({
        success: true,
        message: "זמינות עודכנה בהצלחה",
        data: updatedInstructor,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "הגדרת זמינות נכשלה",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
  
  /**
   * DELETE /api/instructors/:id/availability
   * Removes an instructor's availability for a specific date.
   * Expected body: { date: string, startTime: string }
   */
  async removeAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { date, startTime  } = req.body;
      const updatedInstructor = await InstructorService.removeAvailabilitySlot(id, date, startTime);
      if (!updatedInstructor) {
        res.status(404).json({ success: false, message: "Instructor not found" });
        return;
      }
      res.status(200).json({
        success: true,
        message: "Availability removed successfully",
        data: updatedInstructor,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to remove availability",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * PUT /api/instructors/:id/swimmingstyles
   * Updates an instructor's swimming styles.
   * Expected body: { styles: string[] }
   */
  async updateSwimmingStyles(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { styles } = req.body;
      const updatedInstructor = await InstructorService.updateSwimmingStyles(id, styles);
      if (!updatedInstructor) {
        res.status(404).json({ success: false, message: "Instructor not found" });
        return;
      }
      res.status(200).json({
        success: true,
        message: "Swimming styles updated successfully",
        data: updatedInstructor,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update swimming styles",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * GET /api/instructors/:id/schedule
   * Retrieves an instructor's schedule for a specific date.
   * Query parameter: date (YYYY-MM-DD)
   */
  async getSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { date } = req.query;
      if (!date) {
        res.status(400).json({ success: false, message: "Date query parameter is required" });
        return;
      }
      const schedule = await InstructorService.getSchedule(id, date as string);
      res.status(200).json({ success: true, data: schedule });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve schedule",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

/**
   * GET /api/instructors/available
   * Retrieves available instructors based on filters.
   * Query parameters: date, startTime, endTime, swimmingStyle
   */
async getAvailableInstructors(req: Request, res: Response): Promise<void> {
  try {
    const { date, startTime, endTime, swimmingStyle } = req.query;
    if (!date || !startTime) {
      res.status(400).json({ success: false, message: "Date and startTime are required" });
      return;
    }
    const instructors = await InstructorService.getAvailableInstructors(
      date as string,
      startTime as string,
      endTime as string | undefined,
      swimmingStyle as string | undefined  // Standardized parameter name
    );
    res.status(200).json({
      success: true,
      count: instructors.length,
      data: instructors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve available instructors",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
}

export default new InstructorController();