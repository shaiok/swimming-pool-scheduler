import request from "supertest";
import mongoose from "mongoose";
import app from "../server";
import { User } from "../model/user";
import { WeeklySchedule } from "../model/scheduleManager";
import { TimeSlot } from "../model/timeSlot";
import { Lesson } from "../model/lesson";
import dotenv from "dotenv";

dotenv.config();

// This test will run all components together in sequence
describe("End-to-End Integration Tests", () => {
  let instructorToken: string;
  let instructorId: string;
  let swimmerToken: string;
  let swimmerId: string;
  let scheduleId: string;
  let timeSlotIds: string[] = [];
  let lessonId: string;

  // This test needs to run sequentially
  beforeAll(async () => {
    // Clean up existing test data
    await User.deleteMany({ 
      email: { 
        $in: ["integration.instructor@example.com", "integration.swimmer@example.com"] 
      } 
    });
    await WeeklySchedule.deleteMany({ startDate: "2025-08-01" });
    await TimeSlot.deleteMany({ date: "2025-08-01" });
  });

  it("Should register users", async () => {
    // Register instructor
    const instructorRes = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Integration",
        lastName: "Instructor",
        email: "integration.instructor@example.com",
        password: "password123",
        phone: "1231231234",
        role: "instructor",
        swimmingStyles: ["Freestyle", "Backstroke", "Breaststroke"]
      });

    expect(instructorRes.status).toBe(201);
    instructorToken = instructorRes.body.token;
    instructorId = instructorRes.body.user.id;
    
    // Register swimmer
    const swimmerRes = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Integration",
        lastName: "Swimmer",
        email: "integration.swimmer@example.com",
        password: "password123",
        phone: "4564564567",
        role: "swimmer",
        swimmingStyles: ["Freestyle"],
        preferredLessonType: "private"
      });

    expect(swimmerRes.status).toBe(201);
    swimmerToken = swimmerRes.body.token;
    swimmerId = swimmerRes.body.user.id;
    
    console.log(`Users registered - Instructor ID: ${instructorId}, Swimmer ID: ${swimmerId}`);
  });

  it("Should set instructor availability", async () => {
    const availabilityData = [
      {
        date: "2025-08-01",
        startTime: "09:00",
        endTime: "17:00"
      },
      {
        date: "2025-08-02",
        startTime: "09:00",
        endTime: "17:00"
      }
    ];

    const res = await request(app)
      .put(`/api/instructors/${instructorId}/availability`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ availability: availabilityData });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.availability).toHaveLength(2);
  });

  it("Should create a weekly schedule", async () => {
    const scheduleData = {
      startDate: "2025-08-01",
      endDate: "2025-08-07"
    };

    const res = await request(app)
      .post("/api/schedules")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(scheduleData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    
    scheduleId = res.body.data._id;
    console.log(`Weekly Schedule ID: ${scheduleId}`);
  });

  it("Should generate time slots from instructor availability", async () => {
    const generationData = {
      instructorId: instructorId,
      availabilitySlot: {
        date: "2025-08-01",
        startTime: "09:00",
        endTime: "12:00"
      },
      lessonDuration: 45,
      gap: 15
    };

    const res = await request(app)
      .post("/api/timeslots/generate")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(generationData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    
    timeSlotIds = res.body.data.map((slot: any) => slot._id);
    console.log(`Generated ${timeSlotIds.length} time slots`);
  });

  it("Should add time slots to the schedule", async () => {
    const res = await request(app)
      .post(`/api/schedules/${scheduleId}/timeslots`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ timeSlotIds });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.timeSlots.length).toBe(timeSlotIds.length);
  });

  it("Should find available time slots as a swimmer", async () => {
    const res = await request(app)
      .get("/api/swimmers/timeslots?date=2025-08-01");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    
    // Verify our time slots are included in the available slots
    const foundSlots = timeSlotIds.filter(id => 
      res.body.data.some((slot: any) => slot._id === id)
    );
    expect(foundSlots.length).toBeGreaterThan(0);
  });

  it("Should book a lesson", async () => {
    // Use the first time slot
    const timeSlotToBook = timeSlotIds[0];
    
    const res = await request(app)
      .post(`/api/swimmers/${swimmerId}/lessons`)
      .set("Authorization", `Bearer ${swimmerToken}`)
      .send({
        timeSlotId: timeSlotToBook,
        swimStyle: "Freestyle"
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    
    lessonId = res.body.data._id;
    console.log(`Booked Lesson ID: ${lessonId}`);
  });

  it("Should get swimmer's booked lessons", async () => {
    const res = await request(app)
      .get(`/api/swimmers/${swimmerId}/lessons`)
      .set("Authorization", `Bearer ${swimmerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    
    // Find our lesson in the response
    const foundLesson = res.body.data.find((lesson: any) => lesson._id === lessonId);
    expect(foundLesson).toBeDefined();
  });

  it("Should get instructor's scheduled lessons", async () => {
    const res = await request(app)
      .get(`/api/instructors/${instructorId}/lessons`)
      .set("Authorization", `Bearer ${instructorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    
    // Find our lesson in the response
    const foundLesson = res.body.data.find((lesson: any) => lesson._id === lessonId);
    expect(foundLesson).toBeDefined();
  });

  it("Should check time slot capacity after booking", async () => {
    const res = await request(app)
      .get(`/api/timeslots/${timeSlotIds[0]}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.currentCapacity).toBe(1);
  });

  it("Should cancel the booked lesson", async () => {
    const res = await request(app)
      .delete(`/api/swimmers/${swimmerId}/lessons/${lessonId}`)
      .set("Authorization", `Bearer ${swimmerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    
    // Verify the time slot capacity was updated
    const timeSlotRes = await request(app)
      .get(`/api/timeslots/${timeSlotIds[0]}`);
    
    expect(timeSlotRes.body.data.currentCapacity).toBe(0);
  });

  // Clean up after all tests
  afterAll(async () => {
    // Delete all created resources
    await User.deleteMany({ 
      email: { 
        $in: ["integration.instructor@example.com", "integration.swimmer@example.com"] 
      } 
    });
    await WeeklySchedule.deleteMany({ startDate: "2025-08-01" });
    await TimeSlot.deleteMany({ date: "2025-08-01" });
    if (lessonId) {
      await Lesson.findByIdAndDelete(lessonId);
    }
    
    // Close database connection
    await mongoose.connection.close();
  });
});