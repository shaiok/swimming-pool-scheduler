import express from "express";
import { SwimmerController } from "../controller/swimmerController";
import { authenticateUser } from "../middleware/authMiddleware";

const swimmerRouter = express.Router();

// ✅ Get available instructors for a swim style
swimmerRouter.get("/available-instructors/:swimStyle", authenticateUser, SwimmerController.getAvailableInstructors);

// ✅ Get swimmer schedule
swimmerRouter.get("/schedule/:swimmerId", authenticateUser, SwimmerController.getSchedule);

export default swimmerRouter;
