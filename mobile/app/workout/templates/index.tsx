import React from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { WORKOUT_TEMPLATES } from '@/constants/templates';
import AnimatedButton from '../../../components/AnimatedButton';

export default function TemplateListScreen() {
  const router = useRouter();

  const sections = [
    { title: 'Beginner Plans', data: WORKOUT_TEMPLATES.beginner },
    { title: 'Intermediate Plans', data: WORKOUT_TEMPLATES.intermediate }
  ];

  const renderItem = ({ item }: { item: any }) => (
    <AnimatedButton 
      onPress={() => router.push(`/workout/templates/${item.id}`)}
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
            <Ionicons name="barbell-outline" size={14} color="#555" />
            <Text style={styles.detailText}>{item.level}</Text>
          </View>
        </View>
      </View>
    </AnimatedButton>
  );

  const renderSectionHeader = ({ section }: { section: any }) => (
    <Text style={styles.sectionHeader}>{section.title}</Text>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fitness Plans</Text>
        <View style={{ width: 24 }} />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000',
    marginTop: 10,
    marginBottom: 15,
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
    flex: 1,
    marginRight: 10,
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
});
