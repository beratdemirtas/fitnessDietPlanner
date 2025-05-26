import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../App'; 
import API_BASE_URL from '../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CUP_ML = 200;
const ML_IN_LITRE = 1000;
const DEFAULT_GOAL_LITRE = 2;

const WaterTracker = () => {
  const { userEmail } = useContext(AuthContext);
  const [cups, setCups] = useState(0);
  const [goalLitre, setGoalLitre] = useState(DEFAULT_GOAL_LITRE);
  const [waterIntake, setWaterIntake] = useState(0); // Günlük içilen su miktarı (ml)
  const [dailyGoal, setDailyGoal] = useState(2000); // Günlük hedef (ml)
  const [selectedDate, setSelectedDate] = useState(new Date()); // Bugünün tarihi

  const goalMl = goalLitre * ML_IN_LITRE;
  const goalCups = Math.round(goalMl / CUP_ML);
  const drankMl = cups * CUP_ML;
  const progress = Math.round((drankMl / goalMl) * 100);

  // Sayfa açılınca backend'den veri çek
  useEffect(() => {
    const fetchWater = async () => {
      try {
        const dateKey = selectedDate.toISOString().split('T')[0];
        const response = await fetch(`${API_BASE_URL}/api/water-intake?email=${userEmail}&date=${dateKey}`);
        if (response.ok) {
          const data = await response.json();
          if (data && typeof data.cups === 'number') {
            setCups(data.cups);
          }
        }
      } catch (e) {}
    };
    fetchWater();
  }, [userEmail, goalLitre, selectedDate]);

  // Seçilen tarih değiştiğinde AsyncStorage'dan veriyi yükle
  useEffect(() => {
    const loadWaterIntake = async () => {
      try {
        const dateKey = selectedDate.toISOString().split('T')[0];
        const savedCups = await AsyncStorage.getItem(`waterIntake_${userEmail}_${dateKey}`);
        setCups(Number(savedCups) || 0);
      } catch (e) {
        console.error('Error loading water intake:', e);
      }
    };
    loadWaterIntake();
  }, [selectedDate, userEmail]);

  // Sadece Save butonuna basınca kaydet
  const saveWater = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      // Backend'e kaydet
      const dateKey = selectedDate.toISOString().split('T')[0];
      await fetch(`${API_BASE_URL}/api/water-intake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          date: dateKey,
          cups: cups,
        }),
      });

      // AsyncStorage'a kaydet (email ile birlikte)
      await AsyncStorage.setItem(`waterIntake_${userEmail}_${dateKey}`, cups.toString());

      Alert.alert('Saved!', 'Your water intake has been saved.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save water intake.');
      console.error('Error saving water intake:', e);
    }
  };

  const addCup = () => {
    if (cups < goalCups) setCups(cups + 1);
  };

  const removeCup = () => {
    if (cups > 0) setCups(cups - 1);
  };

  const reset = () => setCups(0);

  const increaseGoal = () => setGoalLitre(prev => +(prev + 0.5).toFixed(1));
  const decreaseGoal = () => {
    if (goalLitre > 0.5) {
      const newGoal = +(goalLitre - 0.5).toFixed(1);
      setGoalLitre(newGoal);
      const newGoalCups = Math.round((newGoal * ML_IN_LITRE) / CUP_ML);
      if (cups > newGoalCups) setCups(newGoalCups);
    }
  };

  const addWater = (amount) => {
    const newIntake = waterIntake + amount;
    setWaterIntake(newIntake);

    const dateKey = selectedDate.toISOString().split('T')[0];
    AsyncStorage.setItem(`waterIntake_${dateKey}`, newIntake.toString())
      .catch(e => console.error('Error saving water intake:', e));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Water Tracker</Text>
      <Text style={styles.goalText}>
        {drankMl / ML_IN_LITRE} / {goalLitre} L ({cups} cups, {progress}%)
      </Text>
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.iconBtn} onPress={removeCup}>
          <Ionicons name="remove-circle-outline" size={40} color="#4fc3f7" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={addCup}>
          <Ionicons name="add-circle-outline" size={40} color="#4fc3f7" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={reset}>
          <Ionicons name="refresh-outline" size={36} color="#bcd4e6" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.saveBtn} onPress={saveWater}>
        <Text style={styles.saveBtnText}>Save</Text>
      </TouchableOpacity>
      <View style={styles.cupsRow}>
        {[...Array(goalCups)].map((_, idx) => (
          <Ionicons
            key={idx}
            name="water-outline"
            size={28}
            color={idx < cups ? '#4fc3f7' : '#bcd4e6'}
            style={{ marginHorizontal: 2 }}
          />
        ))}
      </View>
      <View style={styles.goalAdjustRow}>
        <Text style={styles.goalAdjustText}>Daily goal:</Text>
        <TouchableOpacity onPress={decreaseGoal}>
          <Ionicons name="remove-circle" size={28} color="#bcd4e6" />
        </TouchableOpacity>
        <Text style={styles.goalNumber}>{goalLitre} L</Text>
        <TouchableOpacity onPress={increaseGoal}>
          <Ionicons name="add-circle" size={28} color="#4fc3f7" />
        </TouchableOpacity>
      </View>
    
      <Text style={styles.infoText}>
        Drinking water is essential for your health! Don't forget to reach your goal.
      </Text>
      <Text style={styles.cupInfoText}>
        1 cup = 200ml
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eaf3ef', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#222', marginBottom: 16 },
  goalText: { fontSize: 18, color: '#222', marginBottom: 12 },
  progressBarBackground: {
    width: 220,
    height: 12,
    backgroundColor: '#bcd4e6',
    borderRadius: 8,
    marginBottom: 18,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 12,
    backgroundColor: '#4fc3f7',
    borderRadius: 8,
  },
  buttonRow: { flexDirection: 'row', marginBottom: 18 },
  iconBtn: { marginHorizontal: 16 },
  saveBtn: {
    backgroundColor: '#4fc3f7',
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 18,
  },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  cupsRow: { flexDirection: 'row', marginTop: 8, marginBottom: 18 },
  goalAdjustRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  goalAdjustText: { fontSize: 16, color: '#222', marginHorizontal: 4 },
  goalNumber: { fontSize: 18, fontWeight: 'bold', color: '#4fc3f7', marginHorizontal: 6 },
  infoText: { fontSize: 13, color: '#555', marginTop: 10, textAlign: 'center' },
  cupInfoText: { fontSize: 12, color: '#888', marginTop: 4 },
  waterButton: {
    backgroundColor: '#4fc3f7',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginVertical: 8,
  },
  waterButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default WaterTracker;