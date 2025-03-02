import express from "express";
import { authenticateUser } from "../middleware/authMiddleware";
import { getAvailableSlots } from "../controller/timeSlotController";

const router = express.Router();

router.get("/available", authenticateUser, getAvailableSlots);

export default router;
