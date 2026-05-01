import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Image, Dimensions, Modal, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../constants/api';

const { width } = Dimensions.get('window');

interface Exercise {
  _id: string;
  name: string;
  category: string;
  difficulty: string;
  image: string;
  isFavorited: boolean;
  isOwner: boolean;
}

export default function ExerciseLibrary() {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [filterDifficulties, setFilterDifficulties] = useState<string[]>([]);
  
  const slideAnim = useRef(new Animated.Value(width)).current;

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.error("No token found");
        setLoading(false);
        return;
      }

      // We'll also call the seed endpoint just in case it hasn't been seeded yet.
      try {
        await fetch(`${api.API_BASE_URL}/api/exercises/seed`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
      } catch (err) {
        console.log("Seed error or already seeded", err);
      }

      const response = await fetch(`${api.API_BASE_URL}/api/exercises`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setExercises(data);
      } else {
        console.error("Failed to fetch exercises");
      }
    } catch (error) {
      console.error("Error fetching exercises:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (id: string) => {
    try {
      // Optimistic update
      setExercises(prev => prev.map(ex => 
        ex._id === id ? { ...ex, isFavorited: !ex.isFavorited } : ex
      ));
      
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${api.API_BASE_URL}/api/exercises/${id}/favorite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        // Revert on failure if needed
        setExercises(prev => prev.map(ex => 
          ex._id === id ? { ...ex, isFavorited: !ex.isFavorited } : ex
        ));
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const toggleFilterSidebar = (show: boolean) => {
    if (show) {
      setIsFilterVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(() => setIsFilterVisible(false));
    }
  };

  const availableCategories = Array.from(new Set(exercises.map(ex => ex.category)));
  
  const filteredExercises = exercises.filter(ex => {
    if (filterFavorites && !ex.isFavorited) return false;
    if (filterCategories.length > 0 && !filterCategories.includes(ex.category)) return false;
    if (filterDifficulties.length > 0 && !filterDifficulties.includes(ex.difficulty)) return false;
    return true;
  });

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EXERCISE LIBRARY</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => toggleFilterSidebar(true)}>
            <Ionicons name="filter" size={22} color="#fff" />
            {(filterFavorites || filterCategories.length > 0 || filterDifficulties.length > 0) && (
              <View style={styles.filterBadge} />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.push('/exercise-library/add' as any)}>
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <Modal visible={isFilterVisible} transparent={true} animationType="none" onRequestClose={() => toggleFilterSidebar(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackgroundTouch} onPress={() => toggleFilterSidebar(false)} />
          <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
            <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
              <View style={styles.sidebarHeader}>
                <Text style={styles.sidebarTitle}>FILTERS</Text>
                <TouchableOpacity onPress={() => toggleFilterSidebar(false)}>
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.sidebarContent} bounces={false}>
                <Text style={styles.filterSectionTitle}>FAVORITES</Text>
                <TouchableOpacity 
                  style={[styles.filterPill, filterFavorites && styles.filterPillActive]} 
                  onPress={() => setFilterFavorites(!filterFavorites)}
                >
                  <Ionicons name={filterFavorites ? "star" : "star-outline"} size={16} color={filterFavorites ? "#000" : "#fff"} style={{marginRight: 5}} />
                  <Text style={[styles.filterPillText, filterFavorites && styles.filterPillTextActive]}>Starred Only</Text>
                </TouchableOpacity>

                <Text style={[styles.filterSectionTitle, { marginTop: 20 }]}>DIFFICULTY</Text>
                <View style={styles.pillsContainer}>
                  {['Beginner', 'Intermediate', 'Advanced'].map(diff => (
                    <TouchableOpacity 
                      key={diff}
                      style={[styles.filterPill, filterDifficulties.includes(diff) && styles.filterPillActive]}
                      onPress={() => {
                        if (filterDifficulties.includes(diff)) {
                          setFilterDifficulties(prev => prev.filter(d => d !== diff));
                        } else {
                          setFilterDifficulties(prev => [...prev, diff]);
                        }
                      }}
                    >
                      <Text style={[styles.filterPillText, filterDifficulties.includes(diff) && styles.filterPillTextActive]}>{diff.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.filterSectionTitle, { marginTop: 20 }]}>CATEGORY</Text>
                <View style={styles.pillsContainer}>
                  {availableCategories.map(cat => (
                    <TouchableOpacity 
                      key={cat}
                      style={[styles.filterPill, filterCategories.includes(cat) && styles.filterPillActive]}
                      onPress={() => {
                        if (filterCategories.includes(cat)) {
                          setFilterCategories(prev => prev.filter(c => c !== cat));
                        } else {
                          setFilterCategories(prev => [...prev, cat]);
                        }
                      }}
                    >
                      <Text style={[styles.filterPillText, filterCategories.includes(cat) && styles.filterPillTextActive]}>{cat.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.sidebarFooter}>
                <TouchableOpacity 
                  style={styles.resetBtn} 
                  onPress={() => {
                    setFilterFavorites(false);
                    setFilterCategories([]);
                    setFilterDifficulties([]);
                  }}
                >
                  <Text style={styles.resetBtnText}>RESET</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyBtn} onPress={() => toggleFilterSidebar(false)}>
                  <Text style={styles.applyBtnText}>APPLY</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer}>
          {filteredExercises.map((exercise) => (
            <TouchableOpacity 
              key={exercise._id} 
              style={styles.card}
              onPress={() => router.push({ pathname: '/exercise-library/[id]', params: { id: exercise._id } } as any)}
            >
              <Image source={{ uri: exercise.image }} style={styles.cardImage} />
              
              <TouchableOpacity 
                style={styles.favoriteBtn} 
                onPress={() => toggleFavorite(exercise._id)}
              >
                <Ionicons 
                  name={exercise.isFavorited ? "star" : "star-outline"} 
                  size={24} 
                  color={exercise.isFavorited ? "#FFD700" : "#fff"} 
                />
              </TouchableOpacity>

              <View style={styles.cardOverlay}>
                <View style={styles.tagContainer}>
                  <Text style={styles.tagText}>{exercise.difficulty.toUpperCase()}</Text>
                </View>
                <Text style={styles.cardTitle}>{exercise.name.toUpperCase()}</Text>
                <Text style={styles.cardCategory}>{exercise.category.toUpperCase()}</Text>
              </View>
            </TouchableOpacity>
          ))}
          {filteredExercises.length === 0 && (
            <Text style={styles.emptyText}>No exercises match your filters.</Text>
          )}
        </ScrollView>
      )}
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
  headerIconBtn: {
    padding: 5,
    marginLeft: 10,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4444',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 15,
    paddingBottom: 40,
  },
  card: {
    height: 200,
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#222',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    opacity: 0.7,
  },
  favoriteBtn: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  cardOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  tagContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  tagText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '800',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  cardCategory: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  emptyText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  modalBackgroundTouch: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sidebar: {
    width: width * 0.75,
    backgroundColor: '#111',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  sidebarTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  sidebarContent: {
    padding: 20,
  },
  filterSectionTitle: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  filterPillActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  filterPillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: '#000',
  },
  sidebarFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#222',
    gap: 15,
  },
  resetBtn: {
    flex: 1,
    backgroundColor: '#222',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  applyBtn: {
    flex: 2,
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    fontStyle: 'italic',
  }
});
