import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../config/config';

 const API_KEY = 'f0d59d87a6msh534adefccaa272dp1b7d2fjsn95a61f9d747c'; // kendi RapidAPI anahtarın
 const API_HOST = 'tasty.p.rapidapi.com';
 const API_URL = 'https://tasty.p.rapidapi.com/recipes/list';

const mealTypes = [
  { key: 'breakfast', label: 'Breakfast', query: 'breakfast' },
  { key: 'lunch', label: 'Lunch', query: 'lunch' },
  { key: 'dinner', label: 'Dinner', query: 'dinner' },
  { key: 'snack', label: 'Snack', query: 'snack' },
];

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

  const [preferences, setPreferences] = useState({
    calories: 2000,
    diet: '',
    allergies: [],
    gender: 'male',
    age: '',
    height: '',
    weight: '',
    activity: 1.2,
    goal: 'maintain',
  });
  const [todayMenu, setTodayMenu] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);

  const calories = calculateCalories({ gender, age: Number(age), height: Number(height), weight: Number(weight), activity });

  const toggleAllergy = (value) => {
    setAllergies((prev) =>
      prev.includes(value) ? prev.filter(a => a !== value) : [...prev, value]
    );
  };
  const handleSave = async () => {
    const newPreferences = {
      calories,
      diet,
      allergies,
      gender,
      age,
      height,
      weight,
      activity,
    };

    try {
      const userEmail = await AsyncStorage.getItem('userEmail');
      // Kullanıcıya özel kaydetme
      await AsyncStorage.setItem(`dietPreferences_${userEmail}`, JSON.stringify(newPreferences));
      setPreferences(newPreferences);
      setModalVisible(false);

      // Yeni menü oluştur
      setMenuLoading(true);
      const today = new Date().toISOString().slice(0, 10);
      await fetchTodayMenuAndSave(newPreferences, today, userEmail);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to update menu. Please try again.');
      setMenuLoading(false);
    }
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

  // loadPreferences fonksiyonunu güncelle
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const userEmail = await AsyncStorage.getItem('userEmail');
        const savedPreferences = await AsyncStorage.getItem(`dietPreferences_${userEmail}`); // userEmail'e göre saklama
        if (savedPreferences) {
          const parsedPreferences = JSON.parse(savedPreferences);
          setPreferences(parsedPreferences);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };
    loadPreferences();
  }, []);

  // loadMenu useEffect'ini güncelle
  useEffect(() => {
    const loadMenu = async () => {
      setMenuLoading(true);
      const today = new Date().toISOString().slice(0, 10);
      try {
        const userEmail = await AsyncStorage.getItem('userEmail');
        const saved = await AsyncStorage.getItem(`todayMenu_${userEmail}`); // userEmail'e göre saklama
        if (saved) {
          const { date, menu } = JSON.parse(saved);
          if (date === today) {
            setTodayMenu(menu);
            setMenuLoading(false);
            return;
          }
        }
        // Menü yoksa veya gün değiştiyse yeni menü oluştur
        await fetchTodayMenuAndSave(preferences, today, userEmail);
      } catch (error) {
        setMenuLoading(false);
      }
    };
    loadMenu();
  }, []);

  async function fetchTastyRecipes(query) {
    try {
      const res = await fetch(`${API_URL}?from=0&size=20&q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': API_KEY,
          'X-RapidAPI-Host': API_HOST,
        },
      });
      if (!res.ok) {
        // Hata kodunu konsola yaz
        console.log('API error:', res.status, await res.text());
        throw new Error('API error: ' + res.status);
      }
      const data = await res.json();
      return data.results || [];
    } catch (e) {
      console.log('fetchTastyRecipes error:', e);
      return [];
    }
  }

  function filterTastyRecipes(recipes, preferences, maxCalories) {
    return recipes.filter(r => {
      if (maxCalories && r.nutrition && r.nutrition.calories && r.nutrition.calories > maxCalories) return false;
      if (preferences.diet && preferences.diet !== '' && r.tags && !r.tags.some(t => t.name.toLowerCase().includes(preferences.diet.toLowerCase()))) return false;
      if (preferences.allergies && preferences.allergies.length > 0 && r.sections) {
        const allIngredients = r.sections.flatMap(s => s.components.map(c => c.ingredient.name.toLowerCase()));
        if (preferences.allergies.some(a => allIngredients.includes(a.toLowerCase()))) return false;
      }
      return true;
    });
  }

  function getMealNutrition(recipe) {
    if (!recipe || !recipe.nutrition) return null;
    return {
      calories: recipe.nutrition.calories,
      protein: recipe.nutrition.protein,
      fat: recipe.nutrition.fat,
      carbs: recipe.nutrition.carbohydrates,
    };
  }

  // fetchTodayMenuAndSave fonksiyonunu güncelle
  const fetchTodayMenuAndSave = async (preferences, today, userEmail) => {
    setMenuLoading(true);
    try {
      const menu = [];
      for (const mealType of mealTypes) {
        let query = mealType.query;
        if (preferences.diet && preferences.diet !== '') query += ` ${preferences.diet}`;
        let recipes = await fetchTastyRecipes(query);
        let filtered = filterTastyRecipes(recipes, preferences, preferences.calories ? preferences.calories / 4 : undefined);
        if (filtered.length === 0) {
          recipes = await fetchTastyRecipes(mealType.query);
          filtered = recipes;
        }
        menu.push({
          mealType: mealType.key,
          recipe: filtered.length > 0 ? filtered[Math.floor(Math.random() * filtered.length)] : null,
        });
      }
      setTodayMenu(menu);
      // Kullanıcıya özel kaydetme
      await AsyncStorage.setItem(`todayMenu_${userEmail}`, JSON.stringify({ date: today, menu }));
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch today\'s menu. Please try again later.');
    } finally {
      setMenuLoading(false);
    }
  };

  if (loading) {
      return null;
    }
  return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#eaf3ef' }}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <TouchableOpacity style={styles.button} onPress={handleOpenModal}>
            <Text style={styles.buttonText}>Plan My Diet</Text>
          </TouchableOpacity>

          {/* View My Diet Preferences butonunu kaldırdık */}

          {/* Diet Preferences Card */}
          <View style={styles.card}>
            <Text style={styles.header2}>Your Diet Preferences</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Calories:</Text>
              <Text style={styles.value}>{preferences.calories} kcal</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Diet Type:</Text>
              <Text style={styles.value}>{preferences.diet || 'None'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Allergies:</Text>
              <Text style={styles.value}>
                {preferences.allergies.length > 0 ? preferences.allergies.join(', ') : 'None'}
              </Text>
            </View>
          </View>

          {/* Today's Menu Card */}
          <View style={styles.card}>
            <Text style={styles.header2}>Today's Menu</Text>
            {menuLoading ? (
              <ActivityIndicator size="large" color="#4CAF50" />
            ) : (
              todayMenu.map((meal, index) => {
                const recipe = meal.recipe;
                const nutrition = getMealNutrition(recipe);
                return (
                  <View key={index} style={styles.mealCardContainer}>
                    <View style={styles.mealCard}>
                      <Text style={styles.mealType}>
                        {meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}
                      </Text>
                      {recipe ? (
                        <>
                          <Text style={styles.mealName}>{recipe.name}</Text>
                          {recipe.thumbnail_url && (
                            <Image source={{ uri: recipe.thumbnail_url }} style={styles.mealImage} />
                          )}
                          {nutrition && (
                            <Text style={styles.nutritionText}>
                              <Text>Calories: {nutrition.calories} kcal</Text>
                              <Text> | </Text>
                              <Text>Protein: {nutrition.protein}g</Text>
                              <Text> | </Text>
                              <Text>Fat: {nutrition.fat}g</Text>
                              <Text> | </Text>
                              <Text>Carbs: {nutrition.carbs}g</Text>
                            </Text>
                          )}
                          
                          {recipe.sections && recipe.sections.length > 0 && (
                            <View style={styles.sectionContainer}>
                              <Text style={styles.sectionTitle}>Ingredients</Text>
                              {recipe.sections.map((section, idx) => (
                                <View key={idx}>
                                  {section.components.map((component, compIdx) => (
                                    <Text key={compIdx} style={styles.ingredientText}>
                                      <Text>• </Text>
                                      <Text>
                                        {component.raw_text || 
                                          `${component.measurements[0]?.quantity || ''} ${component.ingredient?.name || ''}`}
                                      </Text>
                                    </Text>
                                  ))}
                                </View>
                              ))}
                            </View>
                          )}

                          {recipe.instructions && recipe.instructions.length > 0 && (
                            <View style={styles.sectionContainer}>
                              <Text style={styles.sectionTitle}>Instructions</Text>
                              {recipe.instructions.map((instruction, idx) => (
                                <Text key={idx} style={styles.instructionText}>
                                  <Text>{`${idx + 1}. `}</Text>
                                  <Text>{instruction.display_text}</Text>
                                </Text>
                              ))}
                            </View>
                          )}
                        </>
                      ) : (
                        <Text style={styles.noRecipeText}>No recipe found</Text>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Modal burada */}
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
        </ScrollView>
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
    paddingHorizontal: 16,
    marginHorizontal: 16,
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
    justifyContent: 'space-between',
    marginBottom: 8,
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    alignItems: 'stretch',
  },
  value: {
    fontSize: 16,
    color: '#2d4d6a',
    fontWeight: 'bold',
  },
  mealCardContainer: {
    marginBottom: 24,
  },
  mealCard: {
    backgroundColor: '#f0f0f0', // Beyaz arka plan
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: '#eee',
  },
  mealType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d4d6a',
    marginBottom: 8,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d4d6a',
    marginBottom: 4,
  },
  mealImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  nutritionText: {
    fontSize: 10, 
    color: '#666',
    marginTop: 1,
    marginBottom: 1,
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 6,
    textAlign: 'center',
  },
  noRecipeText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  scrollContainer: {
    padding: 1,
    backgroundColor: '#eaf3ef',
  },
  header2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d4d6a',
    marginBottom: 10,
    textAlign: 'center',
  },
  sectionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f0f0f0', // Hafif gri arka plan
    borderRadius: 8,
    padding: 1,
  },
  sectionTitle: {
    fontSize: 16, // Küçültüldü
    fontWeight: '600',
    color: '#2d4d6a',
    marginBottom: 6,
  },
  ingredientText: {
    fontSize: 13, // Küçültüldü
    color: '#555',
    marginBottom: 1,
    paddingLeft: 1,
    lineHeight: 17,
  },
  instructionText: {
    fontSize: 13, // Küçültüldü
    color: '#555',
    marginBottom: 1,
    lineHeight: 17,
    paddingLeft: 3,
  },
  ingredientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  ingredientItem: {
    flex: 1,
    minWidth: '45%',
    maxWidth: '50%',
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  instructionStep: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  stepNumber: {
    minWidth: 20,
    color: '#6495ED',
    fontWeight: 'bold',
  }
});

export default DietScreen;

