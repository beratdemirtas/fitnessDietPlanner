import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Image, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'http://localhost:3001/api/meals'; // Gerekirse IP ile değiştir
const USDA_API_KEY = 'q73lnVjXeJ4Gp1bowe8yjT0fVgf7AbiNgZZi3A6Z';
const USDA_API_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';

export default function MealTrackerScreen() {
  const [meals, setMeals] = useState([]);
  const [mealName, setMealName] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');
  const [calories, setCalories] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [macroFilter, setMacroFilter] = useState('all');
  const navigation = useNavigation();
  const [userEmail, setUserEmail] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [macroGoals, setMacroGoals] = useState({ protein: 100, fat: 60, carbs: 200, calories: 2000 });
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalInput, setGoalInput] = useState(macroGoals);
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [addMealTime, setAddMealTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [mealsForDay, setMealsForDay] = useState([]);
  const [showCreateMealModal, setShowCreateMealModal] = useState(false);
  const [mealSearch, setMealSearch] = useState('');
  const [mealSearchResults, setMealSearchResults] = useState([]);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [customMealName, setCustomMealName] = useState('');
  const [creatingMealLoading, setCreatingMealLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('userEmail').then(email => {
      setUserEmail(email);
      if (email) fetchMeals(email);
    });
    const unsubscribe = navigation.addListener('focus', () => {
      if (userEmail) fetchMeals(userEmail);
    });
    loadFavorites();
    AsyncStorage.getItem('macroGoals').then(data => {
      if (data) setMacroGoals(JSON.parse(data));
    });
    return unsubscribe;
  }, [navigation, userEmail]);

  const fetchMeals = async (email) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}?userEmail=${email}`);
      const data = await response.json();
      setMeals(data);
    } catch (e) {
      setError('Could not fetch meals from server.');
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!mealName || !protein || !fat || !carbs || !calories) {
      setError('Please fill in all fields.');
      return;
    }
    if (isNaN(protein) || isNaN(fat) || isNaN(carbs) || isNaN(calories)) {
      setError('Macro values must be numeric.');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          name: mealName,
          protein: Number(protein),
          fat: Number(fat),
          carbs: Number(carbs),
          calories: Number(calories)
        })
      });
      if (!res.ok) throw new Error('Failed to add meal');
      setMealName(''); setProtein(''); setFat(''); setCarbs(''); setCalories('');
      fetchMeals(userEmail);
      setError('');
    } catch (e) {
      setError('Failed to add meal.');
    }
    setLoading(false);
  };

  const removeMeal = async (id) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete meal');
      fetchMeals(userEmail);
    } catch (e) {
      setError('Failed to delete meal.');
    }
    setLoading(false);
  };

  const confirmRemoveMeal = (id) => {
    Alert.alert(
      'Delete Meal',
      'Are you sure you want to delete this meal?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeMeal(id) }
      ]
    );
  };

  const getMacros = () => {
    const totalProtein = meals.reduce((sum, m) => sum + (m && typeof m.protein === 'number' ? m.protein : 0), 0);
    const totalFat = meals.reduce((sum, m) => sum + (m && typeof m.fat === 'number' ? m.fat : 0), 0);
    const totalCarbs = meals.reduce((sum, m) => sum + (m && typeof m.carbs === 'number' ? m.carbs : 0), 0);
    const total = totalProtein + totalFat + totalCarbs;
    return [
      {
        name: 'Protein',
        percent: total ? Math.round((totalProtein / total) * 100) : 0,
        color: '#FFD700',
        icon: '💪',
      },
      {
        name: 'Carbs',
        percent: total ? Math.round((totalCarbs / total) * 100) : 0,
        color: '#FF6347',
        icon: '🍞',
      },
      {
        name: 'Fat',
        percent: total ? Math.round((totalFat / total) * 100) : 0,
        color: '#32CD32',
        icon: '🥑',
      },
    ];
  };

  const filteredMeals = meals
    .filter(meal => meal && meal.name && meal.name.toLowerCase().includes(search.toLowerCase()))
    .filter(meal => {
      if (macroFilter === 'all') return true;
      if (macroFilter === 'protein') return meal.protein >= meal.fat && meal.protein >= meal.carbs;
      if (macroFilter === 'fat') return meal.fat >= meal.protein && meal.fat >= meal.carbs;
      if (macroFilter === 'carbs') return meal.carbs >= meal.protein && meal.carbs >= meal.fat;
      return true;
    });

  const loadFavorites = async () => {
    try {
      const favs = await AsyncStorage.getItem('favoriteMeals');
      if (favs) setFavorites(JSON.parse(favs));
    } catch (e) {
      // ignore
    }
  };

  const saveFavorites = async (favList) => {
    setFavorites(favList);
    await AsyncStorage.setItem('favoriteMeals', JSON.stringify(favList));
  };

  const handleSearch = async (text) => {
    setSearch(text);
    setSearchResult(null);
    setError('');
    if (text.length < 2) return;
    setLoading(true);
    try {
      const url = `${USDA_API_URL}?query=${encodeURIComponent(text)}&api_key=${USDA_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.foods && data.foods.length > 0) {
        setSearchResult(data.foods.slice(0, 5));
      } else {
        setSearchResult([]);
        setError('No results found.');
      }
    } catch (e) {
      setError('API error occurred.');
    }
    setLoading(false);
  };

  const extractMacros = (food) => {
    const nutrients = food.foodNutrients || [];
    const protein = nutrients.find(n => n.nutrientName === 'Protein')?.value || 0;
    const fat = nutrients.find(n => n.nutrientName === 'Total lipid (fat)')?.value || 0;
    const carbs = nutrients.find(n => n.nutrientName === 'Carbohydrate, by difference')?.value || 0;
    const calories = nutrients.find(n => n.nutrientName === 'Energy')?.value || 0;
    return { protein, fat, carbs, calories };
  };

  const getFoodImage = (food) => {
    // USDA bazen image kaynağı döner, yoksa örnek bir görsel kullan
    return food?.foodAttributes?.find(attr => attr.name === 'imageUrl')?.value ||
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80';
  };

  const handleFavorite = async (food) => {
    const macros = extractMacros(food);
    const favMeal = {
      id: food.fdcId,
      name: food.description,
      ...macros
    };
    if (favorites.some(f => f.id === favMeal.id)) return;
    const newFavs = [favMeal, ...favorites];
    await saveFavorites(newFavs);
  };

  const removeFavorite = async (id) => {
    const newFavs = favorites.filter(f => f.id !== id);
    await saveFavorites(newFavs);
  };

  const saveGoals = () => {
    setMacroGoals(goalInput);
    setShowGoalModal(false);
    AsyncStorage.setItem('macroGoals', JSON.stringify(goalInput));
  };

  // Toplam makroları ve kalori hesapla
  const getTotals = () => {
    const totalProtein = meals.reduce((sum, m) => sum + (m && typeof m.protein === 'number' ? m.protein : 0), 0);
    const totalFat = meals.reduce((sum, m) => sum + (m && typeof m.fat === 'number' ? m.fat : 0), 0);
    const totalCarbs = meals.reduce((sum, m) => sum + (m && typeof m.carbs === 'number' ? m.carbs : 0), 0);
    const totalCalories = meals.reduce((sum, m) => sum + (m && typeof m.calories === 'number' ? m.calories : 0), 0);
    return { totalProtein, totalFat, totalCarbs, totalCalories };
  };

  const totals = getTotals();

  const macroBarColor = (percent) => {
    if (percent >= 100) return '#E57373'; // kırmızı
    if (percent >= 80) return '#FFD54F'; // sarı
    return '#81C784'; // yeşil
  };

  const macroList = [
    { key: 'protein', label: 'Protein', icon: '💪', total: totals.totalProtein, goal: macroGoals.protein },
    { key: 'carbs', label: 'Carbs', icon: '🍞', total: totals.totalCarbs, goal: macroGoals.carbs },
    { key: 'fat', label: 'Fat', icon: '🥑', total: totals.totalFat, goal: macroGoals.fat },
  ];

  // Eksik makro uyarısı
  const macroWarnings = macroList.filter(m => m.total < m.goal * 0.8).map(m => `You are below your ${m.label.toLowerCase()} goal!`);

  // Seçili günün öğünlerini getir
  useEffect(() => {
    if (!userEmail) return;
    const dateStr = selectedDate.toISOString().split('T')[0];
    fetch(`${API_URL}?userEmail=${userEmail}&date=${dateStr}`)
      .then(res => res.json())
      .then(data => setMealsForDay(data))
      .catch(() => setMealsForDay([]));
  }, [selectedDate, userEmail, meals]);

  // Öğün ekleme fonksiyonu (saatli)
  const handleAddMeal = async () => {
    if (!mealName || !protein || !fat || !carbs || !calories) {
      setError('Please fill in all fields.');
      return;
    }
    if (isNaN(protein) || isNaN(fat) || isNaN(carbs) || isNaN(calories)) {
      setError('Macro values must be numeric.');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
      name: mealName,
          protein: Number(protein),
          fat: Number(fat),
          carbs: Number(carbs),
          calories: Number(calories),
          time: addMealTime.toISOString(),
          date: selectedDate.toISOString().split('T')[0],
        })
      });
      if (!res.ok) throw new Error('Failed to add meal');
      setMealName(''); setProtein(''); setFat(''); setCarbs(''); setCalories('');
      setShowAddMealModal(false);
      fetchMeals(userEmail);
      setError('');
    } catch (e) {
      setError('Failed to add meal.');
    }
    setLoading(false);
  };

  // Favori öğünden ekle
  const addFavoriteToMeals = async (fav) => {
    setMealName(fav.name);
    setProtein(String(fav.protein));
    setFat(String(fav.fat));
    setCarbs(String(fav.carbs));
    setCalories(String(fav.calories));
    setShowAddMealModal(true);
  };

  // Yemek ismiyle API'den arama
  const handleMealSearch = async (text) => {
    setMealSearch(text);
    setSelectedMeal(null);
    setCustomMealName('');
    if (text.length < 2) return setMealSearchResults([]);
    setCreatingMealLoading(true);
    try {
      const url = `${USDA_API_URL}?query=${encodeURIComponent(text)}&api_key=${USDA_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.foods && data.foods.length > 0) {
        setMealSearchResults(data.foods.slice(0, 5));
      } else {
        setMealSearchResults([]);
      }
    } catch (e) {
      setMealSearchResults([]);
    }
    setCreatingMealLoading(false);
  };

  // Öğünü kaydet
  const handleSaveCreatedMeal = async () => {
    if (!selectedMeal || !customMealName) {
      Alert.alert('Error', 'Please select a meal and enter a meal name.');
      return;
    }
    const macros = extractMacros(selectedMeal);
    try {
      setLoading(true);
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          name: customMealName,
          protein: macros.protein,
          fat: macros.fat,
          carbs: macros.carbs,
          calories: macros.calories,
          time: new Date().toISOString(),
          date: selectedDate.toISOString().split('T')[0],
        })
      });
      if (!res.ok) throw new Error('Failed to add meal');
      setShowCreateMealModal(false);
      setMealSearch('');
      setMealSearchResults([]);
      setSelectedMeal(null);
      setCustomMealName('');
      fetchMeals(userEmail);
    } catch (e) {
      Alert.alert('Error', 'Failed to save meal.');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Meal Tracking</Text>
      <View style={styles.totalsBox}>
        <Text style={styles.totalsTitle}>Today's Total</Text>
        <Text style={styles.totalsCalorie}>🔥 {totals.totalCalories} kcal</Text>
        <View style={styles.totalsMacrosRow}>
          <Text style={styles.totalsMacro}>💪 {totals.totalProtein}g</Text>
          <Text style={styles.totalsMacro}>🍞 {totals.totalCarbs}g</Text>
          <Text style={styles.totalsMacro}>🥑 {totals.totalFat}g</Text>
        </View>
      </View>
      {macroList.map(macro => {
        const percent = macro.goal ? Math.round((macro.total / macro.goal) * 100) : 0;
        return (
          <View key={macro.key} style={styles.macroBarContainer}>
            <Text style={styles.macroLabel}>{macro.icon} {macro.label}</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.min(percent, 100)}%`, backgroundColor: macroBarColor(percent) }]} />
            </View>
            <Text style={styles.macroPercent}>{percent}%</Text>
          </View>
        );
      })}
      {macroWarnings.length > 0 && (
        <View style={styles.warningBox}>
          {macroWarnings.map((w, i) => (
            <Text key={i} style={styles.warningText}>⚠️ {w}</Text>
          ))}
        </View>
      )}
      <View style={styles.dateCard}>
        <TouchableOpacity style={styles.dateBtnRow} onPress={() => setShowDatePicker(true)}>
          <Ionicons name="calendar-outline" size={22} color="#2d4d6a" style={{marginRight: 6}} />
          <Text style={styles.dateBtnText}>Select Date</Text>
        </TouchableOpacity>
        <Text style={styles.selectedDateBig}>{selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
      </View>
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) setSelectedDate(date);
          }}
        />
      )}
      <Text style={styles.mealsForTitle}>Meals for this day</Text>
      {mealsForDay.length === 0 && (
        <View style={styles.noMealsCard}>
          <Text style={styles.noMealsEmoji}>😋</Text>
          <Text style={styles.noMealsText}>No meals for this day.</Text>
        </View>
      )}
      {mealsForDay.map(meal => (
        <View key={meal._id || meal.id} style={styles.mealCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.mealName}>{meal.name}</Text>
            <Text style={styles.mealTime}>{meal.time ? new Date(meal.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</Text>
            <TouchableOpacity onPress={() => confirmRemoveMeal(meal._id)}>
              <Text style={styles.deleteButton}>️</Text>
        </TouchableOpacity>
          </View>
          <View style={styles.mealMacrosRow}>
            <Text style={styles.mealMacro}><Text style={styles.emoji}>💪</Text> {meal.protein}g</Text>
            <Text style={styles.mealMacro}><Text style={styles.emoji}>🥑</Text> {meal.fat}g</Text>
            <Text style={styles.mealMacro}><Text style={styles.emoji}>🍞</Text> {meal.carbs}g</Text>
          </View>
          <Text style={styles.mealCalorie}>🔥 {meal.calories} kcal</Text>
        </View>
      ))}
    </ScrollView>
    <View style={styles.bottomButtonRow}>
      <TouchableOpacity style={styles.bottomBtn} onPress={() => setShowCreateMealModal(true)}>
        <Text style={styles.bottomBtnText}>Create Meal</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.bottomBtn} onPress={() => setShowGoalModal(true)}>
        <Text style={styles.bottomBtnText}>Set Daily Goal</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.bottomBtn} onPress={() => navigation.navigate('MyMeals')}>
        <Text style={styles.bottomBtnText}>My Meals</Text>
      </TouchableOpacity>
    </View>
    <Modal visible={showGoalModal} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Set Daily Macro Goals</Text>
          <TextInput style={styles.input} placeholder="Protein (g)" keyboardType="numeric" value={String(goalInput.protein)} onChangeText={v => setGoalInput({ ...goalInput, protein: v })} />
          <TextInput style={styles.input} placeholder="Carbs (g)" keyboardType="numeric" value={String(goalInput.carbs)} onChangeText={v => setGoalInput({ ...goalInput, carbs: v })} />
          <TextInput style={styles.input} placeholder="Fat (g)" keyboardType="numeric" value={String(goalInput.fat)} onChangeText={v => setGoalInput({ ...goalInput, fat: v })} />
          <TextInput style={styles.input} placeholder="Calories" keyboardType="numeric" value={String(goalInput.calories)} onChangeText={v => setGoalInput({ ...goalInput, calories: v })} />
          <TouchableOpacity style={styles.button} onPress={saveGoals}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, {backgroundColor:'#888'}]} onPress={() => setShowGoalModal(false)}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    <Modal visible={showCreateMealModal} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Öğün Oluştur</Text>
          <TextInput style={styles.input} placeholder="Yemek ismi ara..." value={mealSearch} onChangeText={handleMealSearch} />
          {creatingMealLoading && <Text style={styles.infoText}>Aranıyor...</Text>}
          {mealSearchResults.length > 0 && (
            <View style={{width:'100%'}}>
              {mealSearchResults.map(food => (
                <TouchableOpacity key={food.fdcId} style={[styles.mealSearchResult, selectedMeal && selectedMeal.fdcId === food.fdcId && {backgroundColor:'#eaf3ef'}]} onPress={() => setSelectedMeal(food)}>
                  <Text style={styles.mealName}>{food.description}</Text>
                  <Text style={styles.mealMacroSmall}>💪 {extractMacros(food).protein}g  🥑 {extractMacros(food).fat}g  🍞 {extractMacros(food).carbs}g  🔥 {extractMacros(food).calories} kcal</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {selectedMeal && (
            <View style={{width:'100%', marginTop:10}}>
              <Text style={styles.inputLabel}>Öğün Adı</Text>
              <TextInput style={styles.input} placeholder="(örn: Kahvaltı, Öğle Yemeği)" value={customMealName} onChangeText={setCustomMealName} />
              <Text style={styles.inputLabel}>Seçilen Yemek Değerleri</Text>
              <Text style={styles.mealMacroSmall}>💪 {extractMacros(selectedMeal).protein}g  🥑 {extractMacros(selectedMeal).fat}g  🍞 {extractMacros(selectedMeal).carbs}g  🔥 {extractMacros(selectedMeal).calories} kcal</Text>
            </View>
          )}
          <TouchableOpacity style={styles.button} onPress={handleSaveCreatedMeal}>
            <Text style={styles.buttonText}>Kaydet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, {backgroundColor:'#888'}]} onPress={() => setShowCreateMealModal(false)}>
            <Text style={styles.buttonText}>İptal</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  errorText: { color: 'red', textAlign: 'center', marginBottom: 8 },
  infoText: { color: '#888', textAlign: 'center', marginBottom: 8 },
  input: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 10, marginBottom: 8, fontSize: 16 },
  searchInput: { marginBottom: 16 },
  resultsContainer: { marginBottom: 32 },
  favoritesContainer: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: '#222' },
  mealCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 18, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, alignItems: 'center' },
  foodImage: { width: 90, height: 90, borderRadius: 12, marginBottom: 10, backgroundColor: '#eee' },
  mealName: { fontSize: 20, fontWeight: 'bold', marginBottom: 4, textAlign: 'center' },
  mealMacrosRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, width: '100%' },
  mealMacro: { fontSize: 16, flex: 1, textAlign: 'center' },
  emoji: { fontSize: 16 },
  mealCalorie: { fontSize: 15, color: '#888', marginBottom: 4 },
  favButton: { backgroundColor: '#32CD32', borderRadius: 8, padding: 8, alignItems: 'center', marginTop: 8, width: '100%' },
  favButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  deleteButton: { fontSize: 20, color: '#FF3B30', marginLeft: 8 },
  macrosContainer: { marginBottom: 24 },
  macroBarContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  macroLabel: { width: 80, fontWeight: 'bold' },
  progressBarBg: { flex: 1, height: 12, backgroundColor: '#eee', borderRadius: 6, marginHorizontal: 8 },
  progressBarFill: { height: 12, borderRadius: 6 },
  macroPercent: { width: 40, textAlign: 'right' },
  mealsContainer: {},
  goalBtn: {
    backgroundColor: '#32CD32',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  goalBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#32CD32',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  totalsBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    alignItems: 'center',
  },
  totalsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  totalsCalorie: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6347',
    marginBottom: 6,
  },
  totalsMacrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  totalsMacro: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  warningBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    marginTop: 4,
  },
  warningText: {
    color: '#E57373',
    fontWeight: 'bold',
    fontSize: 15,
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
    justifyContent: 'space-between',
  },
  dateBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eaf3ef',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  dateBtnText: {
    color: '#222',
    fontWeight: 'bold',
  },
  selectedDateBig: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d4d6a',
  },
  mealsForTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 10,
    marginBottom: 6,
  },
  noMealsCard: {
    backgroundColor: '#f5f7fa',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  noMealsEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  noMealsText: {
    color: '#888',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  bottomBtn: {
    flex: 1,
    backgroundColor: '#eaf3ef',
    borderRadius: 16,
    marginHorizontal: 6,
    paddingVertical: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  bottomBtnText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 16,
  },
  mealTime: {
    fontSize: 14,
    color: '#888',
    marginLeft: 8,
  },
  createMealBtn: {
    backgroundColor: '#2d4d6a',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  createMealBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  mealSearchResult: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#eaf3ef',
  },
  mealMacroSmall: {
    fontSize: 13,
    color: '#666',
  },
  inputLabel: {
    fontWeight: 'bold',
    color: '#222',
    marginTop: 8,
    marginBottom: 2,
  },
});