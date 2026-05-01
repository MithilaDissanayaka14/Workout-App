import React from 'react';
import { 
    View, Text, Modal, ScrollView, TextInput, TouchableOpacity, 
    StyleSheet, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ScheduleFormModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: () => void;
    onDelete: (id: string) => void;
    isEditing: boolean;
    currentEditId: string | null;
    
    // State & Setters
    workoutName: string;
    setWorkoutName: (val: string) => void;
    day: string;
    setDay: (val: string) => void;
    time: string;
    setTime: (val: string) => void;
    location: string;
    setLocation: (val: string) => void;
    type: string;
    setType: (val: string) => void;
    duration: string;
    setDuration: (val: string) => void;
    intensity: string;
    setIntensity: (val: string) => void;
    notes: string;
    setNotes: (val: string) => void;
    
    // Picker Visibility States
    intensityPickerVisible: boolean;
    setIntensityPickerVisible: (val: boolean) => void;
    planPickerVisible: boolean;
    setPlanPickerVisible: (val: boolean) => void;
    dayPickerVisible: boolean;
    setDayPickerVisible: (val: boolean) => void;
    timePickerVisible: boolean;
    setTimePickerVisible: (val: boolean) => void;
    
    // Data for Pickers
    workoutPlans: any[];
    intensities: string[];
    types: string[];
    currentCalDate: Date;
    setCurrentCalDate: (val: Date) => void;
    
    // Time Selection State
    selectedHour: string;
    setSelectedHour: (val: string) => void;
    selectedMinute: string;
    setSelectedMinute: (val: string) => void;
    selectedPeriod: string;
    setSelectedPeriod: (val: string) => void;
    
    // Theme & Helpers
    MAROON: string;
    formatDateDisplay: (date: string) => string;
    getCurrentDate: () => string;
}

export const ScheduleFormModal: React.FC<ScheduleFormModalProps> = (p) => {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={p.visible}
            onRequestClose={p.onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHandle} />

                    <Text style={styles.modalTitle}>{p.isEditing ? "Reschedule Session" : "Schedule Workout"}</Text>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text style={styles.inputLabel}>Session Name</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.inputIntegrated}
                                placeholder="e.g., Heavy Squats, Morning Yoga"
                                placeholderTextColor="#999"
                                value={p.workoutName}
                                onChangeText={p.setWorkoutName}
                            />
                            {p.workoutPlans.length > 0 && (
                                <TouchableOpacity
                                    style={styles.planPickerIcon}
                                    onPress={() => p.setPlanPickerVisible(true)}
                                >
                                    <Ionicons name="list" size={20} color={p.MAROON} />
                                    <Text style={{ fontSize: 10, fontWeight: '800', color: p.MAROON, marginLeft: 4 }}>PLANS</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={styles.row}>
                            <View style={{ flex: 1.5, marginRight: 10 }}>
                                <Text style={styles.inputLabel}>Date</Text>
                                <TouchableOpacity
                                    style={styles.customPicker}
                                    onPress={() => {
                                        p.setCurrentCalDate(new Date(p.day));
                                        p.setDayPickerVisible(true);
                                    }}
                                >
                                    <Text style={[styles.pickerValue, { fontSize: 13 }]}>{p.formatDateDisplay(p.day)}</Text>
                                    <Ionicons name="calendar" size={16} color={p.MAROON} />
                                </TouchableOpacity>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>Time</Text>
                                <TouchableOpacity
                                    style={styles.customPicker}
                                    onPress={() => p.setTimePickerVisible(true)}
                                >
                                    <Text style={styles.pickerValue}>{p.time}</Text>
                                    <Ionicons name="time-outline" size={16} color="#666" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <Text style={styles.inputLabel}>Duration</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g., 45 min"
                                    placeholderTextColor="#999"
                                    value={p.duration}
                                    onChangeText={p.setDuration}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>Intensity</Text>
                                <TouchableOpacity
                                    style={styles.customPicker}
                                    onPress={() => p.setIntensityPickerVisible(true)}
                                >
                                    <Text style={styles.pickerValue}>{p.intensity}</Text>
                                    <Ionicons name="flash-outline" size={16} color="#666" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <Text style={styles.inputLabel}>Location</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Gym, Home, Outdoor"
                            placeholderTextColor="#999"
                            value={p.location}
                            onChangeText={p.setLocation}
                        />

                        <Text style={styles.inputLabel}>Personal Notes</Text>
                        <TextInput
                            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                            placeholder="What's the focus of this session?"
                            placeholderTextColor="#999"
                            value={p.notes}
                            onChangeText={p.setNotes}
                            multiline
                        />

                        <Text style={styles.inputLabel}>Activity Type</Text>
                        <View style={styles.typeContainer}>
                            {p.types.map((t) => (
                                <TouchableOpacity
                                    key={t}
                                    style={[
                                        styles.typeButton,
                                        p.type === t && styles.activeTypeButton
                                    ]}
                                    onPress={() => p.setType(t)}
                                >
                                    <Text style={[
                                        styles.typeButtonText,
                                        p.type === t && styles.activeTypeButtonText
                                    ]}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={p.onClose}
                            >
                                <Text style={styles.cancelButtonText}>Close</Text>
                            </TouchableOpacity>

                            {p.isEditing && (
                                <TouchableOpacity
                                    style={styles.deleteButtonForm}
                                    onPress={() => p.onDelete(p.currentEditId!)}
                                >
                                    <Text style={styles.deleteButtonFormText}>Delete</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={styles.submitButton}
                                onPress={p.onSave}
                            >
                                <Text style={styles.submitButtonText}>{p.isEditing ? "Save Changes" : "Confirm Schedule"}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </View>

            {/* --- SUB MODALS (Pickers) --- */}

            {/* Intensity Picker */}
            <Modal visible={p.intensityPickerVisible} transparent={true} animationType="fade">
                <TouchableOpacity
                    style={styles.subModalOverlay}
                    onPress={() => p.setIntensityPickerVisible(false)}
                >
                    <View style={styles.subModalContent}>
                        <Text style={styles.subModalTitle}>Select Intensity</Text>
                        {p.intensities.map(i => (
                            <TouchableOpacity
                                key={i}
                                style={styles.pickerItem}
                                onPress={() => { p.setIntensity(i); p.setIntensityPickerVisible(false); }}
                            >
                                <Text style={[styles.pickerItemText, p.intensity === i && { color: p.MAROON, fontWeight: '700' }]}>{i}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Plan Picker */}
            <Modal visible={p.planPickerVisible} transparent={true} animationType="fade">
                <TouchableOpacity
                    style={styles.subModalOverlay}
                    onPress={() => p.setPlanPickerVisible(false)}
                >
                    <View style={styles.subModalContent}>
                        <Text style={styles.subModalTitle}>Your Workout Plans</Text>
                        <ScrollView style={{ maxHeight: 400 }}>
                            {p.workoutPlans.map(plan => (
                                <TouchableOpacity
                                    key={plan._id}
                                    style={styles.pickerItem}
                                    onPress={() => { p.setWorkoutName(plan.displayName); p.setPlanPickerVisible(false); }}
                                >
                                    <View>
                                        <Text style={[styles.pickerItemText, { textAlign: 'left', fontWeight: '700' }]}>{plan.displayName}</Text>
                                        <Text style={{ fontSize: 12, color: '#888' }}>{plan.goal}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity
                                style={[styles.pickerItem, { backgroundColor: '#F9F9F9' }]}
                                onPress={() => { p.setWorkoutName(''); p.setPlanPickerVisible(false); }}
                            >
                                <Text style={[styles.pickerItemText, { color: p.MAROON, fontWeight: '700' }]}>Custom Session</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Date Picker (Calendar) */}
            <Modal visible={p.dayPickerVisible} transparent={true} animationType="fade">
                <TouchableOpacity
                    style={styles.subModalOverlay}
                    onPress={() => p.setDayPickerVisible(false)}
                >
                    <View style={[styles.subModalContent, { width: '90%', paddingBottom: 25 }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <TouchableOpacity onPress={() => {
                                const d = new Date(p.currentCalDate);
                                d.setMonth(d.getMonth() - 1);
                                p.setCurrentCalDate(d);
                            }}>
                                <Ionicons name="chevron-back" size={24} color={p.MAROON} />
                            </TouchableOpacity>
                            <Text style={{ fontSize: 18, fontWeight: '800' }}>
                                {p.currentCalDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </Text>
                            <TouchableOpacity onPress={() => {
                                const d = new Date(p.currentCalDate);
                                d.setMonth(d.getMonth() + 1);
                                p.setCurrentCalDate(d);
                            }}>
                                <Ionicons name="chevron-forward" size={24} color={p.MAROON} />
                            </TouchableOpacity>
                        </View>

                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                <Text key={d} style={{ width: '14.2%', textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#999', marginBottom: 10 }}>{d}</Text>
                            ))}
                            {(() => {
                                const year = p.currentCalDate.getFullYear();
                                const month = p.currentCalDate.getMonth();
                                const firstDay = new Date(year, month, 1).getDay();
                                const daysInMonth = new Date(year, month + 1, 0).getDate();

                                const cells = [];
                                for (let i = 0; i < firstDay; i++) cells.push(<View key={`empty-${i}`} style={{ width: '14.2%', height: 40 }} />);

                                for (let d = 1; d <= daysInMonth; d++) {
                                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                    const isSelected = p.day === dateStr;
                                    const isToday = p.getCurrentDate() === dateStr;

                                    cells.push(
                                        <TouchableOpacity
                                            key={d}
                                            style={{
                                                width: '14.2%',
                                                height: 40,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                backgroundColor: isSelected ? p.MAROON : isToday ? 'rgba(128, 0, 0, 0.1)' : 'transparent',
                                                borderRadius: 10
                                            }}
                                            onPress={() => {
                                                p.setDay(dateStr);
                                                p.setDayPickerVisible(false);
                                            }}
                                        >
                                            <Text style={{
                                                color: isSelected ? '#fff' : isToday ? p.MAROON : '#333',
                                                fontWeight: isSelected || isToday ? '800' : '400'
                                            }}>{d}</Text>
                                        </TouchableOpacity>
                                    );
                                }
                                return cells;
                            })()}
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Time Picker (Digital) */}
            <Modal visible={p.timePickerVisible} transparent={true} animationType="fade">
                <TouchableOpacity
                    style={styles.subModalOverlay}
                    onPress={() => p.setTimePickerVisible(false)}
                >
                    <View style={styles.subModalContent}>
                        <Text style={styles.subModalTitle}>Schedule Time</Text>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: 180 }}>
                            {/* Hour Column */}
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={styles.columnLabel}>Time</Text>
                                <ScrollView showsVerticalScrollIndicator={false}>
                                    {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(h => (
                                        <TouchableOpacity
                                            key={h}
                                            style={[styles.timePartButton, p.selectedHour === h && styles.activeTimePart]}
                                            onPress={() => {
                                                p.setSelectedHour(h);
                                                const newTime = `${h}:${p.selectedMinute} ${p.selectedPeriod}`;
                                                p.setTime(newTime);
                                            }}
                                        >
                                            <Text style={[styles.timePartText, p.selectedHour === h && styles.activeTimePartText]}>{h}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Minute Column */}
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={styles.columnLabel}>Minute</Text>
                                <ScrollView showsVerticalScrollIndicator={false}>
                                    {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
                                        <TouchableOpacity
                                            key={m}
                                            style={[styles.timePartButton, p.selectedMinute === m && styles.activeTimePart]}
                                            onPress={() => {
                                                p.setSelectedMinute(m);
                                                const newTime = `${p.selectedHour}:${m} ${p.selectedPeriod}`;
                                                p.setTime(newTime);
                                            }}
                                        >
                                            <Text style={[styles.timePartText, p.selectedMinute === m && styles.activeTimePartText]}>{m}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Period Column */}
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={styles.columnLabel}>AM/PM</Text>
                                <View>
                                    {['AM', 'PM'].map(per => (
                                        <TouchableOpacity
                                            key={per}
                                            style={[styles.timePartButton, { height: 60 }, p.selectedPeriod === per && styles.activeTimePart]}
                                            onPress={() => {
                                                p.setSelectedPeriod(per);
                                                const newTime = `${p.selectedHour}:${p.selectedMinute} ${per}`;
                                                p.setTime(newTime);
                                            }}
                                        >
                                            <Text style={[styles.timePartText, p.selectedPeriod === per && styles.activeTimePartText]}>{per}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.submitButton, { marginTop: 20, width: '100%', flex: 0 }]}
                            onPress={() => p.setTimePickerVisible(false)}
                        >
                            <Text style={styles.submitButtonText}>Confirm Time</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </Modal>
    );
};

const styles = StyleSheet.create({
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
        paddingRight: 100,
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
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
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
        backgroundColor: '#000',
    },
    typeButtonText: {
        fontSize: 12,
        color: '#888',
        fontWeight: '700',
    },
    activeTypeButtonText: {
        color: '#fff',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    submitButton: {
        flex: 2,
        backgroundColor: '#000',
        paddingVertical: 18,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '900',
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        paddingVertical: 18,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 15,
        fontWeight: '700',
    },
    deleteButtonForm: {
        flex: 1,
        backgroundColor: '#FFF5F5',
        paddingVertical: 18,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#FFE0E0',
    },
    deleteButtonFormText: {
        color: '#FF0000',
        fontSize: 15,
        fontWeight: '800',
    },
    subModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    subModalContent: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 30,
        padding: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
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
        borderColor: '#000',
    },
    timePartText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    activeTimePartText: {
        color: '#000',
        fontWeight: '900',
    },
});
