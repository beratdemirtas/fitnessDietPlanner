// BMICalculator.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";

const BMICalculator = ({ bmi }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Vücut Kitle Endeksi:</Text>
      <Text style={styles.bmiValue}>{bmi !== null ? bmi : "Hesaplanamadı"}</Text>
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
    color: "#2D9CDB",
  },
});

export default BMICalculator;