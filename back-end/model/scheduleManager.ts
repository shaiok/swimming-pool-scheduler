import mongoose, { Schema, Document } from "mongoose";

export interface ITimeSlot {
  day: string;
  startTime: string;
  endTime: string;
  isTaken: boolean;
  instructor: mongoose.Types.ObjectId;
}

export interface ISchedule extends Document {
  week: string; // E.g., "2025-03-03" (start of the week)
  availableSlots: ITimeSlot[];
}

const TimeSlotSchema = new Schema({
  day: { type: String, required: true }, // Monday, Tuesday, etc.
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  isTaken: { type: Boolean, default: false },
  instructor: { type: Schema.Types.ObjectId, ref: "Instructor", required: true }
});

const ScheduleSchema = new Schema<ISchedule>({
  week: { type: String, required: true }, // Week identifier
  availableSlots: [TimeSlotSchema]
});

export const Schedule = mongoose.model<ISchedule>("Schedule", ScheduleSchema);