import request from "supertest";
import mongoose from "mongoose";
import app from "../server";
import { Instructor } from "../model/instructor";

describe("Instructor API Tests", () => {
  let instructorToken: string;
  let instructorId: string;

  beforeAll(async () => {
    // ✅ Clear existing instructors
    await Instructor.deleteMany({});
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }

    // ✅ Register an Instructor
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

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("user");

    instructorToken = res.body.token;
    instructorId = res.body.user.id;

    if (!instructorId) throw new Error("❌ Instructor ID is missing!");
  });

  // ✅ Test: Set Instructor Availability
  it("Should allow instructor to set availability", async () => {
    const res = await request(app)
      .post("/api/instructors/setAvailability")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({
        instructorId,
        availability: {
          Monday: ["16:00-18:00"],
          Wednesday: ["10:00-12:00"]
        }
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("availability");
    console.log("✅ Instructor Availability Response:", res.body);
  });

  // ✅ Test: Get Instructor Weekly Schedule
  it("Should return instructor's weekly schedule", async () => {
    const startDate = new Date().toISOString().split("T")[0]; // Current week start date

    const res = await request(app)
      .get(`/api/instructors/schedule?instructorId=${instructorId}&startDate=${startDate}`)
      .set("Authorization", `Bearer ${instructorToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    console.log("✅ Instructor Weekly Schedule Response:", res.body);
  });

  afterAll(async () => {
    await mongoose.connection.close();
    app.close();
  });
});
