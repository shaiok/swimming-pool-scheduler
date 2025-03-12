// LessonService.ts
import apiClient from "./apiClient";

export interface Lesson {
  id: string;
  type: string;
  startTime: string;
  endTime: string;
  // …other lesson properties from the backend
}

export const getAllLessons = async (userId: string, role: "swimmer" | "instructor"): Promise<Lesson[]> => {
  // For a swimmer, use studentId; for an instructor, use instructorId
  const queryParam = role === "swimmer" ? `studentId=${userId}` : `instructorId=${userId}`;
  const response = await apiClient.get(`/lessons?${queryParam}`);
  return response.data.data; // assuming the response format is { success, count, data }
};
