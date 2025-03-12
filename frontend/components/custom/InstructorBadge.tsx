

import React from 'react';
import { View, Text, Image, StyleSheet, ImageSourcePropType } from 'react-native';
import { theme } from '../../theme/theme';

// Define the props interface
interface InstructorBadgeProps {
  name: string;
  image?: ImageSourcePropType;
}

const InstructorBadge: React.FC<InstructorBadgeProps> = ({ name, image }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{name}</Text>
      <View style={styles.avatar}>
        {image ? <Image source={image} style={styles.avatarImage} /> : null}
      </View>
    </View>
  );
};

export default InstructorBadge;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  name: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.xs,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ccc',
    marginLeft: theme.spacing.xs,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
});
