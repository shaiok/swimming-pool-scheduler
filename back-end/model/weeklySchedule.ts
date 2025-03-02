import mongoose, { Schema, Document } from "mongoose";

export interface IWeeklySchedule extends Document {
  weekStartDate: Date; // The starting date of the week
  timeSlots: mongoose.Types.ObjectId[]; // References to TimeSlot documents
  totalLessons: number; // Total scheduled lessons in the week
  totalSwimmers: number; // Number of swimmers booked
}

const WeeklyScheduleSchema = new Schema<IWeeklySchedule>({
  weekStartDate: { type: Date, required: true },
  timeSlots: [{ type: Schema.Types.ObjectId, ref: "TimeSlot", required: true }],
  totalLessons: { type: Number, default: 0 },
  totalSwimmers: { type: Number, default: 0 },
});

export const WeeklySchedule = mongoose.model<IWeeklySchedule>("WeeklySchedule", WeeklyScheduleSchema);
