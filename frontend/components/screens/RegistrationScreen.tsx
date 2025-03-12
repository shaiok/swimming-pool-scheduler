// src/screens/RegistrationScreen.tsx
import { RegistrationFormData, ValidationErrors } from "@/types/forms";
import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { I18nManager } from "react-native";
import { FormHeader } from "../custom/FormHeader";
import { RegistrationForm } from "../custom/RegistrationForm";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { AuthStackParamList } from "@/navigation/AppNavigator"; // adjust the path as needed

// Import your API function for registration
import { registerUser } from "../../api/apiAuth";

// Ensure RTL layout for Hebrew
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export const RegistrationScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();

  const [formData, setFormData] = useState<RegistrationFormData>({
    name: "",
    phone: "",
    email: "",
    password: "",
    role: "swimmer",
    swimmingStyles: [],
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roleOptions: { value: "swimmer" | "instructor"; label: string }[] = [
    { value: "swimmer", label: "שחיין" },
    { value: "instructor", label: "מדריך" },
  ];

  const swimmingStyleOptions = [
    { value: "חתירה", label: "חתירה" },
    { value: "גב", label: "גב" },
    { value: "חזה", label: "חזה" },
    { value: "פרפר", label: "פרפר" },
    { value: "אישי", label: "מעורב אישי" },
  ];

  const handleChange = (field: keyof RegistrationFormData, value: any) => {
    setFormData({
      ...formData,
      [field]: value,
    });

    // Clear error when field is changed
    if (errors[field as keyof ValidationErrors]) {
      setErrors({
        ...errors,
        [field]: undefined,
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "שם מלא הינו שדה חובה";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "מספר טלפון הינו שדה חובה";
    } else if (!/^\d{9,10}$/.test(formData.phone.trim())) {
      newErrors.phone = "מספר טלפון לא תקין";
    }

    if (!formData.email.trim()) {
      newErrors.email = "אימייל הינו שדה חובה";
    } else if (!/\S+@\S+\.\S+/.test(formData.email.trim())) {
      newErrors.email = "כתובת אימייל לא תקינה";
    }

    if (!formData.password.trim()) {
      newErrors.password = "סיסמה הינה שדה חובה";
    } else if (formData.password.length < 6) {
      newErrors.password = "סיסמה חייבת להכיל לפחות 6 תווים";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    try {
      setIsSubmitting(true);

      // Match the exact payload structure that worked in Postman
      const payload = {
        firstName: formData.name.trim().split(" ")[0],
        lastName: formData.name.trim().split(" ").slice(1).join(" ") || "N/A",
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
        swimmingStyles: formData.swimmingStyles,
        ...(formData.role === "swimmer" && {
          preferredLessonType: "private" as "private" | "group" | "both",
        }),
      };

      console.log("Sending registration payload:", payload);
      const response = await registerUser(payload);
      console.log("Registration successful:", response);

      navigation.navigate("Login");
    } catch (error: any) {
      console.error("Registration error details:", error);

      // Improve error handling
      if (error.response) {
        console.error("Server response:", error.response.data);
        // You could set a specific error message based on the response
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <FormHeader title="הרשמה" subtitle="צור חשבון חדש למערכת הבריכה" />

      <RegistrationForm
        formData={formData}
        onChange={handleChange}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        errors={errors}
        swimmingStyleOptions={swimmingStyleOptions}
        roleOptions={roleOptions}
      />

      <View style={styles.loginLinkContainer}>
        <Text style={styles.loginText}>כבר יש לך חשבון?</Text>
        <TouchableOpacity
          onPress={() => {
            // Navigate to login screen
            navigation.navigate("Login");
            console.log("Navigate to login");
          }}
        >
          <Text style={styles.loginLink}>התחבר</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loginLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 24,
  },
  loginText: {
    fontSize: 16,
    color: "#666666",
  },
  loginLink: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2196F3",
    marginRight: 4,
  },
});
