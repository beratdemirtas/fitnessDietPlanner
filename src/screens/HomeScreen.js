import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import API_BASE_URL from '../config/config'; 

const API_URL = `${API_BASE_URL}/api/user/profile`;
const VIGO_IMAGE = require('../../assets/images/vigo/welcome.png');
const VIGO_ICON = require('../../assets/images/vigo/icon.jpeg');

const HomeScreen = ({ navigation }) => {
  const [userData, setUserData] = useState({}); // Default value: empty object
  const [weeklyActivity, setWeeklyActivity] = useState([]);
  const [userName, setUserName] = useState('User'); // Default value: 'User'
  const [showVigoOverlay, setShowVigoOverlay] = useState(false);
  const [weeklyData, setWeeklyData] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [weeklyLabels, setWeeklyLabels] = useState(['', '', '', '', '', '', '']);
  const [todayCalories, setTodayCalories] = useState(0);

  useEffect(() => {
    const fetchUserName = async () => {
      const userEmail = await AsyncStorage.getItem('userEmail');
      console.log('User Email:', userEmail); // Check user email
      if (userEmail) {
        try {
          const response = await fetch(`${API_URL}?email=${userEmail}`);
          const data = await response.json();
          console.log('User Data:', data); // Check data from API
          if (data && data.name) {
            setUserName(data.name);
            setUserData(data);
          } else {
            setUserName('');
            setUserData({});
          }
        } catch (e) {
          console.error('Error fetching user name:', e);
          setUserName('');
          setUserData({});
        }
      } else {
        setUserName('');
        setUserData({});
      }
    };

    const checkVigoIntro = async () => {
      const userEmail = await AsyncStorage.getItem('userEmail');
      if (!userEmail) return;
      try {
        const pending = await AsyncStorage.getItem(`vigoIntroPending_${userEmail}`);
        if (pending === 'true') {
          setShowVigoOverlay(true);
        }
      } catch (e) {
        console.error('Error checking Vigo intro state:', e);
      }
    };

    fetchUserName();
    checkVigoIntro();
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
          const userEmail = await AsyncStorage.getItem('userEmail');
          if (!userEmail) return;

          const completedData = await AsyncStorage.getItem('completedExercises');
          const completed = completedData ? JSON.parse(completedData) : {};
          const thisWeek = getThisWeekDays();

          // Use only the logged in user's data
          const userCompleted = completed[userEmail] || {};

          const data = thisWeek.map(({ date }) => userCompleted[date] ? userCompleted[date].length : 0);
          const labels = thisWeek.map(({ dayName }) => dayName);

          setWeeklyData(data);
          setWeeklyLabels(labels);
        } catch (error) {
          console.error('Error loading activity data:', error);
        }
      };

      loadActivityData();
    }, [])
  );

  useFocusEffect(
    React.useCallback(() => {
      const fetchTodayCalories = async () => {
        try {
          const userEmail = await AsyncStorage.getItem('userEmail');
          if (!userEmail) return;
          const today = new Date().toISOString().split('T')[0];
          const response = await fetch(`${API_BASE_URL}/api/meals?email=${userEmail}&date=${today}`);
          const meals = await response.json();
          const total = Array.isArray(meals)
            ? meals.reduce((sum, meal) => sum + (meal.calories || 0), 0)
            : 0;
          setTodayCalories(total);
        } catch (e) {
          setTodayCalories(0);
        }
      };
      fetchTodayCalories();
    }, [])
  );

  useEffect(() => {
    const fetchUserData = async () => {
      const email = await AsyncStorage.getItem('userEmail');
      if (email) {
        const dailyCalories = await AsyncStorage.getItem(`dailyCalories_${email}`);
        setTodayCalories(Number(dailyCalories) || 2000); // Default value: 2000
      }
    };
    fetchUserData();
  }, []);

  const maxIndex = weeklyData.indexOf(Math.max(...weeklyData));

  if (!userName) return <Text>Loading...</Text>;

  const handleLogin = async (email) => {
    try {
      await AsyncStorage.setItem('userEmail', email);
      console.log('User Email Saved:', email); // Check saved email
    } catch (e) {
      console.error('Error saving user email:', e);
    }
  };

  const handleCloseVigoOverlay = async () => {
    try {
      const userEmail = await AsyncStorage.getItem('userEmail');
      if (userEmail) {
        await AsyncStorage.removeItem(`vigoIntroPending_${userEmail}`);
      }
    } catch (e) {
      console.error('Error clearing Vigo intro state:', e);
    } finally {
      setShowVigoOverlay(false);
    }
  };

  const handleDietPlansNavigation = async () => {
    try {
      const email = await AsyncStorage.getItem('userEmail');
      if (!email) {
        Alert.alert('Error', 'User email not found.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/user/has-diet-plan?email=${email}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to check diet plan.');
      }

      if (data.hasDietPlan) {
        // Redirect to DietPreferencesScreen if the user has a diet plan
        navigation.navigate('DietPreferencesScreen', { email });
      } else {
        // Redirect to DietScreen if the user has no diet plan
        navigation.navigate('DietScreen', { email });
      }
    } catch (error) {
      console.error('Error checking diet plan:', error);
      Alert.alert('Error', error.message || 'Failed to check diet plan.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#eaf3ef' }}>
      {showVigoOverlay && (
        <View style={styles.vigoOverlayWrapper} pointerEvents="box-none">
          <TouchableOpacity activeOpacity={0.9} style={styles.vigoOverlayBox} onPress={handleCloseVigoOverlay}>
            <Image source={VIGO_IMAGE} style={styles.vigoImage} resizeMode="contain" />
            <View style={styles.vigoTextWrapper}>
              <Text style={styles.vigoTitle}>Hello {userName || 'Friend'}!</Text>
              <Text style={styles.vigoSubtitle}> I’m Vigo. I can create meal plans. I can design workout routines. I can track your calories. But my most important role is making sure you don’t feel alone as you work toward your goals. If you’re ready, let’s get started..</Text>
              <View style={styles.vigoContinueWrapper}>
                <Text style={styles.vigoContinueText}>Continue-{'>'}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 180 }}>
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
          <TouchableOpacity
    style={[styles.planCard, { backgroundColor: '#a7c7e7' }]} 
    onPress={() => navigation.navigate('Workout')}
  >
    <MaterialCommunityIcons name="dumbbell" size={28} color="#222" />
    <Text style={styles.planCardTitle}>Workout</Text>
    
  </TouchableOpacity>
  <TouchableOpacity
  style={[styles.planCard, { backgroundColor: '#fbeee0', borderColor: '#e6b8a2', borderWidth: 1 }]}
  onPress={() => navigation.navigate('DietScreen')} // Referral to DietScreen
>
  <Ionicons name="fast-food-outline" size={28} color="#222" />
  <Text style={styles.planCardTitle}>Diet Plans</Text>
</TouchableOpacity>
  <TouchableOpacity
    style={[styles.planCard, { backgroundColor: '#e0f7e9' }]}
    onPress={() => navigation.navigate('MealTracker')}
  >
    <Ionicons name="leaf-outline" size={28} color="#222" />
    <Text style={styles.planCardTitle}>Meals</Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={[styles.planCard, { backgroundColor: '#b3e0f2' }]}
    onPress={() => navigation.navigate('WaterTracker')}
  >
    <Ionicons name="water-outline" size={28} color="#222" />
    <Text style={styles.planCardTitle}>Water Tracker</Text>
    <Text style={styles.planCardSub}></Text>
  </TouchableOpacity>
  <TouchableOpacity
  style={[styles.planCard, { backgroundColor: '#f0e6ff' }]}
  onPress={() => navigation.navigate('BarcodeScanner')}
>
  <Ionicons name="barcode-outline" size={28} color="#222" />
  <Text style={styles.planCardTitle}>Scanner</Text>
</TouchableOpacity>
  <TouchableOpacity
  style={[styles.planCard, { backgroundColor: '#ffe6f0' }]}
  onPress={() => navigation.navigate('ImageScanner')}
>
  <Ionicons name="camera-outline" size={28} color="#222" />
  <Text style={styles.planCardTitle}>Food Photo</Text>
</TouchableOpacity>
        </View>

        {/* Chatbot Button (added) */}
        <TouchableOpacity
          style={styles.chatbotButton}
          onPress={() => navigation.navigate('TalkToVigo')}
        >
          <Text style={styles.chatbotText}>Talk to Vigo</Text>
          <View style={styles.chatbotIconWrap}>
            <Image source={VIGO_ICON} style={styles.chatbotIcon} resizeMode="contain" />
          </View>
        </TouchableOpacity>

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
                  {height: val * 14, backgroundColor: idx === maxIndex ? '#2d4d6a' : '#bcd4e6'}
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
  profileBtn: { backgroundColor: '#ffffff', borderRadius: 8, padding: 2 },
  vigoOverlayWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    alignItems: 'center',
  },
  vigoOverlayBox: {
    width: '100%',
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 28,
    paddingTop: 20,
    paddingBottom: 20,
    paddingRight: 20,
    paddingLeft: 20,
    minHeight: 280,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    borderWidth: 0,
  },
  vigoImage: {
    position: 'absolute',
    left: -170,
    top: -300,
    width: 560,
    height: 600,
    zIndex: 5,
  },
  vigoTextWrapper: { flex: 1, justifyContent: 'right', minWidth: 0, marginLeft: 150, marginTop: 30 },
  vigoTitle: { fontSize: 22, fontWeight: 'bold', color: '#222', marginBottom: 10, marginLeft: 110 },
  vigoSubtitle: { fontSize: 13, color: '#000000', lineHeight: 18 },
  vigoContinueWrapper: { alignItems: 'flex-end', marginTop: 18 },
  vigoContinueText: { color: '#CE6E00', fontSize: 15, fontWeight: '700' },
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
  dietPlansButton: {
    backgroundColor: '#F5E1DA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  dietPlansButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  /* Chatbot button styles */
  chatbotButton: {
    backgroundColor: '#98EFB4FF',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 14,
    marginVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#89EAA6FF',
  },
  chatbotText: {
    color: '#06270a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatbotIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#3b2db5',
  },
  chatbotIcon: {
    width: 62,
    height: 62,
    borderRadius: 27,
  },
});

export default HomeScreen;