import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Image, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../constants/api';

const { width, height } = Dimensions.get('window');

interface ExerciseDetail {
  _id: string;
  name: string;
  category: string;
  difficulty: string;
  description: string;
  image: string;
  isFavorited: boolean;
  isOwner: boolean;
}

export default function ExerciseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [exercise, setExercise] = useState<ExerciseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExerciseDetail();
  }, [id]);

  const fetchExerciseDetail = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${api.API_BASE_URL}/api/exercises`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const found = data.find((e: any) => e._id === id);
        if (found) {
          setExercise(found);
        }
      }
    } catch (error) {
      console.error("Error fetching exercise:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !exercise) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      "Delete Exercise",
      "Are you sure you want to delete this exercise?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              const response = await fetch(`${api.API_BASE_URL}/api/exercises/${id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              if (response.ok) {
                router.back();
              } else {
                Alert.alert("Error", "Failed to delete exercise");
              }
            } catch (error) {
              console.error(error);
            }
          }
        }
      ]
    );
  };

  // Parse description steps if they contain numbers like "1. ", "2. "
  const steps = exercise.description.split(/\d+\.\s/).filter(step => step.trim() !== '');

  return (
    <View style={styles.container}>
      <ScrollView bounces={false}>
        <View style={styles.heroContainer}>
          <Image source={{ uri: exercise.image }} style={styles.heroImage} />
          <SafeAreaView style={styles.backButtonContainer}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          </SafeAreaView>
          
          {exercise.isOwner && (
            <SafeAreaView style={styles.actionButtonsContainer}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => router.push({ pathname: '/exercise-library/edit/[id]', params: { id: exercise._id } } as any)}>
                <Ionicons name="pencil" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={handleDelete}>
                <Ionicons name="trash" size={20} color="#ff4444" />
              </TouchableOpacity>
            </SafeAreaView>
          )}

          <View style={styles.heroOverlay}>
            <View style={styles.tagRow}>
              <View style={styles.tagContainer}>
                <Text style={styles.tagText}>{exercise.difficulty.toUpperCase()}</Text>
              </View>
              <View style={[styles.tagContainer, { backgroundColor: '#333' }]}>
                <Text style={[styles.tagText, { color: '#fff' }]}>{exercise.category.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.title}>{exercise.name.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.sectionTitle}>HOW TO PERFORM</Text>
          {steps.length > 0 ? (
            steps.map((step, index) => (
              <View key={index} style={styles.stepContainer}>
                <View style={styles.stepNumberCircle}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step.trim()}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.stepText}>{exercise.description}</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContainer: {
    height: height * 0.45,
    width: '100%',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  backButtonContainer: {
    position: 'absolute',
    top: 0,
    left: 20,
    zIndex: 10,
  },
  backBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  actionButtonsContainer: {
    position: 'absolute',
    top: 0,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  tagRow: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 10,
  },
  tagContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  tagText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '800',
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  contentContainer: {
    padding: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    fontStyle: 'italic',
    marginBottom: 20,
    letterSpacing: 1,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  stepNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    marginTop: 2,
  },
  stepNumberText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 14,
  },
  stepText: {
    color: '#ccc',
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
    fontWeight: '500',
  }
});
