import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../model/user";
import dotenv from "dotenv";

dotenv.config();

// ✅ Ensure JWT_SECRET exists
if (!process.env.JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in environment variables");
}

export const JWT_SECRET = process.env.JWT_SECRET;

export class AuthService {
  // ✅ Register a new user
  static async register(
    firstName: string,
    lastName: string,
    email: string,
    phone: string,
    password: string,
    role: "swimmer" | "instructor"| "admin", // ✅ Add admin role
    swimmingStyles: string[],
    preferredLessonType?: "private" | "group" | "both" // ✅ Add this parameter
  ) {
    // ✅ Validate role
    if (!["swimmer", "instructor","admin"].includes(role)) {
      throw new Error("Invalid role");
    }
  
    // ✅ Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("Email is already in use.");
    }
  
    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
  
    // ✅ Create User with role-specific fields
    const newUser = new User({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      role,
      swimmingStyles: role === "swimmer" ? swimmingStyles : [], // ✅ Assign swimming styles for swimmers
      preferredLessonType: role === "swimmer" ? preferredLessonType : undefined, // ✅ Fix: Include preferredLessonType
      availability: role === "instructor" ? [] : undefined, // ✅ Only instructors have availability
    });
  
    await newUser.save();
  
    // ✅ Generate JWT token
    const token = jwt.sign({ id: newUser._id, role }, JWT_SECRET, { expiresIn: "7d" });
  
    return { token, user: { id: newUser._id, firstName, lastName, email, role } };
  }
  

  // ✅ Login a user
  static async login(email: string, password: string) {
    // ✅ Find the user and include the password
    const user = await User.findOne({ email }).select("+password");
    if (!user) throw new Error("Invalid email or password.");

    // ✅ Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Invalid email or password.");

    // ✅ Generate JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    return {
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        swimmingStyles: user.swimmingStyles, // ✅ Include swimming styles for swimmers
        availability: user.role === "instructor" ? user.availability : undefined, // ✅ Include availability for instructors
      },
    };
  }
}
