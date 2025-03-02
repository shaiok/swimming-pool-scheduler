import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: "swimmer" | "instructor";
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  firstName: { type: String, required: true, maxlength: 30 },
  lastName: { type: String, required: true, maxlength: 30 },
  email: { type: String, required: true, unique: true, lowercase: true }, // ✅ Email should only exist in `User`
  phone: { type: String, required: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ["swimmer", "instructor"], required: true },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model<IUser>("User", UserSchema);
