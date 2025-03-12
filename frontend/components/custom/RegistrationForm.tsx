import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { RegistrationFormData, ValidationErrors } from "../../types/forms";

// Removed SVG icon imports
// Instead, we pass icon names as strings corresponding to MaterialIcons

import { CheckboxGrid, CheckboxOption } from "./CheckboxGrid";
import { RadioGroup, RadioOption } from "./RadioGroup";
import { IconFormField } from "./IconFormField";
import ActionButton from "./ActionButton";

interface RegistrationFormProps {
  formData: RegistrationFormData;
  onChange: (field: keyof RegistrationFormData, value: any) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  errors?: ValidationErrors;
  swimmingStyleOptions: CheckboxOption<string>[];
  roleOptions: RadioOption<"swimmer" | "instructor">[];
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  formData,
  onChange,
  onSubmit,
  isSubmitting = false,
  errors = {},
  swimmingStyleOptions,
  roleOptions,
}) => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.formContainer}>
        <IconFormField
          label="שם מלא"
          iconName="person" // using MaterialIcons name
          value={formData.name}
          onChangeText={(text) => onChange("name", text)}
          error={errors.name}
          placeholder="הכנס את שמך המלא"
        />

        <IconFormField
          label="מספר טלפון"
          iconName="phone"
          value={formData.phone}
          onChangeText={(text) => onChange("phone", text)}
          error={errors.phone}
          placeholder="הכנס את מספר הטלפון שלך"
          keyboardType="phone-pad"
        />

        <IconFormField
          label="אימייל"
          iconName="email"
          value={formData.email}
          onChangeText={(text) => onChange("email", text)}
          error={errors.email}
          placeholder="הכנס את כתובת האימייל שלך"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <IconFormField
          label="סיסמה"
          iconName="lock"
          value={formData.password}
          onChangeText={(text) => onChange("password", text)}
          error={errors.password}
          placeholder="הכנס סיסמה"
          secureTextEntry
        />

        <RadioGroup
          label="תפקיד"
          iconName="people"
          options={roleOptions}
          value={formData.role}
          onChange={(value) => onChange("role", value)}
        />

        <CheckboxGrid
          label={
            formData.role === "instructor"
              ? "סגנונות שחייה שאני מלמד"
              : "סגנונות שחייה שאני שולט בהם"
          }
          iconName="pool"
          options={swimmingStyleOptions}
          selectedValues={formData.swimmingStyles}
          onChange={(values) => onChange("swimmingStyles", values)}
        />

        <ActionButton label="הירשם" onPress={onSubmit} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 24,
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});
