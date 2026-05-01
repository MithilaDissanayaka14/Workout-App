import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import PlanFormComponent, { PlanData } from '../../components/PlanFormComponent';
import { API_BASE_URL } from '@/constants/api';

export default function WorkoutPlanDetailScreen() {
  const { id, edit } = useLocalSearchParams();
  const router = useRouter();
  
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(edit === 'true');
  const [updating, setUpdating] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchPlan();
  }, [id]);

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/workouts/${id}`);
      const data = await response.json();
      if (data.plan) {
        setPlan(data.plan);
      } else {
        Alert.alert('Error', 'Plan not found');
        router.back();
      }
    } catch (error) {
      console.error('Fetch plan error:', error);
      Alert.alert('Error', 'Could not load the plan.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    const performDelete = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/workouts/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          Alert.alert('Success', 'Plan deleted successfully');
          router.back();
        } else {
          Alert.alert('Error', 'Failed to delete plan');
        }
      } catch (error) {
        console.error('Delete error:', error);
        Alert.alert('Error', 'Could not connect to the server.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this workout plan?')) {
        performDelete();
      }
    } else {
      Alert.alert('Delete Plan', 'Are you sure you want to delete this workout plan?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: performDelete }
      ]);
    }
  };

  const handleUpdate = async (data: PlanData) => {
    try {
      setUpdating(true);
      const response = await fetch(`${API_BASE_URL}/api/workouts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const resData = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Plan updated successfully!');
        setPlan(resData.plan);
        setIsEditing(false);
      } else {
        Alert.alert('Error', resData.error || 'Failed to update plan');
      }
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'Could not connect to the server.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading || !plan) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (isEditing) {
    const initialData: PlanData = {
      planName: plan.planName,
      goal: plan.goal,
      durationWeeks: String(plan.durationWeeks),
      daysPerWeek: String(plan.daysPerWeek),
      exercises: plan.exercises
    };

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setIsEditing(false)}>
            <Ionicons name="close" size={26} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Plan</Text>
          <View style={{ width: 26 }} />
        </View>
        <View style={styles.content}>
          <PlanFormComponent 
            initialData={initialData}
            onSubmit={handleUpdate}
            isLoading={updating}
            buttonText="Update Plan"
          />
        </View>
      </View>
    );
  }

  // View Mode
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plan Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.iconMargin}>
            <Ionicons name="create-outline" size={22} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash-outline" size={22} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.overviewCard}>
          <Text style={styles.planNameTitle}>{plan.planName}</Text>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Goal</Text>
              <Text style={styles.statValue}>{plan.goal}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Duration</Text>
              <Text style={styles.statValue}>{plan.durationWeeks} Wks</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Days</Text>
              <Text style={styles.statValue}>{plan.daysPerWeek} / Wk</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionHeader}>Day-wise Breakdown</Text>
        
        {plan.exercises && plan.exercises.length > 0 ? (
           Object.keys(
             plan.exercises.reduce((acc: any, ex: any) => {
               if (!acc[ex.day]) acc[ex.day] = [];
               acc[ex.day].push(ex);
               return acc;
             }, {})
           ).map((dayGroup: string, idx: number) => {
             const dayExercises = plan.exercises.filter((ex: any) => ex.day === dayGroup);
             const isExpanded = expandedDays[dayGroup];
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
           })
        ) : (
          <Text style={styles.emptyExercises}>No exercises added to this plan.</Text>
        )}
        
        <View style={{ height: 60 }} />
      </ScrollView>
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
  iconMargin: {
    marginRight: 15,
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
  emptyExercises: {
    color: '#9E9E9E',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  }
});
