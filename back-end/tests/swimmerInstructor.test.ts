import request from "supertest";
import mongoose from "mongoose";
import  app  from "../server";
import { User } from "../model/user";
import { Swimmer } from "../model/swimmer";
import { Instructor } from "../model/instructor";
import { Lesson } from "../model/lesson";

describe("Swimmer & Instructor API Tests", () => {
  let swimmerToken: string;
  let instructorToken: string;
  let swimmerId: string;
  let instructorId: string;

  // ✅ Setup: Delete previous users & lessons
  beforeAll(async () => {
    await User.deleteMany({});
    await Swimmer.deleteMany({});
    await Instructor.deleteMany({});
    await Lesson.deleteMany({});
  });

  // ✅ Register a new Instructor
  it("Should register a new instructor", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "John",
        lastName: "Doe",
        email: "instructor@example.com",
        password: "password123",
        phone: "1234567890",
        role: "instructor",
        swimmingStyles: ["Freestyle", "Butterfly"]
      });
  
    console.log("🔹 Registered Instructor User ID:", res.body.user.id); // ✅ Debugging
  
    // ✅ Fetch the correct instructor ID from MongoDB
    const instructorRecord = await Instructor.findOne({ user: res.body.user.id });
    console.log("🔹 MongoDB Instructor ID:", instructorRecord?._id); // ✅ Debugging
  
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    instructorToken = res.body.token;
    instructorId = instructorRecord && instructorRecord._id ? instructorRecord._id.toString() : ""; // ✅ Store Instructor ID
  });
  
  

  // ✅ Register a new Swimmer
  it("Should register a new swimmer", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Alice",
        lastName: "Smith",
        email: "swimmer@example.com",
        password: "password123",
        phone: "0987654321",
        role: "swimmer",
        swimmingStyles: ["Freestyle"],
        lessonPreference: "private"
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    swimmerToken = res.body.token;
    swimmerId = res.body.user.id;
  });

  it("Should allow instructor to set availability", async () => {
    console.log("🔹 Sending Token:", instructorToken); // ✅ Debug token
  
    const res = await request(app)
      .post("/api/instructors/availability")
      .set("Authorization", `Bearer ${instructorToken}`) // ✅ Add Token
      .send({
        instructorId: instructorId,
        availability: { "Monday": ["16:00-20:00"], "Thursday": ["10:00-12:00"] }
      });
  
    console.log("🔹 Instructor Availability Response:", res.body); // ✅ Debug API response
  
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Availability updated");
    expect(res.body.instructor.availability).toHaveProperty("Monday"); // ✅ Ensure availability is returned
  });
  
  

  // ✅ Swimmer finds available instructors
  it("Should return available instructors for a swim style", async () => {
    const res = await request(app)
      .get("/api/swimmers/available-instructors/Freestyle")
      .set("Authorization", `Bearer ${swimmerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty("user");
  });

  // ✅ Instructor views schedule (should be empty initially)
  it("Should return an empty instructor schedule", async () => {
    const res = await request(app)
      .get(`/api/instructors/schedule/${instructorId}`)
      .set("Authorization", `Bearer ${instructorToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  // ✅ Swimmer views schedule (should be empty initially)
  it("Should return an empty swimmer schedule", async () => {
    const res = await request(app)
      .get(`/api/swimmers/schedule/${swimmerId}`)
      .set("Authorization", `Bearer ${swimmerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  // ✅ Clean up: Close MongoDB & Server
  afterAll(async () => {
    await mongoose.connection.close();
    app.close();
  });
});
