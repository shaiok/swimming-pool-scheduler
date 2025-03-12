

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '../../theme/theme';

// 1) Define the shape of the props
interface DateSelectorProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  dateRange?: number; // optional, defaults to 7
}

// 2) Define an internal type for our array items
interface DateItem {
  date: Date;
  day: string;
  name: string;
}

// 3) Create the component as a React.FC (functional component)
const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDate,
  onDateSelect,
  dateRange = 7,
}) => {
  // Helper to return an array of dates
  const getDates = (): DateItem[] => {
    const dates: DateItem[] = [];
    const today = new Date();

    for (let i = 0; i < dateRange; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);

      dates.push({
        date,
        day: date.getDate().toString().padStart(2, '0'),
        name: getDayName(date),
      });
    }
    return dates;
  };

  // Helper to get the Hebrew name of the weekday
  const getDayName = (date: Date): string => {
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    return days[date.getDay()];
  };

  // Helper to check if the date is selected
  const isSelected = (date: Date): boolean => {
    return selectedDate.toDateString() === date.toDateString();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {getDates().map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dateItem,
              isSelected(item.date) && styles.selectedDateItem,
            ]}
            onPress={() => onDateSelect(item.date)}
          >
            <Text
              style={[
                styles.dateDay,
                isSelected(item.date) && styles.selectedText,
              ]}
            >
              {item.day}
            </Text>
            <Text
              style={[
                styles.dateName,
                isSelected(item.date) && styles.selectedText,
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default DateSelector;

// 4) Styles
const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    paddingVertical: theme.spacing.sm,
  },
  scrollView: {
    flexDirection: 'row',
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
  },
  dateItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    minWidth: 60,
  },
  selectedDateItem: {
    backgroundColor: theme.colors.text,
  },
  dateDay: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  dateName: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  selectedText: {
    color: theme.colors.card,
  },
});
