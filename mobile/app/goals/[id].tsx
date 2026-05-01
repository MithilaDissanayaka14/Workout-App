import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/constants/api';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function GoalDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [goal, setGoal] = useState(null);
  const [targetValue, setTargetValue] = useState('');
  const [deadline, setDeadline] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchGoal();
  }, [id]);

  const fetchGoal = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_BASE_URL}/api/goals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const goals = await response.json();
        const currentGoal = goals.find(g => g._id === id);
        if (currentGoal) {
          setGoal(currentGoal);
          setTargetValue(currentGoal.targetValue.toString());
          setDeadline(new Date(currentGoal.deadline));
        } else {
          Alert.alert("Error", "Goal not found.");
          router.back();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_BASE_URL}/api/goals/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          targetValue: Number(targetValue),
          deadline: deadline.toISOString()
        })
      });

      if (response.ok) {
        Alert.alert("Success", "Goal updated successfully!", [
          { text: "OK", onPress: () => router.back() }
        ]);
      } else {
        Alert.alert("Error", "Failed to update goal");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Network error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert("Delete Goal", "Are you sure you want to delete this goal?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE_URL}/api/goals/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
              Alert.alert("Deleted", "Goal removed.");
              router.back();
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
    ]);
  };

  if (loading) return <ActivityIndicator size="large" color="#000" style={{ marginTop: 50 }} />;
  if (!goal) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit {goal.type} Goal</Text>
        <TouchableOpacity onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color="red" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.formContainer}>
          <Text style={styles.infoText}>Current Progress: {goal.currentValue} / {goal.targetValue}</Text>
          <Text style={styles.infoText}>Status: {goal.status}</Text>

          <Text style={[styles.label, { marginTop: 20 }]}>Target Value</Text>
          <TextInput 
            style={styles.input} 
            keyboardType="numeric"
            value={targetValue}
            onChangeText={setTargetValue}
          />

          <Text style={styles.label}>Deadline</Text>
          <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowPicker(true)}>
            <Text style={styles.datePickerText}>{deadline.toISOString().split('T')[0]}</Text>
          </TouchableOpacity>

          {showPicker && (
            <DateTimePicker
              value={deadline}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowPicker(Platform.OS === 'ios');
                if (selectedDate) setDeadline(selectedDate);
              }}
            />
          )}

          <TouchableOpacity style={styles.submitButton} onPress={handleUpdate} disabled={saving}>
            <Text style={styles.submitButtonText}>{saving ? 'Saving...' : 'Update Goal'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', flex: 1 },
  formContainer: { padding: 20 },
  infoText: { fontSize: 16, color: '#555', marginBottom: 5 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 8, fontSize: 16, marginBottom: 20 },
  datePickerButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 8, marginBottom: 20 },
  datePickerText: { fontSize: 16, color: '#333' },
  submitButton: { backgroundColor: '#000', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
