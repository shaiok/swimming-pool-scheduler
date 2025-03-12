// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Define User interface to store user data
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  // Add other user properties as needed
}

type AuthContextType = {
  isAuthenticated: boolean;
  userRole: string | null;
  userId: string | null;
  user: User | null; // Add user object
  login: (token: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  userRole: null,
  userId: null,
  user: null, // Initialize as null
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null); // State for user data

  // Check token and user data on startup
  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem("jwtToken");
      const storedRole = await AsyncStorage.getItem("userRole");
      const storedUserId = await AsyncStorage.getItem("userId");
      const storedUserData = await AsyncStorage.getItem("userData");

      if (token) {
        setIsAuthenticated(true);
        setUserRole(storedRole);
        setUserId(storedUserId);

        // Parse and set user data if available
        if (storedUserData) {
          try {
            const userData = JSON.parse(storedUserData);
            setUser(userData);
          } catch (e) {
            console.error("Error parsing stored user data:", e);
          }
        }
      }
    };
    checkToken();
  }, []);

  // Enhanced login function that accepts user data
  const login = async (token: string, userData: User) => {
    try {
      console.log(
        "AuthContext: Setting authentication data",
        token,
        userData.role,
        userData.id
      );
      await AsyncStorage.setItem("jwtToken", token);
      await AsyncStorage.setItem("userRole", userData.role);
      await AsyncStorage.setItem("userId", userData.id);
      await AsyncStorage.setItem("userData", JSON.stringify(userData));

      console.log("AuthContext: Updating state");
      setIsAuthenticated(true);
      setUserRole(userData.role);
      setUserId(userData.id);
      setUser(userData);
    } catch (error) {
      console.error("Error in login function:", error);
      throw error;
    }
  };

  // Updated logout function to clear user data
  const logout = async () => {
    await AsyncStorage.removeItem("jwtToken");
    await AsyncStorage.removeItem("userRole");
    await AsyncStorage.removeItem("userId");
    await AsyncStorage.removeItem("userData");

    setIsAuthenticated(false);
    setUserRole(null);
    setUserId(null);
    setUser(null);
    // Navigation is handled by AppNavigator based on authentication state.
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, userRole, userId, user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
