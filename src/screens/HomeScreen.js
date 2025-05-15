import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HomeScreen = ({ navigation }) => {
  const [weeklyActivity, setWeeklyActivity] = useState([]);
  const [userName, setUserName] = useState('');
  const [weeklyData, setWeeklyData] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [weeklyLabels, setWeeklyLabels] = useState(['', '', '', '', '', '', '']);

  useEffect(() => {
    AsyncStorage.getItem('userName').then(name => {
      if (name) setUserName(name);
      else setUserName('');
    });
  }, []);

  const getThisWeekDays = () => {
    const result = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const monday = new Date(today);
    const day = today.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    monday.setDate(today.getDate() + diff);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      result.push({
        date: d.toISOString().split('T')[0],
        dayName: dayNames[i],
      });
    }
    return result;
  };

  useFocusEffect(
    React.useCallback(() => {
      const loadActivityData = async () => {
        try {
          const completedData = await AsyncStorage.getItem('completedExercises');
          const completed = completedData ? JSON.parse(completedData) : {};
          const thisWeek = getThisWeekDays();

          const data = thisWeek.map(({ date }) => completed[date] ? completed[date].length : 0);
          const labels = thisWeek.map(({ dayName }) => dayName);

          setWeeklyData(data);
          setWeeklyLabels(labels);
        } catch (error) {
          console.error('Aktivite verisi yüklenirken hata oluştu:', error);
        }
      };

      loadActivityData();
    }, [])
  );

  const maxIndex = weeklyData.indexOf(Math.max(...weeklyData));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#eaf3ef' }}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.helloText}>Hello, <Text style={{fontWeight: 'bold'}}>{userName || 'User'}</Text></Text>
          <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="person-circle-outline" size={28} color="#222" />
        </TouchableOpacity>
        </View>

        {/* My Plan */}
        <Text style={styles.sectionTitle}>My Plan</Text>
        <View style={styles.planGrid}>
          <TouchableOpacity style={[styles.planCard, {backgroundColor: '#bcd4e6'}]} onPress={() => navigation.navigate('Workout')}>
            <MaterialCommunityIcons name="dumbbell" size={28} color="#222" />
            <Text style={styles.planCardTitle}>Workout</Text>
            <Text style={styles.planCardSub}>2 hours</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.planCard, {backgroundColor: '#fbeee0', borderColor: '#e6b8a2', borderWidth: 1}]} onPress={() => navigation.navigate('Diet')}>
            <Ionicons name="fast-food-outline" size={28} color="#222" />
            <Text style={styles.planCardTitle}>Diet Plans</Text>
            <Text style={styles.planCardSub}>1 hour</Text>
        </TouchableOpacity>
          <TouchableOpacity style={[styles.planCard, {backgroundColor: '#e0f7e9'}]} onPress={() => navigation.navigate('MealTracker')}>
            <Ionicons name="leaf-outline" size={28} color="#222" />
            <Text style={styles.planCardTitle}>Meals</Text>
            <Text style={styles.planCardSub}>1832 kcal</Text>
        </TouchableOpacity>
          <TouchableOpacity style={styles.letsGoCard}>
            <Text style={styles.letsGoText}>Let's Go</Text>
        </TouchableOpacity>
        </View>

        {/* Weekly Stats */}
        <Text style={styles.sectionTitle}>Weekly Stats</Text>
        <View style={styles.statsBox}>
          <Text style={styles.mostActiveText}>
            Most Active: <Text style={{fontWeight: 'bold'}}>{weeklyLabels[maxIndex]}</Text>
          </Text>
          <View style={styles.barChartRow}>
            {weeklyData.map((val, idx) => (
              <View key={idx} style={styles.barItem}>
                <View style={[
                  styles.bar,
                  {height: val * 15, backgroundColor: idx === maxIndex ? '#2d4d6a' : '#bcd4e6'}
                ]}/>
                <Text style={styles.barLabel}>{weeklyLabels[idx]}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eaf3ef', paddingHorizontal: 18 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, marginBottom: 8 },
  helloText: { fontSize: 24, color: '#222' },
  profileBtn: { backgroundColor: '#dde6e6', borderRadius: 8, padding: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 18, marginBottom: 8, color: '#222' },
  planGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  planCard: {
    width: '48%',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    alignItems: 'flex-start',
    justifyContent: 'center',
    minHeight: 90,
  },
  planCardTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 8, color: '#222' },
  planCardSub: { fontSize: 13, color: '#555', marginTop: 2 },
  letsGoCard: {
    width: '48%',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#222',
  },
  letsGoText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  statsBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  mostActiveText: { textAlign: 'center', color: '#222', marginBottom: 10 },
  barChartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, marginTop: 8 },
  barItem: { alignItems: 'center', flex: 1 },
  bar: { width: 18, borderRadius: 6, marginBottom: 4 },
  barLabel: { fontSize: 12, color: '#888', marginTop: 2 },
});

export default HomeScreen;