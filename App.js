import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import MealTrackerScreen from './src/screens/MealTrackerScreen';
import WorkoutScreen from './src/screens/WorkoutScreen';
import DietScreen from './src/screens/DietScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Fitness & Diet Planner" component={HomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="MealTracker" component={MealTrackerScreen} />
        <Stack.Screen name="Workout" component={WorkoutScreen} />
        <Stack.Screen name="Diet" component={DietScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}