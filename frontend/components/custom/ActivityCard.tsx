import { formatSwimmingStyles } from "@/utils/swimStyleUtil";
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export type LessonType = "private" | "group";

export interface Instructor {
  _id: string;
  firstName: string;
  lastName: string;
  // Instructor's swimming styles stored in the User document
  swimmingStyles?: string[];
}

export interface Lesson {
  studentName: string;
  swimStyle: string;
  lessonId?: string;
}

export interface Activity {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: LessonType;
  status: string;
  maxCapacity: number;
  currentCapacity: number;
  isAlreadyBooked?: boolean;
  lessonId?: string;
  instructor?: Instructor;

  // UPDATED: Allow both string (display format) and string[] (raw data format)
  // This accommodates both the processed display string and raw array from the backend
  swimStyle?: string | string[];

  // Raw swimming styles array from the backend (if needed separately)
  swimmingStyles?: string[];

  lessons?: Lesson[];
}

interface ActivityCardProps {
  activity: Activity;
  role?: "instructor" | "swimmer";
  onViewDetails?: (activity: Activity) => void;
  onCancelTimeSlot?: (activity: Activity) => Promise<void>;
  onBookTimeSlot?: (activity: Activity) => Promise<void>;
  onCancelLesson?: (activity: Activity) => Promise<void>;
  isAlreadyBooked?: boolean;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  role = "instructor",
  onViewDetails,
  onCancelTimeSlot,
  onBookTimeSlot,
  onCancelLesson,
  isAlreadyBooked = false,
}) => {
  const isAvailable = activity.status === "available";
  const isGroupSession = activity.type === "group";
  const isEmptyTimeSlot = activity.currentCapacity === 0;
  const isPartiallyFilled =
    isGroupSession &&
    activity.currentCapacity > 0 &&
    activity.currentCapacity < activity.maxCapacity;
  const isFullyBooked = activity.currentCapacity === activity.maxCapacity;

  let statusLabel = "זמין";
  if (isEmptyTimeSlot) statusLabel = "ריק";
  else if (isFullyBooked) statusLabel = "מלא";
  else if (isPartiallyFilled) statusLabel = "חלקי";

  let instructorName = "לא זמין";
  if (activity.instructor) {
    const firstName = activity.instructor.firstName || "";
    const lastName = activity.instructor.lastName || "";
    if (firstName || lastName) {
      instructorName = `${firstName} ${lastName}`.trim();
    }
  }

  // Use the derived swimStyle (a comma-separated string) directly.
  const displayedSwimStyle = formatSwimmingStyles(activity.swimStyle);

  const capacityLabel = isGroupSession
    ? `${activity.currentCapacity}/${activity.maxCapacity} תלמידים`
    : `${activity.currentCapacity}/${activity.maxCapacity}`;

  return (
    <View
      style={[
        styles.card,
        isAvailable ? styles.availableCard : styles.occupiedCard,
        isPartiallyFilled && styles.partiallyFilledCard,
      ]}
    >
      <View style={styles.headerContainer}>
        <Text style={styles.timeText}>
          {activity.startTime} - {activity.endTime}
        </Text>
        <View
          style={[
            styles.statusBadge,
            isEmptyTimeSlot
              ? styles.emptyBadge
              : isFullyBooked
              ? styles.occupiedBadge
              : isPartiallyFilled
              ? styles.partiallyFilledBadge
              : styles.availableBadge,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              isEmptyTimeSlot
                ? styles.emptyStatusText
                : isFullyBooked
                ? styles.occupiedStatusText
                : isPartiallyFilled
                ? styles.partiallyFilledStatusText
                : styles.availableStatusText,
            ]}
          >
            {statusLabel}
          </Text>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.instructorText}>שם מדריך: {instructorName}</Text>
        <Text style={styles.capacityText}>קיבולת: {capacityLabel}</Text>
        <Text style={styles.lessonTypeText}>
          סוג שיעור: {isGroupSession ? "קבוצתי" : "פרטי"}
        </Text>
        <Text style={styles.swimStyleText}>
          סוג שחייה: {displayedSwimStyle}
        </Text>
        {activity.lessons && activity.lessons.length > 0 && (
          <View style={styles.studentsContainer}>
            <Text style={styles.studentsHeaderText}>תלמידים רשומים:</Text>
            {activity.lessons.map((lesson, index) => (
              <View key={index} style={styles.studentRow}>
                <Text style={styles.studentNameText}>{lesson.studentName}</Text>
                <Text style={styles.swimStyleText}>{lesson.swimStyle}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.actionsContainer}>
        {role === "instructor" ? (
          isEmptyTimeSlot ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => onCancelTimeSlot && onCancelTimeSlot(activity)}
            >
              <Text style={styles.actionButtonText}>בטל חלון זמן</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onViewDetails && onViewDetails(activity)}
            >
              <Text style={styles.actionButtonText}>פרטים</Text>
            </TouchableOpacity>
          )
        ) : (
          <>
            {isAlreadyBooked ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => onCancelLesson && onCancelLesson(activity)}
              >
                <Text style={styles.actionButtonText}>בטל שיעור</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onBookTimeSlot && onBookTimeSlot(activity)}
              >
                <Text style={styles.actionButtonText}>קבע שיעור</Text>
              </TouchableOpacity>
            )}
            {onViewDetails && (
              <TouchableOpacity
                style={[styles.actionButton, { marginLeft: 8 }]}
                onPress={() => onViewDetails(activity)}
              >
                <Text style={styles.actionButtonText}>פרטים</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
  },
  availableCard: { borderLeftColor: "#4CAF50" },
  occupiedCard: { borderLeftColor: "#F44336" },
  partiallyFilledCard: { borderLeftColor: "#FF9800" },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  timeText: { fontSize: 16, fontWeight: "bold", color: "#212121" },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  availableBadge: { backgroundColor: "#E8F5E9" },
  occupiedBadge: { backgroundColor: "#FFEBEE" },
  partiallyFilledBadge: { backgroundColor: "#FFF3E0" },
  emptyBadge: { backgroundColor: "#E0E0E0" },
  statusText: { fontSize: 12, fontWeight: "600" },
  availableStatusText: { color: "#2E7D32" },
  occupiedStatusText: { color: "#C62828" },
  partiallyFilledStatusText: { color: "#E65100" },
  emptyStatusText: { color: "#616161" },
  detailsContainer: { marginBottom: 16 },
  instructorText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#424242",
    marginBottom: 4,
  },
  titleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#424242",
    marginBottom: 4,
  },
  capacityText: { fontSize: 14, color: "#616161", marginBottom: 4 },
  lessonTypeText: { fontSize: 14, color: "#616161", marginBottom: 4 },
  swimStyleText: { fontSize: 14, color: "#616161", marginBottom: 4 },
  studentsContainer: {
    marginTop: 8,
    backgroundColor: "#F5F5F5",
    padding: 8,
    borderRadius: 4,
  },
  studentsHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#424242",
    marginBottom: 4,
  },
  studentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  studentNameText: { fontSize: 14, color: "#424242" },
  actionsContainer: { flexDirection: "row", justifyContent: "flex-start" },
  actionButton: {
    flex: 1,
    backgroundColor: "#2196F3",
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  cancelButton: { backgroundColor: "#F44336" },
  actionButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 14 },
});

export default ActivityCard;
