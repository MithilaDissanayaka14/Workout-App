import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/constants/api';

export default function GoalsScreen() {
  const router = useRouter();
  const [goals, setGoals] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Goals');

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      // Fetch Goals
      const goalRes = await fetch(`${API_BASE_URL}/api/goals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (goalRes.ok) {
        const goalData = await goalRes.json();
        setGoals(goalData);
      }

      // Check and Fetch Achievements
      await fetch(`${API_BASE_URL}/api/achievements/check`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const achRes = await fetch(`${API_BASE_URL}/api/achievements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (achRes.ok) {
        const achData = await achRes.json();
        setAchievements(achData);
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const renderGoal = ({ item }: { item: any }) => {
    const progressPercent = Math.min((item.currentValue / item.targetValue) * 100, 100);
    return (
      <TouchableOpacity style={styles.card} onPress={() => router.push(`/goals/${item._id}` as any)}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.type} Goal</Text>
          <Text style={[styles.statusBadge, item.status === 'Completed' ? styles.statusCompleted : null]}>{item.status}</Text>
        </View>
        <Text style={styles.targetText}>Target: {item.targetValue} | Current: {item.currentValue}</Text>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderAchievement = ({ item }: { item: any }) => (
    <View style={styles.achievementCard}>
      <Ionicons name={item.icon || 'star'} size={40} color="#FFD700" />
      <View style={styles.achievementInfo}>
        <Text style={styles.achievementTitle}>{item.title}</Text>
        <Text style={styles.achievementDesc}>{item.description}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Goals & Achievements</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Goals' && styles.activeTab]} 
          onPress={() => setActiveTab('Goals')}
        >
          <Text style={[styles.tabText, activeTab === 'Goals' && styles.activeTabText]}>Goals</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Achievements' && styles.activeTab]} 
          onPress={() => setActiveTab('Achievements')}
        >
          <Text style={[styles.tabText, activeTab === 'Achievements' && styles.activeTabText]}>Achievements</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 50 }} />
      ) : activeTab === 'Goals' ? (
        <>
          <FlatList 
            data={goals.filter(goal => goal.status !== 'Completed')}
            keyExtractor={(item) => item._id}
            renderItem={renderGoal}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.emptyText}>No active goals found. Create one!</Text>}
          />
          <TouchableOpacity style={styles.fab} onPress={() => router.push('/goals/create' as any)}>
            <Ionicons name="add" size={30} color="#fff" />
          </TouchableOpacity>
        </>
      ) : (
        <FlatList 
          data={achievements}
          keyExtractor={(item) => item._id}
          renderItem={renderAchievement}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>No achievements yet. Keep working out!</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#000' },
  tabText: { fontSize: 16, color: '#666' },
  activeTabText: { color: '#000', fontWeight: 'bold' },
  list: { padding: 20 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  statusBadge: { backgroundColor: '#e0e0e0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, fontSize: 12, overflow: 'hidden' },
  statusCompleted: { backgroundColor: '#d4edda', color: '#155724' },
  targetText: { fontSize: 14, color: '#555', marginBottom: 10 },
  progressBarBg: { height: 10, backgroundColor: '#eee', borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#000' },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#666', fontSize: 16 },
  achievementCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 15, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  achievementInfo: { marginLeft: 15, flex: 1 },
  achievementTitle: { fontSize: 16, fontWeight: 'bold' },
  achievementDesc: { fontSize: 14, color: '#666', marginTop: 4 }
});
