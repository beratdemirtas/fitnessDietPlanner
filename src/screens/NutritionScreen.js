import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { connectDB } from '../config/db';

export default function NutritionScreen({ route }) {
  const { meal } = route.params;
  const navigation = useNavigation();
  const [mealData, setMealData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMealData = async () => {
      try {
        const db = await connectDB();
        const mealsCollection = db.collection('meals');
        const mealDetails = await mealsCollection.findOne({ name: meal.name });
        
        if (mealDetails) {
          setMealData(mealDetails);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMealData();
  }, [meal.name]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{meal.name}</Text>
      <Text style={styles.nutrient}>💪 Protein: {mealData?.protein || meal.protein}g</Text>
      <Text style={styles.nutrient}>🥑 Fat: {mealData?.fat || meal.fat}g</Text>
      <Text style={styles.nutrient}>🍞 Carbs: {mealData?.carbs || meal.carbs}g</Text>
      {/* You can add images or other information here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  nutrient: { fontSize: 20, marginBottom: 12 },
});
