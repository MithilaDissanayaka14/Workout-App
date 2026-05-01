import React, { useRef } from 'react';
import { 
  Animated, 
  TouchableWithoutFeedback, 
  StyleSheet, 
  ViewStyle, 
  StyleProp, 
  Platform 
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface AnimatedButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export default function AnimatedButton({ onPress, children, style, disabled }: AnimatedButtonProps) {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 200,
      bounciness: 10,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 15,
      bounciness: 8,
    }).start();
  };

  const handlePress = () => {
    if (disabled) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    onPress();
  };

  return (
    <TouchableWithoutFeedback 
      onPressIn={handlePressIn} 
      onPressOut={handlePressOut} 
      onPress={handlePress}
      disabled={disabled}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleValue }] }]}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({});
