import request from "supertest";
import mongoose from "mongoose";
import app from "../server"; // Import the Express app
import { User } from "../model/user";
import dotenv from "dotenv";

dotenv.config();

describe("Instructor API Tests", () => {
  let instructorToken: string;
  let instructorId: string;

  // ✅ Register and login an instructor before tests
  beforeAll(async () => {
    // Clean existing users
    await User.deleteMany({ email: "testinstructor@example.com" });
    
    // ✅ Register a new instructor
    const registerRes = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Test",
        lastName: "Instructor",
        email: "testinstructor@example.com",
        password: "password123",
        phone: "0987654321",
        role: "instructor",
        swimmingStyles: ["Freestyle", "Backstroke"]
      });

    instructorToken = registerRes.body.token;
    instructorId = registerRes.body.user.id;

    console.log(`✅ Instructor registered with ID: ${instructorId}`);

    // ✅ Validate token works by making an authenticated request
    const testAuth = await request(app)
      .get(`/api/instructors/${instructorId}`)
      .set("Authorization", `Bearer ${instructorToken}`);

    console.log("✅ Token Authentication Response:", testAuth.body);
  });

  // ✅ Test updating instructor availability
  it("Should update instructor availability", async () => {
    const availabilityData = [
      { date: "2025-04-01", startTime: "16:00", endTime: "20:00" },
      { date: "2025-04-02", startTime: "16:00", endTime: "20:00" }
    ];

    const res = await request(app)
      .put(`/api/instructors/${instructorId}/availability`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ availability: availabilityData });

    console.log("🟢 Update Availability Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.availability).toHaveLength(2);
  });

  // ✅ Test adding a single availability slot
  it("Should add a single availability slot", async () => {
    const newSlot = { date: "2025-04-03", startTime: "17:00", endTime: "21:00" };

    const res = await request(app)
      .post(`/api/instructors/${instructorId}/availability`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(newSlot);

    console.log("🟢 Add Availability Slot Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.availability).toHaveLength(3);
  });

  // ✅ Test updating instructor swimming styles
  it("Should update instructor swimming styles", async () => {
    const swimmingStyles = ["Freestyle", "Backstroke", "Breaststroke"];

    const res = await request(app)
      .put(`/api/instructors/${instructorId}/swimmingstyles`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ swimmingStyles });

    console.log("🟢 Update Swimming Styles Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.swimmingStyles).toEqual(swimmingStyles);
  });

  // ✅ Test getting instructor by ID
  it("Should get instructor by ID", async () => {
    const res = await request(app)
      .get(`/api/instructors/${instructorId}`)
      .set("Authorization", `Bearer ${instructorToken}`);

    console.log("🟢 Get Instructor Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(instructorId);
  });

  // ✅ Test getting available instructors
  it("Should get available instructors", async () => {
    const res = await request(app)
      .get(`/api/instructors/available?date=2025-04-01&startTime=17:00`);

    console.log("🟢 Available Instructors Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.some((instructor: any) => instructor._id === instructorId)).toBe(true);
  });

  // ✅ Close MongoDB connection after tests
  afterAll(async () => {
    await mongoose.connection.close();
  });
});
