import mongoose, { Schema, Document } from "mongoose";

export interface IWeeklySchedule extends Document {
  startDate: string;
  endDate: string;
  timeSlots: mongoose.Schema.Types.ObjectId[];
}

const WeeklyScheduleSchema = new Schema<IWeeklySchedule>({
  startDate: { type: String, required: true }, 
  endDate: { type: String, required: true },
  timeSlots: [{ type: Schema.Types.ObjectId, ref: "TimeSlot" }] 
});

// ✅ Export both the interface and the model
export const WeeklySchedule = mongoose.model<IWeeklySchedule>("WeeklySchedule", WeeklyScheduleSchema);
