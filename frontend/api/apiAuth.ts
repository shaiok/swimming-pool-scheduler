// src/api/authApi.ts
import apiClient from "./apiClient";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone: string;
  // Add other fields if necessary
}

export interface RegisterResponse {
  token: string;
  user: User;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// Define the payload for registration, including all required properties
export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: "swimmer" | "instructor" | "admin";
  swimmingStyles: string[]; // Required for swimmers/instructors
  preferredLessonType?: "private" | "group" | "both"; // Only required for swimmers; optional otherwise
}

// Function to register a new user
export const registerUser = async (
  userData: RegisterPayload
): Promise<RegisterResponse> => {
  const response = await apiClient.post("/auth/register", userData);
  return response.data;
};

// Function to log in a user
export const loginUser = async (credentials: {
  email: string;
  password: string;
}): Promise<LoginResponse> => {
  const response = await apiClient.post("/auth/login", credentials);
  return response.data;
};
