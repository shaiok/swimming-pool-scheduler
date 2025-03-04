// import mongoose, { Schema, Document } from "mongoose";

// export interface IInstructor extends Document {
//   user: mongoose.Types.ObjectId;
//   swimmingStyles: string[];
//   availability: Record<string, string[]>; // ✅ {"Monday": ["16:00-20:00"]}
// }

// const InstructorSchema = new Schema<IInstructor>({
//   user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
//   swimmingStyles: { type: [String], required: true }, // ✅ Ensure this is required
//   availability: { type: Map, of: [String], default: {} }, // ✅ Default value to prevent errors
// });

// export const Instructor = mongoose.model<IInstructor>("Instructor", InstructorSchema);
 