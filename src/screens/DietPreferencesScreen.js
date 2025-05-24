import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import mealsData from '../data/meals.json';
import { filterMeals } from '../utils/mealFilter';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const mealTypes = [
  { key: 'breakfast', label: 'Breakfast', calories: 0.22 },
  { key: 'lunch', label: 'Lunch', calories: 0.33 },
  { key: 'dinner', label: 'Dinner', calories: 0.33 },
  { key: 'snack', label: 'Snack', calories: 0.12 },
];

function getRandomMeal(meals, maxCalories) {
  const filtered = meals.filter(m => m.nutrition.calories <= maxCalories);
  if (filtered.length === 0) return null;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

function generateWeeklyPlan(meals, preferences) {
  // For each day, pick random meals for each meal type, matching calories and filters
  const plan = [];
  for (let i = 0; i < 7; i++) {
    const day = {};
    mealTypes.forEach(mealType => {
      const meal = getRandomMeal(meals, preferences.calories * mealType.calories);
      day[mealType.key] = meal;
    });
    plan.push(day);
  }
  return plan;
}

const DietPreferencesScreen = ({ route, navigation }) => {
  const preferences = route.params?.preferences || {};
  const [filteredMeals, setFilteredMeals] = useState([]);
  const [weeklyPlan, setWeeklyPlan] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const meals = filterMeals(mealsData, preferences);
    setFilteredMeals(meals);
    setWeeklyPlan(generateWeeklyPlan(meals, preferences));
  }, [preferences]);

  useEffect(() => {
    navigation.setOptions({ title: 'Weekly Meal Plan' });
  }, [navigation]);

  const openDayModal = (dayIdx) => {
    setSelectedDay(dayIdx);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedDay(null);
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
          <View style={styles.weekGrid}>
            {weeklyPlan.map((day, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.dayCard}
                activeOpacity={0.8}
                onPress={() => openDayModal(idx)}
              >
                <Text style={styles.dayCardText}>{daysOfWeek[idx]}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
                  return (
                    <View key={mealType.key} style={styles.mealDetailCard}>
                      <Text style={styles.mealType}>{mealType.label}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <Image source={{ uri: meal.image }} style={styles.mealImage} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.mealName}>{meal.name}</Text>
                          <Text style={styles.mealInfo}>Calories: {meal.nutrition.calories}</Text>
                          <Text style={styles.mealInfo}>Protein: {meal.nutrition.protein}g, Fat: {meal.nutrition.fat}g, Carbs: {meal.nutrition.carbs}g</Text>
                        </View>
                      </View>
                      <Text style={styles.mealSubHeader}>Ingredients:</Text>
                      <Text style={styles.mealText}>{meal.ingredients.join(', ')}</Text>
                      <Text style={styles.mealSubHeader}>Instructions:</Text>
                      <Text style={styles.mealText}>{meal.instructions}</Text>
                    </View>
                  );
                })}
              </ScrollView>
              <TouchableOpacity style={styles.closeBtn} onPress={closeModal}>
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
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