import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface IconFormFieldProps extends TextInputProps {
  label: string;
  iconName: keyof typeof MaterialIcons.glyphMap; // Type-safe icon name
  error?: string;
}

export const IconFormField: React.FC<IconFormFieldProps> = ({
  label,
  iconName,
  error,
  ...inputProps
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <MaterialIcons
          name={iconName}
          size={20}
          color="#2196F3"
          style={styles.icon}
        />
        <Text style={styles.label}>{label}</Text>
      </View>

      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor="#A0A0A0"
        {...inputProps}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

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
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    textAlign: "right",
  },
  inputError: {
    borderColor: "#FF3B30",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    marginTop: 4,
  },
});
