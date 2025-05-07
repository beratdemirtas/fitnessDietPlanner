import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const HomeScreen = ({ navigation }) => {
  const [weeklyActivity, setWeeklyActivity] = useState([]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const getDayName = (dateString) => {
    const date = new Date(dateString);
    return days[(date.getDay() + 6) % 7]; // Pazartesi'yi haftanın ilk günü yapar
  };

  const sortDaysFromMonday = (activity) => {
    return activity.sort((a, b) => days.indexOf(a.dayName) - days.indexOf(b.dayName));
  };

  useFocusEffect(
    React.useCallback(() => {
      const loadActivityData = async () => {
        try {
          const completedData = await AsyncStorage.getItem('completedExercises');
          const completed = completedData ? JSON.parse(completedData) : {};
          const today = new Date();
          const weekDays = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            return date.toISOString().split('T')[0];
          });

          let activity = weekDays.map((day) => ({
            date: day,
            dayName: getDayName(day),
            count: completed[day] ? completed[day].length : 0,
          }));

          activity = sortDaysFromMonday(activity);
          setWeeklyActivity(activity);
        } catch (error) {
          console.error('Aktivite verisi yüklenirken hata oluştu:', error);
        }
      };

      loadActivityData();
    }, [])
  );

  return (
    <View style={styles.container}>
      {/* Profil Butonu */}
      <TouchableOpacity 
        style={styles.profileButton} 
        onPress={() => navigation.navigate("Profile")}
      >
        <Ionicons name="person-circle-outline" size={32} color="white" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: "#4CAF50" }]} 
        onPress={() => navigation.navigate("Diet")}
      >
        <Ionicons name="fast-food-outline" size={24} color="white" />
        <Text style={styles.buttonText}>Diet Plans</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: "#FF9800" }]} 
        onPress={() => navigation.navigate("Workout")}
      >
        <Ionicons name="barbell-outline" size={24} color="white" />
        <Text style={styles.buttonText}>Workout</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: "#2196F3" }]} 
        onPress={() => navigation.navigate("MealTracker")}
      >
        <Ionicons name="restaurant-outline" size={24} color="white" />
        <Text style={styles.buttonText}>Meals</Text>
      </TouchableOpacity>

      <Text style={styles.header}>Weekly Activity</Text>
      <View style={styles.activityBar}>
        {weeklyActivity.map((day, index) => (
          <View key={index} style={styles.activityItem}>
            <View style={[styles.bar, { height: day.count * 10 }]} />
            <Text style={styles.dayText}>{day.dayName}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  profileButton: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "#595A50FF",
    borderRadius: 15,
    padding: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 10,
    width: "80%",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    marginLeft: 10,
    fontWeight: "bold",
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  activityBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 150,
    marginTop: 20,
  },
  activityItem: {
    alignItems: "center",
  },
  dayText: {
    fontSize: 12,
    color: "gray",
  },
  bar: {
    width: 20,
    backgroundColor: "#4CAF50",
    marginVertical: 5,
  },
});

export default HomeScreen;