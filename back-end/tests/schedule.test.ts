import request from "supertest";
import mongoose from "mongoose";
import app from "../server"; // Import the Express app
import { User } from "../model/user";
import { WeeklySchedule } from "../model/scheduleManager";
import dotenv from "dotenv";

dotenv.config();

describe("Weekly Schedule API Tests", () => {
  let adminToken: string;
  let instructorToken: string;
  let instructorId: string;
  let scheduleId: string;
  let timeSlotId: string;

  // Register an admin and instructor before tests
  beforeAll(async () => {
    // Clean existing users and schedules
    await User.deleteMany({ email: { $in: ["admin@example.com", "scheduletest@example.com"] } });
    await WeeklySchedule.deleteMany({}); // Clear all schedules for clean testing
  
    // ✅ Register a new admin user
    const adminRes = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Admin",
        lastName: "User",
        email: "admin@example.com",
        password: "admin123",
        phone: "1111111111",
        role: "admin"
      });
  
    console.log("🔵 Admin Registration Response:", adminRes.body); // ✅ Debug admin response
  
    adminToken = adminRes.body.token;
  
    // Check if token exists
    if (!adminToken) {
      throw new Error("❌ Admin token not received!");
    }
  
    // ✅ Register a new instructor
    const registerRes = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Schedule",
        lastName: "Test",
        email: "scheduletest@example.com",
        password: "password123",
        phone: "5555555555",
        role: "instructor",
        swimmingStyles: ["Freestyle", "Backstroke"]
      });
  
    instructorToken = registerRes.body.token;
    instructorId = registerRes.body.user.id;
  
    // ✅ Set instructor availability
    await request(app)
      .put(`/api/instructors/${instructorId}/availability`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({
        availability: [{
          date: "2025-05-01",
          startTime: "09:00",
          endTime: "17:00"
        }]
      });
  
    console.log(`✅ Admin and Instructor registered. Instructor ID: ${instructorId}`);
  });
  

  it("Should create a weekly schedule", async () => {
    const scheduleData = {
      startDate: "2025-05-01",
      endDate: "2025-05-07"
    };
  
    const res = await request(app)
      .post("/api/schedules") // ✅ Fixed API Path
      .set("Authorization", `Bearer ${adminToken}`) // ✅ Use Admin Token
      .send(scheduleData);
  
    console.log("🔵 Create Schedule Request Header:", { Authorization: `Bearer ${adminToken}` });
    console.log("🟢 Create Schedule Response:", res.body);
  
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("_id");
  
    scheduleId = res.body.data._id;
  });
  
  it("Should get all schedules", async () => {
    const res = await request(app)
      .get("/api/schedules") // ✅ Fixed API Path
      .set("Authorization", `Bearer ${instructorToken}`);

    console.log("Get Schedules Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("Should get a schedule by ID", async () => {
    const res = await request(app)
      .get(`/api/schedules/${scheduleId}`) // ✅ Fixed API Path
      .set("Authorization", `Bearer ${instructorToken}`);

    console.log("Get Schedule By ID Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(scheduleId);
  });

// Fix the time slot creation
it("Should create a time slot", async () => {
  const timeSlotData = {
    date: "2025-05-01",
    startTime: "10:00",
    endTime: "10:45",
    instructorId: instructorId,
    maxCapacity: 1,
    // Add the missing required fields:
    type: "private",
    swimStyles: ["Freestyle"]
  };

  const res = await request(app)
    .post("/api/timeslots")
    .set("Authorization", `Bearer ${instructorToken}`)
    .send(timeSlotData);

  console.log("Create Time Slot Response:", res.body);

  expect(res.status).toBe(201);
  expect(res.body.success).toBe(true);
  expect(res.body.data).toHaveProperty("_id");
  
  timeSlotId = res.body.data._id;
});

// Fix the time slot generation endpoint
it("Should generate time slots from instructor availability", async () => {
  const generationData = {
    instructorId: instructorId,
    availabilitySlot: {
      date: "2025-05-01",
      startTime: "14:00",
      endTime: "16:00"
    },
    lessonDuration: 45,
    gap: 15
  };

  const res = await request(app)
    .post("/api/timeslots/generate") // Change this line
    .set("Authorization", `Bearer ${instructorToken}`)
    .send(generationData);

  console.log("Generate Time Slots Response:", res.body);

  expect(res.status).toBe(201);
  expect(res.body.success).toBe(true);
  expect(res.body.data.length).toBeGreaterThan(0);
});

// Add safe check for timeSlotId
it("Should add time slots to a schedule", async () => {
  // Add this check
  if (!timeSlotId) {
    console.log("Creating a backup time slot since previous test failed");
    
    const backupTimeSlotData = {
      date: "2025-05-01",
      startTime: "11:00",
      endTime: "11:45",
      instructorId: instructorId,
      maxCapacity: 1,
      type: "private",
      swimStyles: ["Freestyle"]
    };
    
    const backupRes = await request(app)
      .post("/api/timeslots")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send(backupTimeSlotData);
      
    if (backupRes.status === 201) {
      timeSlotId = backupRes.body.data._id;
    } else {
      throw new Error("❌ timeSlotId is not defined!");
    }
  }

  const res = await request(app)
    .post(`/api/schedules/${scheduleId}/timeslots`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ timeSlotIds: [timeSlotId] });

  console.log("Add Time Slots to Schedule Response:", res.body);

  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.data.timeSlots).toContain(timeSlotId);
});


  it("Should get time slots by schedule", async () => {
    const res = await request(app)
      .get(`/api/timeslots/schedule/${scheduleId}`); // ✅ Fixed API Path

    console.log("Get Time Slots by Schedule Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.some((slot: any) => slot._id === timeSlotId)).toBe(true);
  });

  // ✅ Close MongoDB connection after tests
  afterAll(async () => {
    await mongoose.connection.close();
  });
});
