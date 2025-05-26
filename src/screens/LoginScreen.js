import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../App';
import API_BASE_URL from '../config/config';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Kullanıcı e-postasını kaydet
      await AsyncStorage.setItem('userEmail', email);

      // Kullanıcıya özel başlangıç verilerini oluştur
      await initializeUserData(email);

      // Diyet planını kontrol et ve gerekiyorsa oluştur
      await initializeDietPlan(email);

      // Kullanıcı giriş yaptı olarak işaretleniyor
      signIn(email);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Kullanıcıya özel başlangıç verilerini oluştur
  const initializeUserData = async (email) => {
    try {
      await AsyncStorage.setItem(`favoriteMeals_${email}`, JSON.stringify([])); // Favori yemekler
      await AsyncStorage.setItem(`dailyCalories_${email}`, '2000'); // Günlük kalori hedefi
      console.log('User data initialized for:', email);
    } catch (e) {
      console.error('Error initializing user data:', e);
    }
  };

  const initializeDietPlan = async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/initialize-diet-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('Error initializing diet plan:', data.message);
      } else {
        console.log('Diet plan initialized:', data.dietPlan);
      }
    } catch (error) {
      console.error('Error initializing diet plan:', error);
    }
  };

  const checkLoginStatus = async () => {
    try {
      const email = await AsyncStorage.getItem('userEmail');
      setIsLoggedIn(!!email);
    } catch (error) {
      console.error('Error checking login status:', error);
      setIsLoggedIn(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#eaf3ef' }}>
      <View style={styles.container}>
        <Text style={styles.title}>Login</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity 
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => navigation.navigate('Register')}
          style={styles.linkButton}
        >
          <Text style={styles.linkText}>Don't have an account? Register</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eaf3ef' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, color: '#222' },
  input: { width: '80%', backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 16 },
  button: { backgroundColor: '#32CD32', padding: 14, borderRadius: 8, width: '80%', alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  linkText: { color: '#32CD32', marginTop: 18, fontWeight: 'bold' },
  linkButton: { marginTop: 20, alignItems: 'center' },
});

export default LoginScreen;