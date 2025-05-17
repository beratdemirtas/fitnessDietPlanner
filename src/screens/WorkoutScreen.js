import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native';
import exercisesData from '../../assets/data/exercises.json';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import exerciseImages from '../assets/exerciseImages';

const WorkoutScreen = ({ navigation }) => {
  const [exercises, setExercises] = useState([]);
  const [bmi, setBmi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bmiCategory, setBmiCategory] = useState(null);
  const [completedExercises, setCompletedExercises] = useState([]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const email = await AsyncStorage.getItem('userEmail');
        if (!email) return;
        const response = await fetch(`http://localhost:3001/api/user/profile?email=${email}`);
        const data = await response.json();
        if (data && data.bmi) {
          setBmi(data.bmi);
        } else {
          setBmi(null);
        }
      } catch (e) {
        setBmi(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (bmi) {
      const category = getBMICategory(parseFloat(bmi));
      setBmiCategory(category);
    }
  }, [bmi]);

  useEffect(() => {
    if (bmiCategory) {
      const filteredExercises = exercisesData.filter(
        (exercise) => exercise.category === bmiCategory
      );
      setExercises(filteredExercises);
    }
  }, [bmiCategory]);

  useEffect(() => {
    const loadCompletedExercises = async () => {
      try {
        const completedData = await AsyncStorage.getItem('completedExercises');
        const completed = completedData ? JSON.parse(completedData) : {};
        const today = new Date().toISOString().split('T')[0];

        if (!completed[today]) {
          completed[today] = [];
          await AsyncStorage.setItem('completedExercises', JSON.stringify(completed));
        }

        setCompletedExercises(completed[today]);
      } catch (error) {
        console.error('Tamamlanan hareketler yüklenirken hata oluştu:', error);
      }
    };

    loadCompletedExercises();
  }, []);

  const getBMICategory = (bmiValue) => {
    if (bmiValue < 18.5) return 'zayif';
    if (bmiValue < 25) return 'normal';
    if (bmiValue < 30) return 'fazla_kilolu';
    return 'obez';
  };

  const completeExercise = async (exerciseId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const completedData = await AsyncStorage.getItem('completedExercises');
      const completed = completedData ? JSON.parse(completedData) : {};

      if (!completed[today]) {
        completed[today] = [];
      }

      if (!completed[today].includes(exerciseId)) {
        completed[today].push(exerciseId);
        setCompletedExercises([...completed[today]]);
      }

      await AsyncStorage.setItem('completedExercises', JSON.stringify(completed));
    } catch (error) {
      console.error('Hareket tamamlanırken hata oluştu:', error);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('WorkoutDetail', { exercise: item })}
    >
      <Image
        source={exerciseImages[item.thumbnail]}
        style={styles.image}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.subtitle}>{item.sets} Sets</Text>
      </View>
      <TouchableOpacity
        style={[
          styles.completeButton,
          completedExercises.includes(item.id) && styles.completedButton,
        ]}
        onPress={() => completeExercise(item.id)}
        disabled={completedExercises.includes(item.id)}
      >
        <Text style={styles.completeButtonText}>
          {completedExercises.includes(item.id) ? 'Completed' : 'Complete'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return <View style={styles.container}><Text>Loading...</Text></View>;
  }
  if (!bmi || isNaN(Number(bmi))) {
    return <View style={styles.container}><Text style={styles.noDataText}>Please save your BMI value first.</Text></View>;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {bmiCategory ? (
        <FlatList
          style={styles.container}
          data={exercises}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={<Text style={styles.header}>Workout Recommendations</Text>}
          ListEmptyComponent={<Text style={styles.noDataText}>Egzersiz bulunamadı.</Text>}
        />
      ) : (
        <Text style={styles.noDataText}>Lütfen önce BMI değerinizi kaydedin.</Text>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  image: { width: 120, height: 100, marginRight: 10, borderRadius: 10, resizeMode: 'cover' },
  title: { fontSize: 16, fontWeight: 'bold' },
  subtitle: { fontSize: 14, color: 'gray' },
  completeButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  completedButton: {
    backgroundColor: '#A5D6A7',
    opacity: 0.6,
  },
  completeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  noDataText: { fontSize: 16, color: 'gray', textAlign: 'center', marginTop: 20 },
});

export default WorkoutScreen;