import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, ActivityIndicator, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY = 'cd719ec3fbmsh620963116af066fp155a28jsnda334c75abfe';
const API_HOST = 'tasty.p.rapidapi.com';
const API_URL = 'https://tasty.p.rapidapi.com/recipes/list';

const mealTypes = [
  { key: 'breakfast', label: 'Breakfast', query: 'breakfast' },
  { key: 'lunch', label: 'Lunch', query: 'lunch' },
  { key: 'dinner', label: 'Dinner', query: 'dinner' },
  { key: 'snack', label: 'Snack', query: 'snack' },
];

async function fetchTastyRecipes(query) {
  try {
    const res = await fetch(`${API_URL}?from=0&size=20&q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': API_HOST,
      },
    });
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    return [];
  }
}

function filterTastyRecipes(recipes, preferences, maxCalories) {
  // Filtreyi gevşet: sadece kullanıcı gerçekten seçim yaptıysa uygula
  return recipes.filter(r => {
    if (maxCalories && r.nutrition && r.nutrition.calories && r.nutrition.calories > maxCalories) return false;
    if (preferences.diet && preferences.diet !== '' && r.tags && !r.tags.some(t => t.name.toLowerCase().includes(preferences.diet.toLowerCase()))) return false;
    if (preferences.allergies && preferences.allergies.length > 0 && r.sections) {
      const allIngredients = r.sections.flatMap(s => s.components.map(c => c.ingredient.name.toLowerCase()));
      if (preferences.allergies.some(a => allIngredients.includes(a.toLowerCase()))) return false;
    }
    return true;
  });
}

function getMealNutrition(recipe) {
  if (!recipe || !recipe.nutrition) return null;
  return {
    calories: recipe.nutrition.calories,
    protein: recipe.nutrition.protein,
    fat: recipe.nutrition.fat,
    carbs: recipe.nutrition.carbohydrates,
  };
}

const DietPreferencesScreen = ({ navigation }) => {
  const [preferences, setPreferences] = useState({
    calories: 2000,
    diet: '',
    allergies: [],
    gender: 'male',
    age: '',
    height: '',
    weight: '',
    activity: 1.2,
    goal: 'maintain',
  });

  const [todayMenu, setTodayMenu] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedPreferences = await AsyncStorage.getItem('dietPreferences');
        if (savedPreferences) {
          const parsedPreferences = JSON.parse(savedPreferences);
          setPreferences(parsedPreferences);
          fetchTodayMenu(parsedPreferences);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };
    loadPreferences();
  }, []);

  const fetchTodayMenu = async (preferences) => {
    setLoading(true);
    try {
      const menu = [];
      for (const mealType of mealTypes) {
        let query = mealType.query;
        if (preferences.diet && preferences.diet !== '') query += ` ${preferences.diet}`;
        let recipes = await fetchTastyRecipes(query);
        let filtered = filterTastyRecipes(recipes, preferences, preferences.calories ? preferences.calories / 4 : undefined);
        if (filtered.length === 0) {
          recipes = await fetchTastyRecipes(mealType.query);
          filtered = recipes;
        }
        menu.push({
          mealType: mealType.key,
          recipe: filtered.length > 0 ? filtered[Math.floor(Math.random() * filtered.length)] : null,
        });
      }
      setTodayMenu(menu);
    } catch (error) {
      console.error('Error fetching today\'s menu:', error);
      Alert.alert('Error', 'Failed to fetch today\'s menu. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Kullanıcı Tercihleri Kartı */}
      <View style={styles.card}>
        <Text style={styles.header}>Your Diet Preferences</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Calories:</Text>
          <Text style={styles.value}>{preferences.calories} kcal</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Diet Type:</Text>
          <Text style={styles.value}>{preferences.diet || 'None'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Allergies:</Text>
          <Text style={styles.value}>
            {preferences.allergies.length > 0 ? preferences.allergies.join(', ') : 'None'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('DietScreen', { openModal: true })}
        >
          <Text style={styles.editButtonText}>Edit Preferences</Text>
        </TouchableOpacity>
      </View>

      {/* Günün Menüsü */}
      <View style={styles.card}>
        <Text style={styles.header}>Today's Menu</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#4CAF50" />
        ) : (
          todayMenu.map((meal, index) => {
            const recipe = meal.recipe;
            const nutrition = getMealNutrition(recipe);
            return (
              <View key={index} style={styles.mealCard}>
                <Text style={styles.mealType}>
                  {meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}
                </Text>
                {recipe ? (
                  <>
                    <Text style={styles.mealName}>{recipe.name}</Text>
                    {recipe.thumbnail_url && (
                      <Image source={{ uri: recipe.thumbnail_url }} style={styles.mealImage} />
                    )}
                    {nutrition && (
                      <Text style={styles.nutritionText}>
                        Calories: {nutrition.calories} kcal | Protein: {nutrition.protein}g | Fat: {nutrition.fat}g | Carbs: {nutrition.carbs}g
                      </Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.noRecipeText}>No recipe found</Text>
                )}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#f7f9fc',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2d4d6a',
    marginBottom: 10,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#444',
  },
  value: {
    fontSize: 16,
    color: '#666',
  },
  editButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  mealCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  mealType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 6,
  },
  mealName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  mealImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  nutritionText: {
    fontSize: 14,
    color: '#555',
  },
  noRecipeText: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
});

export default DietPreferencesScreen;

