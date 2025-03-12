import mongoose from "mongoose";
import { Lesson } from "../model/lesson";

// src/utils/validators.ts
export class DateTimeValidator {
  static validateDate(date: string): void {
    const trimmedDate = date.trim();
    console.log("Validating date:", JSON.stringify(trimmedDate)); // log the exact string
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(trimmedDate)) {
      console.error("Invalid date format. Expected YYYY-MM-DD, but got:", trimmedDate);
      throw new Error(`Date must be in YYYY-MM-DD format, but got: ${trimmedDate}`);
    }
  }
  
  
  static validateTimeFormat(time: string): void {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(time)) {
      throw new Error('Time must be in HH:MM format');
    }
  }
  
  static validateTimeRange(startTime: string, endTime: string): void {
    this.validateTimeFormat(startTime);
    this.validateTimeFormat(endTime);
    
    if (startTime >= endTime) {
      throw new Error('Start time must be before end time');
    }
  }
}

export class SwimmingStyleValidator {
  static VALID_STYLES = ["חופש", "גב", "חזה", "פרפר"] as const;
  static readonly LESSON_TYPES = ['private', 'group'] as const;
  
  // Add new normalization method
  static normalizeStyle(style: string): string {
    // Remove any extra whitespace and trim
    return style.trim();
  }
  
  // Update the existing validateStyle method
  static validateStyle(style: string): void {
    const normalizedStyle = this.normalizeStyle(style);
    
    // Your existing validation logic here
    if (!SwimmingStyleValidator.VALID_STYLES.includes(normalizedStyle as typeof SwimmingStyleValidator.VALID_STYLES[number])) {
      throw new Error(`Invalid swimming style: ${style}`);
    }
  }
  
  static validateStyles(styles: string[]): void {
    if (!Array.isArray(styles) || styles.length === 0) {
      throw new Error('Swimming styles must be a non-empty array');
    }
    
    styles.forEach(style => this.validateStyle(style));
  }
  
  static validateLessonType(type: string): void {
    if (!this.LESSON_TYPES.includes(type as any)) {
      throw new Error('Lesson type must be either "private" or "group"');
    }
  }

  static stylesMatch(style1: string, style2: string): boolean {
    return this.normalizeStyle(style1) === this.normalizeStyle(style2);
  }
}

export class MongooseValidator {
  static validateObjectId(id: any): void {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid ID format');
    }
  }

  static  checkExistingLesson(date: string, startHour: string): Promise<boolean> {
    const results =  Lesson.aggregate([
      {
        // Join with the TimeSlot collection
        $lookup: {
          from: 'timeslots', // collection name in MongoDB (usually lowercased plural of model)
          localField: 'timeSlotId',
          foreignField: '_id',
          as: 'timeslotDetails'
        }
      },
      { $unwind: '$timeslotDetails' },
      {
        // Match lessons that have a timeslot on the specified date and start time.
        $match: {
          'timeslotDetails.date': date,
          'timeslotDetails.startTime': startHour
        }
      },
      {
        // Just need to know if any exist, so limit to one.
        $limit: 1
      }
    ]);
    
    return results.then(res => res.length > 0);
  }

  
}

