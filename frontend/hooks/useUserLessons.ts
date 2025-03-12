// src/hooks/useUserLessons.ts
import { getAllLessons } from "@/api/LessonApi";
import { useEffect, useState } from "react";

export interface TimeSlot {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  instructorId: string;
  swimmingStyles: string[];
  type: 'private' | 'group';
  status: string;
  maxCapacity: number;
  currentCapacity: number;
  lessons: string[]; // or array of ObjectId as strings
}

export interface LessonData {
  _id: string;
  timeSlotId: TimeSlot;
  students: {
    _id: string;
    firstName: string;
    lastName: string;
  }[];
  swimStyle: string;
  status: string;
  instructorId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  type: 'private' | 'group';
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface MappedLesson {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'private' | 'group';
  status: string;
  maxCapacity: number;
  currentCapacity: number;
  swimStyle: string;
  instructorName: string;
  studentNames: string[];
}

export const useUserLessons = (userId: string, role: "swimmer" | "instructor") => {
  const [lessons, setLessons] = useState<MappedLesson[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  // Mapping function: convert LessonData into MappedLesson for UI consumption.
  const mapLesson = (lesson: LessonData): MappedLesson => {
    const timeSlot = lesson.timeSlotId;
    return {
      id: lesson._id,
      title: lesson.type === "private" ? "פרטי" : "קבוצתי",
      date: timeSlot.date,
      startTime: timeSlot.startTime,
      endTime: timeSlot.endTime,
      type: lesson.type,
      status: lesson.status,
      maxCapacity: timeSlot.maxCapacity,
      currentCapacity: timeSlot.currentCapacity,
      swimStyle: lesson.swimStyle || "לא מוגדר",
      instructorName: lesson.instructorId.firstName + " " + lesson.instructorId.lastName,
      studentNames: lesson.students.map((s) => s.firstName + " " + s.lastName),
    };
  };

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        setLoading(true);
        const rawLessons: LessonData[] = await getAllLessons(userId, role);
        console.log("DEBUG: Raw lessons fetched:", rawLessons);
        const mapped = rawLessons.map(mapLesson);
        console.log("DEBUG: Mapped lessons:", mapped);
        setLessons(mapped);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchLessons();
    }
  }, [userId, role]);

  return { lessons, loading, error };
};
