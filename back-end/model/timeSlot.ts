import mongoose, { Schema, Document } from "mongoose";

export interface ITimeSlot extends Document {
  date: string;
  startTime: string;
  endTime: string;
  instructorId: mongoose.Schema.Types.ObjectId;
  swimStyles: string[];
  type: "private" | "group";
  status: "available" | "booked" | "cancelled";
  maxCapacity: number;
  currentCapacity: number;
  lessons: mongoose.Schema.Types.ObjectId[];
}

const TimeSlotSchema = new Schema<ITimeSlot>({
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  instructorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  swimStyles: { 
    type: [String], 
    enum: ["Freestyle", "Backstroke", "Breaststroke", "Butterfly"],
    required: true 
  },
  type: { type: String, enum: ["private", "group"], required: true },
  status: { type: String, enum: ["available", "booked", "cancelled"], default: "available" },
  maxCapacity: { type: Number, required: true },
  currentCapacity: { type: Number, default: 0 },
  lessons: [{ type: Schema.Types.ObjectId, ref: "Lesson" }]
});

// ✅ Add index for efficient searching
TimeSlotSchema.index({ date: 1, instructorId: 1, status: 1 });

// ✅ Export both the interface and the model
export const TimeSlot = mongoose.model<ITimeSlot>("TimeSlot", TimeSlotSchema);
