// controllers/TimeSlotController.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import TimeSlotService from "../services/TimeSlotService";

class TimeSlotController {
  /**
   * POST /api/timeslots
   * Creates a new time slot.
   */
  async createTimeSlot(req: Request, res: Response): Promise<void> {
    try {
      // Update to use standardized swimmingStyles parameter
      const { date, startTime, endTime, instructorId, maxCapacity, type, swimmingStyles } = req.body;
      const timeSlot = await TimeSlotService.createTimeSlot({
        date,
        startTime,
        endTime,
        instructorId,
        maxCapacity,
        type,
        swimmingStyles  // Standardized property name
      });
      res.status(201).json({
        success: true,
        message: "Time slot created successfully",
        data: timeSlot,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Failed to create time slot",
        error: errorMessage,
      });
    }
  }

  /**
   * GET /api/timeslots/:id
   * Retrieves a time slot by its ID.
   */
  async getTimeSlotById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const populateDetails = req.query.populate === "true";
      const timeSlot = await TimeSlotService.getTimeSlotById(id, populateDetails);
      if (!timeSlot) {
        res.status(404).json({ success: false, message: "Time slot not found" });
        return;
      }
      res.status(200).json({ success: true, data: timeSlot });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Failed to retrieve time slot",
        error: errorMessage,
      });
    }
  }

  /**
   * GET /api/timeslots
   * Retrieves all time slots with optional filters.
   * Query parameters: date, instructorId, status.
   */
  async getAllTimeSlots(req: Request, res: Response): Promise<void> {
    try {
      const { date, instructorId, status } = req.query;
      const filters: any = {};
      if (date) filters.date = date;
      if (instructorId) filters.instructorId = instructorId;
      if (status) filters.status = status;
      
      const timeSlots = await TimeSlotService.getAllTimeSlots(filters);
      res.status(200).json({
        success: true,
        count: timeSlots.length,
        data: timeSlots,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Failed to retrieve time slots",
        error: errorMessage,
      });
    }
  }

  /**
   * PUT /api/timeslots/:id
   * Updates a time slot.
   */
  async updateTimeSlot(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body; // Updates may include date, startTime, endTime, maxCapacity, status, etc.
      const updatedTimeSlot = await TimeSlotService.updateTimeSlot(id, updates);
      if (!updatedTimeSlot) {
        res.status(404).json({ success: false, message: "Time slot not found" });
        return;
      }
      res.status(200).json({
        success: true,
        message: "Time slot updated successfully",
        data: updatedTimeSlot,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Failed to update time slot",
        error: errorMessage,
      });
    }
  }

  /**
   * DELETE /api/timeslots/:id
   * Deletes a time slot.
   */
  async deleteTimeSlot(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await TimeSlotService.deleteTimeSlot(id);
      if (!deleted) {
        res.status(404).json({ success: false, message: "Time slot not found" });
        return;
      }
      res.status(200).json({ success: true, message: "Time slot deleted successfully" });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Failed to delete time slot",
        error: errorMessage,
      });
    }
  }

  /**
   * POST /api/timeslots/generate
   * Generates time slots from an instructor's availability slot.
   * Expected body: { instructorId, availabilitySlot }
   */
  async generateTimeSlots(req: Request, res: Response): Promise<void> {
    try {
      // Update the expected structure to ensure swimmingStyles is used consistently
      const { instructorId, availabilitySlot } = req.body;
      
      // Ensure availabilitySlot uses swimmingStyles, not swimStyles
      if (availabilitySlot.swimStyles && !availabilitySlot.swimmingStyles) {
        availabilitySlot.swimmingStyles = availabilitySlot.swimStyles;
        delete availabilitySlot.swimStyles;
      }
      
      const generatedSlots = await TimeSlotService.generateTimeSlotsFromAvailability(
        instructorId,
        availabilitySlot
      );
      res.status(201).json({
        success: true,
        message: `Generated ${generatedSlots.length} time slots`,
        data: generatedSlots,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Failed to generate time slots",
        error: errorMessage,
      });
    }
  }

  /**
   * GET /api/timeslots/available
   * Retrieves available time slots based on filters.
   * Query parameters: date, swimStyle, lessonType.
   */
  async getAvailableTimeSlots(req: Request, res: Response): Promise<void> {
    try {
      const { date, swimStyle, lessonType } = req.query;
      if (!date) {
        res.status(400).json({ success: false, message: "Date is required" });
        return;
      }
      const slots = await TimeSlotService.getAvailableTimeSlots({
        date: date as string,
        swimStyle: swimStyle as string,  // Note: Keep as swimStyle in params since this is the query param name
        lessonType: lessonType as "private" | "group",
      });
      res.status(200).json({
        success: true,
        count: slots.length,
        data: slots,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Failed to retrieve available time slots",
        error: errorMessage,
      });
    }
  }
}

export default new TimeSlotController();