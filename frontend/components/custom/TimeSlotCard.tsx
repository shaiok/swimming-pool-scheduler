import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface TimeSlotCardProps {
  time: string;
  isAvailable: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

const TimeSlotCard: React.FC<TimeSlotCardProps> = ({
  time,
  isAvailable,
  onToggle,
  onDelete,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              isAvailable ? styles.availableButton : styles.unavailableButton,
            ]}
            onPress={onToggle}
          >
            <Text style={styles.toggleText}>
              {isAvailable ? "זמין" : "לא זמין"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
            <Text style={styles.deleteText}>✕</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.timeText}>{time}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  cardContent: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
  toggleButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginRight: 8,
  },
  availableButton: {
    backgroundColor: "#4CAF50",
  },
  unavailableButton: {
    backgroundColor: "#F44336",
  },
  toggleText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f8f8f8",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteText: {
    color: "#F44336",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default TimeSlotCard;
