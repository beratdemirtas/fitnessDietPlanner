import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // İkonlar için

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* Profil Butonu */}
      <TouchableOpacity 
        style={styles.profileButton} 
        onPress={() => navigation.navigate("Profile")}
      >
        <Ionicons name="person-circle-outline" size={32} color="white" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: "#4CAF50" }]} 
        onPress={() => navigation.navigate("Diet")}
      >
        <Ionicons name="fast-food-outline" size={24} color="white" />
        <Text style={styles.buttonText}>Diet Plans</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: "#FF9800" }]} 
        onPress={() => navigation.navigate("Workout")}
      >
        <Ionicons name="barbell-outline" size={24} color="white" />
        <Text style={styles.buttonText}>Workout</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: "#2196F3" }]} 
        onPress={() => navigation.navigate("MealTracker")}
      >
        <Ionicons name="restaurant-outline" size={24} color="white" />
        <Text style={styles.buttonText}>Meals</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8F5E9", // Hafif yeşil tonunda arka plan
    alignItems: "center",
    justifyContent: "center",
  },
  profileButton: {
    position: "absolute",
    top: 20, // Üst kenara mesafe
    right: 20, // Sağ kenara mesafe
    backgroundColor: "#595A50FF",
    borderRadius: 15, // Hafif oval köşe
    padding: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 10,
    width: "80%",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    marginLeft: 10,
    fontWeight: "bold",
  },
});

export default HomeScreen;