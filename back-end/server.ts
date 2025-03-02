import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import authRoutes from "./route/authRoutes";
import lessonRoutes from "./route/lessonRoutes";
// import instructorRoutes from "./route/instructorRoutes";
import timeSlotRoutes from "./route/timeSlotRoutes";
import { authenticateUser } from "./middleware/authMiddleware";
import instructorRouter from "./route/instructorRoutes";
import swimmerRouter from "./route/swimmerRoutes";
import mongoose from "mongoose";
import lessonRouter from "./route/lessonRoutes";

// Extend the Request interface to include the user property
declare module "express-serve-static-core" {
  interface Request {
    user?: any;
  }
}


dotenv.config();

const app = express();
app.use(express.json());

// ✅ Use Routes
app.use("/api/auth", authRoutes);
app.use("/api/lessons", lessonRouter);
app.use("/api/instructors", instructorRouter);
app.use("/api/swimmers", swimmerRouter);

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI!)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB Connection Error:", err));

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default server; // ✅ Export server for Jest tests

