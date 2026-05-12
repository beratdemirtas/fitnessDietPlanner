import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { GEMINI_API_KEY } from '@env';

const GEMINI_MODEL = 'gemini-2.5-flash';

export default function FoodScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cameraRef = useRef(null);
  const navigation = useNavigation();

  const takePicture = async () => {
    if (!cameraRef.current) return;
    setLoading(true);
    setError(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
      setPhotoUri(photo.uri);
      await analyzeFood(photo.base64);
    } catch (err) {
      console.error(err);
      setError('Fotoğraf çekilirken hata oluştu.');
      setLoading(false);
    }
  };

  const analyzeFood = async (base64Image) => {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: base64Image,
                  },
                },
                {
                  text: `Bu yemek fotoğrafını analiz et. Sadece aşağıdaki JSON formatında döndür, başka hiçbir şey yazma:
{"name": "yemeğin adı", "calories": 0, "protein": 0, "carbs": 0, "fat": 0}`,
                },
              ],
            }],
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        const message = data?.error?.message || data?.message || 'API hatası oluştu.';
        throw new Error(message);
      }
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Model yanıtı alınamadı. Lütfen tekrar deneyin veya API kotanızı kontrol edin.');
      }

      const cleaned = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      setProduct({
        name: parsed.name,
        calories: parsed.calories,
        protein: parsed.protein,
        carbohydrates: parsed.carbs,
        fat: parsed.fat,
      });
    } catch (err) {
      console.error(err);
      const message = err.message || 'Yemek analizi başarısız oldu. Tekrar deneyin.';
      setError(message);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setProduct(null);
    setPhotoUri(null);
    setError(null);
  };

  const handleAddAsMeal = () => {
    if (!product) return;
    navigation.navigate('MealTracker', {
      scannedMeal: {
        name: product.name || 'Scanned Meal',
        calories: Number(product.calories) || 0,
        protein: Number(product.protein) || 0,
        carbs: Number(product.carbohydrates) || 0,
        fat: Number(product.fat) || 0,
        mealType: 'custom',
      },
    });
  };

  // İzin yok
  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionCard}>
          <MaterialIcons name="camera-alt" size={60} color="#FF6B6B" />
          <Text style={styles.permissionTitle}>Kamera İzni Gerekli</Text>
          <Text style={styles.permissionDescription}>
            Yemek analizi için kamera erişimine ihtiyacımız var.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>İzin Ver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Yükleniyor
  if (loading) {
    return (
      <View style={styles.container}>
        {photoUri && <Image source={{ uri: photoUri }} style={styles.previewImage} />}
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Yemek analiz ediliyor...</Text>
        </View>
      </View>
    );
  }

  // Hata
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={60} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Hata</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={resetScanner}>
            <MaterialIcons name="camera-alt" size={24} color="white" />
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Sonuç
  if (product) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.resultContainer} contentContainerStyle={styles.scrollContent}>
          <View style={styles.resultCard}>
            <View style={styles.headerSection}>
              <Text style={styles.resultTitle}>Yemek Analizi</Text>
            </View>

            {photoUri && (
              <Image source={{ uri: photoUri }} style={styles.productImage} resizeMode="cover" />
            )}

            <View style={styles.infoSection}>
              <Text style={styles.productName}>{product.name}</Text>

              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionItem}>
                  <MaterialIcons name="local-fire-department" size={24} color="#FF6B6B" />
                  <Text style={styles.nutritionLabel}>Kalori</Text>
                  <Text style={styles.nutritionValue}>{product.calories}</Text>
                  <Text style={styles.nutritionUnit}>kcal</Text>
                </View>

                <View style={styles.nutritionItem}>
                  <MaterialIcons name="fitness-center" size={24} color="#4ECDC4" />
                  <Text style={styles.nutritionLabel}>Protein</Text>
                  <Text style={styles.nutritionValue}>{product.protein}</Text>
                  <Text style={styles.nutritionUnit}>g</Text>
                </View>

                <View style={styles.nutritionItem}>
                  <MaterialIcons name="grain" size={24} color="#FFD93D" />
                  <Text style={styles.nutritionLabel}>Karbonhidrat</Text>
                  <Text style={styles.nutritionValue}>{product.carbohydrates}</Text>
                  <Text style={styles.nutritionUnit}>g</Text>
                </View>

                <View style={styles.nutritionItem}>
                  <MaterialIcons name="opacity" size={24} color="#E74C3C" />
                  <Text style={styles.nutritionLabel}>Yağ</Text>
                  <Text style={styles.nutritionValue}>{product.fat}</Text>
                  <Text style={styles.nutritionUnit}>g</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.buttonStack}>
          <TouchableOpacity style={styles.retryButton} onPress={handleAddAsMeal}>
            <MaterialIcons name="check" size={24} color="white" />
            <Text style={styles.retryButtonText}>Öğün Olarak Ekle</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={resetScanner}>
            <MaterialIcons name="camera-alt" size={24} color="#FF6B6B" />
            <Text style={styles.secondaryButtonText}>Yeni Fotoğraf Çek</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Kamera
  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        <View style={styles.overlay}>
          <View style={styles.unfocused} />
          <View style={styles.middle}>
            <View style={styles.unfocused} />
            <View style={styles.scanFrame}>
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
            </View>
            <View style={styles.unfocused} />
          </View>
          <View style={styles.unfocused} />
        </View>

        <View style={styles.instructionContainer}>
          <MaterialIcons name="restaurant" size={40} color="white" />
          <Text style={styles.instructionText}>
            Yemeği çerçeveye yerleştirin ve fotoğraf çekin
          </Text>
        </View>
      </CameraView>

      <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
        <MaterialIcons name="camera" size={36} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'space-between' },
  middle: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  unfocused: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  scanFrame: { width: 280, height: 280, position: 'relative' },
  cornerTL: { position: 'absolute', width: 40, height: 40, borderTopWidth: 3, borderLeftWidth: 3, borderColor: '#FF6B6B', top: -1, left: -1 },
  cornerTR: { position: 'absolute', width: 40, height: 40, borderTopWidth: 3, borderRightWidth: 3, borderColor: '#FF6B6B', top: -1, right: -1 },
  cornerBL: { position: 'absolute', width: 40, height: 40, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: '#FF6B6B', bottom: -1, left: -1 },
  cornerBR: { position: 'absolute', width: 40, height: 40, borderBottomWidth: 3, borderRightWidth: 3, borderColor: '#FF6B6B', bottom: -1, right: -1 },
  captureButton: {
    position: 'absolute', bottom: 40, alignSelf: 'center',
    backgroundColor: '#FF6B6B', width: 72, height: 72,
    borderRadius: 36, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 5, elevation: 8,
  },
  instructionContainer: {
    position: 'absolute', bottom: 130, left: 0, right: 0,
    alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 15,
  },
  instructionText: { color: 'white', fontSize: 14, marginTop: 8, fontWeight: '600' },
  previewImage: { flex: 1 },
  loadingOverlay: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center',
  },
  loadingText: { color: 'white', marginTop: 15, fontSize: 16, fontWeight: '600' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorTitle: { fontSize: 20, fontWeight: 'bold', color: '#FF6B6B', marginTop: 15, marginBottom: 10 },
  errorMessage: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 30 },
  resultContainer: { flex: 1 },
  scrollContent: { paddingBottom: 90 },
  resultCard: { margin: 12, backgroundColor: 'white', borderRadius: 12, overflow: 'hidden', elevation: 3 },
  headerSection: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  resultTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  productImage: { width: '100%', height: 220 },
  infoSection: { padding: 16 },
  productName: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  nutritionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  nutritionItem: { width: '48%', backgroundColor: '#f9f9f9', borderRadius: 10, padding: 12, marginBottom: 12, alignItems: 'center' },
  nutritionLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  nutritionValue: { fontSize: 22, fontWeight: 'bold', color: '#333', marginTop: 4 },
  nutritionUnit: { fontSize: 11, color: '#999', marginTop: 2 },
  buttonStack: {
    position: 'absolute', bottom: 20, left: 20, right: 20,
    flexDirection: 'column', justifyContent: 'center',
  },
  retryButton: {
    backgroundColor: '#FF6B6B', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 14, borderRadius: 8, elevation: 5,
  },
  retryButtonText: { color: 'white', fontSize: 16, fontWeight: '600', marginLeft: 10 },
  secondaryButton: {
    backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 14, borderRadius: 8, elevation: 3,
    borderWidth: 1, borderColor: '#FF6B6B',
    marginTop: 10,
  },
  secondaryButtonText: { color: '#FF6B6B', fontSize: 16, fontWeight: '600', marginLeft: 10 },
  permissionCard: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  permissionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 15, marginBottom: 10 },
  permissionDescription: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  permissionButton: { backgroundColor: '#FF6B6B', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 8 },
  permissionButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});