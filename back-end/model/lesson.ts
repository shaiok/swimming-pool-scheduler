import mongoose, { Schema, Document } from "mongoose";

export interface ILesson extends Document {
  instructor: mongoose.Types.ObjectId;
  swimmers: mongoose.Types.ObjectId[]; // ✅ Array for group lessons
  lessonType: "private" | "group";
  swimStyle: "Freestyle" | "Backstroke" | "Breaststroke" | "Butterfly";
  lessonDate: Date;
  startTime: string; // "16:00"
  endTime: string; // "16:45"
  status: "scheduled" | "completed" | "canceled";
}

const LessonSchema = new Schema<ILesson>({
  instructor: { type: Schema.Types.ObjectId, ref: "Instructor", required: true },
  swimmers: [{ type: Schema.Types.ObjectId, ref: "Swimmer", required: true }],
  lessonType: { type: String, enum: ["private", "group"], required: true },
  swimStyle: { type: String, enum: ["Freestyle", "Backstroke", "Breaststroke", "Butterfly"], required: true },
  lessonDate: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  status: { type: String, enum: ["scheduled", "completed", "canceled"], default: "scheduled" },
});

export const Lesson = mongoose.model<ILesson>("Lesson", LessonSchema);
