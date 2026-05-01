import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { GradientHeader } from '@/components/GradientHeader';
import { WorkoutCard } from '@/components/WorkoutCard';
import { FAB } from '@/components/FAB';
import { getWorkouts, WorkoutSession, getWeeklyInsights, getTemplates, WorkoutTemplate } from '@/storage/workoutStorage';
import { router } from 'expo-router';
import { Flame, Play, Trophy, TrendingUp, TrendingDown } from 'lucide-react-native';

export default function HomeScreen() {
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutSession[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [streak, setStreak] = useState(5); // Mock streak
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);

  const loadData = async () => {
    const workouts = await getWorkouts();
    setRecentWorkouts(workouts.slice(0, 5));
    const weeklyInsights = await getWeeklyInsights();
    setInsights(weeklyInsights);
    const loadedTemplates = await getTemplates();
    setTemplates(loadedTemplates);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <View className="flex-1 bg-[#000000]">
      <ScrollView 
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <GradientHeader 
          title="Hello, Champ! 👋" 
          subtitle="Ready for today's session?" 
        />

        <View className="px-6 -mt-10">
          {/* Streak & Consistency Indicator */}
          <View className="bg-[#1c1c1e] rounded-2xl p-6 shadow-sm border border-gray-800 flex-row items-center justify-between mb-6">
            <View>
              <View className="flex-row items-center">
                <Flame size={24} color="#F59E0B" fill="#F59E0B" />
                <Text className="text-2xl font-bold text-white ml-2">{streak} Day Streak</Text>
              </View>
              <View className="flex-row items-center mt-1">
                {insights && (
                  <>
                    {insights.isIncreasing ? (
                      <TrendingUp size={16} color="#10B981" />
                    ) : (
                      <TrendingDown size={16} color="#EF4444" />
                    )}
                    <Text className={`text-sm font-semibold ml-1 ${insights.isIncreasing ? 'text-green-500' : 'text-red-500'}`}>
                      {insights.volumeChange}% volume vs last week
                    </Text>
                  </>
                )}
              </View>
            </View>
            <View className="bg-gray-800 h-16 w-16 rounded-full items-center justify-center">
              <Trophy size={28} color="#4facfe" />
            </View>
          </View>

          {/* Quick Start Button */}
          <TouchableOpacity 
            className="bg-[#4facfe] rounded-2xl p-6 shadow-md flex-row items-center justify-center mb-8"
            activeOpacity={0.9}
            onPress={() => router.push('/workout')}
          >
            <Play size={24} color="white" fill="white" />
            <Text className="text-white text-xl font-bold ml-3">Start Workout</Text>
          </TouchableOpacity>

          {/* Templates Section */}
          <View className="mb-4">
            <Text className="text-xl font-bold text-white mb-3">Your Templates</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6 pb-2">
              {templates.map(template => (
                <TouchableOpacity
                  key={template.id}
                  className="bg-[#1c1c1e] border border-gray-800 rounded-2xl p-4 mr-4 shadow-sm w-48"
                  activeOpacity={0.8}
                  onPress={() => router.push(`/workout?templateId=${template.id}`)}
                >
                  <View className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center mb-3">
                    <Flame size={20} color="#4facfe" />
                  </View>
                  <Text className="font-bold text-white text-lg">{template.name}</Text>
                  <Text className="text-gray-400 text-sm">{template.exercises.length} exercises</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Recent Workouts */}
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-white">Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/gym/progress' as any)}>
              <Text className="text-[#4facfe] font-semibold">See All</Text>
            </TouchableOpacity>
          </View>

          {recentWorkouts.length > 0 ? (
            recentWorkouts.map((workout) => (
              <WorkoutCard 
                key={workout.id} 
                workout={workout} 
                onPress={() => {}} // Could navigate to details
              />
            ))
          ) : (
            <View className="bg-white rounded-2xl p-10 items-center border border-dashed border-gray-200">
              <Text className="text-gray-400 font-medium">No workouts yet. Start one!</Text>
            </View>
          )}
        </View>
        
        {/* Padding for FAB */}
        <View className="h-24" />
      </ScrollView>

      <FAB onPress={() => router.push('/workout')} />
    </View>
  );
}
