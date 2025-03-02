import request from "supertest";
import mongoose from "mongoose";
import  app  from "../server"; // ✅ Import the server instance for cleanup
import { User } from "../model/user";
import { Swimmer } from "../model/swimmer";
import { Instructor } from "../model/instructor";

describe("Authentication API Tests", () => {
  let swimmerToken: string;
  let instructorToken: string;

  // ✅ Delete all existing users before running tests
beforeAll(async () => {
  await User.deleteMany({});
  await Swimmer.deleteMany({});
  await Instructor.deleteMany({});
});

  // ✅ Register a new Swimmer
  it("Should register a new swimmer", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Tes1t",
        lastName: "Swimmer",
        email: "testswimmer@example.com",
        password: "password123",
        phone: "1234567890",
        role: "swimmer",
        swimmingStyles: ["Freestyle"], // ✅ Ensure required fields are sent
        lessonPreference: "private"
      });

    console.log("Swimmer Registration Response:", res.body); // ✅ Debugging

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    swimmerToken = res.body.token;
  });

  // ✅ Register a new Instructor
  it("Should register a new instructor", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Test",
        lastName: "Instructor",
        email: "testinstructor@example.com",
        password: "password123",
        phone: "0987654321",
        role: "instructor",
        swimmingStyles: ["Freestyle", "Butterfly"]
      });

    console.log("Instructor Registration Response:", res.body); // ✅ Debugging

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    instructorToken = res.body.token;
  });

  // ✅ Log in an existing Swimmer
  it("Should log in an existing swimmer", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "testswimmer@example.com",
        password: "password123"
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    swimmerToken = res.body.token;
  });

  // ✅ Log in an existing Instructor
  it("Should log in an existing instructor", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "testinstructor@example.com",
        password: "password123"
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    instructorToken = res.body.token;
  });



  // ✅ Should return 401 for protected route without a token
  it("Should return 401 for protected route without a token", async () => {
    const res = await request(app).get("/api/auth/protected");
    expect(res.status).toBe(401);
  });

  // ✅ Close server & MongoDB after tests (Fix Jest Open Handle)
  afterAll(async () => {
    await mongoose.connection.close(); // ✅ Close MongoDB connection
    app.close(); // ✅ Close Express server
  });
});
