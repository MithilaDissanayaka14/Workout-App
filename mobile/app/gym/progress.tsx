import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AnimatedButton from '@/components/AnimatedButton';
import {
  deleteProgressEntry,
  getProgressEntries,
  getWorkouts,
  pullProgressEntriesFromBackend,
  saveProgressEntry,
  updateProgressEntry,
  type ProgressEntry,
  type WorkoutSession,
} from '@/storage/workoutStorage';

const moodOptions = ['Energetic', 'Strong', 'Focused', 'Tired', 'Sore', 'Rested'];

const formatDateLabel = (dateValue: string) => {
  const date = new Date(dateValue);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const parseOptionalNumber = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export default function ProgressScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();

  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [mood, setMood] = useState('Energetic');
  const [notes, setNotes] = useState('');

  const latestEntry = entries[0];
  const previousEntry = entries[1];
  const weightChange = latestEntry && previousEntry ? latestEntry.weight - previousEntry.weight : null;
  const progressAlert = weightChange !== null && weightChange >= 1.5
    ? {
        title: 'Weight is rising quickly',
        message: 'Consider tightening your workout plan and staying consistent with meals.',
        tone: 'warning' as const,
        actionLabel: 'Open workout plan',
        action: () => router.push('/workout-scheduler'),
      }
    : weightChange !== null && weightChange <= -1.5
      ? {
          title: 'Weight is dropping fast',
          message: 'Make sure you are eating on time and recovering properly.',
          tone: 'danger' as const,
          actionLabel: 'Log a meal',
          action: () => router.push('/nutrition'),
        }
      : null;

  const loadData = async () => {
    try {
      setLoading(true);
      await pullProgressEntriesFromBackend();
      const [loadedWorkouts, loadedEntries] = await Promise.all([
        getWorkouts(),
        getProgressEntries(),
      ]);
      setWorkouts(loadedWorkouts);
      setEntries(loadedEntries);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const resetForm = () => {
    setEditingId(null);
    setWeight('');
    setWaist('');
    setMood('Energetic');
    setNotes('');
  };

  const openCreate = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEdit = (entry: ProgressEntry) => {
    setEditingId(entry.id);
    setWeight(String(entry.weight ?? ''));
    setWaist(entry.waist !== undefined ? String(entry.waist) : '');
    setMood(entry.mood || 'Energetic');
    setNotes(entry.notes || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    const parsedWeight = Number(weight);
    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      Alert.alert('Missing weight', 'Please enter a valid weight to log progress.');
      return;
    }

    const payload = {
      id: editingId || Date.now().toString(),
      date: editingId ? entries.find(entry => entry.id === editingId)?.date || new Date().toISOString() : new Date().toISOString(),
      weight: parsedWeight,
      waist: parseOptionalNumber(waist),
      mood: mood.trim(),
      notes: notes.trim(),
    };

    const success = editingId
      ? await updateProgressEntry(editingId, payload)
      : await saveProgressEntry(payload);

    if (success) {
      setModalVisible(false);
      resetForm();
      loadData();
    }
  };

  const confirmDelete = (entry: ProgressEntry) => {
    Alert.alert(
      'Delete entry',
      'Remove this progress log? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteProgressEntry(entry.id);
            loadData();
          },
        },
      ]
    );
  };

  const totalVolume = workouts.reduce((acc, workout) => acc + workout.totalVolume, 0);

  const renderItem = ({ item }: { item: ProgressEntry }) => (
    <AnimatedButton onPress={() => openEdit(item)} style={styles.cardWrapper}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>{formatDateLabel(item.date)}</Text>
            <Text style={styles.cardSubtitle}>Progress log</Text>
          </View>
          <View style={styles.weightBadge}>
            <Ionicons name="trending-up-outline" size={14} color="#000" />
            <Text style={styles.weightBadgeText}>{item.weight} kg</Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailPill}>
            <Ionicons name="scale-outline" size={14} color="#555" />
            <Text style={styles.detailText}>{item.weight} kg</Text>
          </View>
          {item.waist !== undefined && (
            <View style={styles.detailPill}>
              <Ionicons name="resize-outline" size={14} color="#555" />
              <Text style={styles.detailText}>{item.waist} in</Text>
            </View>
          )}
          {item.mood ? (
            <View style={styles.detailPill}>
              <Ionicons name="happy-outline" size={14} color="#555" />
              <Text style={styles.detailText}>{item.mood}</Text>
            </View>
          ) : null}
        </View>

        {item.notes ? <Text style={styles.notesText}>{item.notes}</Text> : null}

        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => openEdit(item)}>
            <Ionicons name="create-outline" size={16} color="#000" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDelete(item)}>
            <Ionicons name="trash-outline" size={16} color="#B91C1C" />
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AnimatedButton>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Progress</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={loadData}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={(
          <View>
            <AnimatedButton onPress={openCreate} style={styles.templateBanner}>
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerTitle}>Track your progress</Text>
                <Text style={styles.bannerSubtext}>Weight, waist, mood and notes in one log</Text>
              </View>
              <Ionicons name="add-circle-outline" size={34} color="#fff" />
            </AnimatedButton>

            {progressAlert && (
              <View style={[styles.alertCard, progressAlert.tone === 'warning' ? styles.alertWarning : styles.alertDanger]}>
                <View style={styles.alertHeader}>
                  <View style={styles.alertIconWrap}>
                    <Ionicons
                      name={progressAlert.tone === 'warning' ? 'trending-up-outline' : 'trending-down-outline'}
                      size={20}
                      color={progressAlert.tone === 'warning' ? '#92400E' : '#991B1B'}
                    />
                  </View>
                  <View style={styles.alertTextWrap}>
                    <Text style={styles.alertTitle}>{progressAlert.title}</Text>
                    <Text style={styles.alertMessage}>{progressAlert.message}</Text>
                  </View>
                </View>

                <View style={styles.alertActions}>
                  <TouchableOpacity style={styles.alertPrimaryButton} onPress={progressAlert.action}>
                    <Text style={styles.alertPrimaryButtonText}>{progressAlert.actionLabel}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Total Volume</Text>
                <Text style={styles.summaryValue}>{totalVolume} kg</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Logs</Text>
                <Text style={styles.summaryValue}>{entries.length}</Text>
              </View>
            </View>

            <View style={styles.summaryCardWide}>
              <View style={styles.summaryRowInline}>
                <View>
                  <Text style={styles.summaryLabel}>Latest Weight</Text>
                  <Text style={styles.latestValue}>{latestEntry ? `${latestEntry.weight} kg` : '--'}</Text>
                </View>
                <View style={styles.changeBadge}>
                  <Ionicons name="trending-up" size={16} color={weightChange !== null && weightChange > 0 ? '#B91C1C' : '#047857'} />
                  <Text style={styles.changeText}>
                    {weightChange === null
                      ? 'No comparison yet'
                      : `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg`}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyState}>
              <Ionicons name="stats-chart-outline" size={64} color="#E0E0E0" />
              <Text style={styles.emptyText}>No progress logs yet.</Text>
              <Text style={styles.emptySubText}>Create your first log to track weight, waist, notes and mood.</Text>
            </View>
          )
        }
        ListFooterComponent={<View style={{ height: 110 }} />}
      />

      <TouchableOpacity style={styles.fab} onPress={openCreate}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{editingId ? 'Edit Progress Log' : 'New Progress Log'}</Text>
            <Text style={styles.modalSubtitle}>Log a new body measurement or correct an existing one.</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="e.g. 66"
                value={weight}
                onChangeText={setWeight}
              />

              <Text style={styles.inputLabel}>Waist (inches)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="e.g. 30"
                value={waist}
                onChangeText={setWaist}
              />

              <Text style={styles.inputLabel}>Mood</Text>
              <View style={styles.moodWrap}>
                {moodOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.moodChip, mood === option && styles.moodChipActive]}
                    onPress={() => setMood(option)}
                  >
                    <Text style={[styles.moodChipText, mood === option && styles.moodChipTextActive]}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="Felt stronger today"
                value={notes}
                onChangeText={setNotes}
                multiline
              />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveText}>{editingId ? 'Save Changes' : 'Save Log'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    paddingTop: 16,
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
    paddingBottom: 0,
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
    marginBottom: 16,
  },
  alertCard: {
    marginBottom: 16,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  alertWarning: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  alertDanger: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.65)',
    marginRight: 12,
  },
  alertTextWrap: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 13,
    lineHeight: 18,
    color: '#374151',
  },
  alertActions: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  alertPrimaryButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  alertPrimaryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  bannerTextContainer: {
    flex: 1,
    paddingRight: 12,
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
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 4,
  },
  summaryCardWide: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 4,
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '700',
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000',
  },
  summaryRowInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  latestValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F9',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  changeText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
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
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  weightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  weightBadgeText: {
    marginLeft: 6,
    fontWeight: '800',
    color: '#000',
    fontSize: 12,
  },
  cardDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
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
  notesText: {
    fontSize: 14,
    color: '#111',
    lineHeight: 20,
    marginBottom: 14,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F9',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '800',
    color: '#000',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deleteText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '800',
    color: '#B91C1C',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#757575',
    marginTop: 6,
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000',
    marginBottom: 8,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: '#F7F7F9',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#000',
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  moodWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  moodChip: {
    backgroundColor: '#F7F7F9',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  moodChipActive: {
    backgroundColor: '#000',
  },
  moodChipText: {
    color: '#757575',
    fontSize: 12,
    fontWeight: '700',
  },
  moodChipTextActive: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F7F7F9',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    color: '#000',
    fontWeight: '800',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontWeight: '800',
  },
});
