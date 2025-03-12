// src/hooks/useSwimmerActivities.ts
import { useState, useEffect } from "react";
import { getAvailableTimeSlots, getSwimmerLessons } from "@/api/swimmerApi";
import { Activity }  from "@/components/custom/ActivityCard";
import { formatSwimmingStyles } from "@/utils/swimStyleUtil";

export const useSwimmerActivities = (
  userId: string,
  selectedDate: Date,
  refreshCounter: number = 0
) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSwimmerActivities = async () => {
      setLoading(true);
      try {
        const formattedDate = selectedDate.toISOString().split("T")[0];
        console.log("Fetching swimmer activities for date:", formattedDate);

        // 1. Fetch available timeslots
        const availableResponse = await getAvailableTimeSlots({ date: formattedDate });
        const availableTimeSlots = availableResponse.data || [];
        console.log("Raw available timeslots:", availableTimeSlots);

        // Debug the first timeslot's swimming styles if available
        if (availableTimeSlots.length > 0) {
          console.log("DEBUG - First available timeslot swimming styles:", {
            swimmingStyles: availableTimeSlots[0].swimmingStyles,
            swimStyles: availableTimeSlots[0].swimStyles
          });
        }

        // 2. Fetch booked lessons
        const bookedResponse = await getSwimmerLessons(userId);
        const bookedLessons = bookedResponse.data || [];
        console.log("Raw booked lessons:", bookedLessons);

        // 3. Map available timeslots using standardized swimmingStyles property
        const mappedAvailable: Activity[] = availableTimeSlots.map((slot: any) => {
          // FIXED: Look for standardized swimmingStyles first, fall back to swimStyles for backward compatibility
          const slotStyles = slot.swimmingStyles || slot.swimStyles;
          
          console.log(`Available slot ${slot._id} styles:`, slotStyles);
          
          const displaySwimStyle = formatSwimmingStyles(slotStyles);
          
          return {
            id: slot._id,
            title: slot.instructor
              ? `${slot.instructor.firstName} ${slot.instructor.lastName}`
              : "מדריך לא זמין",
            date: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            type: slot.maxCapacity > 1 ? "group" : "private",
            status: slot.currentCapacity < slot.maxCapacity ? "available" : "fully booked",
            maxCapacity: slot.maxCapacity || 1,
            currentCapacity: slot.currentCapacity || 0,
            isAlreadyBooked: false,
            lessonId: undefined,
            instructor: slot.instructor ? {
              _id: slot.instructor._id,
              firstName: slot.instructor.firstName,
              lastName: slot.instructor.lastName,
              swimmingStyles: slot.instructor.swimmingStyles || []
            } : undefined,
            swimStyle: displaySwimStyle,
          };
        });

        // 4. Map booked lessons for the selected date
        const mappedBooked: Activity[] = bookedLessons
        // Filter out lessons where timeSlotId is null
        .filter((lesson: any) => lesson.timeSlotId && lesson.timeSlotId.date === formattedDate)
        .map((lesson: any) => {
          const ts = lesson.timeSlotId;
          
          // Use the correct property: try swimmingStyles first, then swimStyles
          const slotStyles = ts.swimmingStyles || ts.swimStyles;
          
          console.log(`Booked slot ${ts._id} styles:`, slotStyles);
          
          const displaySwimStyle = formatSwimmingStyles(slotStyles);
          
          return {
            id: ts._id.toString(),
            title: ts.instructorId
              ? `${ts.instructorId.firstName} ${ts.instructorId.lastName}`
              : "חלון זמן שנקבע",
            date: ts.date,
            startTime: ts.startTime,
            endTime: ts.endTime,
            type: ts.maxCapacity > 1 ? "group" : "private",
            status: ts.currentCapacity < ts.maxCapacity ? "available" : "fully booked",
            maxCapacity: ts.maxCapacity || 1,
            currentCapacity: ts.currentCapacity || 0,
            isAlreadyBooked: true,
            lessonId: lesson._id,
            instructor: ts.instructorId ? {
              _id: ts.instructorId._id,
              firstName: ts.instructorId.firstName,
              lastName: ts.instructorId.lastName,
              swimmingStyles: ts.instructorId.swimmingStyles || []
            } : undefined,
            swimStyle: displaySwimStyle,
          };
        });

        // 5. Merge available and booked (booked overrides available)
        const mergedMap: { [key: string]: Activity } = {};
        mappedAvailable.forEach((act) => { mergedMap[act.id] = act; });
        mappedBooked.forEach((act) => { mergedMap[act.id] = act; });

        const mergedActivities = Object.values(mergedMap);
        console.log("Final merged activities:", mergedActivities);

        setActivities(mergedActivities);
      } catch (err: any) {
        console.error("Error fetching swimmer activities:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (userId && selectedDate) {
      fetchSwimmerActivities();
    }
  }, [userId, selectedDate, refreshCounter]);

  return { activities, loading, error };
};