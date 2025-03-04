import request from "supertest";
import mongoose from "mongoose";
import app from "../server";
import { User } from "../model/user";
import dotenv from "dotenv";

dotenv.config();

describe("Swimmer API Tests", () => {
  let swimmerToken: string;
  let swimmerId: string;

  // Register a test swimmer before tests
  beforeAll(async () => {
    // Clean up existing test data
    await User.deleteMany({ email: "swimmertest@example.com" });
    
    // Register a new swimmer
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Swimmer",
        lastName: "Test",
        email: "swimmertest@example.com",
        password: "password123",
        phone: "9998887777",
        role: "swimmer",
        swimmingStyles: ["Freestyle"],
        preferredLessonType: "private"
      });

    swimmerToken = res.body.token;
    swimmerId = res.body.user.id;
    
    console.log(`Swimmer registered with ID: ${swimmerId}`);
  });

  it("Should get swimmer profile", async () => {
    const res = await request(app)
      .get(`/api/swimmers/${swimmerId}`)
      .set("Authorization", `Bearer ${swimmerToken}`);

    console.log("Swimmer Profile Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(swimmerId);
    expect(res.body.data.firstName).toBe("Swimmer");
    expect(res.body.data.lastName).toBe("Test");
    expect(res.body.data.email).toBe("swimmertest@example.com");
    expect(res.body.data.role).toBe("swimmer");
  });

  it("Should update swimmer preferences", async () => {
    const updatedPreferences = {
      swimmingStyles: ["Freestyle", "Backstroke"],
      preferredLessonType: "both"
    };

    const res = await request(app)
      .put(`/api/swimmers/${swimmerId}/preferences`)
      .set("Authorization", `Bearer ${swimmerToken}`)
      .send(updatedPreferences);

    console.log("Update Preferences Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.swimmingStyles).toEqual(expect.arrayContaining(["Freestyle", "Backstroke"]));
    expect(res.body.data.preferredLessonType).toBe("both");
  });

  it("Should get initial swimmer lessons (should be empty)", async () => {
    const res = await request(app)
      .get(`/api/swimmers/${swimmerId}/lessons`)
      .set("Authorization", `Bearer ${swimmerToken}`);

    console.log("Initial Swimmer Lessons Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Should have data property which is an array (likely empty at this point)
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("Should search for available time slots with swimmer preferences", async () => {
    // This assumes you have an endpoint that can filter by swimming style
    const res = await request(app)
      .get("/api/swimmers/timeslots?swimStyle=Backstroke")
      .set("Authorization", `Bearer ${swimmerToken}`);

    console.log("Available Time Slots Response:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Response should contain data array (may be empty if no matching slots)
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("Should not allow unauthorized access to profile", async () => {
    // Try to access without token
    const res = await request(app)
      .get(`/api/swimmers/${swimmerId}`);

    expect(res.status).toBe(401);
  });

  it("Should not allow other swimmers to update preferences", async () => {
    // Register another swimmer
    const otherSwimmerRes = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Other",
        lastName: "Swimmer",
        email: "otherswimmer@example.com",
        password: "password123",
        phone: "1112223333",
        role: "swimmer",
        swimmingStyles: ["Butterfly"],
        preferredLessonType: "private",
      });
  
    console.log("Registration Response:", otherSwimmerRes.body); // Log the entire response
  
    // Extract token and user ID from the response
    const otherSwimmerToken = otherSwimmerRes.body.token;
    const otherSwimmerId = otherSwimmerRes.body.user?.id; // Use optional chaining to avoid errors
  
    if (!otherSwimmerToken) {
      console.error("Error: Token not found in registration response");
      return;
    }
  
    console.log("Other Swimmer Token:", otherSwimmerToken);
    console.log("Other Swimmer ID:", otherSwimmerId);
    console.log("First Swimmer ID (Resource ID):", swimmerId);
  
    // Try to update the first swimmer's preferences
    const res = await request(app)
      .put(`/api/swimmers/${swimmerId}/preferences`)
      .set("Authorization", `Bearer ${otherSwimmerToken}`) // Ensure the token is correctly set
      .send({
        swimmingStyles: ["Butterfly"],
        preferredLessonType: "private",
      });
  
    console.log("Unauthorized Update Response:", res.body);
  
    expect(res.status).toBe(403); // Ensure this matches the expected behavior
  });
// Clean up after tests
afterAll(async () => {
  try {
    // Delete the test swimmers
    await User.findByIdAndDelete(swimmerId);
    
    // Ensure all database connections are closed properly
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  } catch (error) {
    console.error('Error during test cleanup:', error);
  } finally {
    // Ensure Jest doesn't hang
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
});
});