import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export interface RadioOption<T> {
  value: T;
  label: string;
}

interface RadioGroupProps<T> {
  label: string;
  iconName?: keyof typeof MaterialIcons.glyphMap;
  options: RadioOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function RadioGroup<T>({
  label,
  iconName,
  options,
  value,
  onChange,
}: RadioGroupProps<T>) {
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

      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={String(option.value)}
            style={styles.optionItem}
            onPress={() => onChange(option.value)}
          >
            <View style={styles.radio}>
              {value === option.value && <View style={styles.radioSelected} />}
            </View>
            <Text style={styles.optionLabel}>{option.label}</Text>
          </TouchableOpacity>
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
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 24,
    marginBottom: 8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#2196F3",
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2196F3",
  },
  optionLabel: {
    fontSize: 16,
  },
});
