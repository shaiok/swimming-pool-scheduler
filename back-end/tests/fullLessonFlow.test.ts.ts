import request from "supertest";
import mongoose from "mongoose";
import app from "../server";
import { Lesson } from "../model/lesson";

describe("Lesson API Tests", () => {
  let swimmerToken: string;
  let instructorToken: string;
  let swimmerId: string;
  let instructorId: string;
  let lessonId: string;

  beforeAll(async () => {
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase(); // ✅ Clears all test data
    }
  });

  // ✅ Register Instructor & Swimmer, then Book Lesson
  it("Should register and book a lesson", async () => {
    // ✅ Generate Unique Emails to Prevent Conflicts
    const instructorEmail = `instructor${Date.now()}@example.com`;
    const swimmerEmail = `swimmer${Date.now()}@example.com`;

    // ✅ Register Instructor
    const instructorRes = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "John",
        lastName: "Doe",
        email: instructorEmail, // ✅ Unique email
        password: "password123",
        phone: "1234567890",
        role: "instructor",
        swimmingStyles: ["Freestyle", "Butterfly"]
      });

    console.log("🔹 Instructor Registration Response:", instructorRes.body);

    expect(instructorRes.status).toBe(201);
    expect(instructorRes.body).toHaveProperty("user");

    instructorToken = instructorRes.body.token;
    instructorId = instructorRes.body.user?.id;

    if (!instructorId) throw new Error("❌ Instructor ID is missing!");

    // ✅ Register Swimmer
    const swimmerRes = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Alice",
        lastName: "Smith",
        email: swimmerEmail, // ✅ Unique email
        password: "password123",
        phone: "0987654321",
        role: "swimmer",
        swimmingStyles: ["Freestyle"]
      });

    console.log("🔹 Swimmer Registration Response:", swimmerRes.body);

    expect(swimmerRes.status).toBe(201);
    expect(swimmerRes.body).toHaveProperty("user");

    swimmerToken = swimmerRes.body.token;
    swimmerId = swimmerRes.body.user?.id;

    if (!swimmerId) throw new Error("❌ Swimmer ID is missing!");

    // ✅ Book a Lesson
    const lessonRes = await request(app)
      .post("/api/lessons/book")
      .set("Authorization", `Bearer ${swimmerToken}`)
      .send({
        instructorId,
        swimmerId,
        timeSlot: "Monday 16:00-16:45",
        lessonType: "private"
      });

    console.log("🔹 Lesson Booking Response:", lessonRes.body);

    expect(lessonRes.status).toBe(201);
    expect(lessonRes.body).toHaveProperty("lesson");

    lessonId = lessonRes.body.lesson?._id;

    if (!lessonId) throw new Error("❌ Lesson ID is missing!");
  });

  // ✅ Cancel a Lesson
  it("Should allow a swimmer to cancel a lesson", async () => {
    console.log("🔹 Attempting to Cancel Lesson:", { swimmerId, lessonId });

    const res = await request(app)
      .post("/api/lessons/cancel")
      .set("Authorization", `Bearer ${swimmerToken}`)
      .send({ swimmerId, lessonId });

    console.log("🔹 Lesson Cancellation Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Lesson canceled successfully");
  });

  afterAll(async () => {
    await mongoose.connection.close();
    app.close(); // ✅ Ensures Jest properly exits
  });
});
