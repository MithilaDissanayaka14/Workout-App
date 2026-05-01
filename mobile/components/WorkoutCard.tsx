import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { WorkoutSession } from '@/storage/workoutStorage';
import { ChevronRight, Calendar } from 'lucide-react-native';

interface WorkoutCardProps {
  workout: WorkoutSession;
  onPress: () => void;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({ workout, onPress }) => {
  const date = new Date(workout.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <TouchableOpacity 
      onPress={onPress}
      className="bg-[#1c1c1e] rounded-2xl p-5 mb-4 shadow-sm flex-row items-center justify-between border border-gray-800"
      activeOpacity={0.7}
    >
      <View className="flex-1">
        <View className="flex-row items-center mb-2">
          <View className="bg-gray-800 p-2 rounded-lg mr-3">
            <Calendar size={18} color="#4facfe" />
          </View>
          <Text className="text-gray-400 font-medium">{date}</Text>
        </View>
        <Text className="text-white text-lg font-bold">
          {workout.exercises.length} Exercises
        </Text>
        <Text className="text-[#4facfe] font-semibold mt-1">
          Total Volume: {workout.totalVolume} kg
        </Text>
      </View>
      <ChevronRight size={24} color="#6b7280" />
    </TouchableOpacity>
  );
};
