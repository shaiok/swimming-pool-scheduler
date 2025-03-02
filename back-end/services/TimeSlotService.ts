import { TimeSlot } from "../model/timeSlot";

export class TimeSlotService {
  static async getAvailableSlots(date: string) {
    console.log("🔹 Fetching available slots for:", date);

    const availableSlots = await TimeSlot.find({
      date,
      isAvailable: true, // ✅ Only return available slots
    }).sort({ time: 1 }); // ✅ Sort by time

    console.log("🔹 Available Slots:", availableSlots);
    return availableSlots;
  }
}

