import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: "swimmer" | "instructor" | "admin";
  preferredLessonType?: "private" | "group"; // Swimmer preference
  swimmingStyles: string[]; // Only for swimmers
  availability?: { date: string; startTime: string; endTime: string }[]; // Only for instructors
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, maxlength: 30 },
    lastName: { type: String, required: true, maxlength: 30 },
    email: { type: String, required: true, unique: true, lowercase: true, index: true }, // 🔹 Indexed for fast lookup
    phone: { type: String, required: true, match: /^[0-9]{10,15}$/, unique: true }, // 🔹 Validate phone number
    password: { type: String, required: true, select: false }, // 🔹 Password should be hashed before saving
    role: { type: String, enum: ["swimmer", "instructor", "admin"], required: true }, 
    swimmingStyles: { type: [String], enum: ["Freestyle", "Backstroke", "Breaststroke", "Butterfly"], default: [] },

    // 🔹 Fields for Swimmers
    preferredLessonType: { type: String, enum: ["private", "group","both"], required: function () { return this.role === "swimmer"; } },
   

    // 🔹 Fields for Instructors (Date-based availability)
    availability: [
      {
        date: { type: String, required: function () { return this.role === "instructor"; } }, // YYYY-MM-DD format
        startTime: { type: String, required: true }, // "16:00"
        endTime: { type: String, required: true }, // "20:00"
      }
    ],
  },
  { timestamps: true } // 🔹 Automatically adds createdAt & updatedAt
);

export const User = mongoose.model<IUser>("User", UserSchema);
