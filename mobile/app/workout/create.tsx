import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import PlanFormComponent, { PlanData } from '../../components/PlanFormComponent';
import { API_BASE_URL } from '@/constants/api';

export default function CreateWorkoutPlanScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: PlanData) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/workouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const resData = await response.json();
      
      if (response.ok) {
        Alert.alert('Success', 'Workout plan created successfully!');
        router.back();
      } else {
        Alert.alert('Error', resData.error || 'Failed to create plan');
      }
    } catch (error) {
      console.error('Create error:', error);
      Alert.alert('Error', 'Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Plan</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <View style={styles.content}>
        <PlanFormComponent 
          onSubmit={handleSubmit}
          isLoading={loading}
          buttonText="Save Plan"
        />
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
  content: {
    flex: 1,
    padding: 20,
  }
});
