import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';

const WorkoutDetailScreen = ({ route }) => {
  const { exercise } = route.params;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{exercise.name}</Text>
      <Image source={{ uri: exercise.gifUrl }} style={styles.image} />
      <View style={styles.details}>
        <Text style={styles.label}>Hedef Bölge:</Text>
        <Text style={styles.value}>{exercise.target}</Text>

        <Text style={styles.label}>Ekipman:</Text>
        <Text style={styles.value}>{exercise.equipment}</Text>

        <Text style={styles.label}>Vücut Bölgesi:</Text>
        <Text style={styles.value}>{exercise.bodyPart}</Text>
      </View>
      <Text style={styles.howTo}>
        Nasıl Yapılır: Bu hareket, {exercise.target} bölgesini çalıştırmak için {exercise.equipment} ile yapılır. 
        Hareket boyunca formunu koruyarak kontrollü şekilde tekrarlaman önerilir.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  image: { width: 250, height: 250, borderRadius: 10, marginBottom: 20 },
  details: { width: '100%', marginBottom: 20 },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 10 },
  value: { fontSize: 16, color: '#555' },
  howTo: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'left',
    marginTop: 20,
    backgroundColor: '#f3f3f3',
    padding: 15,
    borderRadius: 10,
  },
});

export default WorkoutDetailScreen;