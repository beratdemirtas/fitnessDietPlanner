import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DietScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Diet Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default DietScreen;