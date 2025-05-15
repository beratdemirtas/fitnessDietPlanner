import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

const USDA_API_KEY = 'q73lnVjXeJ4Gp1bowe8yjT0fVgf7AbiNgZZi3A6Z';
const USDA_API_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';

export default function MyMealsScreen() {
  const [search, setSearch] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    loadFavorites();
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>My Meals</Text>
        <TextInput
          style={[styles.input, styles.searchInput]}
          placeholder="Search for a meal..."
          value={search}
          onChangeText={handleSearch}
        />
        {loading && <Text style={styles.infoText}>Searching...</Text>}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
                </View>
              );
            })}
          </View>
        )}
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
  deleteButton: { fontSize: 20, color: '#FF3B30', marginLeft: 8 },
}); 