import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../theme/theme";

// 1) Define possible button types
type ActionButtonType = "register" | "cancel" | "waitlist";

// 2) Define the props interface, including the optional iconName property
interface ActionButtonProps {
  type?: ActionButtonType; // optional, defaults to 'register'
  onPress: () => void; // function to call on button press
  label: string; // text to display
  iconName?: keyof typeof MaterialIcons.glyphMap; // optional icon property
  loading?: boolean;
  disabled?: boolean;
}

// 3) Create the component
const ActionButton: React.FC<ActionButtonProps> = ({
  type = "register",
  onPress,
  label,
  iconName,
  loading = false,
  disabled = false,
}) => {
  // Decide which style to use based on the "type"
  const getButtonStyle = (): StyleProp<ViewStyle> => {
    switch (type) {
      case "cancel":
        return styles.cancelButton;
      case "waitlist":
        return styles.waitlistButton;
      case "register":
      default:
        return styles.registerButton;
    }
  };

  // Decide which text style to use
  const getTextStyle = (): StyleProp<TextStyle> => {
    switch (type) {
      case "cancel":
        return styles.cancelText;
      case "waitlist":
        return styles.waitlistText;
      case "register":
      default:
        return styles.registerText;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, getButtonStyle()]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <View style={styles.content}>
        {iconName && (
          <MaterialIcons
            name={iconName}
            size={20}
            color={theme.colors.primary}
            style={styles.icon}
          />
        )}
        <Text style={getTextStyle()}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default ActionButton;

// 4) Define the styles
const styles = StyleSheet.create({
  button: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 8,
  },
  registerButton: {
    backgroundColor: theme.colors.primaryLight,
  },
  cancelButton: {
    backgroundColor: theme.colors.errorLight,
  },
  waitlistButton: {
    backgroundColor: theme.colors.warningLight,
  },
  registerText: {
    color: theme.colors.primary,
    fontWeight: "500",
  },
  cancelText: {
    color: theme.colors.error,
    fontWeight: "500",
  },
  waitlistText: {
    color: theme.colors.warning,
    fontWeight: "500",
  },
});
