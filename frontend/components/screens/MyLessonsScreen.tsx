// src/components/screens/MyLessonsScreen.tsx
import React, { useCallback, useEffect } from "react";
import {
  SafeAreaView,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  View,
  Text,
  Alert,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { theme } from "@/theme/theme";
import { useUserLessons, MappedLesson } from "@/hooks/useUserLessons";
import LessonCard from "../custom/LessonCard";

const MyLessonsScreen: React.FC = () => {
  const { userId, userRole } = useAuth();
  const { lessons, loading, error } = useUserLessons(
    userId!,
    userRole as "swimmer" | "instructor"
  );

  useEffect(() => {
    if (error) {
      console.error("Error fetching lessons:", error);
      Alert.alert("שגיאה", "אירעה שגיאה בטעינת השיעורים");
    }
  }, [error]);

  const renderItem = useCallback(
    ({ item }: { item: MappedLesson }) => (
      <LessonCard
        lesson={item}
        onViewDetails={(lesson) =>
          Alert.alert("פרטי שיעור", JSON.stringify(lesson, null, 2))
        }
      />
    ),
    []
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} />
      ) : (
        <FlatList
          data={lessons}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>אין שיעורים</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  emptyContainer: {
    padding: 16,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
  },
});

export default MyLessonsScreen;
