import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, useWindowDimensions, SafeAreaView, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Types ---
type ViewState = 'DASHBOARD' | 'ADD_MEALS' | 'LOG_FORM' | 'REPORT' | 'HYDRATION';
type MealType = 'Breakfast' | 'Lunch' | 'Snack' | 'Dinner';

interface MealLog {
  _id?: string;
  items: string;
  mealType: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  date: string;
}

interface DailyStats {
  date: string;
  total: number;
}

export default function NutritionScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [loading, setLoading] = useState(false);

  // Form State
  const [selectedMealType, setSelectedMealType] = useState<MealType>('Breakfast');
  const [foodName, setFoodName] = useState('');
  const [caloriesInput, setCaloriesInput] = useState('');
  const [carbsInput, setCarbsInput] = useState('');
  const [proteinInput, setProteinInput] = useState('');
  const [fatInput, setFatInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Dashboard Stats
  const [todayLogs, setTodayLogs] = useState<MealLog[]>([]);
  const [totals, setTotals] = useState({ cal: 0, carbs: 0, protein: 0, fat: 0 });
  const [stats, setStats] = useState<DailyStats[]>([]);
  const [waterTotal, setWaterTotal] = useState(0);
  const [waterStats, setWaterStats] = useState<DailyStats[]>([]);
  const [waterInput, setWaterInput] = useState('');
  const [mealErrors, setMealErrors] = useState<{ foodName?: string; calories?: string; protein?: string; carbs?: string; fat?: string }>({});
  const [waterError, setWaterError] = useState<string | null>(null);

  // Date State
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Helper to extract ID string robustly
  const extractId = (log: MealLog | any): string | null => {
    if (!log) return null;
    const rawId = log._id || log.id;
    if (!rawId) return null;

    if (typeof rawId === 'string') return rawId.trim();
    if (typeof rawId === 'object' && rawId.$oid) return rawId.$oid.trim();
    if (typeof rawId === 'object' && typeof rawId.toString === 'function') {
      const str = rawId.toString();
      return str.includes('object Object') ? null : str.trim();
    }
    return String(rawId).trim();
  };

  const getAuthHeader = async () => {
    const token = await AsyncStorage.getItem('userToken');
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  };

  useEffect(() => {
    fetchLogs();
    fetchWaterLogs();
    if (currentView === 'REPORT') {
      fetchStats();
    }
    if (currentView === 'REPORT' || currentView === 'HYDRATION') {
      fetchWaterStats();
    }
  }, [selectedDate, currentView]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeader();
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await fetch(`${API_BASE_URL}/api/diet/log?date=${dateStr}`, { headers });
      const data = await response.json();
      if (data.logs) {
        setTodayLogs(data.logs);
        calculateTotals(data.logs);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const headers = await getAuthHeader();
      const response = await fetch(`${API_BASE_URL}/api/diet/stats`, { headers });
      const data = await response.json();
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchWaterLogs = async () => {
    try {
      const headers = await getAuthHeader();
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await fetch(`${API_BASE_URL}/api/water/log?date=${dateStr}`, { headers });
      const data = await response.json();
      if (data.total !== undefined) {
        setWaterTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch water logs:', error);
    }
  };

  const fetchWaterStats = async () => {
    try {
      const headers = await getAuthHeader();
      const response = await fetch(`${API_BASE_URL}/api/water/stats`, { headers });
      const data = await response.json();
      if (data.stats) {
        setWaterStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch water stats:', error);
    }
  };

  const renderChartGrid = () => (
    <View style={styles.gridLineContainer}>
      <View style={styles.gridLine} />
      <View style={styles.gridLine} />
      <View style={[styles.gridLine, { borderStyle: 'solid', backgroundColor: '#E0E0E0' }]} />
      <View style={styles.gridLine} />
      <View style={styles.gridLine} />
    </View>
  );

  const validateWaterForm = (amount: number) => {
    if (!waterInput.trim()) {
      setWaterError('Please enter an amount');
      return false;
    }
    if (isNaN(amount) || amount <= 0) {
      setWaterError('Please enter a valid amount');
      return false;
    }
    setWaterError(null);
    return true;
  };

  const logWater = async (amount: number, isCup = false) => {
    if (!isCup && !validateWaterForm(amount)) return;
    
    try {
      setLoading(true);
      const headers = await getAuthHeader();
      const response = await fetch(`${API_BASE_URL}/api/water/log`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount,
          date: selectedDate.toISOString(),
        }),
      });
      if (response.ok) {
        fetchWaterLogs();
        setWaterInput('');
        setWaterError(null);
        if (currentView === 'REPORT' || currentView === 'HYDRATION') {
          fetchWaterStats();
        }
      }
    } catch (error) {
      console.error('Failed to log water:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (logs: MealLog[]) => {
    const newTotals = logs.reduce((acc, log) => ({
      cal: acc.cal + (log.calories || 0),
      carbs: acc.carbs + (log.carbs || 0),
      protein: acc.protein + (log.protein || 0),
      fat: acc.fat + (log.fat || 0),
    }), { cal: 0, carbs: 0, protein: 0, fat: 0 });
    setTotals(newTotals);
  };

  const handleAddPress = (type: MealType) => {
    setSelectedMealType(type);
    setEditingId(null);
    setFoodName('');
    setCaloriesInput('');
    setCarbsInput('');
    setProteinInput('');
    setFatInput('');
    setMealErrors({});
    setCurrentView('LOG_FORM');
  };

  const handleEdit = (log: MealLog) => {
    const id = extractId(log);
    setEditingId(id);
    setSelectedMealType(log.mealType as MealType);
    setFoodName(log.items);
    setCaloriesInput(String(log.calories));
    setCarbsInput(String(log.carbs));
    setProteinInput(String(log.protein));
    setFatInput(String(log.fat));
    setMealErrors({});
    setCurrentView('LOG_FORM');
  };

  const handleDelete = async (log: MealLog) => {
    const logId = extractId(log);

    console.log('[FRONTEND] Attempting to delete log:', { log, logId });

    if (!logId) {
      const msg = `No ID found for this log.\nKeys: ${Object.keys(log).join(', ')}`;
      console.error('[FRONTEND] ' + msg);
      Alert.alert('Debug Error', msg);
      return;
    }

    const performDelete = async () => {
      try {
        setLoading(true);
        const headers = await getAuthHeader();
        const url = `${API_BASE_URL}/api/diet/log/${logId}`;
        console.log('[FRONTEND] Sending DELETE request to:', url);

        const response = await fetch(url, {
          method: 'DELETE',
          headers: { ...headers, 'Accept': 'application/json' }
        });

        const data = await response.json().catch(() => ({}));
        console.log('[FRONTEND] Delete response:', { status: response.status, data });

        if (response.ok) {
          await fetchLogs();
        } else {
          const errorMsg = data.details
            ? `${data.error}: ${data.details}`
            : (data.error || 'Failed to delete log');

          Alert.alert('Server Error', `Status: ${response.status}\nMessage: ${errorMsg}`);
        }
      } catch (e: any) {
        console.error('[FRONTEND] Delete error:', e);
        Alert.alert('Connection Error', `URL: ${API_BASE_URL}/api/diet/log/${logId}\nError: ${e.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this meal log?')) {
        performDelete();
      }
    } else {
      Alert.alert('Delete Log', 'Are you sure you want to delete this meal log?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: performDelete }
      ]);
    }
  };
  const validateMealForm = () => {
    const newErrors: any = {};
    if (!foodName.trim()) newErrors.foodName = 'Please enter what you ate';
    
    const cal = parseFloat(caloriesInput);
    if (!caloriesInput.trim()) newErrors.calories = 'Required';
    else if (isNaN(cal) || cal < 0) newErrors.calories = 'Invalid';

    const pro = parseFloat(proteinInput);
    if (!proteinInput.trim()) newErrors.protein = 'Required';
    else if (isNaN(pro) || pro < 0) newErrors.protein = 'Invalid';

    const crb = parseFloat(carbsInput);
    if (!carbsInput.trim()) newErrors.carbs = 'Required';
    else if (isNaN(crb) || crb < 0) newErrors.carbs = 'Invalid';

    const ft = parseFloat(fatInput);
    if (!fatInput.trim()) newErrors.fat = 'Required';
    else if (isNaN(ft) || ft < 0) newErrors.fat = 'Invalid';

    setMealErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateMealForm()) return;

    try {
      setLoading(true);
      const headers = await getAuthHeader();
      const url = editingId
        ? `${API_BASE_URL}/api/diet/log/${editingId}`
        : `${API_BASE_URL}/api/diet/log`;
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          items: foodName,
          mealType: selectedMealType,
          calories: parseFloat(caloriesInput) || 0,
          carbs: parseFloat(carbsInput) || 0,
          protein: parseFloat(proteinInput) || 0,
          fat: parseFloat(fatInput) || 0,
          date: selectedDate.toISOString(),
        }),
      });

      if (response.ok) {
        setFoodName('');
        setCaloriesInput('');
        setCarbsInput('');
        setProteinInput('');
        setFatInput('');
        setEditingId(null);
        setMealErrors({});
        setCurrentView('DASHBOARD');
        fetchLogs();
      } else {
        const errData = await response.json();
        Alert.alert('Error', errData.error || 'Failed to save log');
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  // --- Date Helpers ---
  const generateDates = () => {
    const dates = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const formatDateHeader = (date: Date) => {
    const options: any = { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' };
    const formatted = date.toLocaleDateString('en-US', options);
    const [weekday, monthDayYear] = formatted.split(', ');
    return { weekday: weekday === new Date().toLocaleDateString('en-US', { weekday: 'long' }) ? 'Today' : weekday, full: monthDayYear };
  };

  // --- Renderers ---

  const renderDashboard = () => (
    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nutrition Overview</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Nutrition Intake Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Daily Progress</Text>
        <View style={styles.card}>
          <View style={styles.statsRow}>
            <View>
              <Text style={styles.statsLabel}>Total Calories</Text>
              <View style={styles.inlineStats}>
                <Text style={styles.statsValue}>{totals.cal}</Text>
                <Text style={styles.statsTotal}> Cal</Text>
              </View>
            </View>
          </View>

          {/* Progress Bar (Visual indicator, no hard limit now) */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.min((totals.cal / 2500) * 100, 100)}%`, backgroundColor: '#000' }]} />
          </View>

          <View style={styles.macroGrid}>
            <MacroBox icon="egg-outline" value={totals.protein} label="Protein" color="#FF8A65" />
            <MacroBox icon="nutrition-outline" value={totals.carbs} label="Carbs" color="#FFD54F" />
            <MacroBox icon="color-filter-outline" value={totals.fat} label="Fats" color="#BA68C8" />
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={() => setCurrentView('ADD_MEALS')}>
            <Text style={styles.primaryButtonText}>+ Log New Meal</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Water Intake Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Hydration</Text>
        <View style={[styles.card, { backgroundColor: '#f4f4f4' }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={styles.statsLabel}>Today's Total</Text>
              <Text style={[styles.statsValue, { color: '#000' }]}>{waterTotal} ml</Text>
            </View>
            <TouchableOpacity onPress={() => setCurrentView('HYDRATION')}>
              <Ionicons name="arrow-forward-circle" size={40} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Recent Logs List */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Today's Logs</Text>
        {todayLogs.length === 0 ? (
          <Text style={styles.emptyText}>No meals logged yet today.</Text>
        ) : (
          todayLogs.map((log, idx) => (
            <View key={log._id || idx} style={styles.logItem}>
              <View style={styles.logInfo}>
                <Text style={styles.logTitle}>{log.items}</Text>
                <View style={styles.logStatsRow}>
                  <Text style={styles.logKcal}>{log.calories} Kcal</Text>

                  <View style={styles.macroStat}>
                    <View style={[styles.macroDot, { backgroundColor: '#FF8A65' }]} />
                    <Text style={styles.macroValueText}>{log.protein}g <Text style={styles.macroLabelText}>Protein</Text></Text>
                  </View>

                  <View style={styles.macroStat}>
                    <View style={[styles.macroDot, { backgroundColor: '#4CAF50' }]} />
                    <Text style={styles.macroValueText}>{log.carbs}g <Text style={styles.macroLabelText}>Carbs</Text></Text>
                  </View>

                  <View style={styles.macroStat}>
                    <View style={[styles.macroDot, { backgroundColor: '#000' }]} />
                    <Text style={styles.macroValueText}>{log.fat}g <Text style={styles.macroLabelText}>Fat</Text></Text>
                  </View>
                </View>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity onPress={() => handleEdit(log)} style={styles.actionIcon}>
                  <Ionicons name="create-outline" size={18} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(log)} style={styles.actionIcon}>
                  <Ionicons name="trash-outline" size={18} color="#FF5252" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderAddMeals = () => {
    const dates = generateDates();
    const { weekday, full } = formatDateHeader(selectedDate);

    return (
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentView('DASHBOARD')}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Meals</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Calendar Strip */}
        <View style={styles.calendarStrip}>
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarMonth}>{weekday}, <Text style={{ fontWeight: '800' }}>{full}</Text></Text>
            <Ionicons name="chevron-down" size={18} color="#000" />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calendarDays}>
            {dates.map((date, idx) => {
              const isSelected = date.toDateString() === selectedDate.toDateString();
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
              const dayNum = date.getDate();
              return (
                <TouchableOpacity key={idx} style={[styles.dayBox, isSelected && styles.dayBoxSelected]} onPress={() => setSelectedDate(date)}>
                  <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>{dayName}</Text>
                  <Text style={[styles.dayNum, isSelected && styles.dayNumSelected]}>{dayNum}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Meal Categories */}
        <View style={styles.mealList}>
          <MealCategoryItem
            title="Breakfast"
            recommended="850-1170 Cal"
            image="https://images.unsplash.com/photo-1546793665-c74683f339c1?q=80&w=400"
            onAdd={() => handleAddPress('Breakfast')}
          />
          <MealCategoryItem
            title="Lunch"
            recommended="500-700 Cal"
            image="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400"
            onAdd={() => handleAddPress('Lunch')}
          />
          <MealCategoryItem
            title="Snack"
            recommended="100-250 Cal"
            image="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=400"
            onAdd={() => handleAddPress('Snack')}
          />
          <MealCategoryItem
            title="Dinner"
            recommended="500-800 Cal"
            image="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=400"
            onAdd={() => handleAddPress('Dinner')}
          />
        </View>
      </ScrollView>
    );
  };

  const renderLogForm = () => (
    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentView('ADD_MEALS')}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{editingId ? 'Edit' : 'Log'} {selectedMealType}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.formContainer}>
        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>Meal Detail</Text>
          <TextInput
            style={[styles.input, mealErrors.foodName && styles.inputError]}
            placeholder="What did you eat?"
            value={foodName}
            onChangeText={(text) => {
              setFoodName(text);
              if (mealErrors.foodName) setMealErrors({ ...mealErrors, foodName: undefined });
            }}
            placeholderTextColor="#BDBDBD"
          />
          {mealErrors.foodName && <Text style={styles.errorTextSmall}>{mealErrors.foodName}</Text>}

          <View style={styles.formRow}>
            <View style={styles.formHalf}>
              <Text style={styles.inputLabel}>Calories (kcal)</Text>
              <TextInput
                style={[styles.input, mealErrors.calories && styles.inputError]}
                placeholder="0"
                keyboardType="numeric"
                value={caloriesInput}
                onChangeText={(text) => {
                  setCaloriesInput(text);
                  if (mealErrors.calories) setMealErrors({ ...mealErrors, calories: undefined });
                }}
              />
              {mealErrors.calories && <Text style={styles.errorTextSmall}>{mealErrors.calories}</Text>}
            </View>
            <View style={styles.formHalf}>
              <Text style={styles.inputLabel}>Protein (g)</Text>
              <TextInput
                style={[styles.input, mealErrors.protein && styles.inputError]}
                placeholder="0"
                keyboardType="numeric"
                value={proteinInput}
                onChangeText={(text) => {
                  setProteinInput(text);
                  if (mealErrors.protein) setMealErrors({ ...mealErrors, protein: undefined });
                }}
              />
              {mealErrors.protein && <Text style={styles.errorTextSmall}>{mealErrors.protein}</Text>}
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formHalf}>
              <Text style={styles.inputLabel}>Carbs (g)</Text>
              <TextInput
                style={[styles.input, mealErrors.carbs && styles.inputError]}
                placeholder="0"
                keyboardType="numeric"
                value={carbsInput}
                onChangeText={(text) => {
                  setCarbsInput(text);
                  if (mealErrors.carbs) setMealErrors({ ...mealErrors, carbs: undefined });
                }}
              />
              {mealErrors.carbs && <Text style={styles.errorTextSmall}>{mealErrors.carbs}</Text>}
            </View>
            <View style={styles.formHalf}>
              <Text style={styles.inputLabel}>Fat (g)</Text>
              <TextInput
                style={[styles.input, mealErrors.fat && styles.inputError]}
                placeholder="0"
                keyboardType="numeric"
                value={fatInput}
                onChangeText={(text) => {
                  setFatInput(text);
                  if (mealErrors.fat) setMealErrors({ ...mealErrors, fat: undefined });
                }}
              />
              {mealErrors.fat && <Text style={styles.errorTextSmall}>{mealErrors.fat}</Text>}
            </View>
          </View>

          <View style={[styles.logItem, { marginTop: 10, shadowOpacity: 0.1, elevation: 4 }]}>
            <View style={styles.logInfo}>
              <Text style={styles.logTitle}>{foodName || 'Meal Preview'}</Text>
              <View style={styles.logStatsRow}>
                <Text style={styles.logKcal}>{caloriesInput || '0'} Kcal</Text>

                <View style={styles.macroStat}>
                  <View style={[styles.macroDot, { backgroundColor: '#FF8A65' }]} />
                  <Text style={styles.macroValueText}>{proteinInput || '0'}g <Text style={styles.macroLabelText}>Protein</Text></Text>
                </View>

                <View style={styles.macroStat}>
                  <View style={[styles.macroDot, { backgroundColor: '#4CAF50' }]} />
                  <Text style={styles.macroValueText}>{carbsInput || '0'}g <Text style={styles.macroLabelText}>Carbs</Text></Text>
                </View>

                <View style={styles.macroStat}>
                  <View style={[styles.macroDot, { backgroundColor: '#000' }]} />
                  <Text style={styles.macroValueText}>{fatInput || '0'}g <Text style={styles.macroLabelText}>Fat</Text></Text>
                </View>
              </View>
            </View>
          </View>

          <TouchableOpacity style={[styles.primaryButton, { marginTop: 20 }]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{editingId ? 'Update Log' : 'Submit Meal Log'}</Text>}
          </TouchableOpacity>
        </View>

        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800' }}
          style={styles.formDecorationImage}
        />
      </View>
    </ScrollView>
  );

  const renderReport = () => {
    const maxVal = Math.max(...stats.map(s => s.total), 1000);

    return (
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentView('DASHBOARD')}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Visual Analytics</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>7-Day Calorie Trend</Text>
          <View style={[styles.card, { padding: 25 }]}>
            <View style={styles.chartContainer}>
              {renderChartGrid()}
              {stats.map((item, idx) => {
                const dayName = new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' });
                const heightPercent = (item.total / maxVal) * 100;
                return (
                  <View key={idx} style={styles.chartBarWrapper}>
                    <View style={styles.chartBarBackground}>
                      <View style={[styles.chartBarFill, { height: `${heightPercent}%` }]} />
                    </View>
                    <Text style={styles.chartDayLabel}>{dayName}</Text>
                  </View>
                );
              })}
              {stats.length === 0 && (
                <View style={styles.emptyChart}>
                  <Text style={styles.emptyText}>Not enough data for chart</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Daily Breakdown</Text>
          {stats.slice().reverse().map((item, idx) => (
            <View key={idx} style={styles.logItem}>
              <Ionicons name="calendar-outline" size={24} color="#000" style={{ marginRight: 15 }} />
              <View style={styles.logInfo}>
                <Text style={styles.logTitle}>{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                <Text style={styles.logType}>Total consumption</Text>
              </View>
              <Text style={styles.logTitle}>{item.total} Cal</Text>
            </View>
          ))}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    );
  };

  const renderHydration = () => {
    return (
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentView('DASHBOARD')}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hydration Tracker</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Daily Summary Card */}
        <View style={styles.sectionContainer}>
          <View style={[styles.card, { backgroundColor: '#f4f4f4', alignItems: 'center', paddingVertical: 30 }]}>
            <Ionicons name="water" size={64} color="#000" />
            <Text style={[styles.statsValue, { color: '#000', marginTop: 10 }]}>{waterTotal} <Text style={{ fontSize: 18 }}>ml</Text></Text>
            <Text style={styles.statsLabel}>Total Water Drunk Today</Text>
          </View>
        </View>

        {/* Manual Input Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Manual Entry</Text>
          <View style={styles.card}>
            <Text style={styles.inputLabel}>Amount (ml)</Text>
            <View style={{ flexDirection: 'column', flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }, waterError && styles.inputError]}
                  placeholder="e.g. 350"
                  keyboardType="numeric"
                  value={waterInput}
                  onChangeText={(text) => {
                    setWaterInput(text);
                    if (waterError) setWaterError(null);
                  }}
                />
                <TouchableOpacity
                  style={[styles.miniAppButton, { marginLeft: 15 }]}
                  onPress={() => {
                    if (waterInput) {
                      logWater(parseFloat(waterInput));
                    } else {
                      setWaterError('Enter amount');
                    }
                  }}
                >
                  <Text style={styles.miniAppButtonText}>Log</Text>
                </TouchableOpacity>
              </View>
              {waterError && <Text style={[styles.errorTextSmall, { marginTop: 5, marginLeft: 5 }]}>{waterError}</Text>}
            </View>
          </View>
        </View>

        {/* Cup Based Entry */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Log by Cups (250ml each)</Text>
          <View style={[styles.card, { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }]}>
            <TouchableOpacity onPress={() => logWater(250, true)} style={styles.cupIconBtn}>
              <Ionicons name="beer-outline" size={32} color="#000" />
              <Text style={styles.cupInfo}>1 Cup</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => logWater(500, true)} style={styles.cupIconBtn}>
              <View style={{ flexDirection: 'row' }}>
                <Ionicons name="beer-outline" size={32} color="#000" />
                <Ionicons name="beer-outline" size={32} color="#000" style={{ marginLeft: -15 }} />
              </View>
              <Text style={styles.cupInfo}>2 Cups</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => logWater(1000, true)} style={styles.cupIconBtn}>
              <Ionicons name="water-outline" size={32} color="#000" />
              <Text style={styles.cupInfo}>Large Bottle</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Visual Analytics */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>7-Day Water Trend (ml)</Text>
          <View style={[styles.card, { padding: 25, backgroundColor: '#f4f4f4' }]}>
            <View style={styles.chartContainer}>
              {renderChartGrid()}
              {waterStats.map((item, idx) => {
                const dayName = new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' });
                const maxWater = Math.max(...waterStats.map(s => s.total), 3000);
                const heightPercent = (item.total / maxWater) * 100;
                return (
                  <View key={idx} style={styles.chartBarWrapper}>
                    <View style={styles.chartBarBackground}>
                      <View style={[styles.chartBarFillWater, { height: `${heightPercent}%` }]} />
                    </View>
                    <Text style={styles.chartDayLabel}>{dayName}</Text>
                  </View>
                );
              })}
              {waterStats.length === 0 && (
                <View style={styles.emptyChart}>
                  <Text style={styles.emptyText}>No water data for chart</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {currentView === 'DASHBOARD' && renderDashboard()}
      {currentView === 'ADD_MEALS' && renderAddMeals()}
      {currentView === 'LOG_FORM' && renderLogForm()}
      {currentView === 'REPORT' && renderReport()}
      {currentView === 'HYDRATION' && renderHydration()}

      {/* Bottom Nav Mock */}
      <View style={styles.bottomNav}>
        <NavItem icon="home-outline" label="Home" active={false} onPress={() => router.push('/home')} />
        <NavItem icon="restaurant-outline" label="Diet" active={currentView === 'DASHBOARD' || currentView === 'ADD_MEALS' || currentView === 'LOG_FORM'} onPress={() => setCurrentView('DASHBOARD')} />
        <NavItem icon="water-outline" label="Water" active={currentView === 'HYDRATION'} onPress={() => setCurrentView('HYDRATION')} />
        <NavItem icon="stats-chart-outline" label="Report" active={currentView === 'REPORT'} onPress={() => setCurrentView('REPORT')} />
      </View>
    </SafeAreaView>
  );
}

// --- Sub-components ---

const MacroBox = ({ icon, value, label, color }: any) => (
  <View style={styles.macroBox}>
    <View style={[styles.iconCircle, { borderColor: color }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.macroValue}>{value}<Text style={{ fontSize: 10, fontWeight: '400' }}>g</Text></Text>
    <Text style={styles.macroLabel}>{label}</Text>
  </View>
);

const MealCategoryItem = ({ title, recommended, image, onAdd }: any) => (
  <View style={styles.mealCard}>
    <View style={styles.mealInfo}>
      <Text style={styles.mealTitle}>{title}</Text>
      <Text style={styles.recommendedText}>Recommended {recommended}</Text>
      <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
        <Text style={styles.addBtnText}>+ Add</Text>
      </TouchableOpacity>
    </View>
    <Image source={{ uri: image }} style={styles.mealImage} />
  </View>
);

const NavItem = ({ icon, label, active, onPress }: any) => (
  <TouchableOpacity style={styles.navItem} onPress={onPress}>
    <Ionicons name={icon} size={24} color={active ? '#000' : '#BDBDBD'} />
    <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
  </TouchableOpacity>
);

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    fontStyle: 'italic'
  },
  sectionContainer: {
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    marginBottom: 15,
    fontStyle: 'italic',
    letterSpacing: 0.5
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statsRow: {
    marginBottom: 15,
  },
  statsLabel: {
    color: '#9E9E9E',
    fontSize: 14,
    marginBottom: 4,
  },
  inlineStats: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statsValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000',
  },
  statsTotal: {
    fontSize: 16,
    color: '#BDBDBD',
    fontWeight: '600',
    marginLeft: 4,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#F1F1F1',
    borderRadius: 5,
    marginBottom: 25,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  macroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  macroBox: {
    alignItems: 'center',
    width: '23%',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  macroValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000',
  },
  macroLabel: {
    fontSize: 11,
    color: '#9E9E9E',
    marginTop: 2,
  },
  primaryButton: {
    backgroundColor: '#000',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  calendarStrip: {
    marginVertical: 10,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarMonth: {
    fontSize: 16,
    color: '#000',
    marginRight: 5,
  },
  calendarDays: {
    paddingRight: 20,
  },
  dayBox: {
    width: 55,
    height: 85,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F1F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#fff',
  },
  dayBoxSelected: {
    backgroundColor: '#000',
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  dayName: {
    fontSize: 11,
    color: '#9E9E9E',
    marginBottom: 10,
    fontWeight: '700',
  },
  dayNum: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000',
  },
  dayNameSelected: { color: 'rgba(255,255,255,0.7)' },
  dayNumSelected: { color: '#fff' },
  mealList: {
    marginTop: 20,
    paddingBottom: 40,
  },
  mealCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  mealInfo: {
    flex: 1,
  },
  mealTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#000',
    marginBottom: 4,
  },
  recommendedText: {
    fontSize: 13,
    color: '#BDBDBD',
    marginBottom: 14,
  },
  addBtn: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 10,
    width: 70,
    alignItems: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  mealImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginLeft: 15,
  },

  // Form Styles
  formContainer: {
    marginTop: 10,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: '#000',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F1F1',
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formHalf: {
    width: '47%',
  },
  formDecorationImage: {
    width: '100%',
    height: 180,
    borderRadius: 24,
    marginTop: 25,
  },

  // Report Styles
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 200,
    paddingTop: 20,
  },
  chartBarWrapper: {
    alignItems: 'center',
    width: '11%',
    height: 160, // Fixed height ensures visibility
    justifyContent: 'flex-end',
  },
  chartBarBackground: {
    height: '100%',
    width: 12,
    backgroundColor: '#F1F1F1',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBarFill: {
    width: '100%',
    backgroundColor: '#000',
    borderRadius: 6,
    minHeight: 4, // Smallest visible bar if data exists
  },
  chartBarFillWater: {
    width: '100%',
    backgroundColor: '#000', // New color for water
    borderRadius: 6,
    minHeight: 4,
  },
  gridLineContainer: {
    position: 'absolute',
    width: '100%',
    height: 160,
    justifyContent: 'space-between',
    paddingBottom: 0,
    zIndex: -1,
  },
  gridLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#F1F1F1',
    borderStyle: 'dashed',
  },
  chartDayLabel: {
    fontSize: 10,
    color: '#9E9E9E',
    marginTop: 10,
    fontWeight: '700',
  },
  emptyChart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Log Item Styles
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  logInfo: {
    flex: 1,
  },
  logTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    marginBottom: 8,
  },
  logType: {
    fontSize: 13,
    color: '#BDBDBD',
    fontWeight: '500',
  },
  logStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  logKcal: {
    fontSize: 13,
    color: '#9E9E9E',
    fontWeight: '600',
    marginRight: 12,
  },
  macroStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  macroValueText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  macroLabelText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#BDBDBD',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    marginLeft: 10,
  },
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  waterQuickAdd: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  waterBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#000',
  },
  waterBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 12,
  },
  miniAppButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  miniAppButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  cupIconBtn: {
    alignItems: 'center',
    padding: 10,
  },
  cupInfo: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#9E9E9E',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9E9E9E',
    marginTop: 20,
    fontSize: 14,
  },

  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F1F1',
    justifyContent: 'space-around',
    height: 75,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 10,
    color: '#BDBDBD',
    marginTop: 4,
    fontWeight: '700',
  },
  navLabelActive: {
    color: '#000',
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
  },
  errorTextSmall: {
    color: '#FF3B30',
    fontSize: 11,
    marginTop: 4,
    marginBottom: 10,
    marginLeft: 5,
  },
});
