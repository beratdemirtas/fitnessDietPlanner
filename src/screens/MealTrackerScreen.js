import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

  useEffect(() => {
    AsyncStorage.getItem('userEmail').then(email => {
      setUserEmail(email);
      if (email) fetchMeals(email);
    });
    const unsubscribe = navigation.addListener('focus', () => {
      if (userEmail) fetchMeals(userEmail);
    });
    loadFavorites();
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Meal Tracking</Text>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}
        <TextInput
          style={[styles.input, styles.searchInput]}
          placeholder="Search for a meal..."
          value={search}
          onChangeText={handleSearch}
        />
        {loading && <Text style={styles.infoText}>Searching...</Text>}
        {searchResult && searchResult.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.sectionTitle}>Results</Text>
            {searchResult.map(food => {
              const macros = extractMacros(food);
              const image = getFoodImage(food);
              return (
                <View key={food.fdcId} style={styles.mealCard}>
                  <Image source={{ uri: image }} style={styles.foodImage} />
                  <Text style={styles.mealName}>{food.description}</Text>
                  <View style={styles.mealMacrosRow}>
                    <Text style={styles.mealMacro}><Text style={styles.emoji}>💪</Text> {macros.protein}g</Text>
                    <Text style={styles.mealMacro}><Text style={styles.emoji}>🥑</Text> {macros.fat}g</Text>
                    <Text style={styles.mealMacro}><Text style={styles.emoji}>🍞</Text> {macros.carbs}g</Text>
                  </View>
                  <Text style={styles.mealCalorie}>🔥 {macros.calories} kcal</Text>
                  <TouchableOpacity style={styles.favButton} onPress={() => handleFavorite(food)}>
                    <Text style={styles.favButtonText}>Save to Favorites</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
        <View style={styles.macrosContainer}>
          {getMacros().map((macro) => (
            <View key={macro.name} style={styles.macroBarContainer}>
              <Text style={styles.macroLabel}>{macro.icon} {macro.name}</Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${macro.percent}%`, backgroundColor: macro.color }]} />
              </View>
              <Text style={styles.macroPercent}>{macro.percent}%</Text>
            </View>
          ))}
        </View>
        <View style={styles.mealsContainer}>
          {loading && (
            <Text style={{ textAlign: 'center', marginVertical: 16, color: '#888' }}>Loading...</Text>
          )}
          {filteredMeals.map((meal) => {
            if (!meal || !meal.name) return null;
            return (
              <View key={meal._id} style={styles.mealCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  <TouchableOpacity onPress={() => confirmRemoveMeal(meal._id)}>
                    <Text style={styles.deleteButton}>🗑️</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.mealMacrosRow}>
                  <Text style={styles.mealMacro}><Text style={styles.emoji}>💪</Text> {meal.protein}g</Text>
                  <Text style={styles.mealMacro}><Text style={styles.emoji}>🥑</Text> {meal.fat}g</Text>
                  <Text style={styles.mealMacro}><Text style={styles.emoji}>🍞</Text> {meal.carbs}g</Text>
                </View>
                <Text style={styles.mealCalorie}>🔥 {meal.calories} kcal</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.favoritesContainer}>
          <Text style={styles.sectionTitle}>Favorites</Text>
          {favorites.length === 0 && <Text style={styles.infoText}>No favorites yet.</Text>}
          {favorites.map(meal => (
            <View key={meal.id} style={styles.mealCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.mealName}>{meal.name}</Text>
                <TouchableOpacity onPress={() => removeFavorite(meal.id)}>
                  <Text style={styles.deleteButton}>🗑️</Text>
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
});