import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./route/authRoutes";
import instructorRouter from "./route/instructorRoutes";
import swimmerRouter from "./route/swimmerRoutes";
import lessonRouter from "./route/lessonRoutes";
import timeSlotRouter from "./route/timeSlotRoutes";
import mongoose from "mongoose";
import { errorMiddleware } from "./utils/error"; // Import the error middleware

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
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/lessons", lessonRouter);
app.use("/api/instructors", instructorRouter);
app.use("/api/swimmers", swimmerRouter);
app.use("/api/timeslots", timeSlotRouter);

// ✅ API Health Check Route
app.get("/api", (req: Request, res: Response) => {
  res.json({
     message: "Swimming Pool Scheduler API",
     status: "Active",
     version: "1.0.0"
  });
});

// ✅ 404 Route Handler - Keep this before the error handlers
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

// ✅ Use the custom error middleware
app.use(errorMiddleware);

// ✅ Global Error Handler (fallback for any errors not caught by the custom middleware)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ 
    success: false,
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
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
  app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));
}

export default app;