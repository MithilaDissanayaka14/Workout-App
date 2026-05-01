import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Plus, Save, Timer, ChevronDown } from 'lucide-react-native';
import { SetRow } from '@/components/SetRow';
import { saveWorkout, WorkoutSession, Exercise, WorkoutSet, getSuggestedWeight, getTemplates, saveTemplate, WorkoutTemplate } from '@/storage/workoutStorage';
import { LinearGradient as LinearGradientBase } from 'expo-linear-gradient';

const LinearGradient = LinearGradientBase as unknown as React.ComponentType<any>;

export default function WorkoutScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([
    { id: '1', name: 'Bench Press', sets: [{ id: 's1', weight: 60, reps: 10 }] }
  ]);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const { templateId } = useLocalSearchParams<{ templateId: string }>();
  const [templateName, setTemplateName] = useState('');

  useEffect(() => {
    if (templateId) {
      const loadTemplate = async () => {
        const templates = await getTemplates();
        const template = templates.find(t => t.id === templateId);
        if (template) {
          const loadedExercises: Exercise[] = template.exercises.map((te, index) => ({
            id: Date.now().toString() + index,
            name: te.name,
            sets: Array.from({ length: te.sets }).map((_, sIndex) => ({
              id: Date.now().toString() + index + sIndex,
              weight: 0,
              reps: te.reps
            }))
          }));
          setExercises(loadedExercises);
        }
      };
      loadTemplate();
    }
  }, [templateId]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const addExercise = async () => {
    const defaultName = 'New Exercise';
    const suggestedWeight = await getSuggestedWeight(defaultName);
    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: defaultName,
      sets: [{ id: Date.now().toString() + '-s', weight: suggestedWeight || 0, reps: 0 }]
    };
    setExercises([...exercises, newExercise]);
  };

  const addSet = (exerciseId: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        const lastSet = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [...ex.sets, { 
            id: Date.now().toString(), 
            weight: lastSet?.weight || 0, 
            reps: lastSet?.reps || 0 
          }]
        };
      }
      return ex;
    }));
  };

  const updateSet = (exerciseId: string, setId: string, field: 'weight' | 'reps', value: string) => {
    const numValue = parseFloat(value) || 0;
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: numValue } : s)
        };
      }
      return ex;
    }));
  };

  const deleteSet = (exerciseId: string, setId: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.filter(s => s.id !== setId)
        };
      }
      return ex;
    }));
  };

  const updateExerciseName = (id: string, name: string) => {
    setExercises(exercises.map(ex => ex.id === id ? { ...ex, name } : ex));
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      return Alert.alert('Error', 'Please enter a template name');
    }
    const template: WorkoutTemplate = {
      id: Date.now().toString(),
      name: templateName.trim(),
      exercises: exercises.map(ex => ({
        name: ex.name,
        sets: ex.sets.length,
        reps: ex.sets[0]?.reps || 0
      }))
    };
    
    const success = await saveTemplate(template);
    if (success) {
      Alert.alert('Success', 'Template saved successfully!');
      setTemplateName('');
    }
  };

  const finishWorkout = async () => {
    const totalVolume = exercises.reduce((acc, ex) => 
      acc + ex.sets.reduce((sAcc, s) => sAcc + (s.weight * s.reps), 0), 0
    );

    const session: WorkoutSession = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      exercises,
      totalVolume
    };

    const success = await saveWorkout(session);
    if (success) {
      router.replace({
        pathname: '/gym/workout-summary' as any,
        params: { workoutId: session.id }
      });
    }
  };

  return (
    <View className="flex-1 bg-white">
      <LinearGradient
        colors={['#3B82F6', '#60A5FA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="pt-16 pb-6 px-6 flex-row items-center justify-between"
      >
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Active Workout</Text>
        <TouchableOpacity 
          onPress={() => setIsTimerRunning(!isTimerRunning)}
          className="flex-row items-center bg-white/20 px-3 py-1.5 rounded-full"
        >
          <Timer size={18} color="white" />
          <Text className="text-white font-mono ml-2">{formatTime(timer)}</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView className="flex-1 px-6 pt-6">
        {exercises.map((exercise, exIndex) => (
          <View key={exercise.id} className="mb-8 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
            <View className="flex-row items-center justify-between mb-4">
              <TextInput
                className="text-xl font-bold text-gray-800 flex-1"
                value={exercise.name}
                onChangeText={(val) => updateExerciseName(exercise.id, val)}
                placeholder="Exercise Name"
              />
              <ChevronDown size={20} color="#94A3B8" />
            </View>

            <View className="flex-row px-2 mb-2">
              <Text className="w-8 text-gray-400 font-bold">Set</Text>
              <View className="flex-row flex-1 ml-3">
                <Text className="flex-1 text-center text-gray-400 font-bold">kg</Text>
                <View className="w-8" />
                <Text className="flex-1 text-center text-gray-400 font-bold">Reps</Text>
              </View>
              <View className="w-12" />
            </View>

            {exercise.sets.map((set, sIndex) => (
              <SetRow
                key={set.id}
                setNumber={sIndex + 1}
                weight={set.weight.toString()}
                reps={set.reps.toString()}
                onWeightChange={(val) => updateSet(exercise.id, set.id, 'weight', val)}
                onRepsChange={(val) => updateSet(exercise.id, set.id, 'reps', val)}
                onDelete={() => deleteSet(exercise.id, set.id)}
              />
            ))}

            <TouchableOpacity 
              className="mt-4 flex-row items-center justify-center py-2 bg-blue-50 rounded-xl"
              onPress={() => addSet(exercise.id)}
            >
              <Plus size={20} color="#3B82F6" />
              <Text className="text-blue-600 font-bold ml-2">Add Set</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity 
          className="border-2 border-dashed border-gray-200 rounded-2xl p-6 items-center mb-8"
          onPress={addExercise}
        >
          <View className="bg-gray-100 p-3 rounded-full mb-2">
            <Plus size={24} color="#94A3B8" />
          </View>
          <Text className="text-gray-400 font-bold">Add Exercise</Text>
        </TouchableOpacity>

        <View className="bg-blue-50 rounded-2xl p-4 mb-6 border border-blue-100">
          <Text className="font-bold text-blue-800 mb-2">Save as Template</Text>
          <View className="flex-row">
            <TextInput
              className="flex-1 bg-white p-3 rounded-xl border border-blue-100 mr-2 font-semibold text-gray-800"
              placeholder="e.g. Push Day"
              value={templateName}
              onChangeText={setTemplateName}
            />
            <TouchableOpacity 
              className="bg-blue-600 px-4 rounded-xl justify-center items-center shadow-sm shadow-blue-200"
              onPress={handleSaveTemplate}
            >
              <Text className="text-white font-bold">Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          className="bg-blue-600 rounded-2xl p-5 items-center flex-row justify-center mb-12 shadow-lg shadow-blue-200"
          onPress={finishWorkout}
        >
          <Save size={24} color="white" />
          <Text className="text-white text-xl font-bold ml-3">Finish Workout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
