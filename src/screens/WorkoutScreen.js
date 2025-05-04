import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import exercisesData from '../../assets/data/exercises.json';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WorkoutScreen = ({ navigation }) => {
  const [exercises, setExercises] = useState([]);
  const [bmiCategory, setBmiCategory] = useState(null);

  // Kullanıcının BMI kategorisini yükleme
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedData = await AsyncStorage.getItem('userProfile');
        if (storedData) {
          const { bmi } = JSON.parse(storedData);
          if (bmi) {
            const category = getBMICategory(parseFloat(bmi));
            setBmiCategory(category);
          }
        }
      } catch (error) {
        console.error('Kullanıcı verisi yüklenirken hata oluştu:', error);
      }
    };

    loadUserData();
  }, []);

  // BMI kategorisine göre hareketleri filtreleme
  useEffect(() => {
    if (bmiCategory) {
      const filteredExercises = exercisesData.filter(
        (exercise) => exercise.category === bmiCategory
      );
      setExercises(filteredExercises);
    }
  }, [bmiCategory]);

  // BMI kategorisini belirleme fonksiyonu
  const getBMICategory = (bmiValue) => {
    if (bmiValue < 18.5) return 'zayif';
    if (bmiValue < 25) return 'normal';
    if (bmiValue < 30) return 'fazla_kilolu';
    return 'obez';
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('WorkoutDetail', { exercise: item })}
    >
      <Image source={{ uri: item.gifUrl }} style={styles.image} />
      <View>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.subtitle}>Ekipman: {item.equipment}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Workout Recommendations</Text>
      {bmiCategory ? (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      ) : (
        <Text style={styles.noDataText}>Lütfen önce BMI değerinizi kaydedin.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  image: { width: 80, height: 80, marginRight: 10 },
  title: { fontSize: 16, fontWeight: 'bold' },
  subtitle: { fontSize: 14, color: 'gray' },
  noDataText: { fontSize: 16, color: 'gray', textAlign: 'center', marginTop: 20 },
});

export default WorkoutScreen;