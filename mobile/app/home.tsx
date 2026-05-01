import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, ImageBackground, Image, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [firstName, setFirstName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const name = await AsyncStorage.getItem('firstName');
      if (name) {
        setFirstName(name);
      }
    } catch (e) {
      console.error("Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace('/login');
  };

  const features = [
    { id: 1, title: 'Workout Plan', icon: 'fitness', image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=800' },
    { id: 2, title: 'Nutrition & meal plan', icon: 'restaurant', image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800' },
    { id: 3, title: 'Progress', icon: 'stats-chart', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800' },
    { id: 4, title: 'Workout Scheduler', icon: 'calendar', image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=800' },
    { id: 5, title: 'Exercise Library', icon: 'library', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800' },
    { id: 6, title: 'Goals & Achievements', icon: 'trophy', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=800' },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Black Navigation Bar */}
      <SafeAreaView edges={['top']} style={styles.topNavBar}>
        <View style={styles.navHeader}>
          <Text style={styles.logoText}>FitForge</Text>
          <View style={styles.navIcons}>
            <TouchableOpacity onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#fff" style={styles.iconMargin} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalNav}>
          {features.map((f, i) => (
            <TouchableOpacity
              key={i}
              style={styles.navLinkContainer}
              onPress={() => {
                if (f.title === 'Nutrition & meal plan') {
                  router.push('/nutrition');
                } else if (f.title === 'Workout Plan') {
                  router.push('/workout');
                } else if (f.title === 'Workout Scheduler') {
                  router.push('/workout-scheduler' as any);
                } else if (f.title === 'Progress') {
                  router.push('/gym/progress' as any);
                } else if (f.title === 'Exercise Library') {
                  router.push('/exercise-library' as any);
                } else if (f.title === 'Goals & Achievements') {
                  router.push('/goals' as any);
                } else {
                  console.log(`${f.title} pressed`);
                }
              }}
            >
              <Text style={styles.navLinkText}>{f.title.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1200' }}
          style={[styles.heroBackground, { height: height * 0.60, width }]}
        >
          <View style={styles.heroOverlay}>
            <Text style={styles.heroSubtitle}>Hey {firstName || 'Athlete'},</Text>
            <Text style={styles.heroTitle}>BE BETTER {"\n"}EVERYDAY</Text>
            <Text style={styles.heroGreeting}>Ready to crush your goals today?</Text>
          </View>
        </ImageBackground>

        {/* Carousel Section */}
        <View style={styles.carouselSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>EXPLORE APP FEATURES</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <View style={styles.arrowCircle}>
                <Ionicons name="chevron-forward" size={14} color="#000" />
              </View>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContainer}
          >
            {features.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.carouselCard, { width: width * 0.6 }]}
                onPress={() => {
                  if (item.title === 'Nutrition & meal plan') {
                    router.push('/nutrition');
                  } else if (item.title === 'Workout Plan') {
                    router.push('/workout');
                  } else if (item.title === 'Workout Scheduler') {
                    router.push('/workout-scheduler' as any);
                  } else if (item.title == 'Progress') { router.push('/gym/progress' as any); }
                  else if (item.title === 'Exercise Library') {
                    router.push('/exercise-library' as any);
                  } else if (item.title === 'Goals & Achievements') {
                    router.push('/goals' as any);
                  } else {
                    console.log(`${item.title} pressed`);
                  }
                }}
              >
                <Image source={{ uri: item.image }} style={[styles.cardImage, { height: width * 0.85 }]} />
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>{item.title.toUpperCase()}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  topNavBar: {
    backgroundColor: '#000',
    paddingBottom: 15,
  },
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  logoText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 2,
    fontStyle: 'italic',
  },
  navIcons: {
    flexDirection: 'row',
  },
  iconMargin: {
    marginLeft: 15,
  },
  horizontalNav: {
    paddingHorizontal: 15,
  },
  navLinkContainer: {
    marginHorizontal: 15,
  },
  navLinkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  heroBackground: {
    justifyContent: 'flex-end',
  },
  heroOverlay: {
    padding: 20,
    paddingBottom: 30,
    backgroundColor: 'rgba(0,0,0,0.35)',
    height: '100%',
    justifyContent: 'flex-end',
  },
  heroSubtitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 48,
    lineHeight: 52,
    fontWeight: '900',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
    marginBottom: 5,
  },
  heroGreeting: {
    color: '#e0e0e0',
    fontSize: 14,
    marginBottom: 20,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  heroButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  heroButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 8,
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  carouselSection: {
    paddingTop: 40,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 0.5,
    color: '#000',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginRight: 5,
  },
  arrowCircle: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 15,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselContainer: {
    paddingHorizontal: 15,
  },
  carouselCard: {
    marginHorizontal: 5,
  },
  cardImage: {
    width: '100%',
    backgroundColor: '#f4f4f4',
  },
  cardTextContainer: {
    paddingVertical: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.5,
    color: '#000',
  },
});
