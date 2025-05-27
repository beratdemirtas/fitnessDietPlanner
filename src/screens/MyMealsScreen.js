import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Alert, TouchableWithoutFeedback, Keyboard, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import API_BASE_URL from '../config/config'; // <-- Bunu ekle

const USDA_API_KEY = 'q73lnVjXeJ4Gp1bowe8yjT0fVgf7AbiNgZZi3A6Z';
const USDA_API_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';

const mealTypes = [
  { label: 'Breakfast', value: 'breakfast' },
  { label: 'Lunch', value: 'lunch' },
  { label: 'Dinner', value: 'dinner' },
  { label: 'Snack', value: 'snack' },
  { label: 'Drink', value: 'drink' },
  { label: 'Custom', value: 'custom' },
];

export default function MyMealsScreen() {
  const [search, setSearch] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [userEmail, setUserEmail] = useState('');
  const [myMeals, setMyMeals] = useState([]);
  const [showMealTypeModal, setShowMealTypeModal] = useState(false);
  const [selectedFavoriteMeal, setSelectedFavoriteMeal] = useState(null);
  const [selectedMealType, setSelectedMealType] = useState('breakfast');
  const navigation = useNavigation();

  useEffect(() => {
    AsyncStorage.getItem('userEmail').then(email => {
      setUserEmail(email);
      loadFavorites();
      loadMyMeals(email);
    });
  }, []);

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
    return food?.foodAttributes?.find(attr => attr.name === 'imageUrl')?.value ||
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80';
  };

  const loadFavorites = async () => {
    try {
      const email = await AsyncStorage.getItem('userEmail');
      const favs = await AsyncStorage.getItem(`favoriteMeals_${email}`);
      if (favs) setFavorites(JSON.parse(favs));
    } catch (e) {
      console.error('Error loading favorites:', e);
    }
  };

  const saveFavoriteMeals = async (newFavs) => {
    try {
      const email = await AsyncStorage.getItem('userEmail');
      await AsyncStorage.setItem(`favoriteMeals_${email}`, JSON.stringify(newFavs));
      setFavorites(newFavs);
    } catch (e) {
      console.error('Error saving favorites:', e);
    }
  };

  const removeFavorite = async (id) => {
    const email = await AsyncStorage.getItem('userEmail');
    const newFavs = favorites.filter(f => f.id !== id);
    setFavorites(newFavs);
    await AsyncStorage.setItem(`favoriteMeals_${email}`, JSON.stringify(newFavs));
  };

  const getMyMealsKey = (email) => `myMeals_${email}`;
  const getMealsKey = (email, date) => `meals_${email}_${date}`;

  const loadMyMeals = async (email) => {
    if (!email) return;
    const key = getMyMealsKey(email);
    const data = await AsyncStorage.getItem(key);
    const meals = data ? JSON.parse(data) : [];
    
    // mealType eksikse varsayılan bir değer ekle
    const updatedMeals = meals.map(meal => ({
      ...meal,
      mealType: meal.mealType || 'custom', // Varsayılan olarak 'custom' eklenir
    }));
    
    setMyMeals(updatedMeals);
  };

  const handleConsume = async (meal) => {
    if (!userEmail) return;
    const today = new Date().toISOString().split('T')[0];
    const mealToSend = {
      ...meal,
      userEmail,
      date: today,
      name: meal.name && meal.name.trim() !== ''
        ? meal.name
        : (meal.mealType ? meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1) : 'Meal'),
    };
    try {
      await fetch(`${API_BASE_URL}/api/meals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mealToSend),
      });
      Alert.alert('Consumed', 'Meal added to today!');
      navigation.navigate('MealTracker');
    } catch (e) {
      Alert.alert('Error', 'Could not add meal to today.');
    }
  };

  const handleFavorite = async (food) => {
    const macros = extractMacros(food);
    const favMeal = {
      id: food.fdcId,
      name: food.description,
      protein: macros.protein,
      fat: macros.fat,
      carbs: macros.carbs,
      calories: macros.calories,
      portion: food.householdServingFullText || (food.servingSize && food.servingSizeUnit ? `${food.servingSize} ${food.servingSizeUnit}` : null)
    };
    if (favorites.some(f => f.id === favMeal.id)) return;
    const newFavs = [favMeal, ...favorites];
    setFavorites(newFavs);
    const email = await AsyncStorage.getItem('userEmail');
    await AsyncStorage.setItem(`favoriteMeals_${email}`, JSON.stringify(newFavs));
  };

  const handleConsumeWithType = async () => {
    if (!selectedFavoriteMeal) return;
    let meal = { ...selectedFavoriteMeal, mealType: selectedMealType };

    // Eğer foods dizisi yoksa oluştur
    if (!meal.foods) {
      meal.foods = [{
        description: meal.name,
        portion: meal.portion,
        protein: meal.protein,
        fat: meal.fat,
        carbs: meal.carbs,
        calories: meal.calories,
      }];
    }

    setShowMealTypeModal(false);
    setSelectedFavoriteMeal(null);
    await handleConsume(meal);
  };

  const removeMyMeal = async (id) => {
    const email = await AsyncStorage.getItem('userEmail');
    const key = getMyMealsKey(email);
    const newMeals = myMeals.filter(m => m.id !== id);
    setMyMeals(newMeals);
    await AsyncStorage.setItem(key, JSON.stringify(newMeals));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.header}>My Meals</Text>
        <View style={{ position: 'relative', marginBottom: 16 }}>
          <TextInput
            style={[styles.input, styles.searchInput, { paddingRight: 32 }]}
            placeholder="Search for a food..."
            value={search}
            onChangeText={handleSearch}
            onBlur={() => { setSearch(''); setSearchResult(null); }}
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => { setSearch(''); setSearchResult(null); }}
              style={{ position: 'absolute', right: 10, top: 0, bottom: 0, justifyContent: 'center', height: '100%' }}
            >
              <Ionicons name="close-circle" size={22} color="#bbb" />
            </TouchableOpacity>
          )}
        </View>
        {loading && <Text style={styles.infoText}>Searching...</Text>}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {searchResult && searchResult.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.sectionTitle}>Results</Text>
            {searchResult.map(food => {
              const macros = extractMacros(food);
              const servingInfo = food.householdServingFullText || (food.servingSize && food.servingSizeUnit ? `${food.servingSize} ${food.servingSizeUnit}` : null);
              const isFav = favorites.some(f => f.id === food.fdcId);
              return (
                <View key={food.fdcId} style={styles.mealCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <Text style={styles.mealName}>{food.description}</Text>
                    <TouchableOpacity onPress={() => handleFavorite(food)}>
                      <Text style={{ fontSize: 22, color: isFav ? '#E57373' : '#bbb', marginLeft: 8 }}>
                        {isFav ? '❤️' : '🤍'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {servingInfo && (
                    <Text style={{ fontStyle: 'italic', color: '#666', fontSize: 14, marginBottom: 2 }}>Portion: {servingInfo}</Text>
                  )}
                  <View style={styles.mealMacrosRow}>
                    <Text style={styles.mealMacro}><Text style={styles.emoji}>💪</Text> {macros.protein}g</Text>
                    <Text style={styles.mealMacro}><Text style={styles.emoji}>🥑</Text> {macros.fat}g</Text>
                    <Text style={styles.mealMacro}><Text style={styles.emoji}>🍞</Text> {macros.carbs}g</Text>
                  </View>
                  <Text style={styles.mealCalorie}>🔥 {macros.calories} kcal</Text>
                </View>
              );
            })}
          </View>
        )}
        <View style={styles.myMealsContainer}>
          <Text style={styles.sectionTitle}>My Meals</Text>
          {myMeals.length === 0 && <Text style={styles.infoText}>No saved meals yet.</Text>}
          {myMeals.map(meal => (
            <View key={meal.id} style={styles.mealCard}>
              {/* Meal Type */}
              {meal.mealType && (
                <Text style={styles.mealTypeText}>
                  {meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}
                </Text>
              )}
              {/* Meal Name */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', width: '100%' }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.mealName, { textAlign: 'left', marginBottom: 0 }]} numberOfLines={2} ellipsizeMode='tail'>
                    {meal.name}
                  </Text>
                </View>
                <View style={{ flexDirection: 'column', alignItems: 'flex-end', alignSelf: 'flex-start', minWidth: 90 }}>
                  <TouchableOpacity onPress={() => handleConsume(meal)} style={{ marginBottom: 4 }}>
                    <View style={styles.consumeBtn}>
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>🍽️ Consume</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => removeMyMeal(meal.id)}>
                    <Text style={styles.deleteBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
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
        </View>
        <View style={styles.favoritesContainer}>
          <Text style={styles.sectionTitle}>Favorite Foods</Text>
          {favorites.length === 0 && <Text style={styles.infoText}>No favorites yet.</Text>}
          {favorites.map(meal => (
            <View key={meal.id} style={styles.mealCard}>
              {/* Favori kartı içeriği My Meals ile aynı hizaya getirildi */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', width: '100%' }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.mealName, { textAlign: 'left', marginBottom: 0 }]} numberOfLines={2} ellipsizeMode='tail'>
                    {meal.name}
                  </Text>
                </View>
                <View style={{ flexDirection: 'column', alignItems: 'flex-end', alignSelf: 'flex-start', minWidth: 90 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedFavoriteMeal(meal);
                      setShowMealTypeModal(true);
                    }}
                    style={{ marginBottom: 4 }}
                  >
                    <View style={styles.consumeBtn}>
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>🍽️ Consume</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => removeFavorite(meal.id)}>
                    <Text style={styles.deleteBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {meal.portion && (
                <Text style={{ fontStyle: 'italic', color: '#666', fontSize: 14, marginBottom: 2 }}>Portion: {meal.portion}</Text>
              )}
              {!meal.portion && (
                <Text style={{ fontStyle: 'italic', color: '#bbb', fontSize: 14, marginBottom: 2 }}>Portion: Not specified</Text>
              )}
              <View style={styles.mealMacrosRow}>
                <Text style={styles.mealMacro}><Text style={styles.emoji}>💪</Text> {meal.protein}g</Text>
                <Text style={styles.mealMacro}><Text style={styles.emoji}>🥑</Text> {meal.fat}g</Text>
                <Text style={styles.mealMacro}><Text style={styles.emoji}>🍞</Text> {meal.carbs}g</Text>
              </View>
              <Text style={styles.mealCalorie}>🔥 {meal.calories} kcal</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <Modal
        visible={showMealTypeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMealTypeModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 24,
            width: '80%',
            alignItems: 'center'
          }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Select Meal Type</Text>
            {mealTypes.map(mt => (
              <TouchableOpacity
                key={mt.value}
                style={{
                  backgroundColor: selectedMealType === mt.value ? '#4CAF50' : '#f5f5f5',
                  paddingVertical: 10,
                  paddingHorizontal: 18,
                  borderRadius: 10,
                  marginBottom: 8,
                  width: '100%',
                  alignItems: 'center',
                  borderWidth: selectedMealType === mt.value ? 0 : 1,
                  borderColor: '#ddd',
                }}
                onPress={() => setSelectedMealType(mt.value)}
              >
                <Text style={{
                  color: selectedMealType === mt.value ? '#fff' : '#222',
                  fontWeight: 'bold',
                  fontSize: 16
                }}>{mt.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.consumeBtn, { width: '100%', marginTop: 10 }]}
              onPress={handleConsumeWithType}
            >
              <Text style={styles.consumeBtnText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteBtn, { marginTop: 10 }]}
              onPress={() => setShowMealTypeModal(false)}
            >
              <Text style={styles.deleteBtnText}>Cancel</Text>
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
  myMealsContainer: { marginBottom: 24 },
  favoritesContainer: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: '#222' },
  mealCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 18, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, alignItems: 'center' },
  foodImage: { width: 90, height: 90, borderRadius: 12, marginBottom: 10, backgroundColor: '#eee' },
  mealName: { fontSize: 20, fontWeight: 'bold', marginBottom: 4, textAlign: 'center' },
  mealMacrosRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, width: '100%' },
  mealMacro: { fontSize: 16, flex: 1, textAlign: 'center' },
  emoji: { fontSize: 16 },
  mealCalorie: { fontSize: 15, color: '#888', marginBottom: 4 },
  deleteButton: { fontSize: 20, color: '#FF3B30', marginLeft: 8 },
  consumeBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginLeft: 8,
    shadowColor: '#388E3C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  foodName: {
    fontSize: 15,
    color: '#444',
    marginBottom: 4,
    marginTop: 2,
    fontStyle: 'italic',
  },
  deleteBtn: {
    marginLeft: 8,
    padding: 4,
  },
  deleteBtnText: {
    fontSize: 20,
    color: '#FF3B30',
  },
  mealTypeText: {
    position: 'absolute',
    top: 8,
    left: 12, // Sol üst köşe için left kullanıyoruz
    fontSize: 18, // Daha büyük yazı tipi
    fontWeight: 'bold',
    color: '#4CAF50', // Yeşil renk
  },
});