import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { theme } from "../../theme/theme";

interface TimeRangeModalProps {
  onClose: () => void;
  // Updated onSave to include swimmingStyles array.
  onSave: (
    startTime: string,
    lessonType: "private" | "group",
    swimmingStyles: string[]
  ) => void;
  selectedDate: Date;
}

// Available swimming styles in Hebrew.
const AVAILABLE_STYLES = ["חופש", "גב", "חזה", "פרפר"];

const TimeRangeModal: React.FC<TimeRangeModalProps> = ({
  onClose,
  onSave,
  selectedDate,
}) => {
  const [startTime, setStartTime] = useState("08:00");
  const [lessonType, setLessonType] = useState<"private" | "group">("private");
  // Use state for selected swimming styles.
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

  // Available times (only round hours)
  const times = Array.from(
    { length: 16 },
    (_, i) => `${(6 + i).toString().padStart(2, "0")}:00`
  );

  // Toggle style selection
  const toggleStyle = (style: string) => {
    if (selectedStyles.includes(style)) {
      setSelectedStyles(selectedStyles.filter((s) => s !== style));
    } else {
      setSelectedStyles([...selectedStyles, style]);
    }
  };

  const handleSave = () => {
    // No validation added here; add if needed.
    onSave(startTime, lessonType, selectedStyles);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>הוספת טווח זמן</Text>
          <Text style={styles.dateText}>{selectedDate.toDateString()}</Text>

          {/* Lesson Type Selection */}
          <View style={styles.lessonTypeContainer}>
            <TouchableOpacity
              style={[
                styles.lessonTypeButton,
                lessonType === "group" && styles.selectedType,
              ]}
              onPress={() => setLessonType("group")}
            >
              <Text
                style={
                  lessonType === "group"
                    ? styles.selectedText
                    : styles.unselectedText
                }
              >
                שיעור קבוצתי
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.lessonTypeButton,
                lessonType === "private" && styles.selectedType,
              ]}
              onPress={() => setLessonType("private")}
            >
              <Text
                style={
                  lessonType === "private"
                    ? styles.selectedText
                    : styles.unselectedText
                }
              >
                שיעור פרטי
              </Text>
            </TouchableOpacity>
          </View>

          {/* Swimming Styles Selection */}
          <View style={styles.stylesContainer}>
            <Text style={styles.inputLabel}>סגנונות שחייה</Text>
            <View style={styles.stylesButtonsContainer}>
              {AVAILABLE_STYLES.map((style) => (
                <TouchableOpacity
                  key={style}
                  style={[
                    styles.styleButton,
                    selectedStyles.includes(style) &&
                      styles.styleButtonSelected,
                  ]}
                  onPress={() => toggleStyle(style)}
                >
                  <Text
                    style={
                      selectedStyles.includes(style)
                        ? styles.styleButtonTextSelected
                        : styles.styleButtonText
                    }
                  >
                    {style}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Time Selection */}
          <View style={styles.timeContainer}>
            <Text style={styles.inputLabel}>שעת התחלה</Text>
            <ScrollView style={styles.picker}>
              {times.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeOption,
                    startTime === time && styles.selectedTime,
                  ]}
                  onPress={() => setStartTime(time)}
                >
                  <Text
                    style={
                      startTime === time
                        ? styles.selectedTimeText
                        : styles.timeText
                    }
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>ביטול</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>הוסף</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 24,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
    color: theme.colors.primary,
  },
  lessonTypeContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  lessonTypeButton: {
    padding: 10,
    flex: 1,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#f1f1f1",
    marginHorizontal: 4,
  },
  selectedType: { backgroundColor: theme.colors.primary },
  selectedText: { color: "white", fontWeight: "bold" },
  unselectedText: { color: "#333" },
  stylesContainer: {
    marginBottom: 16,
  },
  stylesButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  styleButton: {
    padding: 8,
    margin: 4,
    borderRadius: 4,
    backgroundColor: "#f1f1f1",
  },
  styleButtonSelected: {
    backgroundColor: theme.colors.primary,
  },
  styleButtonText: {
    fontSize: 14,
    color: "#333",
  },
  styleButtonTextSelected: {
    fontSize: 14,
    color: "white",
    fontWeight: "bold",
  },
  timeContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 14, marginBottom: 8, textAlign: "right" },
  picker: { borderWidth: 1, borderColor: "#ddd", borderRadius: 4, height: 120 },
  timeOption: { padding: 12, alignItems: "center" },
  selectedTime: { backgroundColor: theme.colors.primary + "20" },
  timeText: { fontSize: 16 },
  selectedTimeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between" },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 4,
    backgroundColor: "#f1f1f1",
    alignItems: "center",
  },
  cancelButtonText: { color: "#333", fontWeight: "500" },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
  },
  saveButtonText: { color: "white", fontWeight: "500" },
});

export default TimeRangeModal;
