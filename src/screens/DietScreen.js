import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const dietExamples = [
  {
    time: 'Morning',
    title: 'Egg & Avocado Toast',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80',
    details: 'Egg, avocado, whole grain bread, spinach',
  },
  {
    time: 'Afternoon',
    title: 'Chicken Salad Bowl',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80',
    details: 'Grilled chicken, greens, tomatoes, carrots',
  },
  {
    time: 'Evening',
    title: 'Salmon & Veggies',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
    details: 'Salmon, broccoli, sweet potato',
  },
  {
    time: 'Snack',
    title: 'Fruit & Yogurt',
    image: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=400&q=80',
    details: 'Greek yogurt, mixed berries, honey, chia seeds',
  },
  {
    time: 'Night',
    title: 'Light Cheese Plate',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
    details: 'Low-fat cheese, cucumber, cherry tomatoes, walnuts',
  },
];

const macros = [
  { label: 'Fat', percent: 29, color: '#FFD700' },
  { label: 'Pro', percent: 65, color: '#6495ED' },
  { label: 'Carb', percent: 85, color: '#8A2BE2' },
];

const placeholderImage = 'https://via.placeholder.com/400x120?text=No+Image';

const DietScreen = () => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#eaf3ef' }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Today's Goal Card */}
        <View style={styles.goalCard}>
          <Text style={styles.goalTitle}>Today's Goal</Text>
          <View style={styles.goalRow}>
            <Text style={styles.calorieText}>Calories{"\n"}<Text style={styles.calorieValue}>1,234</Text></Text>
            <View style={styles.macrosRow}>
              {macros.map((m, i) => (
                <View key={i} style={styles.macroCircleBox}>
                  <View style={[styles.macroCircle, { borderColor: m.color }]}>
                    <Text style={[styles.macroPercent, { color: m.color }]}>{m.percent}%</Text>
                  </View>
                  <Text style={styles.macroLabel}>{m.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Diet Example Cards */}
        {dietExamples.map((item, idx) => {
          const [imgSrc, setImgSrc] = useState(item.image);
          return (
            <View key={idx} style={styles.dietCard}>
              <Image
                source={{ uri: imgSrc }}
                style={styles.dietImage}
                onError={() => setImgSrc(placeholderImage)}
                defaultSource={{ uri: placeholderImage }}
              />
              <View style={styles.dietInfoRow}>
                <Text style={styles.dietTime}>{item.time}</Text>
                <Text style={styles.dietTitle}>{item.title}</Text>
                <TouchableOpacity>
                  <Text style={styles.detailsBtn}>Details</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.dietDetails}>{item.details}</Text>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#eaf3ef',
    paddingBottom: 32,
  },
  goalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222',
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calorieText: {
    fontSize: 15,
    color: '#888',
    marginRight: 12,
  },
  calorieValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
  },
  macrosRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroCircleBox: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  macroCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  macroPercent: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  macroLabel: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
  },
  dietCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 18,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  dietImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  dietInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  dietTime: {
    fontSize: 15,
    color: '#888',
    fontWeight: 'bold',
  },
  dietTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  detailsBtn: {
    fontSize: 14,
    color: '#6495ED',
    fontWeight: 'bold',
  },
  dietDetails: {
    fontSize: 14,
    color: '#444',
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 4,
  },
});

export default DietScreen;