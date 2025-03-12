// src/screens/LoginScreen.tsx
import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { I18nManager } from "react-native";
import { LoginForm } from "../custom/LoginForm";
import { FormHeader } from "../custom/FormHeader";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { AppTabParamList, AuthStackParamList } from "@/navigation/AppNavigator";
import { loginUser } from "../../api/apiAuth";
import { useAuth } from "./../../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
// Ensure RTL layout for Hebrew
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();

  const authContext = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const handleLogin = async () => {
    if (!identifier || !password) {
      setError("אנא הזן את כל השדות הנדרשים");
      return;
    }

    try {
      setIsLoading(true);
      setError(undefined);

      // Log login attempt for debugging
      console.log(`Attempting to login with email: ${identifier}`);

      // Call the API to log in the user
      const response = await loginUser({
        email: identifier.trim(), // Trim to remove any accidental whitespace
        password: password,
      });

      console.log("Login successful:", response);

      if (!response || !response.token) {
        throw new Error("תגובת התחברות לא חוקית מהשרת");
      }

      // Create a user object with all necessary data
      const userData = {
        id: response.user.id,
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        email: response.user.email,
        role: response.user.role,
        // Add other properties as needed
      };

      // Use the updated auth context to set user data
      await authContext.login(response.token, userData);

      // Log a confirmation message for debugging
      console.log(
        "Authentication state updated, auth context should trigger navigation"
      );
    } catch (err: any) {
      console.error("Login error:", err);

      // More detailed error logging
      if (err.response) {
        console.error("Error status:", err.response.status);
        console.error("Error data:", err.response.data);
      }

      // User-friendly error message
      setError(
        err.response?.data?.message ||
          "התחברות נכשלה. אנא בדוק את פרטי ההתחברות שלך ונסה שוב."
      );
    } finally {
      setIsLoading(false);
    }
  };
  // New handleRegister function
  const handleRegister = () => {
    console.log("Navigate to registration");
    navigation.navigate("Registration");
  };

  return (
    <SafeAreaView style={styles.container}>
      <FormHeader title="התחברות" subtitle="התחבר למערכת הבריכה" />

      <LoginForm
        identifier={identifier}
        password={password}
        rememberMe={rememberMe}
        isLoading={isLoading}
        error={error}
        onChangeIdentifier={setIdentifier}
        onChangePassword={setPassword}
        onChangeRememberMe={setRememberMe}
        onSubmit={handleLogin}
      />

      <View style={styles.registerContainer}>
        <Text style={styles.registerText}>אין לך חשבון?</Text>
        <TouchableOpacity onPress={handleRegister}>
          <Text style={styles.registerLink}>הירשם עכשיו</Text>
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
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 24,
  },
  registerText: {
    fontSize: 16,
    color: "#666666",
  },
  registerLink: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2196F3",
    marginRight: 4,
  },
});
