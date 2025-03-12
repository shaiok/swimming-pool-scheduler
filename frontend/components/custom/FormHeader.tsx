import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Svg, Path, Circle } from "react-native-svg";

interface FormHeaderProps {
  title: string;
  subtitle?: string;
}

export const FormHeader: React.FC<FormHeaderProps> = ({ title, subtitle }) => {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Svg
          width={64}
          height={64}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path d="M3 7h3M14 7h7M6 7c0 3-2 4-2 7M18 7c0 3 2 4 2 7M7.5 12c1-3 2.5-4 4.5-4 2 0 3.5 1 4.5 4" />
        </Svg>
      </View>

      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
});
