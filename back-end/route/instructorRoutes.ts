import express from "express";
import { InstructorController } from "../controller/instructorController";
import { authenticateUser } from "../middleware/authMiddleware";

const instructorRouter = express.Router();

// ✅ Set availability
instructorRouter.post("/availability", authenticateUser, InstructorController.setAvailability);

// ✅ Get instructor schedule
instructorRouter.get("/schedule/:instructorId", authenticateUser, InstructorController.getSchedule);

export default instructorRouter;
