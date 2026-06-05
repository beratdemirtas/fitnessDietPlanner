import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Image, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import API_BASE_URL from '../config/config';

const API_URL = `${API_BASE_URL}/api/meals`;
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
  const route = useRoute();
  const [userEmail, setUserEmail] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [macroGoals, setMacroGoals] = useState({ protein: 100, fat: 60, carbs: 200, calories: 2000 });
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
  const [selectedMealType, setSelectedMealType] = useState('breakfast');
  const [mealItems, setMealItems] = useState([]);
  const [userInfo, setUserInfo] = useState({
    age: '',
    gender: 'male',
    height: '',
    weight: '',
    activityLevel: 'moderate'
  });
  const [calculatedCalories, setCalculatedCalories] = useState(null);
  const [inputErrors, setInputErrors] = useState({});
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalInput, setGoalInput] = useState({
    calories: macroGoals.calories,
    protein: macroGoals.protein,
    carbs: macroGoals.carbs,
    fat: macroGoals.fat,
  });

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

  useEffect(() => {
    if (!route.params?.scannedMeal || !userEmail) return;
    handleAddMeal(route.params.scannedMeal);
    navigation.setParams({ scannedMeal: undefined });
  }, [route.params?.scannedMeal, userEmail]);

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
      const dateStr = selectedDate.toISOString().split('T')[0];
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
          date: dateStr
        })
      });
      if (!res.ok) throw new Error('Failed to add meal');
      setMealName(''); setProtein(''); setFat(''); setCarbs(''); setCalories('');
      fetchMealsForDay();
      setError('');
    } catch (e) {
      setError('Failed to add meal.');
    }
    setLoading(false);
  };

  const removeMeal = async (id) => {
    if (!id) {
      setError('Meal id not found, cannot delete.');
      return;
    }
    try {
      console.log('Silinecek meal id:', id);
      setLoading(true);
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      const data = await res.json();
      console.log('Silme response status:', res.status, 'response:', data);
      if (!res.ok) throw new Error('Failed to delete meal');
      fetchMealsForDay();
    } catch (e) {
      setError('Failed to delete meal.');
      console.log('Silme hatası:', e);
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

  // UPLOAD FAVORITES
  const loadFavorites = async () => {
    try {
      const email = await AsyncStorage.getItem('userEmail');
      const favs = await AsyncStorage.getItem(`favoriteMeals_${email}`);
      if (favs) setFavorites(JSON.parse(favs));
      else setFavorites([]);
    } catch (e) {
      setFavorites([]);
    }
  };

  // SAVE FAVORITES
  const saveFavorites = async (favList) => {
    setFavorites(favList);
    const email = await AsyncStorage.getItem('userEmail');
    await AsyncStorage.setItem(`favoriteMeals_${email}`, JSON.stringify(favList));
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
    // USDA sometimes returns image source, otherwise use a sample image
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

  // Show only dishes from the selected day (safe even if the backend returns incorrect data)
  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const filteredMealsForDay = mealsForDay.filter(meal => meal.date === selectedDateStr);

  // Calculate total macros and calories only through filteredMeals
  const getTotals = () => {
    const totalProtein = filteredMealsForDay.reduce((sum, m) => sum + (m && typeof m.protein === 'number' ? m.protein : 0), 0);
    const totalFat = filteredMealsForDay.reduce((sum, m) => sum + (m && typeof m.fat === 'number' ? m.fat : 0), 0);
    const totalCarbs = filteredMealsForDay.reduce((sum, m) => sum + (m && typeof m.carbs === 'number' ? m.carbs : 0), 0);
    const totalCalories = filteredMealsForDay.reduce((sum, m) => sum + (m && typeof m.calories === 'number' ? m.calories : 0), 0);
    return { totalProtein, totalFat, totalCarbs, totalCalories };
  };

  const totals = getTotals();

  const macroBarColor = (percent) => {
    if (percent >= 100) return '#E57373'; 
    if (percent >= 80) return '#FFD54F'; 
    return '#81C784'; 
  };

  const macroList = [
    { key: 'protein', label: 'Protein', icon: '💪', total: totals.totalProtein, goal: macroGoals.protein },
    { key: 'carbs', label: 'Carbs', icon: '🍞', total: totals.totalCarbs, goal: macroGoals.carbs },
    { key: 'fat', label: 'Fat', icon: '🥑', total: totals.totalFat, goal: macroGoals.fat },
  ];

  // Missing macro warning hereIt gives missing macro warning here
  const macroWarnings = macroList.filter(m => m.total < m.goal * 0.8).map(m => `You are below your ${m.label.toLowerCase()} goal!`);

  // Fetch meals for selected day from backend
  const fetchMealsForDay = async () => {
    if (!userEmail) {
      setMealsForDay([]);
      setError('No user email found. Please log in again.');
      return;
    }
    
    const dateStr = selectedDate.toISOString().split('T')[0];
    console.log('MealTracker userEmail:', userEmail, 'date:', selectedDate.toISOString().split('T')[0]);
    
    try {
      const response = await fetch(`${API_URL}?userEmail=${userEmail}&date=${dateStr}`);
      console.log('Fetch response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Could not fetch meals from server');
      }
      
      const data = await response.json();
      console.log('Fetched meals:', data);
      
      setMealsForDay(data);
      setError('');
    } catch (e) {
      console.error('Error fetching meals:', e);
      setMealsForDay([]);
      setError(e.message || 'Could not fetch meals from server');
    }
  };

  useEffect(() => {
    fetchMealsForDay();
  }, [selectedDate, userEmail]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchMealsForDay();
    });
    return unsubscribe;
  }, [navigation, selectedDate, userEmail]);

  // consume meal (POST to backend)
  const handleAddMeal = async (meal) => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const mealData = {
        userEmail,
        name: meal.name || 'Unnamed Meal',
        protein: Number(meal.protein) || 0,
        fat: Number(meal.fat) || 0,
        carbs: Number(meal.carbs) || 0,
        calories: Number(meal.calories) || 0,
        date: dateStr,
        mealType: meal.mealType || 'custom', // adding mealType
        foods: meal.foods || [] // adding foods
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mealData)
      });

      if (!response.ok) {
        throw new Error('Failed to add meal');
      }

      await fetchMealsForDay();
    } catch (e) {
      console.error('Error adding meal:', e);
    }
  };

  // Delete meal (DELETE to backend)
  const handleDeleteMeal = async (id) => {
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      fetchMealsForDay();
    } catch (e) {}
  };

  const handleMealSearch = async (text) => {
    setMealSearch(text);
    setMealSearchResults([]);
    setError('');
    if (text.length < 2) return;
    setCreatingMealLoading(true);
    try {
      const url = `${USDA_API_URL}?query=${encodeURIComponent(text)}&api_key=${USDA_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.foods && data.foods.length > 0) {
        setMealSearchResults(data.foods.slice(0, 5));
      } else {
        setMealSearchResults([]);
        setError('No results found.');
      }
    } catch (e) {
      setError('API error occurred.');
    }
    setCreatingMealLoading(false);
  };

  const handleAddMealItem = (food) => {
    const macros = extractMacros(food);
    const portion = food.householdServingFullText || (food.servingSize && food.servingSizeUnit ? `${food.servingSize} ${food.servingSizeUnit}` : null);
    setMealItems(prev => [...prev, { food, macros, portion }]);
  };

  const handleRemoveMealItem = (idx) => {
    setMealItems(prev => prev.filter((_, i) => i !== idx));
  };

  const totalMealMacros = mealItems.reduce((acc, item) => {
    acc.protein += Number(item.macros.protein) || 0;
    acc.fat += Number(item.macros.fat) || 0;
    acc.carbs += Number(item.macros.carbs) || 0;
    acc.calories += Number(item.macros.calories) || 0;
    return acc;
  }, { protein: 0, fat: 0, carbs: 0, calories: 0 });

  // Helper function to edit the date format
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handler for date picker
  const onDateChange = (event, selected) => {
    setShowDatePicker(false);
    if (selected) {
      setSelectedDate(selected);
    }
  };

  const mealTypes = [
    { label: 'Breakfast', value: 'breakfast' },
    { label: 'Lunch', value: 'lunch' },
    { label: 'Dinner', value: 'dinner' },
    { label: 'Snack', value: 'snack' },
    { label: 'Drink', value: 'drink' },
    { label: 'Custom', value: 'custom' },
  ];

  const validateInputs = () => {
    const errors = {};
    if (!userInfo.age || isNaN(userInfo.age) || userInfo.age < 10 || userInfo.age > 100) errors.age = 'Enter a valid age (10-100)';
    if (!userInfo.height || isNaN(userInfo.height) || userInfo.height < 100 || userInfo.height > 250) errors.height = 'Enter a valid height (100-250 cm)';
    if (!userInfo.weight || isNaN(userInfo.weight) || userInfo.weight < 30 || userInfo.weight > 250) errors.weight = 'Enter a valid weight (30-250 kg)';
    setInputErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const calculateCalories = () => {
    const { age, gender, height, weight, activityLevel } = userInfo;

    // Convert height from cm to meters
    const heightInMeters = height / 100;

    // Calculate BMR using Mifflin-St Jeor Equation
    let bmr;
    if (gender === 'male') {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }

    // Apply activity multiplier
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9,
    };

    const tdee = Math.round(bmr * activityMultipliers[activityLevel]);
    setCalculatedCalories(tdee);

    // Set macro goals based on calculated calories
    const newMacroGoals = {
      calories: tdee,
      protein: Math.round((tdee * 0.3) / 4), // 30% of calories from protein
      carbs: Math.round((tdee * 0.45) / 4),  // 45% of calories from carbs
      fat: Math.round((tdee * 0.25) / 9),    // 25% of calories from fat
    };

    setGoalInput(newMacroGoals);
  };

  // Fill in your profile information before opening the modal:
  const openGoalModal = async () => {
    try {
      const profileStr = await AsyncStorage.getItem('userProfile');
      if (profileStr) {
        const profile = JSON.parse(profileStr);
        setUserInfo(prev => ({
          ...prev,
          age: profile.age || '',
          gender: profile.gender || 'male',
          height: profile.height || '',
          weight: profile.weight || ''
        }));
      } else {
        // If there is no data in AsyncStorage, pull from API
        const userEmail = await AsyncStorage.getItem('userEmail');
        if (userEmail) {
          const response = await fetch(`${API_BASE_URL}/api/user/profile?email=${userEmail}`);
          const data = await response.json();
          setUserInfo(prev => ({
            ...prev,
            age: data.age || '',
            gender: data.gender || 'male',
            height: data.height || '',
            weight: data.weight || ''
          }));
        }
      }
      setShowGoalModal(true);
    } catch (e) {
      console.error('Error loading profile data:', e);
      setShowGoalModal(true);
    }
  };

  useEffect(() => {
    if (userInfo.age && userInfo.height && userInfo.weight) {
      calculateCalories();
    }
  }, [userInfo]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileStr = await AsyncStorage.getItem('userProfile');
        if (profileStr) {
          const profile = JSON.parse(profileStr);
          setUserInfo(prev => ({
            ...prev,
            age: profile.age || '',
            gender: profile.gender || 'male',
            height: profile.height || '',
            weight: profile.weight || ''
          }));
        }
      } catch (e) {
        console.error('Error loading profile data:', e);
      }
    };

    loadProfile();
  }, []);

  const loadDailyMeals = async () => {
    const email = await AsyncStorage.getItem('userEmail');
    const today = new Date().toISOString().split('T')[0];
    const meals = await AsyncStorage.getItem(`meals_${email}_${today}`);
    setMealsForDay(meals ? JSON.parse(meals) : []);
  };

  const saveDailyMeals = async (newMeals) => {
    const email = await AsyncStorage.getItem('userEmail');
    const today = new Date().toISOString().split('T')[0];
    await AsyncStorage.setItem(`meals_${email}_${today}`, JSON.stringify(newMeals));
    setMealsForDay(newMeals);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Meal Tracking</Text>
      <View style={styles.todaysTotalCard}>
        <Text style={styles.todaysTotalLabel}>Today's Total</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 6 }}>
          <Text style={styles.caloriesIcon}>🔥</Text>
          <Text style={styles.caloriesValue}>{Number(totals.totalCalories).toFixed(0)}</Text>
          <Text style={styles.caloriesUnit}> / {Number(macroGoals.calories).toFixed(0)} kcal</Text>
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
            <Text style={styles.macroPercent}>{Number(macro.total).toFixed(0)}g / {Number(macro.goal).toFixed(0)}g</Text>
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
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}
      <Text style={styles.mealsForTitle}>Meals for this day</Text>
      {filteredMealsForDay.length === 0 && (
        <View style={styles.noMealsCard}>
          <Text style={styles.noMealsEmoji}>😋</Text>
          <Text style={styles.noMealsText}>No meals for this day.</Text>
        </View>
      )}
      {filteredMealsForDay.map(meal => (
        <View key={meal._id || meal.id} style={styles.mealCard}>
          {/* Meal Type */}
          {meal.mealType && (
            <Text style={{ fontStyle: 'italic', color: '#666', fontSize: 14, marginBottom: 4 }}>
              Meal Type: {meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}
            </Text>
          )}
          {/* Meal Name */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.mealName}>{meal.name}</Text>
            {meal._id ? (
              <TouchableOpacity onPress={() => confirmRemoveMeal(meal._id)}>
                <Text style={styles.deleteButton}>🗑️</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {/* Foods List */}
          {Array.isArray(meal.foods) && meal.foods.length > 0 ? (
            <View style={{ marginBottom: 4 }}>
              {meal.foods.map((f, i) => (
                <Text key={i} style={styles.foodName}>
                  Food: <Text style={{ fontWeight: 'bold' }}>{f.description}</Text>
                  {f.portion ? `  |  Portion: ${f.portion}` : ''}
                </Text>
              ))}
            </View>
          ) : (
            <Text style={styles.foodName}>Food: {meal.foodName || meal.food || '-'}</Text>
          )}
          {/* Macros */}
          <View style={styles.mealMacrosRow}>
            <Text style={styles.mealMacro}><Text style={styles.emoji}>💪</Text> {meal.protein}g</Text>
            <Text style={styles.mealMacro}><Text style={styles.emoji}>🥑</Text> {meal.fat}g</Text>
            <Text style={styles.mealMacro}><Text style={styles.emoji}>🍞</Text> {meal.carbs}g</Text>
          </View>
          <Text style={styles.mealCalorie}>🔥 {meal.calories} kcal</Text>
        </View>
      ))}
      {error ? <Text style={{ color: 'red', textAlign: 'center', marginBottom: 8 }}>{error}</Text> : null}
      {/* Şık Kalori Kartı */}
      <View style={styles.calorieCard}>
        <Text style={styles.calorieLabel}>Calories</Text>
        <Text style={styles.calorieValue}>
          {Number(totals.totalCalories).toFixed(0)}
          <Text style={styles.calorieUnit}> kcal</Text>
        </Text>
        <Text style={styles.calorieGoal}>/ {Number(macroGoals.calories).toFixed(0)} kcal goal</Text>
      </View>
    </ScrollView>
    <View style={styles.bottomButtonRow}>
      <TouchableOpacity style={styles.bottomBtn} onPress={() => setShowCreateMealModal(true)}>
        <Text style={styles.bottomBtnText}>Create Meal</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.bottomBtn} onPress={openGoalModal}>
        <Text style={styles.bottomBtnText}>Set Daily Goal</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.bottomBtn} onPress={() => navigation.navigate('MyMeals')}>
        <Text style={styles.bottomBtnText}>My Meals</Text>
      </TouchableOpacity>
    </View>
    <Modal visible={showCreateMealModal} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: '85%', width: '90%', justifyContent: 'center', alignItems: 'center' }]}>
          <ScrollView
            contentContainerStyle={{
              justifyContent: 'center',
              alignItems: 'center',
              paddingBottom: 24,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.modalTitle}>Create Meal</Text>
            <Text style={styles.modalSubtitle}>Add foods and details for your meal</Text>
            <Text style={styles.inputLabel}>Select meal type</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12, justifyContent: 'center' }}>
              {mealTypes.map(mt => (
                <TouchableOpacity
                  key={mt.value}
                  onPress={() => setSelectedMealType(mt.value)}
                  style={{
                    backgroundColor: selectedMealType === mt.value ? '#4CAF50' : '#f5f5f5',
                    paddingVertical: 7,
                    paddingHorizontal: 16,
                    borderRadius: 20,
                    marginHorizontal: 4,
                    marginBottom: 6,
                    borderWidth: selectedMealType === mt.value ? 0 : 1,
                    borderColor: '#ddd',
                  }}
                >
                  <Text style={{ color: selectedMealType === mt.value ? '#fff' : '#222', fontWeight: 'bold', fontSize: 15 }}>{mt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.inputLabel}>Select Date</Text>
            <TouchableOpacity 
              style={styles.dateSelector} 
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={22} color="#2d4d6a" style={{marginRight: 6}} />
              <Text style={styles.dateSelectorText}>
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={(event, selected) => {
                  setShowDatePicker(false);
                  if (selected) {
                    setSelectedDate(selected);
                  }
                }}
                maximumDate={new Date()}
              />
            )}
            <Text style={styles.inputLabel}>Add Food</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 8 }}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Search for food or drink..."
                value={mealSearch}
                onChangeText={handleMealSearch}
              />
              {mealSearch.length > 0 && (
                <TouchableOpacity onPress={() => { setMealSearch(''); setMealSearchResults([]); }} style={{ marginLeft: 6 }}>
                  <Ionicons name="close-circle" size={22} color="#bbb" />
                </TouchableOpacity>
              )}
            </View>
            {creatingMealLoading && <Text style={styles.infoText}>Searching...</Text>}
            {mealSearchResults.length > 0 && (
              <View style={{width:'100%', marginBottom: 8, maxHeight: 220}}>
                <ScrollView>
                  {mealSearchResults.map(food => {
                    const isFav = favorites.some(f => f.id === food.fdcId);
                    return (
                      <View key={food.fdcId} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 8, marginBottom: 4, padding: 8 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.mealName}>{food.description}</Text>
                          {(food.householdServingFullText || (food.servingSize && food.servingSizeUnit)) && (
                            <Text style={{ fontStyle: 'italic', color: '#666', fontSize: 14 }}>Portion: {food.householdServingFullText || `${food.servingSize} ${food.servingSizeUnit}`}</Text>
                          )}
                          <Text style={styles.mealMacroSmall}>💪 {extractMacros(food).protein}g  🥑 {extractMacros(food).fat}g  🍞 {extractMacros(food).carbs}g  🔥 {extractMacros(food).calories} kcal</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleAddMealItem(food)} style={{ marginHorizontal: 8 }}>
                          <Ionicons name="add-circle" size={26} color="#4CAF50" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleFavorite(food)}>
                          <Text style={{ fontSize: 22, color: isFav ? '#E57373' : '#bbb' }}>{isFav ? '❤️' : '🤍'}</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}
            {mealItems.length > 0 && (
              <View style={{width:'100%', marginTop:10}}>
                <Text style={styles.inputLabel}>Foods/Drinks in this meal:</Text>
                {mealItems.map((item, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, backgroundColor:'#eaf3ef', borderRadius:8, padding:8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.mealName}>{item.food.description}</Text>
                      {item.portion && <Text style={{ fontStyle: 'italic', color: '#666', fontSize: 14 }}>Portion: {item.portion}</Text>}
                      <Text style={styles.mealMacroSmall}>💪 {item.macros.protein}g  🥑 {item.macros.fat}g  🍞 {item.macros.carbs}g  🔥 {item.macros.calories} kcal</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveMealItem(idx)} style={{ marginLeft: 8 }}>
                      <Ionicons name="trash" size={22} color="#E57373" />
                    </TouchableOpacity>
                  </View>
                ))}
                <View style={{ backgroundColor:'#f5f5f5', borderRadius:8, padding:8, marginTop:8 }}>
                  <Text style={{ fontWeight:'bold', color:'#222' }}>Total for this meal:</Text>
                  <Text style={styles.mealMacroSmall}>💪 {totalMealMacros.protein}g  🥑 {totalMealMacros.fat}g  🍞 {totalMealMacros.carbs}g  🔥 {totalMealMacros.calories} kcal</Text>
                </View>
              </View>
            )}
            <TouchableOpacity
              style={styles.saveBtnModern}
              onPress={async () => {
                if (mealItems.length === 0) { setError('Please add at least one food or drink.'); return; }
                setCreatingMealLoading(true);
                try {
                  // 1. Save to Local
                  const myMealsKey = `myMeals_${userEmail}`;
                  const myMeals = await AsyncStorage.getItem(myMealsKey);
                  const newMyMeals = myMeals ? JSON.parse(myMeals) : [];
                  newMyMeals.unshift({
                    id: Date.now(),
                    name: customMealName,
                    mealType: selectedMealType,
                    foods: mealItems.map(item => ({
                      description: item.food.description,
                      portion: item.portion,
                      ...item.macros
                    })),
                    protein: totalMealMacros.protein,
                    fat: totalMealMacros.fat,
                    carbs: totalMealMacros.carbs,
                    calories: totalMealMacros.calories,
                    date: selectedDate.toISOString().split('T')[0],
                  });
                  await AsyncStorage.setItem(myMealsKey, JSON.stringify(newMyMeals));

                  // 2. Save to the backend too!
                  await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      userEmail,
                      name: customMealName,
                      mealType: selectedMealType,
                      foods: mealItems.map(item => ({
                        description: item.food.description,
                        portion: item.portion,
                        protein: Number(item.macros.protein) || 0,
                        fat: Number(item.macros.fat) || 0,
                        carbs: Number(item.macros.carbs) || 0,
                        calories: Number(item.macros.calories) || 0,
                      })),
                      protein: totalMealMacros.protein,
                      fat: totalMealMacros.fat,
                      carbs: totalMealMacros.carbs,
                      calories: totalMealMacros.calories,
                      date: selectedDate.toISOString().split('T')[0],
                    })
                  });

                  setShowCreateMealModal(false);
                  setCustomMealName('');
                  setMealSearch('');
                  setMealSearchResults([]);
                  setMealItems([]);
                  fetchMealsForDay();
                } catch (e) {
                  setError('Failed to save meal.');
                }
                setCreatingMealLoading(false);
              }}
            >
              <Text style={styles.saveBtnTextModern}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtnModern}
              onPress={() => { setShowCreateMealModal(false); setMealItems([]); }}
            >
              <Text style={styles.cancelBtnTextModern}>Cancel</Text>
            </TouchableOpacity>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
    <Modal
      visible={showGoalModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowGoalModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <Text style={styles.modalTitleModern}>Set Daily Goal</Text>
            <Text style={styles.modalSubtitle}>Enter your information to calculate your daily calorie needs</Text>
            <View style={styles.rowInputs}>
              <View style={styles.inputGroupSmall}>
                <Text style={styles.inputLabelModern}>Age</Text>
                <TextInput
                  style={[styles.inputModern, inputErrors.age && styles.inputError, { backgroundColor: '#f5f5f5' }]}
                  placeholder="e.g. 25"
                  keyboardType="numeric"
                  value={userInfo.age.toString()}
                  editable={false}
                />
                {inputErrors.age && <Text style={styles.errorTextSmall}>{inputErrors.age}</Text>}
              </View>
              <View style={styles.inputGroupSmall}>
                <Text style={styles.inputLabelModern}>Height (cm)</Text>
                <TextInput
                  style={[styles.inputModern, inputErrors.height && styles.inputError, { backgroundColor: '#f5f5f5' }]}
                  placeholder="e.g. 170"
                  keyboardType="numeric"
                  value={userInfo.height.toString()}
                  editable={false}
                />
                {inputErrors.height && <Text style={styles.errorTextSmall}>{inputErrors.height}</Text>}
              </View>
              <View style={styles.inputGroupSmall}>
                <Text style={styles.inputLabelModern}>Weight (kg)</Text>
                <TextInput
                  style={[styles.inputModern, inputErrors.weight && styles.inputError, { backgroundColor: '#f5f5f5' }]}
                  placeholder="e.g. 65"
                  keyboardType="numeric"
                  value={userInfo.weight.toString()}
                  editable={false}
                />
                {inputErrors.weight && <Text style={styles.errorTextSmall}>{inputErrors.weight}</Text>}
              </View>
            </View>
            <Text style={styles.inputLabelModern}>Gender</Text>
            <View style={styles.genderRowModern}>
              <TouchableOpacity
                style={[
                  styles.genderBtnModern,
                  userInfo.gender === 'male' && styles.genderBtnActive,
                  { opacity: 0.7 }
                ]}
                disabled={true}
              >
                <Text style={[
                  styles.genderBtnText,
                  userInfo.gender === 'male' && styles.genderBtnTextActive,
                ]}>Male</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderBtnModern,
                  userInfo.gender === 'female' && styles.genderBtnActive,
                  { opacity: 0.7 }
                ]}
                disabled={true}
              >
                <Text style={[
                  styles.genderBtnText,
                  userInfo.gender === 'female' && styles.genderBtnTextActive,
                ]}>Female</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.inputLabelModern}>Activity Level</Text>
            <View style={{ width: '100%', marginBottom: 10 }}>
              {[
                { label: 'Sedentary', value: 'sedentary', desc: 'Little or no exercise' },
                { label: 'Light', value: 'light', desc: 'Exercise 1-3 days/week' },
                { label: 'Moderate', value: 'moderate', desc: 'Exercise 3-5 days/week' },
                { label: 'Active', value: 'active', desc: 'Exercise 6-7 days/week' },
                { label: 'Very Active', value: 'veryActive', desc: 'Hard exercise & physical job' },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    {
                      backgroundColor: userInfo.activityLevel === opt.value ? '#4CAF50' : '#f5f5f5',
                      borderRadius: 10,
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      marginBottom: 8,
                      borderWidth: userInfo.activityLevel === opt.value ? 0 : 1,
                      borderColor: '#e0e0e0',
                    }
                  ]}
                  onPress={() => setUserInfo(prev => ({ ...prev, activityLevel: opt.value }))}
                >
                  <Text style={{
                    color: userInfo.activityLevel === opt.value ? '#fff' : '#222',
                    fontWeight: 'bold',
                    fontSize: 16,
                    textAlign: 'left'
                  }}>{opt.label}</Text>
                  <Text style={{
                    color: userInfo.activityLevel === opt.value ? '#eaf3ef' : '#888',
                    fontSize: 13,
                    marginTop: 2,
                    textAlign: 'left'
                  }}>{opt.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {calculatedCalories && (
              <View style={styles.resultCardModern}>
                <Text style={styles.resultTitleModern}>Estimated Daily Calories</Text>
                <Text style={styles.resultCaloriesModern}>{calculatedCalories} kcal</Text>
                <View style={styles.resultMacrosRowModern}>
                  <View style={styles.resultMacroBox}>
                    <Text style={styles.resultMacroIcon}>💪</Text>
                    <Text style={styles.resultMacroText}>Protein: {goalInput.protein}g</Text>
                  </View>
                  <View style={styles.resultMacroBox}>
                    <Text style={styles.resultMacroIcon}>🍞</Text>
                    <Text style={styles.resultMacroText}>Carbs: {goalInput.carbs}g</Text>
                  </View>
                  <View style={styles.resultMacroBox}>
                    <Text style={styles.resultMacroIcon}>🥑</Text>
                    <Text style={styles.resultMacroText}>Fat: {goalInput.fat}g</Text>
                  </View>
                </View>
              </View>
            )}
            <TouchableOpacity style={styles.saveBtnModern} onPress={saveGoals}>
              <Text style={styles.saveBtnTextModern}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtnModern} onPress={() => setShowGoalModal(false)}>
              <Text style={styles.cancelBtnTextModern}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
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
    padding: 20,           
    width: '85%',          
    maxHeight: '80%',      
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
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
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eaf3ef',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  dateSelectorText: {
    color: '#2d4d6a',
    fontWeight: 'bold',
    fontSize: 16,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 12,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  genderButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#4CAF50',
  },
  genderButtonText: {
    fontSize: 16,
    color: '#333',
  },
  genderButtonTextActive: {
    color: '#fff',
  },
  picker: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  calculateButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultsContainer: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  caloriesText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 16,
  },
  macroTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  macroText: {
    fontSize: 15,
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#888',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContentModern: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,           
    width: '85%',          
    maxHeight: '80%',      
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  modalTitleModern: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalSubtitle: {
    color: '#666',
    fontSize: 15,
    marginBottom: 18,
    textAlign: 'center',
  },
  rowInputs: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inputGroupSmall: {
    flex: 1,
    marginHorizontal: 4,
  },
  inputGroupFull: {
    width: '100%',
    marginBottom: 10,
  },
  inputLabelModern: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#333',
  },
  inputModern: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 2,
  },
  inputError: {
    borderColor: '#E57373',
    backgroundColor: '#fff0f0',
  },
  errorTextSmall: {
    color: '#E57373',
    fontSize: 12,
    marginBottom: 2,
  },
  genderRowModern: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 2,
    marginBottom: 2,
  },
  genderBtnModern: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  genderBtnActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#388e3c',
  },
  genderBtnText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  genderBtnTextActive: {
    color: '#fff',
  },
  pickerModern: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginTop: 2,
    marginBottom: 2,
  },
  calculateBtnModern: {
    backgroundColor: '#388e3c',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
    width: '100%',
  },
  calculateBtnTextModern: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  resultCardModern: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 18,
    marginTop: 18,
    marginBottom: 8,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  resultTitleModern: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  resultCaloriesModern: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
  },
  resultMacrosRowModern: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  resultMacroBox: {
    flex: 1,
    backgroundColor: '#eaf3ef',
    borderRadius: 10,
    marginHorizontal: 4,
    padding: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  resultMacroIcon: {
    fontSize: 18,
    marginRight: 4,
  },
  resultMacroText: {
    fontSize: 15,
    color: '#388e3c',
    fontWeight: 'bold',
  },
  saveBtnModern: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  saveBtnTextModern: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelBtnModern: {
    backgroundColor: '#bbb',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  cancelBtnTextModern: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalsBoxMinimal: {
    backgroundColor: '#f5f5f5',
    borderRadius: 14,
    padding: 18,
    marginBottom: 18,
    alignItems: 'center',
  },
  totalsTitleMinimal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
    textAlign: 'center',
  },
  totalsRowMinimal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 4,
  },
  totalsLabelMinimal: {
    fontSize: 15,
    color: '#888',
    fontWeight: 'bold',
  },
  totalsValueMinimal: {
    fontSize: 15,
    color: '#222',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  calorieCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 22,
    paddingVertical: 28,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  calorieLabel: {
    fontSize: 16,
    color: '#888',
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 1,
  },
  calorieValue: {
    fontSize: 44,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 2,
  },
  calorieUnit: {
    fontSize: 20,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  calorieGoal: {
    fontSize: 15,
    color: '#aaa',
    marginTop: 2,
  },
  todaysTotalCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 22,
    paddingVertical: 22,
    paddingHorizontal: 28,
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  todaysTotalLabel: {
    fontSize: 16,
    color: '#888',
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 2,
  },
  caloriesIcon: {
    fontSize: 22,
    marginRight: 4,
    color: '#FF6347',
  },
  caloriesValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginRight: 4,
  },
  caloriesUnit: {
    fontSize: 16,
    color: '#888',
    fontWeight: 'bold',
    marginBottom: 2,
  },
});