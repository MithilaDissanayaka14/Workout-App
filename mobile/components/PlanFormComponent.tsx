import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedButton from './AnimatedButton';

export interface Exercise {
  day: string;
  exerciseName: string;
  sets: number;
  repsOrDuration: string;
}

export interface PlanData {
  planName: string;
  goal: string;
  durationWeeks: string;
  daysPerWeek: string;
  exercises: Exercise[];
}

interface PlanFormComponentProps {
  initialData?: PlanData;
  onSubmit: (data: PlanData) => void;
  isLoading: boolean;
  buttonText: string;
}

interface DayGroup {
  dayName: string;
  exercises: Omit<Exercise, 'day'>[];
}

export default function PlanFormComponent({ initialData, onSubmit, isLoading, buttonText }: PlanFormComponentProps) {
  const [planName, setPlanName] = useState(initialData?.planName || '');
  const [goal, setGoal] = useState(initialData?.goal || 'Weight Loss');
  const [durationWeeks, setDurationWeeks] = useState(initialData?.durationWeeks || '');
  const [daysPerWeek, setDaysPerWeek] = useState(initialData?.daysPerWeek || '');
  
  const defaultGoals = ['Weight Loss', 'Muscle Gain', 'Maintenance'];
  const [isCustomGoal, setIsCustomGoal] = useState(
    initialData?.goal ? !defaultGoals.includes(initialData.goal) : false
  );

  const initializeGroups = (): DayGroup[] => {
    if (!initialData?.exercises || initialData.exercises.length === 0) {
      return [{ dayName: 'Day 1', exercises: [{ exerciseName: '', sets: 3, repsOrDuration: '10 reps' }] }];
    }
    const groups: Record<string, Omit<Exercise, 'day'>[]> = {};
    initialData.exercises.forEach(ex => {
      if (!groups[ex.day]) groups[ex.day] = [];
      groups[ex.day].push({ exerciseName: ex.exerciseName, sets: ex.sets, repsOrDuration: ex.repsOrDuration });
    });
    return Object.keys(groups).map((dayName) => ({
      dayName,
      exercises: groups[dayName]
    }));
  };

  const [dayGroups, setDayGroups] = useState<DayGroup[]>(initializeGroups());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (flatExercises: Exercise[]) => {
    const newErrors: Record<string, string> = {};
    if (!planName.trim()) newErrors.planName = 'Plan Name is required';
    if (isCustomGoal && !goal.trim()) newErrors.goal = 'Custom goal is required';
    if (!durationWeeks || isNaN(Number(durationWeeks)) || Number(durationWeeks) < 1) newErrors.durationWeeks = 'Enter valid weeks';
    if (!daysPerWeek || isNaN(Number(daysPerWeek)) || Number(daysPerWeek) < 1 || Number(daysPerWeek) > 7) newErrors.daysPerWeek = 'Enter 1-7 days';
    if (flatExercises.length === 0) newErrors.exercises = 'At least one exercise is required';
    
    // Check if any day group has no name
    const missingDayNames = dayGroups.some(g => !g.dayName.trim());
    if (missingDayNames) newErrors.exercises = 'All day headers must have a name';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddDayGroup = () => {
    setDayGroups([...dayGroups, { dayName: `Day ${dayGroups.length + 1}`, exercises: [{ exerciseName: '', sets: 3, repsOrDuration: '10 reps' }] }]);
  };

  const handleRemoveDayGroup = (gIndex: number) => {
    const updated = [...dayGroups];
    updated.splice(gIndex, 1);
    setDayGroups(updated);
  };

  const updateDayName = (gIndex: number, newName: string) => {
    const updated = [...dayGroups];
    updated[gIndex].dayName = newName;
    setDayGroups(updated);
  };

  const handleAddExerciseToGroup = (gIndex: number) => {
    const updated = [...dayGroups];
    updated[gIndex].exercises.push({ exerciseName: '', sets: 3, repsOrDuration: '10 reps' });
    setDayGroups(updated);
  };

  const updateExercise = (gIndex: number, exIndex: number, field: keyof Omit<Exercise, 'day'>, value: any) => {
    const updated = [...dayGroups];
    updated[gIndex].exercises[exIndex] = { ...updated[gIndex].exercises[exIndex], [field]: value };
    setDayGroups(updated);
  };

  const removeExercise = (gIndex: number, exIndex: number) => {
    const updated = [...dayGroups];
    updated[gIndex].exercises.splice(exIndex, 1);
    // If no exercises left in the group, we could automatically remove the group,
    // but maybe the user just wants to replace the exercise. Let's just remove the entry.
    setDayGroups(updated);
  };

  const handleSubmit = () => {
    const flatExercises: Exercise[] = [];
    dayGroups.forEach(group => {
      // only map if dayName has a value
      const dName = group.dayName.trim() || `Unnamed Day`;
      group.exercises.forEach(ex => {
        flatExercises.push({
          day: dName,
          exerciseName: ex.exerciseName,
          sets: ex.sets,
          repsOrDuration: ex.repsOrDuration
        });
      });
    });

    if (validate(flatExercises)) {
      onSubmit({ planName, goal, durationWeeks, daysPerWeek, exercises: flatExercises });
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Plan Details</Text>
        
        <Text style={styles.label}>Plan Name</Text>
        <TextInput
          style={[styles.input, errors.planName && styles.inputError]}
          placeholder="e.g. Summer Shred"
          value={planName}
          onChangeText={setPlanName}
        />
        {errors.planName && <Text style={styles.errorText}>{errors.planName}</Text>}

        <Text style={styles.label}>Goal</Text>
        <View style={styles.goalRow}>
          {defaultGoals.map((g) => (
            <TouchableOpacity 
              key={g} 
              style={[styles.goalBtn, goal === g && !isCustomGoal && styles.goalBtnActive]}
              onPress={() => { setGoal(g); setIsCustomGoal(false); }}
            >
              <Text style={[styles.goalBtnText, goal === g && !isCustomGoal && styles.goalBtnTextActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity 
            style={[styles.goalBtn, isCustomGoal && styles.goalBtnActive]}
            onPress={() => { setIsCustomGoal(true); setGoal(''); }}
          >
            <Text style={[styles.goalBtnText, isCustomGoal && styles.goalBtnTextActive]}>Custom</Text>
          </TouchableOpacity>
        </View>
        
        {isCustomGoal && (
          <TextInput
            style={[styles.input, { marginTop: 10 }, errors.goal && styles.inputError]}
            placeholder="Type your custom goal..."
            value={goal}
            onChangeText={setGoal}
          />
        )}
        {errors.goal && <Text style={styles.errorText}>{errors.goal}</Text>}

        <View style={styles.row}>
          <View style={styles.halfCol}>
            <Text style={styles.label}>Duration (Weeks)</Text>
            <TextInput
              style={[styles.input, errors.durationWeeks && styles.inputError]}
              placeholder="e.g. 12"
              keyboardType="numeric"
              value={durationWeeks}
              onChangeText={setDurationWeeks}
            />
            {errors.durationWeeks && <Text style={styles.errorText}>{errors.durationWeeks}</Text>}
          </View>
          <View style={styles.halfCol}>
            <Text style={styles.label}>Days/Week</Text>
            <TextInput
              style={[styles.input, errors.daysPerWeek && styles.inputError]}
              placeholder="e.g. 5"
              keyboardType="numeric"
              value={daysPerWeek}
              onChangeText={setDaysPerWeek}
            />
            {errors.daysPerWeek && <Text style={styles.errorText}>{errors.daysPerWeek}</Text>}
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.exercisesHeaderRow}>
          <Text style={styles.sectionTitle}>Workout Regimen</Text>
          <AnimatedButton onPress={handleAddDayGroup} style={styles.addExerciseBtn}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.addExerciseBtnText}>Add Day</Text>
          </AnimatedButton>
        </View>
        {errors.exercises && <Text style={styles.errorText}>{errors.exercises}</Text>}

        {dayGroups.map((group, gIdx) => (
          <View key={gIdx} style={styles.dayGroupContainer}>
            <View style={styles.dayGroupHeader}>
              <View style={styles.dayGroupHeaderInput}>
                <Ionicons name="calendar-outline" size={18} color="#757575" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.dayGroupNameInput}
                  value={group.dayName}
                  onChangeText={(val) => updateDayName(gIdx, val)}
                  placeholder="e.g. Day 1 - Push"
                />
              </View>
              <TouchableOpacity onPress={() => handleRemoveDayGroup(gIdx)}>
                <Ionicons name="trash-outline" size={20} color="#FF5252" />
              </TouchableOpacity>
            </View>

            {group.exercises.map((ex, exIdx) => (
              <View key={exIdx} style={styles.exerciseBlock}>
                <View style={styles.exerciseBlockHeader}>
                  <Text style={styles.exerciseIndex}>Exercise {exIdx + 1}</Text>
                  <TouchableOpacity onPress={() => removeExercise(gIdx, exIdx)}>
                    <Ionicons name="close-circle-outline" size={20} color="#9E9E9E" />
                  </TouchableOpacity>
                </View>

                <View style={styles.row}>
                  <View style={[styles.halfCol, { flex: 1 }]}>
                    <Text style={styles.labelSmall}>Name</Text>
                    <TextInput
                      style={styles.inputSmall}
                      placeholder="e.g. Bench Press"
                      value={ex.exerciseName}
                      onChangeText={(val) => updateExercise(gIdx, exIdx, 'exerciseName', val)}
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.halfCol}>
                    <Text style={styles.labelSmall}>Sets</Text>
                    <TextInput
                      style={styles.inputSmall}
                      keyboardType="numeric"
                      value={String(ex.sets)}
                      onChangeText={(val) => updateExercise(gIdx, exIdx, 'sets', val.replace(/[^0-9]/g, '') || 1)}
                    />
                  </View>
                  <View style={styles.halfCol}>
                    <Text style={styles.labelSmall}>Reps/Duration</Text>
                    <TextInput
                      style={styles.inputSmall}
                      placeholder="e.g. 10 reps"
                      value={ex.repsOrDuration}
                      onChangeText={(val) => updateExercise(gIdx, exIdx, 'repsOrDuration', val)}
                    />
                  </View>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.addExBtnOutline} onPress={() => handleAddExerciseToGroup(gIdx)}>
              <Ionicons name="add" size={16} color="#000" />
              <Text style={styles.addExBtnOutlineText}>Add Exercise</Text>
            </TouchableOpacity>
          </View>
        ))}

      </View>

      <AnimatedButton 
        style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]} 
        onPress={handleSubmit}
        disabled={isLoading}
      >
        <Text style={styles.primaryButtonText}>{isLoading ? 'Saving...' : buttonText}</Text>
      </AnimatedButton>
      
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
    marginBottom: 15,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#757575',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F7F7F9',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: '#2D2E49',
    fontWeight: '500',
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#FF5252',
  },
  errorText: {
    color: '#FF5252',
    fontSize: 12,
    marginTop: 5,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  halfCol: {
    flex: 0.48,
  },
  goalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
    gap: 8,
  },
  goalBtn: {
    backgroundColor: '#F7F7F9',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  goalBtnActive: {
    backgroundColor: '#000',
  },
  goalBtnText: {
    color: '#757575',
    fontSize: 13,
    fontWeight: '600',
  },
  goalBtnTextActive: {
    color: '#fff',
  },
  exercisesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addExerciseBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  dayGroupContainer: {
    backgroundColor: '#FCFCFC',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  dayGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    paddingBottom: 10,
  },
  dayGroupHeaderInput: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 15,
  },
  dayGroupNameInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    paddingVertical: 0,
  },
  addExBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#000',
    borderStyle: 'dashed',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 5,
  },
  addExBtnOutlineText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 5,
  },
  exerciseBlock: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  exerciseBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  exerciseIndex: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9E9E9E',
    marginBottom: 4,
  },
  inputSmall: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#2D2E49',
  },
  primaryButton: {
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    marginHorizontal: 5,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
