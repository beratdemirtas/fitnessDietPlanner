import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function GoalScreen({ navigation, route }) {
  const [userInfo, setUserInfo] = useState({
    age: '',
    gender: 'male',
    height: '',
    weight: '',
    activityLevel: 'moderate',
    goal: 'maintain', // 'lose', 'maintain', 'gain'
  });
  const [goalInput, setGoalInput] = useState({ protein: 100, fat: 60, carbs: 200, calories: 2000 });
  const [calculatedCalories, setCalculatedCalories] = useState(null);
  const [inputErrors, setInputErrors] = useState({});

  const validateInputs = () => {
    const errors = {};
    if (!userInfo.age || isNaN(userInfo.age) || userInfo.age < 10 || userInfo.age > 100) errors.age = 'Enter a valid age (10-100)';
    if (!userInfo.height || isNaN(userInfo.height) || userInfo.height < 100 || userInfo.height > 250) errors.height = 'Enter a valid height (100-250 cm)';
    if (!userInfo.weight || isNaN(userInfo.weight) || userInfo.weight < 30 || userInfo.weight > 250) errors.weight = 'Enter a valid weight (30-250 kg)';
    setInputErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const calculateCalories = () => {
    if (!validateInputs()) return;
    const { age, gender, height, weight, activityLevel, goal } = userInfo;
    let bmr;
    if (gender === 'male') {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9
    };
    let tdee = Math.round(bmr * activityMultipliers[activityLevel]);
    let adjustment = 0;
    let note = '';
    if (goal === 'lose') {
      adjustment = -500;
      note = 'Calorie deficit for weight loss';
    } else if (goal === 'gain') {
      adjustment = 500;
      note = 'Calorie surplus for weight gain';
    } else {
      note = 'Maintenance calories';
    }
    tdee = tdee + adjustment;
    setCalculatedCalories({ value: tdee, note });
    const newMacroGoals = {
      calories: tdee,
      protein: Math.round((tdee * 0.3) / 4),
      carbs: Math.round((tdee * 0.45) / 4),
      fat: Math.round((tdee * 0.25) / 9)
    };
    setGoalInput(newMacroGoals);
  };

  const saveGoals = async () => {
    await AsyncStorage.setItem('macroGoals', JSON.stringify(goalInput));
    navigation.navigate('MealTracker');
  };

  return (
    <View style={{flex:1, backgroundColor:'#fff'}}>
      <ScrollView contentContainerStyle={{padding:16, paddingBottom:32}} keyboardShouldPersistTaps="handled">
        <Text style={styles.minimalTitle}>Set Daily Goal</Text>
        <Text style={styles.minimalSubtitle}>Enter your information to calculate your daily calorie needs</Text>
        <View style={styles.rowInputs}>
          <View style={styles.inputGroupSmall}>
            <Text style={styles.inputLabelMinimal}>Age</Text>
            <TextInput
              style={[styles.inputMinimal, inputErrors.age && styles.inputError]}
              keyboardType="numeric"
              value={userInfo.age}
              onChangeText={text => setUserInfo({ ...userInfo, age: text })}
              placeholder="e.g. 25"
              maxLength={3}
            />
            {inputErrors.age && <Text style={styles.errorTextSmall}>{inputErrors.age}</Text>}
          </View>
          <View style={styles.inputGroupSmall}>
            <Text style={styles.inputLabelMinimal}>Height (cm)</Text>
            <TextInput
              style={[styles.inputMinimal, inputErrors.height && styles.inputError]}
              keyboardType="numeric"
              value={userInfo.height}
              onChangeText={text => setUserInfo({ ...userInfo, height: text })}
              placeholder="e.g. 170"
              maxLength={3}
            />
            {inputErrors.height && <Text style={styles.errorTextSmall}>{inputErrors.height}</Text>}
          </View>
          <View style={styles.inputGroupSmall}>
            <Text style={styles.inputLabelMinimal}>Weight (kg)</Text>
            <TextInput
              style={[styles.inputMinimal, inputErrors.weight && styles.inputError]}
              keyboardType="numeric"
              value={userInfo.weight}
              onChangeText={text => setUserInfo({ ...userInfo, weight: text })}
              placeholder="e.g. 65"
              maxLength={3}
            />
            {inputErrors.weight && <Text style={styles.errorTextSmall}>{inputErrors.weight}</Text>}
          </View>
        </View>
        <View style={styles.inputGroupFull}>
          <Text style={styles.inputLabelMinimal}>Gender</Text>
          <View style={styles.genderRowMinimal}>
            <TouchableOpacity
              style={[styles.genderBtnMinimal, userInfo.gender === 'male' && styles.genderBtnActive]}
              onPress={() => setUserInfo({ ...userInfo, gender: 'male' })}
            >
              <Text style={[styles.genderBtnText, userInfo.gender === 'male' && styles.genderBtnTextActive]}>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderBtnMinimal, userInfo.gender === 'female' && styles.genderBtnActive]}
              onPress={() => setUserInfo({ ...userInfo, gender: 'female' })}
            >
              <Text style={[styles.genderBtnText, userInfo.gender === 'female' && styles.genderBtnTextActive]}>Female</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.inputGroupFull}>
          <Text style={styles.inputLabelMinimal}>Goal</Text>
          <View style={styles.goalRowMinimal}>
            <TouchableOpacity
              style={[styles.goalBtnMinimal, userInfo.goal === 'lose' && styles.goalBtnActive]}
              onPress={() => setUserInfo({ ...userInfo, goal: 'lose' })}
            >
              <Text style={[styles.goalBtnText, userInfo.goal === 'lose' && styles.goalBtnTextActive]}>Lose</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.goalBtnMinimal, userInfo.goal === 'maintain' && styles.goalBtnActive]}
              onPress={() => setUserInfo({ ...userInfo, goal: 'maintain' })}
            >
              <Text style={[styles.goalBtnText, userInfo.goal === 'maintain' && styles.goalBtnTextActive]}>Maintain</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.goalBtnMinimal, userInfo.goal === 'gain' && styles.goalBtnActive]}
              onPress={() => setUserInfo({ ...userInfo, goal: 'gain' })}
            >
              <Text style={[styles.goalBtnText, userInfo.goal === 'gain' && styles.goalBtnTextActive]}>Gain</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.inputGroupFull}>
          <Text style={styles.inputLabelMinimal}>Activity Level</Text>
          <Picker
            selectedValue={userInfo.activityLevel}
            style={styles.pickerMinimal}
            onValueChange={value => setUserInfo({ ...userInfo, activityLevel: value })}
          >
            <Picker.Item label="Sedentary (Little or no exercise)" value="sedentary" />
            <Picker.Item label="Light (Exercise 1-3 days/week)" value="light" />
            <Picker.Item label="Moderate (Exercise 3-5 days/week)" value="moderate" />
            <Picker.Item label="Active (Exercise 6-7 days/week)" value="active" />
            <Picker.Item label="Very Active (Hard exercise & physical job)" value="veryActive" />
          </Picker>
        </View>
        <TouchableOpacity style={styles.calculateBtnMinimal} onPress={calculateCalories}>
          <Text style={styles.calculateBtnTextMinimal}>Calculate</Text>
        </TouchableOpacity>
        {calculatedCalories && (
          <View style={styles.resultCardMinimal}>
            <Text style={styles.resultCaloriesMinimal}>{calculatedCalories.value} kcal</Text>
            <Text style={styles.resultNoteMinimal}>{calculatedCalories.note}</Text>
            <View style={styles.resultMacrosRowMinimal}>
              <Text style={styles.resultMacroMinimal}>💪 {goalInput.protein}g</Text>
              <Text style={styles.resultMacroMinimal}>🍞 {goalInput.carbs}g</Text>
              <Text style={styles.resultMacroMinimal}>🥑 {goalInput.fat}g</Text>
            </View>
          </View>
        )}
        <TouchableOpacity style={[styles.saveBtnMinimal, !calculatedCalories && {opacity:0.5}]} onPress={saveGoals} disabled={!calculatedCalories}>
          <Text style={styles.saveBtnTextMinimal}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtnMinimal} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtnTextMinimal}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 32,
    paddingHorizontal: 10,
  },
  minimalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#222',
    textAlign: 'center',
  },
  minimalSubtitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 18,
    textAlign: 'center',
  },
  rowInputs: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inputGroupSmall: {
    flex: 1,
    marginHorizontal: 4,
  },
  inputGroupFull: {
    width: '100%',
    marginBottom: 10,
  },
  inputLabelMinimal: {
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
    fontSize: 14,
  },
  inputMinimal: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#eaf3ef',
    marginBottom: 2,
  },
  inputError: {
    borderColor: '#E57373',
    backgroundColor: '#fff0f0',
  },
  errorTextSmall: {
    color: '#E57373',
    fontSize: 12,
    marginBottom: 2,
  },
  genderRowMinimal: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 2,
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  genderBtnMinimal: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eaf3ef',
  },
  genderBtnActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#388e3c',
  },
  genderBtnText: {
    fontSize: 15,
    color: '#333',
    fontWeight: 'bold',
  },
  genderBtnTextActive: {
    color: '#fff',
  },
  goalRowMinimal: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 2,
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  goalBtnMinimal: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eaf3ef',
  },
  goalBtnActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#388e3c',
  },
  goalBtnText: {
    fontSize: 15,
    color: '#333',
    fontWeight: 'bold',
  },
  goalBtnTextActive: {
    color: '#fff',
  },
  pickerMinimal: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderColor: '#eaf3ef',
    borderWidth: 1,
    marginTop: 2,
    marginBottom: 2,
  },
  calculateBtnMinimal: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
    width: '100%',
  },
  calculateBtnTextMinimal: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  resultCardMinimal: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 16,
    marginTop: 18,
    marginBottom: 8,
    width: '100%',
    alignItems: 'center',
  },
  resultCaloriesMinimal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  resultNoteMinimal: {
    color: '#888',
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'center',
  },
  resultMacrosRowMinimal: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 2,
  },
  resultMacroMinimal: {
    fontSize: 15,
    color: '#222',
    marginHorizontal: 10,
    fontWeight: 'bold',
  },
  saveBtnMinimal: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
    width: '100%',
  },
  saveBtnTextMinimal: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cancelBtnMinimal: {
    backgroundColor: '#eaf3ef',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 16,
    width: '100%',
  },
  cancelBtnTextMinimal: {
    color: '#888',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 