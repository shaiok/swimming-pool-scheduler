import request from "supertest";
import mongoose from "mongoose";
import app from "../server";
import { User } from "../model/user";
import { TimeSlot } from "../model/timeSlot";
import { Lesson } from "../model/lesson";
import dotenv from "dotenv";

dotenv.config();

describe("Lesson Booking API Tests", () => {
  let instructorToken: string;
  let instructorId: string;
  let swimmerToken: string;
  let swimmerId: string;
  let timeSlotId: string;
  let lessonId: string;

  // ✅ Clean up before running tests
  beforeAll(async () => {
    console.log("🟡 Cleaning up old test data...");
  
    // Delete by both email and phone to ensure cleanup
    await User.deleteMany({ 
      $or: [
        { email: { $in: ["bookingtest.instructor1@example.com", "bookingtest.swimmer@example.com"] } },
        { phone: { $in: ["1234567890", "0987654321"] } }
      ]
    });
  
    await TimeSlot.deleteMany({ date: "2025-06-01" });
  
    console.log("✅ Cleanup complete. Proceeding with test setup...");

    // ✅ Register an instructor (or retrieve existing)
    let instructor = await User.findOne({ email: "bookingtest.instructor1@example.com" });

    if (!instructor) {
      const instructorRes = await request(app)
        .post("/api/auth/register")
        .send({
          firstName: "Booking",
          lastName: "Instructor",
          email: "bookingtest.instructor1@example.com", 
          password: "password123",
          phone: "1234567890",
          role: "instructor",
          swimmingStyles: ["Freestyle", "Backstroke", "Breaststroke"]
        });

      console.log("Instructor Registration Response:", instructorRes.body);

      instructorToken = instructorRes.body.token;
      instructorId = instructorRes.body.user?.id;
    } else {
      console.log("Instructor already exists. Using existing ID.");
      if (instructor && instructor._id) {
        instructorId = (instructor._id as mongoose.Types.ObjectId).toString();
        }
      }
      

    // ✅ Register a swimmer (or retrieve existing)
    let swimmer = await User.findOne({ email: "bookingtest.swimmer@example.com" });

    if (!swimmer) {
      const swimmerRes = await request(app)
        .post("/api/auth/register")
        .send({
          firstName: "Booking",
          lastName: "Swimmer",
          email: "bookingtest.swimmer@example.com",
          password: "password123",
          phone: "0987654321",
          role: "swimmer",
          swimmingStyles: ["Freestyle"],
          preferredLessonType: "private"
        });

      console.log("Swimmer Registration Response:", swimmerRes.body);

      swimmerToken = swimmerRes.body.token;
      swimmerId = swimmerRes.body.user?.id;
    } else {
      console.log("Swimmer already exists. Using existing ID.");
      if (swimmer && swimmer._id) {
        swimmerId = (swimmer._id as mongoose.Types.ObjectId).toString();
      }
      
    }

    console.log(`Test users set up. Instructor ID: ${instructorId}, Swimmer ID: ${swimmerId}`);

    // ✅ Set instructor availability
    await request(app)
      .put(`/api/instructors/${instructorId}/availability`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({
        availability: [{
          date: "2025-06-01",
          startTime: "09:00",
          endTime: "17:00"
        }]
      });

    // ✅ Create a time slot
    const timeSlotRes = await request(app)
      .post("/api/timeslots")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({
        date: "2025-06-01",
        startTime: "10:00",
        endTime: "10:45",
        instructorId,
        maxCapacity: 1,
        type: "private",
        swimStyles: ["Freestyle"],
        status: "available"
      });

    console.log("Time Slot Creation Response:", timeSlotRes.body);

    if (timeSlotRes.body.success && timeSlotRes.body.data) {
      timeSlotId = timeSlotRes.body.data._id;
    } else {
      throw new Error("❌ Could not create a valid time slot");
    }
  });

  // ✅ Test: Find available time slots
  it("Should find available time slots", async () => {
    const res = await request(app)
      .get("/api/swimmers/timeslots?date=2025-06-01");

    console.log("Available Time Slots Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const found = res.body.data.some((slot: any) => slot._id === timeSlotId);
    expect(found).toBe(true);
  });

  // ✅ Test: Get time slot details
  it("Should get time slot details", async () => {
    const res = await request(app)
      .get(`/api/timeslots/${timeSlotId}`);

    console.log("Time Slot Details Before Booking:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.currentCapacity).toBe(0);
  });

  // ✅ Test: Book a lesson
  it("Should book a lesson", async () => {
    const res = await request(app)
      .post(`/api/swimmers/${swimmerId}/lessons`)
      .set("Authorization", `Bearer ${swimmerToken}`)
      .send({
        timeSlotId,
        swimStyle: "Freestyle"
      });

    console.log("Book Lesson Response:", res.body);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("_id");

    lessonId = res.body.data._id;
  });

  // ✅ Test: Verify time slot capacity increased
  it("Should verify time slot capacity increased after booking", async () => {
    const res = await request(app)
      .get(`/api/timeslots/${timeSlotId}`);

    console.log("Time Slot After Booking:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.currentCapacity).toBe(1);
  });

  // ✅ Test: Get swimmer's booked lessons
  it("Should get swimmer's booked lessons", async () => {
    const res = await request(app)
      .get(`/api/swimmers/${swimmerId}/lessons`)
      .set("Authorization", `Bearer ${swimmerToken}`);

    console.log("Swimmer Lessons Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0]._id).toBe(lessonId);
  });

  // ✅ Test: Prevent booking a full time slot
  it("Should not allow booking when time slot is full", async () => {
    const res = await request(app)
      .post(`/api/swimmers/${swimmerId}/lessons`)
      .set("Authorization", `Bearer ${swimmerToken}`)
      .send({
        timeSlotId,
        swimStyle: "Freestyle"
      });

    console.log("Book Full Time Slot Response:", res.body);

    expect(res.status).not.toBe(201);
    expect(res.body.success).toBe(false);
  });

  // ✅ Test: Cancel a lesson
  it("Should cancel a lesson", async () => {
    const res = await request(app)
      .delete(`/api/swimmers/${swimmerId}/lessons/${lessonId}`)
      .set("Authorization", `Bearer ${swimmerToken}`);

    console.log("Cancel Lesson Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // ✅ Test: Verify time slot capacity decreased after cancellation
  it("Should verify time slot capacity decreased after cancellation", async () => {
    const res = await request(app)
      .get(`/api/timeslots/${timeSlotId}`);

    console.log("Time Slot After Cancellation:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.currentCapacity).toBe(0);
  });

  // ✅ Clean up after tests
  afterAll(async () => {
    await TimeSlot.deleteMany({ date: "2025-06-01" });
    if (lessonId) await Lesson.findByIdAndDelete(lessonId);
    await User.deleteMany({ email: { $in: ["bookingtest.instructor1@example.com", "bookingtest.swimmer@example.com"] } });
    await mongoose.connection.close();
  });
});
