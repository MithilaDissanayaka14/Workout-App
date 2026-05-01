
// Fit Schedule 
// Handles workout planning, tab-based viewing, and scheduling.

import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    FlatList,
    Modal,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WeeklyStatsCard } from '../components/WeeklyStatsCard';
import { ScheduleFormModal } from '../components/ScheduleFormModal';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/constants/api';

const { width } = Dimensions.get('window');
const PRIMARY_COLOR = '#000';
const SECONDARY_COLOR = '#333';

type TabType = 'TODAY' | 'UPCOMING' | 'COMPLETED';

export default function WorkoutScheduler() {
    // 1. STATE: Global UI and User data
    const router = useRouter();
    // State Management 
    const [schedules, setSchedules] = useState<any[]>([]);
    const [workoutPlans, setWorkoutPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentEditId, setCurrentEditId] = useState<string | null>(null);
    const [firstName, setFirstName] = useState('Athlete');
    const [userId, setUserId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('TODAY');
    const [showStats, setShowStats] = useState(false);

    // Toast state
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const toastOpacity = useRef(new Animated.Value(0)).current;
    const toastTranslateY = useRef(new Animated.Value(-100)).current;

    // Form states
    const [workoutName, setWorkoutName] = useState('');
    const [day, setDay] = useState(new Date().toISOString().split('T')[0]); // Default to current date (YYYY-MM-DD)
    const [time, setTime] = useState('06:00 PM');
    const [selectedHour, setSelectedHour] = useState('06');
    const [selectedMinute, setSelectedMinute] = useState('00');
    const [selectedPeriod, setSelectedPeriod] = useState('PM');
    const [location, setLocation] = useState('');
    const [type, setType] = useState('Strength');
    const [duration, setDuration] = useState('60 min');
    const [intensity, setIntensity] = useState('Medium');
    const [notes, setNotes] = useState('');

    // Calendar navigation state
    const [currentCalDate, setCurrentCalDate] = useState(new Date());

    // Picker states
    const [dayPickerVisible, setDayPickerVisible] = useState(false);
    const [timePickerVisible, setTimePickerVisible] = useState(false);
    const [planPickerVisible, setPlanPickerVisible] = useState(false);
    const [intensityPickerVisible, setIntensityPickerVisible] = useState(false);

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const times = [
        '12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '4:00 AM', '5:00 AM', '6:00 AM', '7:00 AM',
        '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM',
        '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM'
    ];
    const intensities = ['Low', 'Medium', 'High'];
    const types = ['Strength', 'Cardio', 'Yoga'];

    //  Lifecycle & Initial Data Fetch 
    useEffect(() => {
        loadUserData();
        fetchWorkoutPlans();
    }, []);

    const getCurrentDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    const formatDateDisplay = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        } catch (e) {
            return dateStr;
        }
    };

    // 2. USER: Loads profile from local storage
    const loadUserData = async () => {
        try {
            const name = await AsyncStorage.getItem('firstName');
            const uid = await AsyncStorage.getItem('userId');
            if (name) setFirstName(name);
            if (uid) {
                setUserId(uid);
                fetchSchedules(uid);
            } else {
                fetchSchedules();
            }
        } catch (e) { }
    };

    // 3. API: Fetches plans and schedules
    const fetchWorkoutPlans = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/workouts`);
            const data = await response.json();

            // Handle both array response and object { plans: [...] } response
            const plans = Array.isArray(data) ? data : (data.plans || []);

            if (Array.isArray(plans)) {
                const selectableItems: any[] = [];
                plans.forEach((plan: any) => {
                    // Flatten the plans into individual selectable exercises
                    if (plan.exercises && plan.exercises.length > 0) {
                        plan.exercises.forEach((ex: any, index: number) => {
                            selectableItems.push({
                                ...plan,
                                _id: `${plan._id}-${index}`,
                                displayName: ex.exerciseName,
                                planName: plan.planName,
                                dayInPlan: ex.day,
                                // Format the goal to show sets and reps for that specific exercise
                                goal: `${ex.sets} Sets • ${ex.repsOrDuration} (${plan.planName})`
                            });
                        });
                    } else {
                        selectableItems.push({
                            ...plan,
                            displayName: plan.planName,
                            goal: plan.goal
                        });
                    }
                });
                setWorkoutPlans(selectableItems);
            }
        } catch (error) {
            console.error('Plan fetch error:', error);
        }
    };

    // TIME: Keeps digital picker and DB in sync
    const syncTimeParts = (timeStr: string) => {
        try {
            const [h, rest] = timeStr.split(':');
            const [m, p] = rest.split(' ');
            setSelectedHour(h.padStart(2, '0'));
            setSelectedMinute(m.padStart(2, '0'));
            setSelectedPeriod(p);
        } catch (e) {
            setSelectedHour('06');
            setSelectedMinute('00');
            setSelectedPeriod('PM');
        }
    };

    // API: Fetches the user's private schedule
    const fetchSchedules = async (uid?: string) => {
        setLoading(true);
        try {
            const finalUid = uid || userId;
            const url = finalUid
                ? `${API_BASE_URL}/api/workout-schedules?userId=${finalUid}`
                : `${API_BASE_URL}/api/workout-schedules`;

            const response = await fetch(url);
            const data = await response.json();
            // Sort by date (YYYY-MM-DD)
            const sortedData = Array.isArray(data) ? data.sort((a, b) => a.day.localeCompare(b.day)) : [];
            setSchedules(sortedData);
        } catch (error) {
            console.error('Fetch error:', error);
            setSchedules([]);
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message: string) => {
        setToastMessage(message);
        setToastVisible(true);
        Animated.parallel([
            Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(toastTranslateY, { toValue: 0, duration: 400, useNativeDriver: true })
        ]).start();

        setTimeout(() => {
            hideToast();
        }, 3000);
    };

    const hideToast = () => {
        Animated.parallel([
            Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
            Animated.timing(toastTranslateY, { toValue: -100, duration: 400, useNativeDriver: true })
        ]).start(() => setToastVisible(false));
    };

    const handleOpenAddModal = () => {
        setIsEditing(false);
        setCurrentEditId(null);
        setWorkoutName('');
        setLocation('');
        setDay(getCurrentDate());
        setTime('06:00 PM');
        syncTimeParts('06:00 PM');
        setType('Strength');
        setDuration('60 min');
        setIntensity('Medium');
        setNotes('');
        setModalVisible(true);
    };

    // 4. STATS: Calculates weekly progress metrics
    const getWeeklyStats = () => {
        const todayStr = getCurrentDate();

        // Filter for workouts in the current week (Monday-Sunday)
        const now = new Date();
        const startOfWeek = new Date(now);
        const dayNum = now.getDay() || 7;
        startOfWeek.setDate(now.getDate() - dayNum + 1);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        // Completed: Workouts done specifically this week
        const completed = schedules.filter(s => {
            const d = new Date(s.day);
            return d >= startOfWeek && d <= endOfWeek && s.isCompleted;
        }).length;

        // Remaining: Sum of "Today" and "Upcoming" (all future uncompleted tasks)
        const remaining = schedules.filter(s => s.day >= todayStr && !s.isCompleted).length;

        const total = completed + remaining;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { completed, remaining, total, percentage };
    };

    const stats = getWeeklyStats();

    const handleEdit = (item: any) => {
        setIsEditing(true);
        setCurrentEditId(item._id);
        setWorkoutName(item.workoutName);
        setDay(item.day);
        setTime(item.time);
        syncTimeParts(item.time);
        setLocation(item.location);
        setType(item.type || 'Strength');
        setDuration(item.duration || '60 min');
        setIntensity(item.intensity || 'Medium');
        setNotes(item.notes || '');
        setModalVisible(true);
    };

    // 5. ACTIONS: Save, Edit, Delete, and Complete
    const handleAddWorkout = async () => {
        if (!workoutName || !location) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        const payload = {
            workoutName,
            day,
            time,
            location,
            type,
            duration,
            intensity,
            notes,
            userId // Include the user's ID so it saves to their account
        };
        const url = isEditing
            ? `${API_BASE_URL}/api/workout-schedules/${currentEditId}`
            : `${API_BASE_URL}/api/workout-schedules`;

        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setModalVisible(false);
                showToast(isEditing ? "Workout rescheduled successfully! 📅" : "Workout added to schedule! 💪");
                fetchSchedules();
            } else {
                const errorData = await response.json();
                Alert.alert('Error', errorData.error || 'Failed to save workout');
            }
        } catch (error) {
            console.error('Save workout error:', error);
            Alert.alert('Error', 'Something went wrong');
        }
    };

    const handleToggleComplete = async (item: any) => {
        const newStatus = !item.isCompleted;
        try {
            const response = await fetch(`${API_BASE_URL}/api/workout-schedules/${item._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isCompleted: newStatus })
            });
            if (response.ok) {
                if (newStatus) {
                    showToast(`${item.workoutName} completed! 🎉`);
                }
                fetchSchedules();
            }
        } catch (error) {
            console.error('Update status error:', error);
        }
    };

    const handleDelete = async (id: string) => {
        const performDelete = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/workout-schedules/${id}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    showToast("Workout removed from schedule. 🗑️");
                    fetchSchedules();
                    setModalVisible(false);
                }
            } catch (error) {
                console.error('Delete error:', error);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm("Are you sure you want to delete this workout?")) {
                performDelete();
            }
        } else {
            Alert.alert(
                "Delete Schedule",
                "Are you sure you want to delete this workout?",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: performDelete }
                ]
            );
        }
    };

    // 6. UI: Renders the individual workout cards
    const renderScheduleItem = ({ item }: { item: any }) => (
        <View style={styles.scheduleCard}>
            <View style={styles.cardHeaderRow}>
                <View style={[styles.accentBar, { backgroundColor: item.isCompleted ? '#E0E0E0' : PRIMARY_COLOR }]} />
                <View style={styles.headerTextContainer}>
                    <Text style={[styles.workoutNameText, item.isCompleted && styles.lineThroughText]}>{item.workoutName}</Text>
                    <Text style={styles.dayText}>{formatDateDisplay(item.day)} • {item.time}</Text>
                </View>
                {item.isCompleted && (
                    <View style={styles.completedBadge}>
                        <Text style={styles.completedBadgeText}>Success</Text>
                    </View>
                )}
            </View>

            <View style={styles.cardInfoRow}>
                <View style={styles.infoPill}>
                    <Ionicons name="location-outline" size={14} color="#666" />
                    <Text style={styles.pillText}>{item.location}</Text>
                </View>
                <View style={styles.infoPill}>
                    <Ionicons name="timer-outline" size={14} color="#666" />
                    <Text style={styles.pillText}>{item.duration || '60m'}</Text>
                </View>
                <View style={[styles.infoPill, { backgroundColor: item.intensity === 'High' ? '#FFEBEB' : '#F0F0F0' }]}>
                    <Text style={[styles.pillText, { color: item.intensity === 'High' ? '#FF0000' : '#666' }]}>{item.intensity || 'Med'}</Text>
                </View>
            </View>

            {item.notes ? (
                <Text style={styles.notesText} numberOfLines={1}>"{item.notes}"</Text>
            ) : null}

            <View style={styles.cardButtonsRow}>
                {!item.isCompleted ? (
                    <TouchableOpacity
                        style={styles.completeButton}
                        onPress={() => handleToggleComplete(item)}
                    >
                        <Ionicons name="checkmark" size={18} color="#fff" />
                        <Text style={styles.completeButtonText}>Complete</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.completeButton, { backgroundColor: '#E8F5E9' }]}
                        onPress={() => handleToggleComplete(item)}
                    >
                        <Ionicons name="refresh-outline" size={18} color="#2E7D32" />
                        <Text style={[styles.completeButtonText, { color: '#2E7D32' }]}>Redo</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={styles.rescheduleButton}
                    onPress={() => handleEdit(item)}
                >
                    <Ionicons name="calendar-outline" size={18} color="#000" />
                    <Text style={styles.rescheduleButtonText}>Reschedule</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.deleteButtonSmall}
                    onPress={() => handleDelete(item._id)}
                >
                    <Ionicons name="trash-outline" size={18} color="#FF0000" />
                </TouchableOpacity>
            </View>
        </View>
    );

    // FILTER: Sorts workouts into Today, Upcoming, and Completed
    // LOGIC: Filters workouts by Today/Upcoming/Completed
    const getFilteredSchedules = () => {
        const today = getCurrentDate();
        if (activeTab === 'TODAY') {
            // Sessions scheduled specifically for today
            return schedules.filter(s => s.day === today && !s.isCompleted);
        } else if (activeTab === 'UPCOMING') {
            // Sessions scheduled for any date in the future
            return schedules.filter(s => s.day > today && !s.isCompleted);
        } else if (activeTab === 'COMPLETED') {
            // All finished sessions
            return schedules.filter(s => s.isCompleted);
        }
        return [];
    };

    const filteredSchedules = getFilteredSchedules();

    // 7. RENDER: The main screen layout
    return (
        <SafeAreaView edges={['bottom']} style={styles.container}>
            <View style={styles.topHeader}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerNavRow}>
                        <TouchableOpacity onPress={() => router.replace('/home')} style={styles.headerIconButton}>
                            <Ionicons name="arrow-back" size={24} color="#000" />
                        </TouchableOpacity>
                        <View style={styles.headerTitleContainer}>
                            <Text style={[styles.headerMainTitle, { color: '#000', fontStyle: 'italic' }]}>Workout Schedule</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.headerIconButton}
                            onPress={() => setShowStats(!showStats)}
                        >
                            <View style={[styles.headerIconBox, { marginRight: 0, backgroundColor: showStats ? '#F5F5F5' : '#fff', borderColor: '#EEE', borderWidth: 1 }]}>
                                <Ionicons name="stats-chart" size={20} color="#000" />
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.maroonTabContainer}>
                        <Text style={styles.maroonTabSubtitle}>Master your routine, {firstName}! 🔥</Text>

                        <View style={styles.tabContainer}>
                            {(['TODAY', 'UPCOMING', 'COMPLETED'] as TabType[]).map((tab) => (
                                <TouchableOpacity
                                    key={tab}
                                    style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
                                    onPress={() => setActiveTab(tab)}
                                >
                                    <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                        {tab}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </SafeAreaView>
            </View>

            {showStats && <WeeklyStatsCard stats={stats} />}

            {toastVisible && (
                <Animated.View style={[styles.toastContainer, { opacity: toastOpacity, transform: [{ translateY: toastTranslateY }] }]}>
                    <View style={styles.toastContent}>
                        <View style={styles.toastIconWrapper}>
                            <Ionicons name="checkmark-circle" size={20} color="#000" />
                        </View>
                        <Text style={toastTextStyles.toastText}>{toastMessage}</Text>
                    </View>
                </Animated.View>
            )}

            <View style={styles.contentContainer}>
                {loading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                    </View>
                ) : (
                    <FlatList
                        data={filteredSchedules}
                        keyExtractor={(item) => item._id}
                        renderItem={renderScheduleItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons
                                    name={activeTab === 'COMPLETED' ? "checkmark-done-outline" : "calendar-outline"}
                                    size={80}
                                    color="#E0E0E0"
                                />
                                <Text style={styles.emptyTitle}>
                                    {activeTab === 'TODAY' ? "No workouts for today" :
                                        activeTab === 'UPCOMING' ? "No upcoming workouts" :
                                            "No completed workouts yet"}
                                </Text>
                                <Text style={styles.emptySubtitle}>
                                    {activeTab === 'COMPLETED' ? "Complete your first workout to see it here!" : "Stay consistent and keep pushing!"}
                                </Text>
                            </View>
                        }
                    />
                )}
            </View>

            <TouchableOpacity style={styles.fab} onPress={handleOpenAddModal}>
                <Ionicons name="add" size={32} color="#fff" />
            </TouchableOpacity>

            <ScheduleFormModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSave={handleAddWorkout}
                onDelete={handleDelete}
                isEditing={isEditing}
                currentEditId={currentEditId}
                workoutName={workoutName}
                setWorkoutName={setWorkoutName}
                day={day}
                setDay={setDay}
                time={time}
                setTime={setTime}
                location={location}
                setLocation={setLocation}
                type={type}
                setType={setType}
                duration={duration}
                setDuration={setDuration}
                intensity={intensity}
                setIntensity={setIntensity}
                notes={notes}
                setNotes={setNotes}
                intensityPickerVisible={intensityPickerVisible}
                setIntensityPickerVisible={setIntensityPickerVisible}
                planPickerVisible={planPickerVisible}
                setPlanPickerVisible={setPlanPickerVisible}
                dayPickerVisible={dayPickerVisible}
                setDayPickerVisible={setDayPickerVisible}
                timePickerVisible={timePickerVisible}
                setTimePickerVisible={setTimePickerVisible}
                workoutPlans={workoutPlans}
                intensities={intensities}
                types={types}
                currentCalDate={currentCalDate}
                setCurrentCalDate={setCurrentCalDate}
                selectedHour={selectedHour}
                setSelectedHour={setSelectedHour}
                selectedMinute={selectedMinute}
                setSelectedMinute={setSelectedMinute}
                selectedPeriod={selectedPeriod}
                setSelectedPeriod={setSelectedPeriod}
                MAROON={PRIMARY_COLOR}
                formatDateDisplay={formatDateDisplay}
                getCurrentDate={getCurrentDate}
            />
        </SafeAreaView>
    );
}

const toastTextStyles = StyleSheet.create({
    toastText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
    }
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    topHeader: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingBottom: 30,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerNavRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 10,
        marginBottom: 15,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIconBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        padding: 8,
        borderRadius: 12,
        marginRight: 12,
    },
    headerIconButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerMainTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#eee',
        fontWeight: '500',
    },
    maroonTabContainer: {
        backgroundColor: PRIMARY_COLOR,
        marginHorizontal: 15,
        marginTop: 15,
        borderRadius: 25,
        padding: 20,
        paddingBottom: 15,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
    },
    maroonTabSubtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
        marginBottom: 20,
        textAlign: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 15,
        padding: 5,
    },
    toastContainer: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        zIndex: 1000,
        alignItems: 'center',
    },
    toastContent: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
        minWidth: 200,
    },
    toastIconWrapper: {
        marginRight: 12,
    },
    contentContainer: {
        flex: 1,
        marginTop: -30,
        backgroundColor: '#fff',
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        paddingTop: 10,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
    },
    activeTabButton: {
        backgroundColor: '#fff',
    },
    tabText: {
        fontSize: 12,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.7)',
    },
    activeTabText: {
        color: PRIMARY_COLOR,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#666',
        marginTop: 20,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 100,
    },
    scheduleCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 18,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 3,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    accentBar: {
        width: 4,
        height: 48,
        borderRadius: 2,
        marginRight: 15,
        backgroundColor: PRIMARY_COLOR,
    },
    headerTextContainer: {
        flex: 1,
    },
    workoutNameText: {
        fontSize: 22,
        fontWeight: '800',
        color: '#000',
        letterSpacing: -0.5,
    },
    lineThroughText: {
        textDecorationLine: 'line-through',
        color: '#777',
    },
    dayText: {
        fontSize: 15,
        color: '#555',
        marginTop: 2,
        fontWeight: '600',
    },
    completedBadge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    completedBadgeText: {
        color: '#2E7D32',
        fontSize: 11,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    cardInfoRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 15,
        paddingLeft: 19,
        gap: 8,
    },
    infoPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    pillText: {
        fontSize: 13,
        color: '#666',
        marginLeft: 5,
        fontWeight: '700',
    },
    notesText: {
        fontSize: 14,
        color: '#777',
        fontStyle: 'italic',
        paddingLeft: 19,
        marginBottom: 15,
    },
    cardButtonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        marginTop: 5,
    },
    completeButton: {
        flex: 1.2,
        backgroundColor: '#00C851',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 16,
    },
    completeButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '900',
        marginLeft: 5,
    },
    rescheduleButton: {
        flex: 1.2,
        backgroundColor: '#F7F7F7',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    rescheduleButtonText: {
        color: '#000',
        fontSize: 12,
        fontWeight: '800',
        marginLeft: 5,
    },
    deleteButtonSmall: {
        backgroundColor: '#FFF5F5',
        padding: 14,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 25,
        backgroundColor: PRIMARY_COLOR,
        width: 65,
        height: 65,
        borderRadius: 32.5,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: PRIMARY_COLOR,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 12,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingHorizontal: 25,
        paddingTop: 12,
        paddingBottom: 40,
        height: '85%',
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#EEE',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#000',
        marginBottom: 25,
        letterSpacing: -1,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '900',
        color: '#666',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        backgroundColor: '#FBFBFB',
        borderWidth: 1,
        borderColor: '#F0F0F0',
        borderRadius: 16,
        paddingHorizontal: 18,
        paddingVertical: 16,
        fontSize: 16,
        marginBottom: 22,
        color: '#000',
        fontWeight: '600',
    },
    inputIntegrated: {
        backgroundColor: '#FBFBFB',
        borderWidth: 1,
        borderColor: '#F0F0F0',
        borderRadius: 16,
        paddingLeft: 18,
        paddingRight: 100, // Make room for the button
        paddingVertical: 16,
        fontSize: 16,
        color: '#000',
        fontWeight: '600',
    },
    inputWrapper: {
        position: 'relative',
        marginBottom: 22,
    },
    planPickerIcon: {
        position: 'absolute',
        right: 8,
        top: 8,
        bottom: 8,
        backgroundColor: 'rgba(128, 0, 0, 0.05)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    customPicker: {
        backgroundColor: '#FBFBFB',
        borderWidth: 1,
        borderColor: '#F0F0F0',
        borderRadius: 16,
        paddingHorizontal: 18,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 22,
    },
    pickerValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '700',
    },
    row: {
        flexDirection: 'row',
    },
    typeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 35,
        marginTop: 5,
        gap: 8,
    },
    typeButton: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    activeTypeButton: {
        backgroundColor: PRIMARY_COLOR,
    },
    typeButtonText: {
        fontSize: 13,
        fontWeight: '900',
        color: '#888',
    },
    activeTypeButtonText: {
        color: '#fff',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        gap: 10,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: 'center',
    },
    deleteButtonForm: {
        flex: 1,
        backgroundColor: '#FFF5F5',
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFE0E0',
    },
    submitButton: {
        flex: 2,
        backgroundColor: PRIMARY_COLOR,
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#666',
    },
    deleteButtonFormText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#FF4444',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    subModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    subModalContent: {
        backgroundColor: '#fff',
        width: '92%',
        borderRadius: 30,
        paddingHorizontal: 20,
        paddingTop: 30,
        paddingBottom: 20,
        maxHeight: '90%',
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.2,
        shadowRadius: 30,
        elevation: 20,
    },
    subModalTitle: {
        fontSize: 20,
        fontWeight: '900',
        marginBottom: 20,
        textAlign: 'center',
        color: '#000',
        letterSpacing: -0.5,
    },
    pickerItem: {
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#F8F8F8',
    },
    pickerItemText: {
        fontSize: 16,
        textAlign: 'center',
        color: '#333',
    },
    columnLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#666',
        textTransform: 'uppercase',
        marginBottom: 10,
    },
    timePartButton: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
        borderRadius: 12,
    },
    activeTimePart: {
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        borderColor: PRIMARY_COLOR,
    },
    timePartText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    activeTimePartText: {
        color: PRIMARY_COLOR,
        fontWeight: '900',
    },
    statsContainer: {
        paddingHorizontal: 20,
        marginTop: -30,
        marginBottom: 20,
    },
    statsCard: {
        backgroundColor: '#FFF3E0',
        borderRadius: 25,
        padding: 22,
        shadowColor: '#E65100',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 8,
    },
    statsTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#BF360C',
        marginBottom: 18,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 18,
    },
    statItem: {
        flex: 1,
    },
    statValue: {
        fontSize: 34,
        fontWeight: '900',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#8D6E63',
        textTransform: 'uppercase',
    },
    progressBarBg: {
        height: 10,
        backgroundColor: '#fff',
        borderRadius: 5,
        width: '100%',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#FF6D00',
        borderRadius: 5,
    },
});
