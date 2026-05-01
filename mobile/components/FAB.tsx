import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Plus } from 'lucide-react-native';

interface FABProps {
  onPress: () => void;
  icon?: React.ReactNode;
}

export const FAB: React.FC<FABProps> = ({ onPress, icon }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.fab}
      className="bg-blue-500 rounded-full items-center justify-center shadow-lg"
    >
      {icon || <Plus size={30} color="white" />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 64,
    height: 64,
    elevation: 5,
  },
});
