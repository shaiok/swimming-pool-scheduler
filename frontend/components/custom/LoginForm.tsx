// src/components/login/LoginForm.tsx
import React from "react";
import { View, StyleSheet, Text } from "react-native";
import ActionButton from "./ActionButton";
import { CheckboxField } from "./CheckboxField";
import { IconFormField } from "./IconFormField";
import { LinkText } from "./LinkText";

interface LoginFormProps {
  identifier: string;
  password: string;
  rememberMe: boolean;
  isLoading: boolean;
  error?: string;
  onChangeIdentifier: (text: string) => void;
  onChangePassword: (text: string) => void;
  onChangeRememberMe: (checked: boolean) => void;
  onSubmit: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  identifier,
  password,
  rememberMe,
  isLoading,
  error,
  onChangeIdentifier,
  onChangePassword,
  onChangeRememberMe,
  onSubmit,
}) => {
  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <IconFormField
        label="אימייל / טלפון"
        iconName="person"
        value={identifier}
        onChangeText={onChangeIdentifier}
        placeholder="הכנס אימייל או מספר טלפון"
        autoCapitalize="none"
      />

      <IconFormField
        label="סיסמה"
        iconName="lock"
        value={password}
        onChangeText={onChangePassword}
        placeholder="הכנס סיסמה"
        secureTextEntry
      />

      <View style={styles.optionsRow}>
        <CheckboxField
          label="זכור אותי"
          checked={rememberMe}
          onChange={onChangeRememberMe}
        />
      </View>

      <ActionButton
        label="התחבר"
        iconName="login"
        onPress={onSubmit}
        loading={isLoading}
        disabled={isLoading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  errorContainer: {
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 14,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 8,
  },
});
