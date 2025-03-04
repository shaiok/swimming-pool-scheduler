import request from "supertest";
import mongoose from "mongoose";
import app from "../server";
import { User } from "../model/user";
import { TimeSlot } from "../model/timeSlot";
import { Lesson } from "../model/lesson";
import dotenv from "dotenv";

dotenv.config();

describe("Group Lesson API Tests", () => {
  let instructorToken: string;
  let instructorId: string;
  let swimmer1Token: string;
  let swimmer1Id: string;
  let swimmer2Token: string;
  let swimmer2Id: string;
  let groupTimeSlotId: string;
  let groupLessonId: string;

  // Set up test data: register users and create time slots
  beforeAll(async () => {
    // Clean up existing test data
    await User.deleteMany({ 
      email: { 
        $in: [
          "grouptest.instructor@example.com", 
          "grouptest.swimmer1@example.com", 
          "grouptest.swimmer2@example.com"
        ] 
      } 
    });
    await TimeSlot.deleteMany({ date: "2025-07-01" });
    
    // Register an instructor
    const instructorRes = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Group",
        lastName: "Instructor",
        email: "grouptest.instructor@example.com",
        password: "password123",
        phone: "1122334455",
        role: "instructor",
        swimmingStyles: ["Freestyle", "Backstroke", "Breaststroke"]
      });

    instructorToken = instructorRes.body.token;
    instructorId = instructorRes.body.user.id;
    
    // Register first swimmer
    const swimmer1Res = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Group",
        lastName: "Swimmer1",
        email: "grouptest.swimmer1@example.com",
        password: "password123",
        phone: "2233445566",
        role: "swimmer",
        swimmingStyles: ["Freestyle"],
        preferredLessonType: "group"
      });

    swimmer1Token = swimmer1Res.body.token;
    swimmer1Id = swimmer1Res.body.user.id;
    
    // Register second swimmer
    const swimmer2Res = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Group",
        lastName: "Swimmer2",
        email: "grouptest.swimmer2@example.com",
        password: "password123",
        phone: "3344556677",
        role: "swimmer",
        swimmingStyles: ["Backstroke"],
        preferredLessonType: "group"
      });

    swimmer2Token = swimmer2Res.body.token;
    swimmer2Id = swimmer2Res.body.user.id;
    
    // Set instructor availability
    await request(app)
      .put(`/api/instructors/${instructorId}/availability`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({
        availability: [{
          date: "2025-07-01",
          startTime: "14:00",
          endTime: "17:00"
        }]
      });
  });

  it("Should create a group time slot", async () => {
    const res = await request(app)
      .post("/api/timeslots")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({
        date: "2025-07-01",
        startTime: "14:00",
        endTime: "15:00",
        instructorId,
        maxCapacity: 5,
        type: "group",
        swimStyles: ["Freestyle", "Backstroke"]
      });

    console.log("Create Group Time Slot Response:", res.body);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("_id");
    expect(res.body.data.type).toBe("group");
    expect(res.body.data.maxCapacity).toBe(5);
    
    groupTimeSlotId = res.body.data._id;
  });

  it("Should book first swimmer into group lesson", async () => {
    const res = await request(app)
      .post(`/api/swimmers/${swimmer1Id}/lessons`)
      .set("Authorization", `Bearer ${swimmer1Token}`)
      .send({
        timeSlotId: groupTimeSlotId,
        swimStyle: "Freestyle"
      });

    console.log("Book First Swimmer Response:", res.body);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("_id");
    
    groupLessonId = res.body.data._id;
  });

  it("Should verify time slot capacity after first booking", async () => {
    const res = await request(app)
      .get(`/api/timeslots/${groupTimeSlotId}`);

    console.log("Time Slot After First Booking:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.currentCapacity).toBe(1);
  });

  it("Should book second swimmer into the same group lesson", async () => {
    const res = await request(app)
      .post(`/api/swimmers/${swimmer2Id}/lessons`)
      .set("Authorization", `Bearer ${swimmer2Token}`)
      .send({
        timeSlotId: groupTimeSlotId,
        swimStyle: "Backstroke"
      });

    console.log("Book Second Swimmer Response:", res.body);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("Should verify time slot capacity after second booking", async () => {
    const res = await request(app)
      .get(`/api/timeslots/${groupTimeSlotId}`);

    console.log("Time Slot After Second Booking:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.currentCapacity).toBe(2);
  });

  it("Should get lessons for the group time slot", async () => {
    // This requires a specific endpoint to get lessons by time slot
    // If you don't have this, you may need to implement it or skip this test
    const res = await request(app)
      .get(`/api/timeslots/${groupTimeSlotId}/lessons`);

    console.log("Lessons for Group Time Slot:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it("Should allow first swimmer to cancel their lesson", async () => {
    // Get the swimmer's lessons first to find the lesson ID
    const lessonsRes = await request(app)
      .get(`/api/swimmers/${swimmer1Id}/lessons`)
      .set("Authorization", `Bearer ${swimmer1Token}`);
    
    // Get the specific lesson ID for this time slot
    const lesson = lessonsRes.body.data.find((l: any) => 
      l.timeSlotId === groupTimeSlotId || 
      (l.timeSlotId && l.timeSlotId._id === groupTimeSlotId)
    );
    
    if (!lesson) {
      fail("Could not find the lesson for cancellation");
      return;
    }
    
    const cancelRes = await request(app)
      .delete(`/api/swimmers/${swimmer1Id}/lessons/${lesson._id}`)
      .set("Authorization", `Bearer ${swimmer1Token}`);

    console.log("Cancel First Swimmer Response:", cancelRes.body);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.success).toBe(true);
  });

  it("Should verify time slot capacity after cancellation", async () => {
    const res = await request(app)
      .get(`/api/timeslots/${groupTimeSlotId}`);

    console.log("Time Slot After Cancellation:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.currentCapacity).toBe(1);
  });

  // Clean up after tests
  afterAll(async () => {
    // Delete test time slots and lessons
    await TimeSlot.deleteMany({ date: "2025-07-01" });
    if (groupLessonId) {
      await Lesson.findByIdAndDelete(groupLessonId);
    }
    
    // Close database connection
    await mongoose.connection.close();
  });
});