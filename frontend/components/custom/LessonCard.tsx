// src/components/LessonCard.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { theme } from "@/theme/theme";
import { MappedLesson } from "@/hooks/useUserLessons";

interface LessonCardProps {
  lesson: MappedLesson;
  onViewDetails?: (lesson: MappedLesson) => void;
}

const LessonCard: React.FC<LessonCardProps> = ({ lesson, onViewDetails }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{lesson.title}</Text>
        <Text style={styles.status}>{lesson.status}</Text>
      </View>
      <View style={styles.details}>
        <Text style={styles.info}>תאריך: {lesson.date}</Text>
        <Text style={styles.info}>
          שעה: {lesson.startTime} - {lesson.endTime}
        </Text>
        <Text style={styles.info}>מדריך: {lesson.instructorName}</Text>
        <Text style={styles.info}>
          קיבולת: {lesson.currentCapacity}/{lesson.maxCapacity}
        </Text>
        <Text style={styles.info}>סגנון שחייה: {lesson.swimStyle}</Text>
        {lesson.studentNames.length > 0 && (
          <Text style={styles.info}>
            תלמידים: {lesson.studentNames.join(", ")}
          </Text>
        )}
      </View>
      {onViewDetails && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => onViewDetails(lesson)}
        >
          <Text style={styles.buttonText}>פרטים</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  status: {
    fontSize: 16,
    color: theme.colors.primary,
  },
  details: {
    marginTop: 8,
  },
  info: {
    fontSize: 14,
    marginVertical: 2,
  },
  button: {
    marginTop: 12,
    backgroundColor: theme.colors.primary,
    padding: 8,
    borderRadius: 4,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default LessonCard;
