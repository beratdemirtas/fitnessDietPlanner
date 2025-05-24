import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import mealsData from '../data/meals.json';
// import { filterMeals } from '../utils/mealFilter';

const API_KEY = '799c65da92msh3564c8eb4e8ed35p15e3a6jsn8a04a0d37a0a'; // <-- Replace with your key or use process.env
const API_HOST = 'tasty.p.rapidapi.com';
const API_URL = 'https://tasty.p.rapidapi.com/recipes/list';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const mealTypes = [
  { key: 'breakfast', label: 'Breakfast', query: 'breakfast' },
  { key: 'lunch', label: 'Lunch', query: 'lunch' },
  { key: 'dinner', label: 'Dinner', query: 'dinner' },
  { key: 'snack', label: 'Snack', query: 'snack' },
];

async function fetchTastyRecipes(query) {
  const res = await fetch(`${API_URL}?from=0&size=20&q=${encodeURIComponent(query)}`, {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': API_KEY,
      'X-RapidAPI-Host': API_HOST,
    },
  });
  const data = await res.json();
  return data.results || [];
}

function filterTastyRecipes(recipes, preferences, maxCalories) {
  // Filter by calories if nutrition info exists, diet, allergies
  return recipes.filter(r => {
    if (maxCalories && r.nutrition && r.nutrition.calories && r.nutrition.calories > maxCalories) return false;
    if (preferences.diet && preferences.diet !== '' && r.tags && !r.tags.some(t => t.name.toLowerCase().includes(preferences.diet))) return false;
    if (preferences.allergies && preferences.allergies.length > 0 && r.sections) {
      const allIngredients = r.sections.flatMap(s => s.components.map(c => c.ingredient.name.toLowerCase()));
      if (preferences.allergies.some(a => allIngredients.includes(a.toLowerCase()))) return false;
    }
    return true;
  });
}

function getMealNutrition(recipe) {
  if (!recipe.nutrition) return null;
  return {
    calories: recipe.nutrition.calories,
    protein: recipe.nutrition.protein,
    fat: recipe.nutrition.fat,
    carbs: recipe.nutrition.carbohydrates,
  };
}

const DietPreferencesScreen = ({ route, navigation }) => {
  const preferences = route.params?.preferences || {};
  const [weeklyPlan, setWeeklyPlan] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completedDays, setCompletedDays] = useState([]);

  useEffect(() => {
    navigation.setOptions({ title: 'Weekly Meal Plan' });
  }, [navigation]);

  // Load completed days from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem('completedDays').then(data => {
      if (data) setCompletedDays(JSON.parse(data));
    });
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function buildPlan() {
      setLoading(true);
      const plan = [];
      for (let i = 0; i < 7; i++) {
        const day = {};
        for (const mealType of mealTypes) {
          // Build query: meal type + diet + allergies
          let query = mealType.query;
          if (preferences.diet && preferences.diet !== '') query += ` ${preferences.diet}`;
          // Optionally add more filters
          const recipes = await fetchTastyRecipes(query);
          const filtered = filterTastyRecipes(recipes, preferences, preferences.calories ? preferences.calories / 4 : undefined);
          day[mealType.key] = filtered.length > 0 ? filtered[Math.floor(Math.random() * filtered.length)] : null;
        }
        plan.push(day);
      }
      if (isMounted) setWeeklyPlan(plan);
      setLoading(false);
    }
    buildPlan();
    return () => { isMounted = false; };
  }, [preferences]);

  const openDayModal = (dayIdx) => {
    setSelectedDay(dayIdx);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedDay(null);
  };

  const markDayComplete = async (dayIdx) => {
    if (!completedDays.includes(dayIdx)) {
      const updated = [...completedDays, dayIdx];
      setCompletedDays(updated);
      await AsyncStorage.setItem('completedDays', JSON.stringify(updated));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#eaf3ef' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.header}>Your Diet Preferences</Text>
          <Text style={styles.prefLabel}>Daily Calorie Goal: <Text style={styles.prefValue}>{preferences.calories || '-'}</Text></Text>
          <Text style={styles.prefLabel}>Diet Type: <Text style={styles.prefValue}>{preferences.diet || 'None'}</Text></Text>
          <Text style={styles.prefLabel}>Allergies: <Text style={styles.prefValue}>{preferences.allergies && preferences.allergies.length > 0 ? preferences.allergies.join(', ') : 'None'}</Text></Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.header}>Weekly Meal Plan</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#6495ED" style={{ marginVertical: 32 }} />
          ) : (
            <View style={styles.weekGrid}>
              {weeklyPlan.map((day, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.dayCard, completedDays.includes(idx) && { backgroundColor: '#b6e2c6', borderColor: '#4CAF50' }]}
                  activeOpacity={0.8}
                  onPress={() => openDayModal(idx)}
                >
                  <Text style={styles.dayCardText}>
                    {daysOfWeek[idx]} {completedDays.includes(idx) ? '✔️' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalHeader}>{selectedDay !== null ? daysOfWeek[selectedDay] : ''} - Meals</Text>
              <ScrollView style={{ maxHeight: 400 }}>
                {selectedDay !== null && mealTypes.map(mealType => {
                  const meal = weeklyPlan[selectedDay][mealType.key];
                  if (!meal) return (
                    <View key={mealType.key} style={styles.mealDetailCard}>
                      <Text style={styles.mealType}>{mealType.label}</Text>
                      <Text style={styles.noMeal}>No suitable meal found.</Text>
                    </View>
                  );
                  const nutrition = getMealNutrition(meal);
                  return (
                    <View key={mealType.key} style={styles.mealDetailCard}>
                      <Text style={styles.mealType}>{mealType.label}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <Image source={{ uri: meal.thumbnail_url }} style={styles.mealImage} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.mealName}>{meal.name}</Text>
                          {nutrition && <Text style={styles.mealInfo}>Calories: {nutrition.calories}</Text>}
                          {nutrition && <Text style={styles.mealInfo}>Protein: {nutrition.protein}g, Fat: {nutrition.fat}g, Carbs: {nutrition.carbs}g</Text>}
                        </View>
                      </View>
                      <Text style={styles.mealSubHeader}>Ingredients:</Text>
                      <Text style={styles.mealText}>{meal.sections ? meal.sections.flatMap(s => s.components.map(c => c.ingredient.name)).join(', ') : '-'}</Text>
                      <Text style={styles.mealSubHeader}>Instructions:</Text>
                      <Text style={styles.mealText}>{meal.instructions ? meal.instructions.map(i => i.display_text).join(' ') : '-'}</Text>
                    </View>
                  );
                })}
              </ScrollView>
              <TouchableOpacity style={styles.closeBtn} onPress={closeModal}>
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
              {selectedDay !== null && !completedDays.includes(selectedDay) && (
                <TouchableOpacity style={[styles.closeBtn, { backgroundColor: '#4CAF50', marginTop: 8 }]} onPress={() => { markDayComplete(selectedDay); closeModal(); }}>
                  <Text style={[styles.closeBtnText, { color: '#fff' }]}>Complete</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#eaf3ef',
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 22,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d4d6a',
    marginBottom: 14,
    textAlign: 'center',
  },
  prefLabel: {
    fontSize: 15,
    color: '#444',
    marginBottom: 4,
  },
  prefValue: {
    fontWeight: 'bold',
    color: '#222',
  },
  weekGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 4,
    gap: 6,
  },
  dayCard: {
    backgroundColor: '#eaf3ef',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 0,
    margin: 4,
    minWidth: 72,
    maxWidth: 90,
    width: '27%',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayCardText: {
    color: '#2d4d6a',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.1,
    textAlign: 'center',
    flexWrap: 'nowrap',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 22,
    width: '92%',
    maxWidth: 420,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    alignItems: 'stretch',
  },
  modalHeader: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#2d4d6a',
    marginBottom: 12,
    textAlign: 'center',
  },
  mealDetailCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  mealType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6495ED',
    marginBottom: 4,
  },
  mealName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  mealInfo: {
    fontSize: 13,
    color: '#555',
    marginBottom: 1,
  },
  mealSubHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#444',
    marginTop: 6,
    marginBottom: 2,
  },
  mealText: {
    fontSize: 13,
    color: '#333',
    marginBottom: 2,
  },
  mealImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  noMeal: {
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  closeBtn: {
    backgroundColor: '#6495ED',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 10,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default DietPreferencesScreen; 