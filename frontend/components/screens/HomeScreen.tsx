import React, { useState, useCallback, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import DateSelector from "../custom/DateSelector";
import ActivityCard from "../custom/ActivityCard";
import { Activity } from "../custom/ActivityCard";
import { theme } from "../../theme/theme";
import { formatDate } from "../../utils/dateUtils";
import { useAuth } from "@/context/AuthContext";
import { useInstructorActivities } from "@/hooks/useInstructorActivities";
import { useSwimmerActivities } from "@/hooks/useSwimmerActivities";
import TimeRangeModal from "../custom/TimeRangeModal";
import {
  removeAvailabilitySlot,
  updateAvailability,
} from "@/api/instructorApi";
import { bookLesson, cancelLesson } from "@/api/swimmerApi";
import { timeToMinutes, minutesToTime } from "../../utils/dateUtils";

const HomeScreen: React.FC = () => {
  const { userRole, userId, user } = useAuth(); // Get user data from auth context
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [refreshCounter, setRefreshCounter] = useState<number>(0);
  const [showModal, setShowModal] = useState<boolean>(false);

  // DEBUG: Log user role and ID
  console.log(
    `HomeScreen rendering with userRole: ${userRole}, userId: ${userId}, userName: ${
      user?.firstName || "unknown"
    }`
  );

  // If userRole === "instructor", useInstructorActivities; otherwise, useSwimmerActivities
  const { activities, loading, error } =
    userRole === "instructor"
      ? useInstructorActivities(userId!, selectedDate, refreshCounter)
      : useSwimmerActivities(userId!, selectedDate, refreshCounter);

  // DEBUG: Log activities whenever they change
  useEffect(() => {
    console.log(`Activities updated. Count: ${activities.length}`);

    if (activities.length > 0) {
      // Log the first activity as a sample
      console.log("Sample activity:", JSON.stringify(activities[0], null, 2));

      // Check for missing instructor data
      const missingInstructorCount = activities.filter(
        (a) => !a.instructor || !a.instructor.firstName
      ).length;
      if (missingInstructorCount > 0) {
        console.warn(
          `Warning: ${missingInstructorCount} activities missing instructor data`
        );
      }

      // Check for missing swim style data
      const missingSwimStyleCount = activities.filter(
        (a) => !a.swimStyle || a.swimStyle === "לא זמין"
      ).length;
      if (missingSwimStyleCount > 0) {
        console.warn(
          `Warning: ${missingSwimStyleCount} activities missing swim style data`
        );
      }
    }
  }, [activities]);

  const refreshActivities = useCallback(() => {
    console.log("Refreshing activities...");
    setRefreshCounter((prev) => prev + 1);
  }, []);

  const handleInstructorCancel = useCallback(
    async (activity: Activity) => {
      try {
        console.log("Cancelling instructor time slot:", activity.id);
        const formattedDate = selectedDate.toISOString().split("T")[0];
        const result = await removeAvailabilitySlot(
          userId!,
          formattedDate,
          activity.startTime
        );
        console.log("תוצאת ביטול חלון זמן:", result);
        refreshActivities();
      } catch (error: any) {
        console.error("שגיאה בביטול חלון זמן:", error);
        Alert.alert("שגיאה", "לא ניתן לבטל חלון זמן");
      }
    },
    [userId, selectedDate, refreshActivities]
  );

  const handleSwimmerBook = useCallback(
    async (activity: Activity) => {
      try {
        console.log("Booking swimmer lesson for slot:", activity.id);

        // FIXED: Better handling of swim style parsing from the display string
        let swimStyle: string;

        // Debug the activity's swimStyle property
        console.log("DEBUG - Activity swim style to book:", activity.swimStyle);

        if (activity.swimStyle && activity.swimStyle.includes(",")) {
          // If multiple styles, use the first one
          swimStyle = (
            typeof activity.swimStyle === "string"
              ? activity.swimStyle
              : activity.swimStyle.join(",")
          )
            .split(",")[0]
            .trim();
        } else if (activity.swimStyle) {
          // If single style, use as is
          swimStyle =
            typeof activity.swimStyle === "string"
              ? activity.swimStyle.trim()
              : activity.swimStyle.join(",").trim();
        } else {
          // Fallback
          swimStyle = "חופש";
        }

        console.log(`Using swim style: ${swimStyle} for booking`);

        const result = await bookLesson(userId!, activity.id, swimStyle);
        console.log("תוצאת הזמנת שיעור:", result);
        refreshActivities();
      } catch (error: any) {
        console.error("שגיאה בהזמנת שיעור:", error);
        Alert.alert("שגיאה", "לא ניתן לקבוע שיעור");
      }
    },
    [userId, refreshActivities]
  );

  const handleSwimmerCancel = useCallback(
    async (activity: Activity) => {
      try {
        if (!activity.lessonId) {
          throw new Error("לא נמצא מזהה שיעור לביטול");
        }
        console.log("Cancelling swimmer lesson:", activity.lessonId);
        const result = await cancelLesson(userId!, activity.lessonId);
        console.log("תוצאת ביטול שיעור:", result);
        refreshActivities();
      } catch (error: any) {
        console.error("שגיאה בביטול שיעור:", error);
        Alert.alert("שגיאה", "לא ניתן לבטל שיעור");
      }
    },
    [userId, refreshActivities]
  );

  const renderItem = useCallback(
    ({ item }: { item: Activity }) => {
      // DEBUG: Log each activity being rendered
      console.log(
        `Rendering activity: ${item.id}, instructor: ${
          item.instructor?.firstName || "none"
        }, swimStyle: ${item.swimStyle || "none"}`
      );

      return (
        <ActivityCard
          activity={item}
          role={userRole === "instructor" ? "instructor" : "swimmer"}
          onViewDetails={(act) => {
            // Base details
            let detailsText = `סוג שיעור: ${
              act.type === "group" ? "קבוצתי" : "פרטי"
            }
          זמן: ${act.startTime} - ${act.endTime}
          קיבולת: ${act.currentCapacity}/${act.maxCapacity}
          מדריך: ${act.instructor?.firstName || "לא זמין"} ${
              act.instructor?.lastName || ""
            }
          סגנון שחייה: ${act.swimStyle || "לא זמין"}`;

            // Add student information if available (especially important for instructors)
            if (act.lessons && act.lessons.length > 0) {
              detailsText += "\n\nתלמידים רשומים:";
              act.lessons.forEach((lesson, index) => {
                detailsText += `\n${index + 1}. ${lesson.studentName} - ${
                  lesson.swimStyle
                }`;
              });
            }

            Alert.alert("פרטי שיעור", detailsText);
          }}
          onCancelTimeSlot={
            userRole === "instructor" ? handleInstructorCancel : undefined
          }
          onBookTimeSlot={
            userRole === "swimmer" ? handleSwimmerBook : undefined
          }
          onCancelLesson={
            userRole === "swimmer" ? handleSwimmerCancel : undefined
          }
          isAlreadyBooked={
            userRole === "swimmer" ? item.isAlreadyBooked : false
          }
        />
      );
    },
    [handleInstructorCancel, handleSwimmerBook, handleSwimmerCancel, userRole]
  );

  // Handle API errors
  useEffect(() => {
    if (error) {
      console.error("API Error:", error);
      Alert.alert("שגיאה", "אירעה שגיאה בטעינת הנתונים. נסה שוב מאוחר יותר.");
    }
  }, [error]);

  // Get appropriate greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "בוקר טוב";
    if (hour < 18) return "צהריים טובים";
    return "ערב טוב";
  };

  // Get user's first name or appropriate fallback
  const getUserName = () => {
    if (user && user.firstName) {
      return user.firstName;
    }
    return userRole === "instructor" ? "מדריך/ה" : "תלמיד/ה";
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* Welcome message instead of month text */}
        <Text style={styles.welcomeText}>
          {getGreeting()}, {getUserName()}
        </Text>

        {/* Refresh button */}
        <TouchableOpacity
          onPress={refreshActivities}
          style={styles.refreshButton}
        >
          <Text style={styles.refreshButtonText}>רענן</Text>
        </TouchableOpacity>
      </View>

      <DateSelector
        selectedDate={selectedDate}
        onDateSelect={(date) => {
          console.log(`Date selected: ${date.toDateString()}`);
          setSelectedDate(date);
          refreshActivities();
        }}
      />

      <View style={styles.dateHeader}>
        <Text style={styles.dateHeaderText}>{formatDate(selectedDate)}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} />
      ) : (
        <FlatList
          data={activities}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                אין פעילויות זמינות לתאריך זה
              </Text>
            </View>
          }
        />
      )}

      {userRole === "instructor" && (
        <TouchableOpacity
          style={styles.actionButtonContainer}
          onPress={() => setShowModal(true)}
        >
          <Text style={{ color: "black", fontSize: 24 }}>+</Text>
        </TouchableOpacity>
      )}

      {showModal && userRole === "instructor" && (
        <TimeRangeModal
          onClose={() => setShowModal(false)}
          onSave={async (startTime, lessonType, swimmingStyles) => {
            try {
              console.log(
                `Adding availability: ${startTime}, ${lessonType}, styles: ${swimmingStyles.join(
                  ","
                )}`
              );
              const formattedDate = selectedDate.toISOString().split("T")[0];
              const duration = lessonType === "group" ? 60 : 45;
              const endTime = minutesToTime(
                timeToMinutes(startTime) + duration
              );

              // FIXED: Use consistently named parameter swimmingStyles
              const updateResponse = await updateAvailability(userId!, {
                date: formattedDate,
                startTime,
                endTime,
                lessonType,
                swimmingStyles, // Consistently using standardized property name
              });

              console.log("תוצאת עדכון זמינות:", updateResponse);
              refreshActivities();
              setShowModal(false);
            } catch (error: any) {
              console.error("שגיאה בהוספת טווח זמן:", error);
              Alert.alert("שגיאה", "לא ניתן להוסיף טווח זמן");
            }
          }}
          selectedDate={selectedDate}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  welcomeText: {
    fontSize: theme.fontSize.xl,
    fontWeight: "bold",
    color: theme.colors.text,
    textAlign: "right", // For RTL support
  },
  dateHeader: {
    paddingVertical: theme.spacing.sm,
    alignItems: "center",
  },
  dateHeaderText: {
    fontSize: theme.fontSize.lg,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  actionButtonContainer: {
    position: "absolute",
    bottom: 24,
    left: 24,
    zIndex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
  },
  refreshButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  refreshButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default HomeScreen;
