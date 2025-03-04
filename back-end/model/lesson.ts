import mongoose, { Schema, Document } from "mongoose";

export interface ILesson extends Document {
  timeSlotId: mongoose.Schema.Types.ObjectId;
  instructorId: mongoose.Schema.Types.ObjectId;
  students: mongoose.Schema.Types.ObjectId[];
  type: "private" | "group";
  swimStyle: string;
  status: "scheduled" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const LessonSchema = new Schema<ILesson>(
  {
    timeSlotId: { type: Schema.Types.ObjectId, ref: "TimeSlot", required: true },
    instructorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    students: [{ type: Schema.Types.ObjectId, ref: "User" }],
    type: { type: String, enum: ["private", "group"], required: true },
    swimStyle: { type: String, required: true },
    status: { type: String, enum: ["scheduled", "completed", "cancelled"], default: "scheduled" }
  },
  { timestamps: true }
);

// ✅ Export both the interface and the model
export const Lesson = mongoose.model<ILesson>("Lesson", LessonSchema);
