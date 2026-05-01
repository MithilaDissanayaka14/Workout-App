import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { API_BASE_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AnimatedButton from '../../components/AnimatedButton';

export default function WorkoutPlanScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isFocused) {
      fetchPlans();
    }
  }, [isFocused]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_BASE_URL}/api/workouts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.plans) {
        setPlans(data.plans);
      }
    } catch (error) {
      console.error('Failed to fetch plans', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <AnimatedButton
      onPress={() => router.push(`/workout/${item._id}`)}
      style={styles.cardWrapper}
    >
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.planName}>{item.planName}</Text>
          <Ionicons name="chevron-forward" size={20} color="#000" />
        </View>
        <View style={styles.cardDetails}>
          <View style={styles.detailPill}>
            <Ionicons name="flag-outline" size={14} color="#555" />
            <Text style={styles.detailText}>{item.goal}</Text>
          </View>
          <View style={styles.detailPill}>
            <Ionicons name="time-outline" size={14} color="#555" />
            <Text style={styles.detailText}>{item.durationWeeks} Weeks</Text>
          </View>
          <View style={styles.detailPill}>
            <Ionicons name="calendar-outline" size={14} color="#555" />
            <Text style={styles.detailText}>{item.daysPerWeek} Days/Wk</Text>
          </View>
        </View>
      </View>
    </AnimatedButton>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/home')}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout Plans</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.bannerContainer}>
        <AnimatedButton
          onPress={() => router.push('/workout/templates')}
          style={styles.templateBanner}
        >
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Explore Fitness Plans</Text>
            <Text style={styles.bannerSubtext}>Browse beginner & intermediate templates</Text>
          </View>
          <Ionicons name="compass-outline" size={32} color="#fff" />
        </AnimatedButton>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : plans.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="barbell-outline" size={64} color="#E0E0E0" />
          <Text style={styles.emptyText}>No workout plans found.</Text>
          <Text style={styles.emptySubText}>Create your first plan to get started!</Text>
        </View>
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <AnimatedButton
        onPress={() => router.push('/workout/create')}
        style={styles.fab}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </AnimatedButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    fontSize: 20,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.5,
    fontStyle: 'italic',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    marginTop: 15,
  },
  emptySubText: {
    fontSize: 14,
    color: '#757575',
    marginTop: 8,
    textAlign: 'center',
  },
  bannerContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 5,
  },
  templateBanner: {
    backgroundColor: '#000',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
  },
  bannerSubtext: {
    fontSize: 13,
    color: '#E0E0E0',
    fontWeight: '500',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  cardWrapper: {
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  planName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
  },
  cardDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#757575',
    marginLeft: 5,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 25,
    backgroundColor: '#000',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
});
