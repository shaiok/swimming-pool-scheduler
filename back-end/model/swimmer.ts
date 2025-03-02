import mongoose, { Schema, Document } from "mongoose";

export interface ISwimmer extends Document {
  user: mongoose.Types.ObjectId; // ✅ Reference to User model
  swimmingStyles: string[];
  lessonPreference: "private" | "group";
}

const SwimmerSchema = new Schema<ISwimmer>({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  swimmingStyles: { type: [String], required: true },
  lessonPreference: { type: String, enum: ["private", "group"], required: true },
});

export const Swimmer = mongoose.model<ISwimmer>("Swimmer", SwimmerSchema);
