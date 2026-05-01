import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient as LinearGradientBase } from 'expo-linear-gradient';

const LinearGradient = LinearGradientBase as unknown as React.ComponentType<any>;

interface GradientHeaderProps {
  title: string;
  subtitle?: string;
}

export const GradientHeader: React.FC<GradientHeaderProps> = ({ title, subtitle }) => {
  return (
    <LinearGradient
      colors={['#000000', '#1a1a1a', '#f8fafc']}
      style={styles.header}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <View className="pt-16 px-6 pb-8">
        <Text className="text-white text-3xl font-bold">{title}</Text>
        {subtitle && <Text className="text-gray-300 text-lg mt-1">{subtitle}</Text>}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 20,
  },
});
