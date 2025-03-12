// src/hooks/useInstructorActivities.ts
import { useState, useEffect } from "react";
import { getSchedule } from "@/api/instructorApi";
import { Activity, LessonType, Lesson } from "@/components/custom/ActivityCard";
import { formatSwimmingStyles } from "@/utils/swimStyleUtil";

export const useInstructorActivities = (
  userId: string,
  selectedDate: Date,
  refreshCounter: number = 0
) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchInstructorActivities = async () => {
      setLoading(true);
      try {
        const formattedDate = selectedDate.toISOString().split("T")[0];
        console.log("Fetching instructor schedule for date:", formattedDate);
        
        const response = await getSchedule(userId, formattedDate);
        const scheduleData = response.data || [];
        
        console.log("Raw schedule data:", scheduleData);
        
        // Add debug logging for the first item's swimming styles fields
        if (scheduleData.length > 0) {
          const firstSlot = scheduleData[0];
          console.log("DEBUG - First slot swimming styles fields:", {
            swimmingStyles: firstSlot.swimmingStyles,
            swimStyles: firstSlot.swimStyles,
            instructorSwimmingStyles: firstSlot.instructor?.swimmingStyles,
            processedLessons: firstSlot.processedLessons
          });
        }
        
        const mappedActivities: Activity[] = scheduleData.map((slot: any) => {
          // FIXED: Look for standardized swimmingStyles first, fall back to swimStyles for backward compatibility
          const slotStyles = slot.swimmingStyles || slot.swimStyles;
          const instructorStyles = slot.instructor && slot.instructor.swimmingStyles;
          
          // Debug log for this specific slot's swimming styles
          console.log(`Slot ${slot._id} styles:`, {
            slotStyles,
            instructorStyles
          });
          
          const displaySwimStyle = formatSwimmingStyles(slotStyles);
          
          // Process lessons with student information
          const processedLessons: Lesson[] = Array.isArray(slot.processedLessons)
            ? slot.processedLessons.flatMap((lesson: any) => 
                Array.isArray(lesson.students)
                  ? lesson.students.map((student: any) => ({
                      studentName: student.name,
                      swimStyle: lesson.swimStyle,
                      lessonId: lesson.lessonId
                    }))
                  : []
              )
            : [];
            
          // Log processed lessons for debugging
          if (processedLessons.length > 0) {
            console.log(`Slot ${slot._id} has ${processedLessons.length} processed students:`, processedLessons);
          }
          
          return {
            id: slot._id,
            title: slot.instructor 
              ? `${slot.instructor.firstName} ${slot.instructor.lastName}`
              : "מדריך לא זמין",
            date: formattedDate,
            startTime: slot.startTime,
            endTime: slot.endTime,
            type: slot.type as LessonType || (slot.maxCapacity > 1 ? "group" : "private"),
            status: slot.status || "available",
            maxCapacity: slot.maxCapacity || 1,
            currentCapacity: slot.currentCapacity || 0,
            isAlreadyBooked: false,
            lessonId: undefined,
            instructor: slot.instructor ? {
              _id: slot.instructor._id,
              firstName: slot.instructor.firstName,
              lastName: slot.instructor.lastName,
              swimmingStyles: slot.instructor.swimmingStyles || [],
            } : undefined,
            swimStyle: displaySwimStyle,
            lessons: processedLessons
          };
        });

        console.log("Mapped activities:", mappedActivities);
        setActivities(mappedActivities);
      } catch (err: any) {
        console.error("Error fetching instructor activities:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (userId && selectedDate) {
      fetchInstructorActivities();
    }
  }, [userId, selectedDate, refreshCounter]);

  return { activities, loading, error };
};