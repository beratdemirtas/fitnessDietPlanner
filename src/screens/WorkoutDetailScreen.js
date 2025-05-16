import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video } from 'expo-av';
import exerciseVideos from '../assets/exerciseVideos';

const WorkoutDetailScreen = ({ route }) => {
  const { exercise } = route.params;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{exercise.name}</Text>
        <Video
          source={exerciseVideos[exercise.video]}
          style={styles.image}
          useNativeControls
          resizeMode="contain"
          isLooping
          shouldPlay
        />
        <View style={styles.details}>
          <Text style={styles.label}>Target Area:</Text>
          <Text style={styles.value}>{exercise.target}</Text>
          <Text style={styles.label}>Equipment:</Text>
          <Text style={styles.value}>{exercise.equipment}</Text>
        </View>
        <View style={styles.howTo}>
          <Text style={{ fontWeight: 'bold' }}>
            How To:
          </Text>
          <Text>
          </Text>
          {exercise.howTo && exercise.howTo.map((line, idx) => (
            <Text key={idx} style={{ marginBottom: 4 }}>{line}</Text>
          ))}
          <Text style={{ marginTop: 10 }}>
            It is recommended to repeat in a controlled manner, maintaining form throughout the movement.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 20,
    marginBottom: 20,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    height: 230,
    resizeMode: 'cover',
  },
  details: { width: '100%', marginBottom: 20 },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 10 },
  value: { fontSize: 16, color: '#555' },
  howTo: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'left',
    marginTop: 5,
    backgroundColor: '#f3f3f3',
    padding: 15,
    borderRadius: 10,
    width: 400,
  },
});

export default WorkoutDetailScreen;