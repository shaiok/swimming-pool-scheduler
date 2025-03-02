import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../model/user";
import { Swimmer } from "../model/swimmer";
import { Instructor } from "../model/instructor";

import dotenv from "dotenv";
dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in environment variables");
}

export const JWT_SECRET = process.env.JWT_SECRET;




  export class AuthService {
    // ✅ Register a new user (Swimmer or Instructor)
    static async register(firstName: string, lastName: string, email: string, phone: string, password: string, role: "swimmer" | "instructor") {
      if (!["swimmer", "instructor"].includes(role)) {
        throw new Error("Invalid role");
      }
  
      // ✅ Check if user already exists in `User` collection
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error("Email already in use");
      }
  
      // ✅ Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // ✅ Create User first
      const newUser = new User({ firstName, lastName, email, phone, password: hashedPassword, role });
      await newUser.save();
  
      // ✅ Create role-specific entry and reference User ID
      if (role === "swimmer") {
        await new Swimmer({ user: newUser._id, swimmingStyles: ["Freestyle"], lessonPreference: "private" }).save();
      } else {
        await new Instructor({ user: newUser._id, swimmingStyles: ["Freestyle", "Butterfly"] }).save();
      }
  
      // ✅ Generate JWT token
      const token = jwt.sign({ id: newUser._id, role }, JWT_SECRET, { expiresIn: "7d" });
  
      return { token, user: { id: newUser._id, firstName, lastName, email, role } };
    }
  

  // ✅ Login a user
  static async login(email: string, password: string) {
    // Find the user and include the password
    const user = await User.findOne({ email }).select("+password");
    if (!user) throw new Error("Invalid credentials");

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Invalid credentials");

    // Retrieve role-specific data
    const swimmer = await Swimmer.findOne({ user: user._id }).populate("user");
    const instructor = await Instructor.findOne({ user: user._id }).populate("user");
    const roleData = swimmer || instructor;

    // Generate JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    return { 
      token, 
      user: { 
        id: user._id, 
        firstName: user.firstName, 
        lastName: user.lastName, 
        email: user.email, 
        role: user.role,
        roleData // ✅ Include role-specific details
      } 
    };
  }
}
