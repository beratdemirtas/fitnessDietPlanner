import React, { useEffect, useState, createContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import MealTrackerScreen from './src/screens/MealTrackerScreen';
import WorkoutScreen from './src/screens/WorkoutScreen';
import WorkoutDetailScreen from './src/screens/WorkoutDetailScreen';
import DietScreen from './src/screens/DietScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

const Stack = createStackNavigator();
export const AuthContext = createContext();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const email = await AsyncStorage.getItem('userEmail');
      setIsLoggedIn(!!email);
    } catch (error) {
      console.error('Error checking login status:', error);
      setIsLoggedIn(false);
    }
  };

  const authContext = {
    signIn: async (email) => {
      try {
        await AsyncStorage.setItem('userEmail', email);
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Error signing in:', error);
      }
    },
    signOut: async () => {
      try {
        await AsyncStorage.removeItem('userEmail');
        setIsLoggedIn(false);
      } catch (error) {
        console.error('Error signing out:', error);
      }
    }
  };

  if (isLoggedIn === null) return null; // loading

  return (
    <AuthContext.Provider value={authContext}>
      <NavigationContainer>
        <Stack.Navigator 
          screenOptions={{ 
            headerShown: true,
            headerStyle: {
              backgroundColor: '#eaf3ef',
            },
            headerTintColor: '#222',
          }}
        >
          {isLoggedIn ? (
            <>
              <Stack.Screen 
                name="HomeScreen" 
                component={HomeScreen}
                options={{ title: 'Home' }}
              />
              <Stack.Screen 
                name="Profile" 
                component={ProfileScreen}
                options={{ title: 'Profile' }}
              />
              <Stack.Screen 
                name="MealTracker" 
                component={MealTrackerScreen}
                options={{ title: 'Meal Tracker' }}
              />
              <Stack.Screen 
                name="Workout" 
                component={WorkoutScreen}
                options={{ title: 'Workout' }}
              />
              <Stack.Screen 
                name="WorkoutDetail" 
                component={WorkoutDetailScreen}
                options={{ title: 'Workout Details' }}
              />
              <Stack.Screen 
                name="Diet" 
                component={DietScreen}
                options={{ title: 'Diet' }}
              />
            </>
          ) : (
            <>
              <Stack.Screen 
                name="Login" 
                component={LoginScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Register" 
                component={RegisterScreen}
                options={{ headerShown: false }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}