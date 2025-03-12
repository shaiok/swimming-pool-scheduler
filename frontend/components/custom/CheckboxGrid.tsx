import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export interface CheckboxOption<T> {
  value: T;
  label: string;
}

interface CheckboxGridProps<T> {
  label: string;
  iconName?: keyof typeof MaterialIcons.glyphMap;
  options: CheckboxOption<T>[];
  selectedValues: T[];
  onChange: (selectedValues: T[]) => void;
  columns?: number;
}

export function CheckboxGrid<T>({
  label,
  iconName,
  options,
  selectedValues,
  onChange,
  columns = 2,
}: CheckboxGridProps<T>) {
  const toggleOption = (value: T) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        {iconName && (
          <MaterialIcons
            name={iconName}
            size={20}
            color="#2196F3"
            style={styles.icon}
          />
        )}
        <Text style={styles.label}>{label}</Text>
      </View>

      <View style={[styles.optionsGrid, { flexDirection: "row-reverse" }]}>
        {options.map((option) => (
          <View
            key={String(option.value)}
            style={[styles.optionContainer, { width: `${100 / columns}%` }]}
          >
            <TouchableOpacity
              style={styles.checkboxItem}
              onPress={() => toggleOption(option.value)}
            >
              <View
                style={[
                  styles.checkbox,
                  selectedValues.includes(option.value) &&
                    styles.checkboxSelected,
                ]}
              >
                {selectedValues.includes(option.value) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={styles.optionLabel}>{option.label}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
  },
  optionsGrid: {
    flexWrap: "wrap",
  },
  optionContainer: {
    marginBottom: 12,
  },
  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#2196F3",
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: "#2196F3",
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  optionLabel: {
    fontSize: 16,
  },
});
