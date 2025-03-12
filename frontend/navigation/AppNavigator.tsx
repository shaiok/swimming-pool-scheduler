// src/navigation/AppNavigator.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import {
  createNavigationContainerRef,
  NavigationContainer,
} from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import HomeScreen from "@/components/screens/HomeScreen";
import { LoginScreen } from "@/components/screens/LoginScreen";
import { RegistrationScreen } from "@/components/screens/RegistrationScreen";
import { useAuth } from "@/context/AuthContext";
import MyLessonsScreen from "@/components/screens/MyLessonsScreen";

// Define types for navigation
export type AuthStackParamList = {
  Login: undefined;
  Registration: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  Lessons: undefined;
  Logout: undefined;
};

// Create a combined type for root navigation
export type RootStackParamList = AuthStackParamList & AppTabParamList;

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Navigation function that can be used anywhere
export function navigate(name: keyof RootStackParamList, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  } else {
    console.warn("Navigation container is not ready");
  }
}

// Create navigators
const Stack = createStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<AppTabParamList>();

// Auth stack for unauthenticated users
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Registration" component={RegistrationScreen} />
  </Stack.Navigator>
);

// Dummy logout screen that triggers logout on mount
const LogoutScreen: React.FC = () => {
  const { logout } = useAuth();
  React.useEffect(() => {
    logout();
  }, [logout]);
  return null; // Optionally show a loading indicator
};

// Tab navigator for authenticated users
const AppTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        let iconName: keyof typeof MaterialIcons.glyphMap;
        if (route.name === "Home") {
          iconName = "event";
        } else if (route.name === "Lessons") {
          iconName = "school"; // use an appropriate icon for lessons
        } else if (route.name === "Logout") {
          iconName = "exit-to-app";
        } else {
          iconName = "event"; // fallback icon
        }
        return <MaterialIcons name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{ title: "לוח זמנים", headerShown: false }}
    />
    <Tab.Screen
      name="Lessons"
      component={MyLessonsScreen}
      options={{ title: "השיעורים שלי", headerShown: false }}
    />
    <Tab.Screen
      name="Logout"
      component={LogoutScreen}
      options={{ title: "Logout", headerShown: false }}
    />
  </Tab.Navigator>
);

// Main navigator with conditional rendering
const AppNavigator: React.FC = () => {
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (navigationRef.isReady()) {
      console.log("Navigation is ready");
    }
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      {isAuthenticated ? <AppTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
