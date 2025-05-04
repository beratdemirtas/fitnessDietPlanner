import React from "react";
import { View, Text, StyleSheet } from "react-native";

const BMICalculator = ({ bmi }) => {
  const getBMICategory = (bmiValue) => {
    const value = parseFloat(bmiValue);
    if (value < 18.5) return { text: "Zayıf", color: "#3498db" };
    if (value < 25) return { text: "Normal", color: "#27ae60" };
    if (value < 30) return { text: "Fazla Kilolu", color: "#f1c40f" };
    return { text: "Obez", color: "#e74c3c" };
  };

  if (!bmi) return null;

  const category = getBMICategory(bmi);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Vücut Kitle Endeksi:</Text>
      <Text style={[styles.bmiValue, { color: category.color }]}>
        {bmi} ({category.text})
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    alignItems: "center",
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  bmiValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
});

export default BMICalculator;