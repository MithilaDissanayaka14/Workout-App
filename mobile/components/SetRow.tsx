import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Trash2 } from 'lucide-react-native';

interface SetRowProps {
  setNumber: number;
  weight: string;
  reps: string;
  onWeightChange: (val: string) => void;
  onRepsChange: (val: string) => void;
  onDelete: () => void;
  isPR?: boolean;
}

export const SetRow: React.FC<SetRowProps> = ({ 
  setNumber, 
  weight, 
  reps, 
  onWeightChange, 
  onRepsChange, 
  onDelete,
  isPR 
}) => {
  return (
    <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
      <View className="flex-row items-center flex-1">
        <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center mr-3">
          <Text className="text-blue-600 font-bold">{setNumber}</Text>
        </View>
        <View className="flex-1 flex-row">
          <TextInput
            className="flex-1 bg-gray-50 p-2 rounded-lg text-center font-semibold text-gray-800"
            placeholder="kg"
            keyboardType="numeric"
            value={weight}
            onChangeText={onWeightChange}
          />
          <Text className="mx-2 self-center text-gray-400">×</Text>
          <TextInput
            className="flex-1 bg-gray-50 p-2 rounded-lg text-center font-semibold text-gray-800"
            placeholder="reps"
            keyboardType="numeric"
            value={reps}
            onChangeText={onRepsChange}
          />
        </View>
      </View>
      
      <TouchableOpacity onPress={onDelete} className="ml-4 p-2">
        <Trash2 size={20} color="#EF4444" opacity={0.6} />
      </TouchableOpacity>
    </View>
  );
};
