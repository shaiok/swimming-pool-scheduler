import mongoose, { Schema, Document } from "mongoose";

export interface ITimeSlot extends Document {
  date: Date;
  time: string; // "16:00", "16:15", "16:30", etc.
  instructor: mongoose.Types.ObjectId; // Reference to Instructor
  lesson: mongoose.Types.ObjectId | null; // Linked Lesson (if booked)
  isAvailable: boolean; // Determines if the slot is bookable
  maxCapacity: number; // Maximum allowed swimmers (5 for private, 20 for group)
  currentCapacity: number; // Number of booked swimmers
}

const TimeSlotSchema = new Schema<ITimeSlot>({
  date: { type: Date, required: true },
  time: { type: String, required: true }, // "HH:mm" format
  instructor: { type: Schema.Types.ObjectId, ref: "Instructor", required: true },
  lesson: { type: Schema.Types.ObjectId, ref: "Lesson", default: null },
  isAvailable: { type: Boolean, default: true },
  maxCapacity: { type: Number, required: true },
  currentCapacity: { type: Number, default: 0 },
});

export const TimeSlot = mongoose.model<ITimeSlot>("TimeSlot", TimeSlotSchema);
