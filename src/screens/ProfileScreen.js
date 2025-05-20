import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../App';
import API_BASE_URL from '../config/config';

const API_URL = `${API_BASE_URL}/api/user/profile`;
const LOGIN_URL = `${API_BASE_URL}/api/user/login`;
const UPDATE_URL = `${API_BASE_URL}/api/user/profile`;
const DELETE_URL = `${API_BASE_URL}/api/user/profile`;

export default function ProfileScreen() {
  const { signOut } = useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedData, setEditedData] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userEmail = await AsyncStorage.getItem('userEmail');
      console.log('userEmail:', userEmail); // DEBUG
      if (userEmail) {
        const response = await fetch(`${API_URL}?email=${userEmail}`);
        const data = await response.json();
        console.log('Profile API response:', data); // DEBUG
        setUserData(data);
        setEditedData(data);
      } else {
        throw new Error('No userEmail found in AsyncStorage');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userData.email,
          name: editedData.name,
          surname: editedData.surname,
          height: editedData.height,
          weight: editedData.weight,
          photo: editedData.photo,
        }),
      });
      const data = await response.json();
      setUserData(data.user);
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Profile',
      'Are you sure you want to delete your profile? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await User.deleteProfile(userData.email);
              await AsyncStorage.removeItem('userEmail');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              Alert.alert('Error', error.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setEditedData(prev => ({
          ...prev,
          photo: result.assets[0].uri
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleProfileLogin = async () => {
    try {
      setLoading(true);
      const response = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      await AsyncStorage.setItem('userEmail', loginEmail);
      await loadUserData();
      
    } catch (error) {
      Alert.alert('Error', error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setUserData(null);
      setEditedData(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  // BMI kategorisi fonksiyonu
  const getBMICategory = (bmi) => {
    if (!bmi) return '';
    const val = parseFloat(bmi);
    if (val < 18.5) return { label: 'Underweight', color: '#4FC3F7', icon: '🍃' };
    if (val < 25) return { label: 'Normal', color: '#81C784', icon: '💪' };
    if (val < 30) return { label: 'Overweight', color: '#FFD54F', icon: '🍔' };
    return { label: 'Obese', color: '#E57373', icon: '⚠️' };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#32CD32" />
      </SafeAreaView>
    );
  }

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No user data found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {userData ? (
          <>
            <TouchableOpacity style={styles.photoContainer} onPress={editing ? pickImage : null}>
              <Image source={{ uri: editedData.photo }} style={styles.profileImage} />
              {editing && <Text style={styles.editPhotoText}>Tap to change photo</Text>}
            </TouchableOpacity>

            {editing ? (
              <>
                <TextInput
                  style={styles.input}
                  value={editedData.name}
                  onChangeText={(text) => setEditedData(prev => ({ ...prev, name: text }))}
                  placeholder="Name"
                />
                <TextInput
                  style={styles.input}
                  value={editedData.surname}
                  onChangeText={(text) => setEditedData(prev => ({ ...prev, surname: text }))}
                  placeholder="Surname"
                />
                <TextInput
                  style={styles.input}
                  value={editedData.height}
                  onChangeText={(text) => setEditedData(prev => ({ ...prev, height: text }))}
                  placeholder="Height (cm)"
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.input}
                  value={editedData.weight}
                  onChangeText={(text) => setEditedData(prev => ({ ...prev, weight: text }))}
                  placeholder="Weight (kg)"
                  keyboardType="numeric"
                />
                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
                    <Text style={styles.buttonText}>Save Changes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => {
                    setEditing(false);
                    setEditedData(userData);
                  }}>
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDelete}>
                    <Text style={styles.buttonText}>Delete Profile</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.name}>{userData.name} {userData.surname}</Text>
                <Text style={styles.email}>{userData.email}</Text>
                <View style={styles.infoContainer}>
                  <Text style={styles.infoLabel}>Gender:</Text>
                  <Text style={styles.infoValue}>{userData.gender}</Text>
                </View>
                <View style={styles.infoContainer}>
                  <Text style={styles.infoLabel}>Birth Date:</Text>
                  <Text style={styles.infoValue}>{userData.birthDate}</Text>
                </View>
                <View style={styles.infoContainer}>
                  <Text style={styles.infoLabel}>Height:</Text>
                  <Text style={styles.infoValue}>{userData.height} cm</Text>
                </View>
                <View style={styles.infoContainer}>
                  <Text style={styles.infoLabel}>Weight:</Text>
                  <Text style={styles.infoValue}>{userData.weight} kg</Text>
                </View>
                <View style={styles.infoContainer}>
                  <Text style={styles.infoLabel}>BMI:</Text>
                  <Text style={styles.infoValue}>{userData.bmi}</Text>
                </View>
                <View style={styles.bmiBox}>
                  <Text style={styles.bmiTitle}>BMI (Body Mass Index)</Text>
                  <View style={styles.bmiValueRow}>
                    <Text style={styles.bmiValue}>{userData.bmi}</Text>
                    <Text style={styles.bmiIcon}>{getBMICategory(userData.bmi).icon}</Text>
                  </View>
                  <View style={[styles.bmiBadge, {backgroundColor: getBMICategory(userData.bmi).color}]}> 
                    <Text style={styles.bmiBadgeText}>{getBMICategory(userData.bmi).label}</Text>
                  </View>
                  <Text style={styles.bmiDesc}>
                    {getBMICategory(userData.bmi).label === 'Underweight' && 'You are under the normal weight. Consider a balanced diet.'}
                    {getBMICategory(userData.bmi).label === 'Normal' && 'Your weight is in the healthy range. Keep it up!'}
                    {getBMICategory(userData.bmi).label === 'Overweight' && 'You are above the normal weight. Consider more activity.'}
                    {getBMICategory(userData.bmi).label === 'Obese' && 'You are in the obese range. Please consult a health professional.'}
                  </Text>
                </View>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={[styles.button, styles.editButton]} onPress={handleEdit}>
                    <Text style={styles.buttonText}>Edit Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleLogout}>
                    <Text style={styles.buttonText}>Logout</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </>
        ) : (
          <View style={styles.loginRegisterContainer}>
            <Text style={styles.sectionTitle}>Login or Register</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={loginEmail}
              onChangeText={setLoginEmail}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={loginPassword}
              onChangeText={setLoginPassword}
              secureTextEntry
            />
            <TouchableOpacity style={styles.button} onPress={handleProfileLogin}>
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.linkText}>Don't have an account? Register</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eaf3ef',
  },
  photoContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 10,
  },
  editPhotoText: {
    color: '#32CD32',
    fontSize: 14,
    marginTop: 5,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#222',
  },
  email: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 10,
    fontSize: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 8,
  },
  infoLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  infoValue: {
    flex: 1,
    fontSize: 16,
    color: '#666',
  },
  bmiBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  bmiTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  bmiValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bmiValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#32CD32',
    marginRight: 10,
  },
  bmiIcon: {
    fontSize: 32,
  },
  bmiBadge: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  bmiBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  bmiDesc: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  buttonContainer: {
    padding: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  editButton: {
    backgroundColor: '#32CD32',
  },
  saveButton: {
    backgroundColor: '#32CD32',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  loginRegisterContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#222',
  },
  linkText: {
    color: '#32CD32',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
});