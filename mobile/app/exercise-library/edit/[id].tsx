import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../../constants/api';

export default function EditExerciseScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchExercise();
  }, [id]);

  const fetchExercise = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${api.API_BASE_URL}/api/exercises`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const found = data.find((e: any) => e._id === id);
        if (found) {
          setName(found.name);
          setCategory(found.category);
          setDifficulty(found.difficulty);
          setDescription(found.description);
          setImage(found.image);
        } else {
          Alert.alert("Error", "Exercise not found");
          router.back();
        }
      }
    } catch (error) {
      console.error("Error fetching exercise:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!name || !category || !difficulty || !description || !image) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${api.API_BASE_URL}/api/exercises/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          category,
          difficulty,
          description,
          image
        })
      });

      if (response.ok) {
        Alert.alert('Success', 'Exercise updated successfully', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to update exercise');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An error occurred while updating the exercise');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EDIT EXERCISE</Text>
        <View style={{ width: 34 }} />
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.formContainer} bounces={false}>
        <Text style={styles.label}>EXERCISE NAME</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. Push Up" 
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>CATEGORY</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. Chest, Back, Legs" 
          placeholderTextColor="#666"
          value={category}
          onChangeText={setCategory}
        />

        <Text style={styles.label}>DIFFICULTY</Text>
        <View style={styles.difficultyContainer}>
          {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
            <TouchableOpacity 
              key={level}
              style={[styles.difficultyBtn, difficulty === level && styles.difficultyBtnActive]}
              onPress={() => setDifficulty(level)}
            >
              <Text style={[styles.difficultyText, difficulty === level && styles.difficultyTextActive]}>
                {level.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>IMAGE URL (PEXELS/UNSPLASH)</Text>
        <TextInput 
          style={styles.input} 
          placeholder="https://..." 
          placeholderTextColor="#666"
          value={image}
          onChangeText={setImage}
          autoCapitalize="none"
        />

        <Text style={styles.label}>HOW TO PERFORM (STEP-BY-STEP)</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          placeholder="1. Start in plank position...&#10;2. Lower your body..." 
          placeholderTextColor="#666"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />

        <TouchableOpacity 
          style={styles.submitBtn} 
          onPress={handleUpdate}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.submitBtnText}>UPDATE EXERCISE</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#111',
  },
  backBtn: {
    padding: 5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 2,
  },
  formContainer: {
    padding: 20,
    paddingBottom: 50,
  },
  label: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 20,
  },
  input: {
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    fontWeight: '500',
    borderWidth: 1,
    borderColor: '#333',
  },
  textArea: {
    height: 150,
  },
  difficultyContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  difficultyBtn: {
    flex: 1,
    backgroundColor: '#222',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  difficultyBtnActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  difficultyText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '800',
  },
  difficultyTextActive: {
    color: '#000',
  },
  submitBtn: {
    backgroundColor: '#fff',
    marginTop: 40,
    paddingVertical: 18,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
    fontStyle: 'italic',
  }
});
