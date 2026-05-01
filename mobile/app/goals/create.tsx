import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/constants/api';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreateGoalScreen() {
  const router = useRouter();
  const [type, setType] = useState('Weight');
  const [targetValue, setTargetValue] = useState('');
  const [deadline, setDeadline] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!targetValue || !deadline) {
      Alert.alert("Error", "Please fill out all fields.");
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_BASE_URL}/api/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type,
          targetValue: Number(targetValue),
          deadline: deadline.toISOString()
        })
      });

      if (response.ok) {
        Alert.alert("Success", "Goal created successfully!", [
          { text: "OK", onPress: () => router.back() }
        ]);
      } else {
        const data = await response.json();
        Alert.alert("Error", data.message || "Failed to create goal");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Goal</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.formContainer}>
          <Text style={styles.label}>Goal Type</Text>
          <View style={styles.typeContainer}>
            <TouchableOpacity 
              style={[styles.typeButton, type === 'Weight' && styles.typeButtonActive]} 
              onPress={() => setType('Weight')}
            >
              <Text style={[styles.typeText, type === 'Weight' && styles.typeTextActive]}>Weight</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.typeButton, type === 'Nutrition' && styles.typeButtonActive]} 
              onPress={() => setType('Nutrition')}
            >
              <Text style={[styles.typeText, type === 'Nutrition' && styles.typeTextActive]}>Nutrition</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>{type === 'Weight' ? 'Target Weight (kg)' : 'Target Calories (kcal)'}</Text>
          <TextInput 
            style={styles.input} 
            placeholder={type === 'Weight' ? "e.g. 70" : "e.g. 30000"}
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

          <TouchableOpacity style={styles.submitButton} onPress={handleCreate} disabled={loading}>
            <Text style={styles.submitButtonText}>{loading ? 'Creating...' : 'Create Goal'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  formContainer: { padding: 20 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  typeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  typeButton: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginHorizontal: 4, alignItems: 'center' },
  typeButtonActive: { backgroundColor: '#000', borderColor: '#000' },
  typeText: { color: '#666', fontWeight: 'bold' },
  typeTextActive: { color: '#fff' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 8, fontSize: 16, marginBottom: 20 },
  datePickerButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 8, marginBottom: 20 },
  datePickerText: { fontSize: 16, color: '#333' },
  submitButton: { backgroundColor: '#000', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
