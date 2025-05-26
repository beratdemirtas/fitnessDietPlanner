import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../config/config';

const DIET_TYPES = [
  { label: 'None', value: '' },
  { label: 'Vegan', value: 'vegan' },
  { label: 'Vegetarian', value: 'vegetarian' },
  { label: 'Gluten-Free', value: 'gluten-free' },
  { label: 'High Protein', value: 'high-protein' },
];

const ALLERGIES = [
  { label: 'Gluten', value: 'gluten' },
  { label: 'Dairy', value: 'dairy' },
  { label: 'Soy', value: 'soy' },
];

const ACTIVITY_LEVELS = [
  { label: 'Sedentary', value: 1.2 },
  { label: 'Light', value: 1.375 },
  { label: 'Moderate', value: 1.55 },
  { label: 'Active', value: 1.725 },
  { label: 'Very Active', value: 1.9 },
];

function calculateCalories({ gender, age, height, weight, activity }) {
  if (!gender || !age || !height || !weight || !activity) return null;
  let bmr =
    gender === 'male'
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;
  return Math.round(bmr * activity);
}

const DietScreen = ({ navigation, route }) => {
  const [modalVisible, setModalVisible] = useState(false);
  // Form states
  const [gender, setGender] = useState('male');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activity, setActivity] = useState(1.2);
  const [diet, setDiet] = useState('');
  const [allergies, setAllergies] = useState([]);
  const [loading, setLoading] = useState(true);

  const calories = calculateCalories({ gender, age: Number(age), height: Number(height), weight: Number(weight), activity });

  const toggleAllergy = (value) => {
    setAllergies((prev) =>
      prev.includes(value) ? prev.filter(a => a !== value) : [...prev, value]
    );
  };
  const handleSave = async () => {
      const preferences = {
        calories,
        diet,
        allergies,
        gender,
        age,
        height,
        weight,
        activity,
      };
      await AsyncStorage.setItem('dietPreferences', JSON.stringify(preferences));
      setModalVisible(false);
      navigation.replace('DietPreferencesScreen', { preferences }); // Ekran adı düzeltildi
    };
    const handleCancel = () => {
    setModalVisible(false);
    setGender('male');
    setAge('');
    setHeight('');
    setWeight('');
    setActivity(1.2);
    setDiet('');
    setAllergies([]);
    };
    const handleOpenModal = async () => {
      setModalVisible(true);
    };
    const handleViewPreferences = async () => {
      const savedPreferences = await AsyncStorage.getItem('dietPreferences');
      if (!savedPreferences) {
        Alert.alert('No Diet Found', 'You have not created a diet plan yet. Please create one first.');
        return;
      }
      navigation.navigate('DietPreferencesScreen');
    };

    useEffect(() => {
      const fetchUserData = async () => {
        try {
          const userEmail = await AsyncStorage.getItem('userEmail');
          if (userEmail) {
            const response = await fetch(`${API_BASE_URL}/api/user/profile?email=${userEmail}`);
            const data = await response.json();
            setGender(data.gender || 'male');
            // Calculate age from birthDate if available
            if (data.birthDate) {
              const birth = new Date(data.birthDate);
              const today = new Date();
              let years = today.getFullYear() - birth.getFullYear();
              const m = today.getMonth() - birth.getMonth();
              if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) years--;
              setAge(years.toString());
            } else {
              setAge('');
            }
            setHeight(data.height ? data.height.toString() : '');
            setWeight(data.weight ? data.weight.toString() : '');
          } else {
            setGender('male');
            setAge('');
            setHeight('');
            setWeight('');
          }
        } catch (e) {
          // fallback to defaults
          setGender('male');
          setAge('');
          setHeight('');
          setWeight('');
        }
        setActivity(1.2);
        setDiet('');
        setAllergies([]);
        setLoading(false);
      };
      fetchUserData();
    }, []);

    useEffect(() => {
      if (route.params?.openModal) { // route.params üzerinden openModal kontrolü
        setModalVisible(true); // Modalı aç
      }
    }, [route.params]);

    if (loading) {
        return null;
      }
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#eaf3ef' }}>
          <View style={styles.container}>
            <Text style={styles.header}>Welcome to your Diet Planner!</Text>
            <Text style={styles.description}>
              Plan your weekly meals based on your goals and preferences. Get personalized meal suggestions and organize your diet easily.
            </Text>
            <TouchableOpacity style={styles.button} onPress={handleOpenModal}>
              <Text style={styles.buttonText}>Plan My Diet</Text>
            </TouchableOpacity>
            {/* Yeni Buton */}
            <TouchableOpacity
              style={[styles.button, styles.preferencesButton]}
              onPress={handleViewPreferences} // Updated to use the new function
            >
              <Text style={styles.buttonText}>View My Diet Preferences</Text>
            </TouchableOpacity>
          </View>
          <Modal
            visible={modalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleCancel}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <Text style={styles.modalHeader}>Personalize Your Diet Plan</Text>
                <View style={styles.row}>
                  <TouchableOpacity
                    style={[styles.radioBtn, gender === 'male' && styles.radioBtnActive]}
                    onPress={() => setGender('male')}
                  >
                    <Text style={[styles.radioText, gender === 'male' && styles.radioTextActive]}>Male</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.radioBtn, gender === 'female' && styles.radioBtnActive]}
                    onPress={() => setGender('female')}
                  >
                    <Text style={[styles.radioText, gender === 'female' && styles.radioTextActive]}>Female</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inputRow}>
                  <View style={styles.inputCol}>
                    <Text style={styles.label}>Age</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 28"
                      keyboardType="numeric"
                      value={age}
                      onChangeText={setAge}
                    />
                  </View>
                  <View style={styles.inputCol}>
                    <Text style={styles.label}>Height (cm)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 170"
                      keyboardType="numeric"
                      value={height}
                      onChangeText={setHeight}
                    />
                  </View>
                  <View style={styles.inputCol}>
                    <Text style={styles.label}>Weight (kg)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 65"
                      keyboardType="numeric"
                      value={weight}
                      onChangeText={setWeight}
                    />
                  </View>
                </View>
                <Text style={styles.label}>Activity Level</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  <View style={styles.chipRow}>
                    {ACTIVITY_LEVELS.map(opt => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.chip, activity === opt.value && styles.chipActive]}
                        onPress={() => setActivity(opt.value)}
                      >
                        <Text style={[styles.chipText, activity === opt.value && styles.chipTextActive]}>{opt.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                <Text style={styles.calorieLabel}>Estimated Daily Calories</Text>
                <Text style={styles.calorieValue}>{calories ? calories + ' kcal' : '-'}</Text>
                <Text style={styles.label}>Diet Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  <View style={styles.chipRow}>
                    {DIET_TYPES.map(opt => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.chip, diet === opt.value && styles.chipActive]}
                        onPress={() => setDiet(opt.value)}
                      >
                        <Text style={[styles.chipText, diet === opt.value && styles.chipTextActive]}>{opt.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                <Text style={styles.label}>Allergies</Text>
                <View style={styles.checkboxList}>
                  {ALLERGIES.map(opt => (
                    <TouchableOpacity
                      key={opt.value}
                      style={styles.checkboxRow}
                      onPress={() => toggleAllergy(opt.value)}
                    >
                      <View style={[styles.checkbox, allergies.includes(opt.value) && styles.checkboxChecked]}>
                        {allergies.includes(opt.value) && <View style={styles.checkboxDot} />}
                      </View>
                      <Text style={styles.checkboxLabel}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.modalBtnRow}>
                  <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#6495ED' }]} onPress={handleSave}>
                    <Text style={styles.modalBtnText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#bbb' }]} onPress={handleCancel}>
                    <Text style={styles.modalBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2d4d6a',
    marginBottom: 18,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#6495ED',
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'stretch',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d4d6a',
    marginBottom: 18,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  radioBtn: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 6,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  radioBtnActive: {
    backgroundColor: '#6495ED',
    borderColor: '#6495ED',
  },
  radioText: {
    color: '#444',
    fontWeight: 'bold',
    fontSize: 16,
  },
  radioTextActive: {
    color: '#fff',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inputCol: {
    flex: 1,
    marginHorizontal: 4,
  },
  label: {
    fontSize: 15,
    color: '#444',
    marginBottom: 4,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#eee',
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  chip: {
    backgroundColor: '#f5f5f5',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#eee',
  },
  chipActive: {
    backgroundColor: '#6495ED',
    borderColor: '#6495ED',
  },
  chipText: {
    color: '#444',
    fontWeight: 'bold',
    fontSize: 15,
  },
  chipTextActive: {
    color: '#fff',
  },
  calorieLabel: {
    fontSize: 15,
    color: '#888',
    marginTop: 10,
    textAlign: 'center',
  },
  calorieValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d4d6a',
    textAlign: 'center',
    marginBottom: 8,
  },
  checkboxList: {
    marginVertical: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#bbb',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    borderColor: '#6495ED',
    backgroundColor: '#6495ED',
  },
  checkboxDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#444',
    fontWeight: 'bold',
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  modalBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  preferencesButton: {
    backgroundColor: '#4CAF50', // Yeşil renk
    marginTop: 12, // Üst boşluk
  },
});

export default DietScreen;

