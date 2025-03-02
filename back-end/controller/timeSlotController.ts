import { Request, Response } from "express";
import TimeSlotService from "../services/TimeSlotService";

export const getAvailableSlots = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const result = await TimeSlotService.getAvailableSlots(date as string);
    res.json(result);
  } catch (err) {
    res.status(400).json({ msg: (err as Error).message });
  }
};
