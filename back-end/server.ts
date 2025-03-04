import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./route/authRoutes";
import instructorRouter from "./route/instructorRoutes";
import swimmerRouter from "./route/swimmerRoutes";
import lessonRouter from "./route/lessonRoutes";
import scheduleRouter from "./route/scheduleMangerRoutes";
import timeSlotRouter from "./route/timeSlotRoutes";
import mongoose from "mongoose";

// Extend Express Request to include `user`
declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      role: string;
      userId?: string;
    };
  }
}

// ✅ Load environment variables
dotenv.config();

// ✅ Initialize Express app
const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/lessons", lessonRouter);
app.use("/api/instructors", instructorRouter);
app.use("/api/swimmers", swimmerRouter);
app.use("/api/schedules", scheduleRouter);
app.use("/api/timeslots", timeSlotRouter);

// ✅ API Health Check Route
app.get("/api", (req: Request, res: Response) => {
  res.json({ 
    message: "Swimming Pool Scheduler API",
    status: "Active",
    version: "1.0.0"
  });
});

// ✅ 404 Route Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

// ✅ Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ 
    message: "Internal server error", 
    error: process.env.NODE_ENV === "development" ? err.message : undefined
  });
});


const MONGO_URI = process.env.MONGO_URI;

if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log(`🟢 MongoDB Connected to ${MONGO_URI}`))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));
} else {
  console.error("❌ MONGO_URI is not set in environment variables.");
}

// ✅ Start server only if not running Jest tests
if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

export default app;
//
