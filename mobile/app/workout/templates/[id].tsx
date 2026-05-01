import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WORKOUT_TEMPLATES } from '@/constants/templates';
import { API_BASE_URL } from '@/constants/api';
import AnimatedButton from '../../../components/AnimatedButton';

export default function TemplateDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [template, setTemplate] = useState<any>(null);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Find the template across categories
    const allTemplates = [...WORKOUT_TEMPLATES.beginner, ...WORKOUT_TEMPLATES.intermediate];
    const found = allTemplates.find(t => t.id === id);
    if (found) {
      setTemplate(found);
    } else {
      Alert.alert('Error', 'Template not found');
      router.back();
    }
  }, [id]);

  const handleSaveToMyPlans = async () => {
    if (!template) return;
    try {
      setSaving(true);
      const payload = {
        planName: `${template.planName} (Copy)`,
        goal: template.goal,
        durationWeeks: template.durationWeeks,
        daysPerWeek: template.daysPerWeek,
        exercises: template.exercises
      };

      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_BASE_URL}/api/workouts`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      
      if (response.ok && data.plan && data.plan._id) {
        Alert.alert('Success', 'Plan saved to your library!');
        // Redirect to edit mode of the newly cloned plan
        router.replace(`/workout/${data.plan._id}?edit=true`);
      } else {
        Alert.alert('Error', data.error || 'Failed to save the plan.');
      }
    } catch (error) {
      console.error('Failed to clone plan:', error);
      Alert.alert('Error', 'Could not connect to server.');
    } finally {
      setSaving(false);
    }
  };

  if (!template) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // Group exercises by Day
  const groupedExercises = template.exercises.reduce((acc: any, ex: any) => {
    if (!acc[ex.day]) acc[ex.day] = [];
    acc[ex.day].push(ex);
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Template Overview</Text>
        <View style={styles.headerActions}>
           <Ionicons name="lock-closed-outline" size={20} color="#9E9E9E" />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.overviewCard}>
          <Text style={styles.planNameTitle}>{template.planName}</Text>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Goal</Text>
              <Text style={styles.statValue}>{template.goal}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Duration</Text>
              <Text style={styles.statValue}>{template.durationWeeks} Wks</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Days</Text>
              <Text style={styles.statValue}>{template.daysPerWeek} / Wk</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionHeader}>Day-wise Breakdown</Text>
        
        {Object.keys(groupedExercises).map((dayGroup: string, idx: number) => {
          const dayExercises = groupedExercises[dayGroup];
          const isExpanded = expandedDays[dayGroup] ?? true; // Templates can be expanded by default to show preview
          return (
            <View key={idx} style={styles.dayGroupContainer}>
              <TouchableOpacity 
                style={styles.dayDropdownButton}
                onPress={() => setExpandedDays(prev => ({ ...prev, [dayGroup]: !isExpanded }))}
              >
                <Text style={styles.dayDropdownTitle}>{dayGroup}</Text>
                <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#000" />
              </TouchableOpacity>

              {isExpanded && dayExercises.map((ex: any, exIdx: number) => (
                <View key={exIdx} style={styles.exerciseCard}>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{ex.exerciseName}</Text>
                    <View style={styles.badgeMeta}>
                      <Text style={styles.exerciseMeta}>{ex.sets} Sets • {ex.repsOrDuration}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          );
        })}
        
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Sticky Bottom Save Button */}
      <View style={styles.stickyFooter}>
        <AnimatedButton 
          onPress={handleSaveToMyPlans} 
          style={[styles.primaryButton, saving && { opacity: 0.7 }]}
          disabled={saving}
        >
          <Ionicons name="download-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.primaryButtonText}>
            {saving ? 'Creating Plan...' : 'Save to My Plans'}
          </Text>
        </AnimatedButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.5,
    fontStyle: 'italic',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  overviewCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  planNameTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000',
    marginBottom: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 15,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'flex-start',
  },
  statLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    color: '#000',
    fontWeight: '800',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
    marginBottom: 15,
  },
  dayGroupContainer: {
    marginBottom: 10,
  },
  dayDropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 5,
  },
  dayDropdownTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
  },
  exerciseCard: {
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 15,
    marginBottom: 8,
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
    marginBottom: 4,
  },
  badgeMeta: {
    backgroundColor: '#000',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 2,
  },
  exerciseMeta: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '800',
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
  },
  primaryButton: {
    backgroundColor: '#000',
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  }
});
