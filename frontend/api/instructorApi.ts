// src/api/instructorApi.ts
import apiClient from "./apiClient";

// Add debug logging utility
const logApiRequest = (method: string, url: string, data?: any) => {
  console.log(`API ${method} ${url}`, data ? JSON.stringify(data) : "");
};

export interface AvailabilityParams {
  date: string; // YYYY-MM-DD
}

// Get all instructors
export const getAllInstructors = async () => {
  logApiRequest('GET', "/instructors");
  const response = await apiClient.get("/instructors");
  return response.data;
};

// Get a single instructor by ID
export const getInstructorById = async (instructorId: string) => {
  logApiRequest('GET', `/instructors/${instructorId}`);
  const response = await apiClient.get(`/instructors/${instructorId}`);
  return response.data;
};

// Get instructor availability (optionally filtered by date)
export const getAvailability = async (instructorId: string, date?: string) => {
  logApiRequest('GET', `/instructors/${instructorId}/availability`, { date });
  const response = await apiClient.get(`/instructors/${instructorId}/availability`, {
    params: { date }
  });
  return response.data;
};

// Set (update) instructor availability for a day/time range.
export const updateAvailability = async (instructorId: string, data: {
  date: string;
  startTime: string;
  endTime: string;
  lessonType: "private" | "group";
  swimmingStyles: string[]; // Standardized property name
}) => {
  logApiRequest('PUT', `/instructors/${instructorId}/availability`, data);
  const response = await apiClient.put(`/instructors/${instructorId}/availability`, data);
  return response.data;
};

// Add a single availability slot
export const addAvailabilitySlot = async (instructorId: string, slot: { 
  date: string; 
  startTime: string; 
  endTime: string;
  swimmingStyles: string[]; // Standardized property name
}) => {
  logApiRequest('POST', `/instructors/${instructorId}/availability`, slot);
  const response = await apiClient.post(`/instructors/${instructorId}/availability`, slot);
  return response.data;
};

// Remove an availability slot for a specific date and start time
export const removeAvailabilitySlot = async (instructorId: string, date: string, startTime: string) => {
  logApiRequest('DELETE', `/instructors/${instructorId}/availability`, { date, startTime });
  const response = await apiClient.delete(`/instructors/${instructorId}/availability`, {
    data: { date, startTime },
  });
  return response.data;
};

// Update instructor swimming styles
export const updateSwimmingStyles = async (instructorId: string, swimmingStyles: string[]) => {
  logApiRequest('PUT', `/instructors/${instructorId}/swimmingstyles`, { swimmingStyles });
  const response = await apiClient.put(`/instructors/${instructorId}/swimmingstyles`, { styles: swimmingStyles });
  return response.data;
};

// Get an instructor's schedule for a specific date
export const getSchedule = async (instructorId: string, date: string) => {
  console.log("Calling getSchedule with:", { instructorId, date });
  
  try {
    const url = `/instructors/${instructorId}/schedule?date=${date}`;
    logApiRequest('GET', url);
    
    const response = await apiClient.get(url);
    
    // Debug logging for swimming styles in response
    if (response.data && response.data.data && response.data.data.length > 0) {
      const sample = response.data.data[0];
      console.log("DEBUG - Sample schedule response item swimming styles:", {
        swimmingStyles: sample.swimmingStyles,
        swimStyles: sample.swimStyles,
        instructorSwimmingStyles: sample.instructor?.swimmingStyles
      });
    }
    
    return response.data;
  } catch (error: any) {
    console.error("getSchedule error details:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    throw error;
  }
};