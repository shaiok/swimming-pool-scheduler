// src/api/swimmerApi.ts
import apiClient from "./apiClient";

// Add debug logging utility
const logApiRequest = (method: string, url: string, data?: any) => {
  console.log(`API ${method} ${url}`, data ? JSON.stringify(data) : "");
};

export interface TimeSlotParams {
  date: string; // formatted as YYYY-MM-DD
  swimStyle?: string; // Keep this as swimStyle since it's a query parameter name from the backend
  lessonType?: 'private' | 'group';
}

/**
 * Get available time slots
 */
export const getAvailableTimeSlots = async (params: TimeSlotParams) => {
  const queryParams = new URLSearchParams();
  queryParams.append('date', params.date);
  if (params.swimStyle) queryParams.append('swimStyle', params.swimStyle);
  if (params.lessonType) queryParams.append('lessonType', params.lessonType);
  
  const url = `/timeslots/available?${queryParams.toString()}`;
  logApiRequest('GET', url);
  
  const response = await apiClient.get("/timeslots/available", { params });
  
  // Debug logging for swimming styles in response
  if (response.data && response.data.data && response.data.data.length > 0) {
    const sample = response.data.data[0];
    console.log("DEBUG - Sample available time slot swimming styles:", {
      swimmingStyles: sample.swimmingStyles,
      swimStyles: sample.swimStyles
    });
  }
  
  return response.data;
};

/**
 * Book a lesson
 * Note: Keeping swimStyle as the parameter name for backward compatibility with backend
 */
export const bookLesson = async (swimmerId: string, timeSlotId: string, swimStyle: string) => {
  const data = { timeSlotId, swimStyle };
  logApiRequest('POST', `/swimmers/${swimmerId}/lessons`, data);
  
  const response = await apiClient.post(`/swimmers/${swimmerId}/lessons`, data);
  return response.data;
};

/**
 * Cancel a lesson
 */
export const cancelLesson = async (swimmerId: string, lessonId: string) => {
  logApiRequest('DELETE', `/swimmers/${swimmerId}/lessons/${lessonId}`);
  
  const response = await apiClient.delete(`/swimmers/${swimmerId}/lessons/${lessonId}`);
  return response.data;
};

/**
 * Get swimmer lessons
 */
export const getSwimmerLessons = async (swimmerId: string) => {
  logApiRequest('GET', `/swimmers/${swimmerId}/lessons`);
  
  const response = await apiClient.get(`/swimmers/${swimmerId}/lessons`);
  
  // Debug logging for swimming styles in response
  if (response.data && response.data.data && response.data.data.length > 0) {
    const sample = response.data.data[0];
    if (sample.timeSlotId) {
      console.log("DEBUG - Sample booked lesson time slot swimming styles:", {
        swimmingStyles: sample.timeSlotId.swimmingStyles,
        swimStyles: sample.timeSlotId.swimStyles
      });
    }
  }
  
  return response.data;
};

/**
 * Update swimmer preferences
 */
export const updatePreferences = async (
  swimmerId: string, 
  preferences: { 
    swimmingStyles?: string[]; 
    preferredLessonType?: 'private' | 'group' | 'both'; 
  }
) => {
  logApiRequest('PUT', `/swimmers/${swimmerId}/preferences`, preferences);
  
  const response = await apiClient.put(`/swimmers/${swimmerId}/preferences`, preferences);
  return response.data;
};