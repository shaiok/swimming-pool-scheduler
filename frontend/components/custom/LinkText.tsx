// src/components/common/LinkText.tsx
import React from "react";
import { Text, StyleSheet, TouchableOpacity } from "react-native";

interface LinkTextProps {
  text: string;
  onPress: () => void;
  bold?: boolean;
}

export const LinkText: React.FC<LinkTextProps> = ({
  text,
  onPress,
  bold = false,
}) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.link, bold && styles.boldLink]}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  link: {
    color: "#2196F3",
    fontSize: 16,
  },
  boldLink: {
    fontWeight: "bold",
  },
});
