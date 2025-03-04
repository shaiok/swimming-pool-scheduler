import mongoose from 'mongoose';
import { IUser } from '../model/user';

// Get the User model
const User = mongoose.model<IUser>('User');

/**
 * Service for instructor operations
 */
class InstructorService {
  /**
   * Get all instructors
   * @returns Array of instructors
   */
  async getAllInstructors(): Promise<IUser[]> {
    try {
      return await User.find({ role: 'instructor' })
        .select('firstName lastName email phone swimmingStyles availability');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get instructor by ID
   * @param instructorId - Instructor's ID
   * @returns Instructor data or null if not found
   */
  async getInstructorById(instructorId: mongoose.Types.ObjectId | string): Promise<IUser | null> {
    try {
      return await User.findOne({ _id: instructorId, role: 'instructor' })
        .select('firstName lastName email phone swimmingStyles availability');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update instructor availability
   * @param instructorId - Instructor's ID
   * @param availability - New availability array
   * @returns Updated instructor data or null if not found
   */
  async updateAvailability(
    instructorId: mongoose.Types.ObjectId | string,
    availability: { date: string; startTime: string; endTime: string }[]
  ): Promise<IUser | null> {
    try {
      // Validate the availability data
      this.validateAvailability(availability);

      // Update the instructor
      return await User.findOneAndUpdate(
        { _id: instructorId, role: 'instructor' },
        { $set: { availability } },
        { new: true }
      ).select('firstName lastName email phone swimmingStyles availability');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add a single availability slot
   * @param instructorId - Instructor's ID
   * @param availabilitySlot - New availability slot
   * @returns Updated instructor data or null if not found
   */
  async addAvailabilitySlot(
    instructorId: mongoose.Types.ObjectId | string,
    availabilitySlot: { date: string; startTime: string; endTime: string }
  ): Promise<IUser | null> {
    try {
      // Validate the availability slot
      this.validateAvailabilitySlot(availabilitySlot);

      // Add the slot to the instructor's availability
      return await User.findOneAndUpdate(
        { _id: instructorId, role: 'instructor' },
        { $push: { availability: availabilitySlot } },
        { new: true }
      ).select('firstName lastName email phone swimmingStyles availability');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove an availability slot
   * @param instructorId - Instructor's ID
   * @param date - Date of the slot to remove
   * @param startTime - Start time of the slot to remove
   * @returns Updated instructor data or null if not found
   */
  async removeAvailabilitySlot(
    instructorId: mongoose.Types.ObjectId | string,
    date: string,
    startTime: string
  ): Promise<IUser | null> {
    try {
      // Remove the slot from the instructor's availability
      return await User.findOneAndUpdate(
        { _id: instructorId, role: 'instructor' },
        { $pull: { availability: { date, startTime } } },
        { new: true }
      ).select('firstName lastName email phone swimmingStyles availability');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update instructor swimming styles
   * @param instructorId - Instructor's ID
   * @param swimmingStyles - Array of swimming styles
   * @returns Updated instructor data or null if not found
   */
  async updateSwimmingStyles(
    instructorId: mongoose.Types.ObjectId | string,
    swimmingStyles: string[]
  ): Promise<IUser | null> {
    try {
      // Validate swimming styles
      this.validateSwimmingStyles(swimmingStyles);

      // Update the instructor
      return await User.findOneAndUpdate(
        { _id: instructorId, role: 'instructor' },
        { $set: { swimmingStyles } },
        { new: true }
      ).select('firstName lastName email phone swimmingStyles availability');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get instructors available on a specific date and time
   * @param date - Date to check
   * @param startTime - Start time to check
   * @param endTime - End time to check (optional)
   * @param swimmingStyle - Swimming style to filter by (optional)
   * @returns Array of available instructors
   */
  async getAvailableInstructors(
    date: string,
    startTime: string,
    endTime?: string,
    swimmingStyle?: string
  ): Promise<IUser[]> {
    try {
      // Build query
      const query: any = { role: 'instructor' };

      // Add availability filter
      const availabilityFilter: any = {
        'availability.date': date,
        'availability.startTime': { $lte: startTime }
      };

      if (endTime) {
        availabilityFilter['availability.endTime'] = { $gte: endTime };
      }

      // Add swimming style filter if provided
      if (swimmingStyle) {
        query.swimmingStyles = swimmingStyle;
      }

      // Execute query
      return await User.find({
        ...query,
        $and: [availabilityFilter]
      }).select('firstName lastName email phone swimmingStyles availability');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate availability data
   * @param availability - Availability array to validate
   * @throws Error if availability data is invalid
   */
  private validateAvailability(
    availability: { date: string; startTime: string; endTime: string }[]
  ): void {
    if (!Array.isArray(availability)) {
      throw new Error('Availability must be an array');
    }

    for (const slot of availability) {
      this.validateAvailabilitySlot(slot);
    }
  }

  /**
   * Validate a single availability slot
   * @param slot - Availability slot to validate
   * @throws Error if slot is invalid
   */
  private validateAvailabilitySlot(
    slot: { date: string; startTime: string; endTime: string }
  ): void {
    // Check if all required fields are present
    if (!slot.date || !slot.startTime || !slot.endTime) {
      throw new Error('Date, start time, and end time are required for availability slots');
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(slot.date)) {
      throw new Error('Date must be in YYYY-MM-DD format');
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
      throw new Error('Times must be in HH:MM format');
    }

    // Validate that start time is before end time
    if (slot.startTime >= slot.endTime) {
      throw new Error('Start time must be before end time');
    }
  }

  /**
   * Validate swimming styles
   * @param styles - Array of swimming styles to validate
   * @throws Error if styles are invalid
   */
  private validateSwimmingStyles(styles: string[]): void {
    const validStyles = ['Freestyle', 'Backstroke', 'Breaststroke', 'Butterfly'];
    
    if (!Array.isArray(styles)) {
      throw new Error('Swimming styles must be an array');
    }

    for (const style of styles) {
      if (!validStyles.includes(style)) {
        throw new Error(`Invalid swimming style: ${style}`);
      }
    }
  }
}

export default new InstructorService();