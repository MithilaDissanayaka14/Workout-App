import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Trophy, ArrowRight, Scale, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react-native';
import { getWorkouts, getBodyStats, saveBodyWeight, WorkoutSession, BodyStat } from '@/storage/workoutStorage';
import { LinearGradient as LinearGradientBase } from 'expo-linear-gradient';

const LinearGradient = LinearGradientBase as unknown as React.ComponentType<any>;

export default function WorkoutSummaryScreen() {
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const [workout, setWorkout] = useState<WorkoutSession | null>(null);
  const [previousWeight, setPreviousWeight] = useState<number | null>(null);
  const [newWeightStr, setNewWeightStr] = useState('');
  const [savedWeight, setSavedWeight] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const workouts = await getWorkouts();
      const currentWorkout = workouts.find(w => w.id === workoutId);
      if (currentWorkout) {
        setWorkout(currentWorkout);
      }

      const stats = await getBodyStats();
      if (stats.length > 0) {
        setPreviousWeight(stats[0].weight);
      }
    };
    loadData();
  }, [workoutId]);

  const handleSaveWeight = async () => {
    const weight = parseFloat(newWeightStr);
    if (!isNaN(weight) && weight > 0) {
      await saveBodyWeight(weight);
      setSavedWeight(weight);
    }
  };

  const getWeightDifference = () => {
    if (!previousWeight || !savedWeight) return null;
    const diff = savedWeight - previousWeight;
    return diff;
  };

  const difference = getWeightDifference();

  return (
    <View className="flex-1 bg-slate-50">
      <LinearGradient
        colors={['#3B82F6', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-20 pb-10 px-6 items-center rounded-b-[40px] shadow-lg"
      >
        <View className="bg-white/20 w-20 h-20 rounded-full items-center justify-center mb-4">
          <Trophy size={40} color="white" />
        </View>
        <Text className="text-white text-3xl font-extrabold mb-1">Workout Complete!</Text>
        <Text className="text-blue-100 text-lg font-medium">Great job crushing your goals today.</Text>
      </LinearGradient>

      <ScrollView className="flex-1 px-6 -mt-4">
        {workout && (
          <View className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-6 flex-row justify-between">
            <View className="flex-1 items-center border-r border-gray-100">
              <Text className="text-gray-400 font-bold mb-1">Total Volume</Text>
              <Text className="text-2xl font-black text-gray-800">{workout.totalVolume} kg</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-gray-400 font-bold mb-1">Exercises</Text>
              <Text className="text-2xl font-black text-gray-800">{workout.exercises.length}</Text>
            </View>
          </View>
        )}

        <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
          <View className="flex-row items-center mb-4">
            <View className="bg-purple-100 p-2 rounded-xl mr-3">
              <Scale size={24} color="#8B5CF6" />
            </View>
            <Text className="text-xl font-bold text-gray-800">Post-Workout Weigh-In</Text>
          </View>

          {previousWeight !== null && (
            <Text className="text-gray-500 font-medium mb-4">
              Previous weight: <Text className="text-gray-800 font-bold">{previousWeight} kg</Text>
            </Text>
          )}

          {savedWeight === null ? (
            <View className="flex-row">
              <TextInput
                className="flex-1 bg-gray-50 p-4 rounded-2xl font-bold text-lg text-gray-800 mr-3 border border-gray-100"
                placeholder="New weight (kg)"
                keyboardType="numeric"
                value={newWeightStr}
                onChangeText={setNewWeightStr}
              />
              <TouchableOpacity 
                className="bg-blue-600 px-6 rounded-2xl items-center justify-center shadow-md shadow-blue-200"
                onPress={handleSaveWeight}
              >
                <Text className="text-white font-bold text-lg">Log</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="bg-green-50 p-4 rounded-2xl border border-green-100 items-center">
              <View className="flex-row items-center mb-2">
                <CheckCircle size={24} color="#10B981" />
                <Text className="text-green-600 font-bold text-lg ml-2">Weight Logged!</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-2xl font-black text-gray-800 mr-3">{savedWeight} kg</Text>
                {difference !== null && difference !== 0 && (
                  <View className={`flex-row items-center px-2 py-1 rounded-lg ${difference > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                    {difference > 0 ? <TrendingUp size={16} color="#EF4444" /> : <TrendingDown size={16} color="#10B981" />}
                    <Text className={`font-bold ml-1 ${difference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {Math.abs(difference).toFixed(1)} kg
                    </Text>
                  </View>
                )}
                {difference === 0 && (
                  <View className="bg-gray-200 px-2 py-1 rounded-lg">
                    <Text className="font-bold text-gray-600">No change</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity 
          className="bg-gray-900 p-5 rounded-2xl flex-row items-center justify-center shadow-md mb-8"
          onPress={() => router.navigate('/home')}
        >
          <Text className="text-white font-bold text-lg mr-2">Back to Dashboard</Text>
          <ArrowRight size={20} color="white" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
