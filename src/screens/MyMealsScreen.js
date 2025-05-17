import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Alert, TouchableWithoutFeedback, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const USDA_API_KEY = 'q73lnVjXeJ4Gp1bowe8yjT0fVgf7AbiNgZZi3A6Z';
const USDA_API_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';

export default function MyMealsScreen() {
  const [search, setSearch] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [userEmail, setUserEmail] = useState('');
  const [myMeals, setMyMeals] = useState([]);

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
      const favs = await AsyncStorage.getItem('favoriteMeals');
      if (favs) setFavorites(JSON.parse(favs));
    } catch (e) {}
  };

  const removeFavorite = async (id) => {
    const newFavs = favorites.filter(f => f.id !== id);
    setFavorites(newFavs);
    await AsyncStorage.setItem('favoriteMeals', JSON.stringify(newFavs));
  };

  const getMyMealsKey = (email) => `myMeals_${email}`;
  const getMealsKey = (email, date) => `meals_${email}_${date}`;

  const loadMyMeals = async (email) => {
    if (!email) return;
    const key = getMyMealsKey(email);
    const data = await AsyncStorage.getItem(key);
    setMyMeals(data ? JSON.parse(data) : []);
  };

  const handleConsume = async (meal) => {
    if (!userEmail) return;
    const today = new Date().toISOString().split('T')[0];
    try {
      await fetch('http://localhost:3001/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...meal,
          userEmail,
          date: today,
        }),
      });
      Alert.alert('Consumed', 'Meal added to today!');
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
    await AsyncStorage.setItem('favoriteMeals', JSON.stringify(newFavs));
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
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Text style={styles.mealName}>
                  {meal.mealType ? meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1) : meal.name}
                </Text>
                {meal.mealType && meal.name && meal.mealType.toLowerCase() !== meal.name.toLowerCase() && (
                  <Text style={{ fontSize: 15, color: '#888', fontWeight: 'bold', marginBottom: 2, textAlign: 'center' }}>{meal.name}</Text>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity style={styles.consumeBtn} onPress={() => handleConsume(meal)}>
                    <Text style={styles.consumeBtnText}>🍽️ Consume</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={async () => {
                    const key = getMyMealsKey(userEmail);
                    const updated = myMeals.filter(m => m.id !== meal.id);
                    setMyMeals(updated);
                    await AsyncStorage.setItem(key, JSON.stringify(updated));
                  }}>
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
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Text style={styles.mealName}>{meal.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity style={styles.consumeBtn} onPress={() => handleConsume(meal)}>
                    <Text style={styles.consumeBtnText}>🍽️ Consume</Text>
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
  consumeBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.5,
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
}); 