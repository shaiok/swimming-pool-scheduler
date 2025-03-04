import request from "supertest";
import mongoose from "mongoose";
import app from "../server";
import { User } from "../model/user";
import dotenv from "dotenv";

dotenv.config();

describe("Error Handling Tests", () => {
  let instructorToken: string;
  let instructorId: string;
  let swimmerToken: string;
  let swimmerId: string;

  // Register test users before tests
  beforeAll(async () => {
    // Clean up existing test data
    await User.deleteMany({ 
      email: { 
        $in: ["errortest.instructor@example.com", "errortest.swimmer@example.com"] 
      } 
    });
    
    // Register an instructor
    const instructorRes = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Error",
        lastName: "Instructor",
        email: "errortest.instructor@example.com",
        password: "password123",
        phone: "7778889999",
        role: "instructor",
        swimmingStyles: ["Freestyle", "Backstroke"]
      });

    instructorToken = instructorRes.body.token;
    instructorId = instructorRes.body.user.id;
    
    // Register a swimmer
    const swimmerRes = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Error",
        lastName: "Swimmer",
        email: "errortest.swimmer@example.com",
        password: "password123",
        phone: "6667778888",
        role: "swimmer",
        swimmingStyles: ["Freestyle"],
        preferredLessonType: "private"
      });

    swimmerToken = swimmerRes.body.token;
    swimmerId = swimmerRes.body.user.id;
  });

  it("Should handle duplicate email registration", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Duplicate",
        lastName: "Email",
        email: "errortest.instructor@example.com", // Using same email
        password: "password123",
        phone: "1112223333",
        role: "instructor",
        swimmingStyles: ["Freestyle"]
      });

    console.log("Duplicate Email Response:", res.body);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Email is already in use");
  });

  it("Should handle duplicate phone number registration", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Duplicate",
        lastName: "Phone",
        email: "another.email@example.com",
        password: "password123",
        phone: "7778889999", // Using same phone as instructor
        role: "instructor",
        swimmingStyles: ["Freestyle"]
      });

    console.log("Duplicate Phone Response:", res.body);

    // Depending on your implementation, this might be a 400 or 500
    expect(res.status).not.toBe(201);
  });

  it("Should handle invalid time slot dates", async () => {
    const res = await request(app)
      .post("/api/timeslots")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({
        date: "invalid-date",
        startTime: "10:00",
        endTime: "10:45",
        instructorId,
        maxCapacity: 1,
        type: "private",
        swimStyles: ["Freestyle"]
      });

    console.log("Invalid Date Response:", res.body);

    expect(res.status).toBe(500);
    expect(res.body.error).toContain("Date must be in YYYY-MM-DD format");
  });

  it("Should handle invalid time formats", async () => {
    const res = await request(app)
      .post("/api/timeslots")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({
        date: "2025-08-01",
        startTime: "25:00", // Invalid hour
        endTime: "10:45",
        instructorId,
        maxCapacity: 1,
        type: "private",
        swimStyles: ["Freestyle"]
      });

    console.log("Invalid Time Format Response:", res.body);

    expect(res.status).toBe(500);
    expect(res.body.error).toContain("Times must be in HH:MM format");
  });

  it("Should handle invalid time range (start after end)", async () => {
    const res = await request(app)
      .post("/api/timeslots")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({
        date: "2025-08-01",
        startTime: "11:00",
        endTime: "10:00", // Before start time
        instructorId,
        maxCapacity: 1,
        type: "private",
        swimStyles: ["Freestyle"]
      });

    console.log("Invalid Time Range Response:", res.body);

    expect(res.status).toBe(500);
    expect(res.body.error).toContain("Start time must be before end time");
  });

  it("Should handle invalid instructor ID", async () => {
    const res = await request(app)
      .post("/api/timeslots")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({
        date: "2025-08-01",
        startTime: "10:00",
        endTime: "10:45",
        instructorId: "invalid-id",
        maxCapacity: 1,
        type: "private",
        swimStyles: ["Freestyle"]
      });

    console.log("Invalid Instructor ID Response:", res.body);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Invalid instructor ID format");
  });

  it("Should handle non-existent resource", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    
    const res = await request(app)
      .get(`/api/timeslots/${fakeId}`);

    console.log("Non-existent Resource Response:", res.body);

    expect(res.status).toBe(404);
    expect(res.body.message).toContain("not found");
  });

  it("Should handle unauthorized access", async () => {
    // Try to access without token
    const res = await request(app)
      .post("/api/timeslots")
      .send({
        date: "2025-08-01",
        startTime: "10:00",
        endTime: "10:45",
        instructorId,
        maxCapacity: 1,
        type: "private",
        swimStyles: ["Freestyle"]
      });

    console.log("Unauthorized Access Response:", res.body);

    expect(res.status).toBe(401);
  });

  it("Should handle incorrect role access", async () => {
    // Try to create a time slot as a swimmer (should be instructor only)
    const res = await request(app)
      .post("/api/timeslots")
      .set("Authorization", `Bearer ${swimmerToken}`)
      .send({
        date: "2025-08-01",
        startTime: "10:00",
        endTime: "10:45",
        instructorId,
        maxCapacity: 1,
        type: "private",
        swimStyles: ["Freestyle"]
      });

    console.log("Incorrect Role Access Response:", res.body);

    expect(res.status).toBe(403);
  });

  // Clean up after tests
  afterAll(async () => {
    // Delete test users
    await User.deleteMany({ 
      email: { 
        $in: ["errortest.instructor@example.com", "errortest.swimmer@example.com"] 
      } 
    });
    
    // Close database connection
    await mongoose.connection.close();
  });
});